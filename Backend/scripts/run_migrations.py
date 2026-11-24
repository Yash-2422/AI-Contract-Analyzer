"""Provision the runtime database role, then run Alembic as the migration role."""

import os
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from psycopg2 import sql
from sqlalchemy import create_engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings


def _configure_application_role(engine, app_user: str, app_password: str) -> None:
    if not app_user or not app_password:
        raise ValueError("POSTGRES_APP_USER and POSTGRES_APP_PASSWORD must be set")

    connection = engine.raw_connection()
    try:
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT current_user, current_database()")
            migration_user, database_name = cursor.fetchone()
            if migration_user == app_user:
                raise ValueError("The application role must differ from the migration role")

            cursor.execute(
                "SELECT rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, "
                "rolreplication, rolbypassrls "
                "FROM pg_roles WHERE rolname = %s",
                (app_user,),
            )
            role = cursor.fetchone()
            if role is None:
                # PostgreSQL defaults newly-created roles to NOLOGIN,
                # NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, and
                # NOBYPASSRLS. Keep the CREATE statement minimal: managed
                # providers such as Neon may reject attempts to set
                # provider-controlled role attributes explicitly.
                cursor.execute(
                    sql.SQL(
                        "CREATE ROLE {} WITH LOGIN PASSWORD {}"
                    ).format(sql.Identifier(app_user), sql.Literal(app_password))
                )
                cursor.execute(
                    "SELECT rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, "
                    "rolreplication, rolbypassrls "
                    "FROM pg_roles WHERE rolname = %s",
                    (app_user,),
                )
                role = cursor.fetchone()

            if role is None or not role[0] or any(role[1:]):
                raise ValueError(
                    "The application role is missing LOGIN or has elevated role attributes. "
                    "It was not modified; choose a new SQL-created application role."
                )

            cursor.execute(
                "SELECT EXISTS (SELECT 1 FROM pg_auth_members "
                "WHERE member = (SELECT oid FROM pg_roles WHERE rolname = %s))",
                (app_user,),
            )
            if cursor.fetchone()[0]:
                raise ValueError(
                    "The application role has role memberships and was not modified. "
                    "Use a new SQL-created role with no memberships; Neon Console/API "
                    "roles inherit neon_superuser privileges."
                )

            cursor.execute(
                "SELECT has_database_privilege(%s, %s, 'CREATE'), "
                "has_schema_privilege(%s, 'public', 'CREATE')",
                (app_user, database_name, app_user),
            )
            can_create_database, can_create_schema = cursor.fetchone()
            if can_create_database or can_create_schema:
                raise ValueError(
                    "The application role already has database or schema CREATE "
                    "privileges; it was not modified."
                )

            cursor.execute(
                sql.SQL("GRANT CONNECT ON DATABASE {} TO {}").format(
                    sql.Identifier(database_name), sql.Identifier(app_user)
                )
            )
            cursor.execute(
                sql.SQL("GRANT USAGE ON SCHEMA public TO {}").format(
                    sql.Identifier(app_user)
                )
            )
            cursor.execute(
                sql.SQL(
                    "ALTER DEFAULT PRIVILEGES FOR ROLE {} IN SCHEMA public "
                    "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {}"
                ).format(sql.Identifier(migration_user), sql.Identifier(app_user))
            )
            cursor.execute(
                sql.SQL(
                    "ALTER DEFAULT PRIVILEGES FOR ROLE {} IN SCHEMA public "
                    "GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO {}"
                ).format(sql.Identifier(migration_user), sql.Identifier(app_user))
            )
        finally:
            cursor.close()
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def _grant_existing_application_privileges(engine, app_user: str) -> None:
    connection = engine.raw_connection()
    try:
        cursor = connection.cursor()
        try:
            cursor.execute(
                sql.SQL(
                    "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES "
                    "IN SCHEMA public TO {}"
                ).format(sql.Identifier(app_user))
            )
            cursor.execute(
                sql.SQL(
                    "GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES "
                    "IN SCHEMA public TO {}"
                ).format(sql.Identifier(app_user))
            )
            cursor.execute(
                sql.SQL("GRANT USAGE ON TYPE public.vector TO {}").format(
                    sql.Identifier(app_user)
                )
            )
            cursor.execute("SELECT to_regclass('public.alembic_version')")
            if cursor.fetchone()[0] is not None:
                cursor.execute(
                    sql.SQL("REVOKE ALL PRIVILEGES ON TABLE public.alembic_version FROM {}").format(
                        sql.Identifier(app_user)
                    )
                )
        finally:
            cursor.close()
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def main() -> int:
    app_user = os.environ.get("POSTGRES_APP_USER", "contract_app")
    app_password = os.environ.get("POSTGRES_APP_PASSWORD", "")
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    try:
        _configure_application_role(engine, app_user, app_password)
        command.upgrade(Config("alembic.ini"), "head")
        _grant_existing_application_privileges(engine, app_user)
        print("Database migrations and application-role grants completed.")
        return 0
    except ValueError as exc:
        print(f"Database validation failed: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        # Avoid printing driver exceptions because they may contain credentials.
        print(f"Database migration setup failed ({type(exc).__name__}).", file=sys.stderr)
        return 1
    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
