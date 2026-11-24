"""Verify least-privilege grants using the application's DATABASE_URL."""

import os
import sys

from sqlalchemy import create_engine, text


def main() -> int:
    expected_role = os.environ.get("POSTGRES_APP_USER", "contract_app")
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("FAIL|DATABASE_URL is required", file=sys.stderr)
        return 2

    engine = create_engine(database_url, pool_pre_ping=True)
    failures: list[str] = []
    try:
        with engine.connect() as connection:
            role = connection.execute(
                text(
                    """
                    SELECT current_user = :expected_role,
                           r.rolcanlogin,
                           NOT r.rolsuper AND NOT r.rolcreatedb AND NOT r.rolcreaterole
                               AND NOT r.rolreplication AND NOT r.rolbypassrls,
                           has_database_privilege(current_user, current_database(), 'CONNECT'),
                           NOT has_database_privilege(current_user, current_database(), 'CREATE'),
                           has_schema_privilege(current_user, 'public', 'USAGE'),
                           NOT has_schema_privilege(current_user, 'public', 'CREATE'),
                           to_regtype('public.vector') IS NOT NULL
                               AND has_type_privilege(current_user, 'public.vector', 'USAGE'),
                           NOT EXISTS (
                               SELECT 1 FROM pg_auth_members
                               WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)
                           ),
                           NOT COALESCE(
                               pg_has_role(current_user, to_regrole('neon_superuser'), 'MEMBER'),
                               false
                           )
                    FROM pg_roles r WHERE r.rolname = current_user
                    """
                ),
                {"expected_role": expected_role},
            ).one()
            role_checks = (
                ("expected_application_role", role[0]),
                ("login_without_elevated_attributes", role[1] and role[2]),
                ("database_connect_without_create", role[3] and role[4]),
                ("schema_usage_without_create", role[5] and role[6]),
                ("pgvector_type_usage", role[7]),
                ("no_role_memberships", role[8]),
                ("not_neon_superuser_member", role[9]),
            )

            table_checks = connection.execute(
                text(
                    """
                    SELECT COALESCE(bool_and(
                               has_table_privilege(current_user, c.oid, 'SELECT')
                           AND has_table_privilege(current_user, c.oid, 'INSERT')
                           AND has_table_privilege(current_user, c.oid, 'UPDATE')
                           AND has_table_privilege(current_user, c.oid, 'DELETE')
                           ), true),
                           count(*)
                    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
                      AND c.relname <> 'alembic_version'
                    """
                )
            ).one()
            sequence_checks = connection.execute(
                text(
                    """
                    SELECT COALESCE(bool_and(
                               has_sequence_privilege(current_user, c.oid, 'USAGE')
                           AND has_sequence_privilege(current_user, c.oid, 'SELECT')
                           AND has_sequence_privilege(current_user, c.oid, 'UPDATE')
                           ), true),
                           count(*)
                    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'public' AND c.relkind = 'S'
                    """
                )
            ).one()
            alembic_checks = connection.execute(
                text(
                    """
                    SELECT to_regclass('public.alembic_version') IS NULL
                        OR NOT has_table_privilege(current_user, 'public.alembic_version', 'SELECT')
                           AND NOT has_table_privilege(current_user, 'public.alembic_version', 'INSERT')
                           AND NOT has_table_privilege(current_user, 'public.alembic_version', 'UPDATE')
                           AND NOT has_table_privilege(current_user, 'public.alembic_version', 'DELETE')
                    """
                )
            ).scalar_one()

        checks = list(role_checks) + [
            ("application_table_dml", table_checks[0]),
            ("application_sequences", sequence_checks[0]),
            ("no_alembic_version_access", alembic_checks),
        ]
        for name, passed in checks:
            print(f"{'PASS' if passed else 'FAIL'}|{name}")
            if not passed:
                failures.append(name)
        return 1 if failures else 0
    except Exception as exc:
        # SQLAlchemy driver errors can include the URL; emit only the type.
        print(f"FAIL|database_role_verification|{type(exc).__name__}", file=sys.stderr)
        return 1
    finally:
        engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
