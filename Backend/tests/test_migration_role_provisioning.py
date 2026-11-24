"""Focused tests for safe SQL-based application-role provisioning."""

from __future__ import annotations

import pytest
from psycopg2.sql import Composed, Identifier, Literal, SQL

from scripts.run_migrations import _configure_application_role


SAFE_ROLE = (True, False, False, False, False, False)


def _render(query):
    if isinstance(query, SQL):
        return query.string
    if isinstance(query, Identifier):
        return '"' + query.string + '"'
    if isinstance(query, Literal):
        return repr(query._wrapped)
    if isinstance(query, Composed):
        return "".join(_render(part) for part in query._wrapped)
    return query


class FakeCursor:
    def __init__(self, *, role=None, membership=False, create_privileges=(False, False)):
        self.role = role
        self.membership = membership
        self.create_privileges = create_privileges
        self.statements = []
        self._result = None
        self.role_queries = 0

    def execute(self, query, params=None):
        rendered = _render(query)
        self.statements.append((rendered, params))
        if rendered.startswith("SELECT current_user, current_database()"):
            self._result = ("migration_owner", "contract_test")
        elif rendered.startswith("CREATE ROLE"):
            self.role = SAFE_ROLE
            self._result = None
        elif rendered.startswith("SELECT EXISTS") and "FROM pg_auth_members" in rendered:
            self._result = (self.membership,)
        elif rendered.startswith("SELECT has_database_privilege"):
            self._result = self.create_privileges
        elif "FROM pg_roles WHERE rolname = %s" in rendered:
            self.role_queries += 1
            self._result = self.role
        else:
            self._result = None

    def fetchone(self):
        return self._result

    def close(self):
        pass


class FakeConnection:
    def __init__(self, cursor):
        self.fake_cursor = cursor
        self.committed = False
        self.rolled_back = False

    def cursor(self):
        return self.fake_cursor

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True

    def close(self):
        pass


class FakeEngine:
    def __init__(self, cursor):
        self.connection = FakeConnection(cursor)

    def raw_connection(self):
        return self.connection


def test_new_role_uses_minimal_sql_create_and_safe_defaults():
    cursor = FakeCursor(role=None)
    engine = FakeEngine(cursor)

    _configure_application_role(engine, "contract_runtime", "existing-app-password")

    create_sql = next(sql for sql, _ in cursor.statements if sql.startswith("CREATE ROLE"))
    assert "LOGIN" in create_sql
    assert "existing-app-password" in create_sql
    assert all(
        forbidden not in create_sql.upper()
        for forbidden in (
            "SUPERUSER",
            "CREATEDB",
            "CREATEROLE",
            "REPLICATION",
            "BYPASSRLS",
            "NOINHERIT",
        )
    )
    assert engine.connection.committed


def test_existing_nonprivileged_role_with_default_inherit_is_accepted_unchanged():
    cursor = FakeCursor(role=SAFE_ROLE)
    engine = FakeEngine(cursor)

    _configure_application_role(engine, "contract_runtime", "unused-password")

    assert not any(sql.startswith(("CREATE ROLE", "ALTER ROLE")) for sql, _ in cursor.statements)
    assert engine.connection.committed


@pytest.mark.parametrize(
    "role",
    [
        (True, False, True, False, False, False),  # CREATEDB
        (True, False, False, True, False, False),  # CREATEROLE
        (True, True, False, False, False, False),  # SUPERUSER
    ],
)
def test_existing_privileged_role_is_rejected_without_modification(role):
    cursor = FakeCursor(role=role)
    engine = FakeEngine(cursor)

    with pytest.raises(ValueError, match="elevated role attributes"):
        _configure_application_role(engine, "contract_runtime", "unused-password")

    assert not any(sql.startswith(("ALTER ROLE", "GRANT")) for sql, _ in cursor.statements)
    assert engine.connection.rolled_back


def test_existing_role_with_membership_is_rejected_without_revocation_or_grants():
    cursor = FakeCursor(role=SAFE_ROLE, membership=True)
    engine = FakeEngine(cursor)

    with pytest.raises(ValueError, match="role memberships"):
        _configure_application_role(engine, "contract_runtime", "unused-password")

    assert not any(sql.startswith(("ALTER ROLE", "REVOKE", "GRANT")) for sql, _ in cursor.statements)
    assert engine.connection.rolled_back


def test_existing_role_with_create_privileges_is_rejected_without_grants():
    cursor = FakeCursor(role=SAFE_ROLE, create_privileges=(False, True))
    engine = FakeEngine(cursor)

    with pytest.raises(ValueError, match="database or schema CREATE privileges"):
        _configure_application_role(engine, "contract_runtime", "unused-password")

    assert not any(sql.startswith(("ALTER ROLE", "REVOKE", "GRANT")) for sql, _ in cursor.statements)
    assert engine.connection.rolled_back
