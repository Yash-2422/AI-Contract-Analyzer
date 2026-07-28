"""
Pure security helpers: password hashing and JWT encode/decode.

Deliberately has zero DB or FastAPI imports - every function here is a plain
input -> output transformation, which makes it trivial to unit test and
impossible to accidentally couple to a request/session lifecycle.
"""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from enum import StrEnum

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(user_id), "type": TokenType.ACCESS, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: uuid.UUID) -> tuple[str, datetime]:
    """Returns (token, expires_at) - expires_at is stored alongside the
    hashed token in the DB so we can prune/validate expiry without decoding.

    Includes a random `jti` claim: without it, two tokens minted for the
    same user in the same second (exp has second-level precision) would be
    byte-identical JWTs, colliding on the token_hash unique constraint.
    """
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": str(user_id),
        "type": TokenType.REFRESH,
        "exp": expire,
        "jti": uuid.uuid4().hex,
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expire


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


def hash_token(token: str) -> str:
    """
    Refresh tokens are stored hashed so a DB leak doesn't hand out usable
    tokens. SHA-256 (not bcrypt) on purpose: bcrypt silently caps input at
    72 bytes and our JWTs are longer, and tokens are already high-entropy
    random strings (unlike passwords) so a slow hash adds no real security
    here - just deterministic, collision-resistant hashing for lookup.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_token_hash(token: str, token_hash: str) -> bool:
    return hash_token(token) == token_hash
