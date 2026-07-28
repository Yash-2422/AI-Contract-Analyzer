"""
Database engine and session management.

Repositories never create their own sessions - they receive one through
FastAPI's dependency injection (`get_db`). This keeps transaction boundaries
at the request level and makes repositories trivially testable with an
in-memory / test session.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,  # avoids "server closed the connection unexpectedly" errors
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Shared declarative base for every ORM model in the app."""

    pass


def get_db() -> Generator:
    """
    FastAPI dependency that yields a DB session and guarantees it is closed
    after the request, even if an exception is raised.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()