import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: uuid.UUID, token_hash: str, expires_at: datetime) -> RefreshToken:
        record = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        return (
            self.db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .first()
        )

    def revoke(self, record: RefreshToken) -> None:
        record.revoked = True
        self.db.commit()

    def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False)
        ).update({"revoked": True})
        self.db.commit()

    def is_valid(self, record: RefreshToken) -> bool:
        if record.revoked:
            return False
        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return expires_at > datetime.now(timezone.utc)