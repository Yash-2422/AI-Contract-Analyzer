"""
Data-access layer for User. Services depend on this, never on `db.query(...)`
directly - keeps SQLAlchemy specifics out of business logic and makes the
service layer testable with a fake/mock repository.
"""

import uuid

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserRegisterRequest


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def create(self, data: UserRegisterRequest, hashed_password: str) -> User:
        user = User(
            email=data.email,
            hashed_password=hashed_password,
            full_name=data.full_name,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, **fields) -> User:
        for key, value in fields.items():
            if value is not None:
                setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()