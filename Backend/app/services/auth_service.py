"""
Business logic for authentication and profile management.

Endpoints (app/api/v1/endpoints/auth.py) call these methods and translate
the results/exceptions into HTTP responses. This service never touches
FastAPI's Request/Response directly, so it can be reused (e.g. from a CLI
script or a background job) without pulling in the web layer.
"""

import uuid

from fastapi import HTTPException, status

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    ChangePasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)


class AuthService:
    def __init__(self, user_repo: UserRepository, token_repo: RefreshTokenRepository):
        self.user_repo = user_repo
        self.token_repo = token_repo

    # --- Registration & login ---

    def register(self, data: UserRegisterRequest) -> User:
        if self.user_repo.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        hashed = hash_password(data.password)
        return self.user_repo.create(data, hashed)

    def login(self, data: UserLoginRequest) -> TokenResponse:
        user = self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )
        return self._issue_tokens(user.id)

    # --- Token refresh & logout ---

    def refresh(self, refresh_token: str) -> TokenResponse:
        token_hash = hash_token(refresh_token)
        record = self.token_repo.get_by_hash(token_hash)

        if not record or not self.token_repo.is_valid(record):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token is invalid or has expired. Please log in again.",
            )

        # Rotate: revoke the used token and issue a brand new pair. This
        # limits the damage window if a refresh token is ever intercepted.
        self.token_repo.revoke(record)
        return self._issue_tokens(record.user_id)

    def logout(self, refresh_token: str) -> None:
        token_hash = hash_token(refresh_token)
        record = self.token_repo.get_by_hash(token_hash)
        if record:
            self.token_repo.revoke(record)

    # --- Profile management ---

    def update_profile(self, user: User, full_name: str | None) -> User:
        return self.user_repo.update(user, full_name=full_name)

    def change_password(self, user: User, data: ChangePasswordRequest) -> None:
        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect.",
            )
        self.user_repo.update(user, hashed_password=hash_password(data.new_password))
        # Invalidate every existing session so a stolen old password can't
        # keep using a refresh token issued before the change.
        self.token_repo.revoke_all_for_user(user.id)

    def delete_account(self, user: User) -> None:
        self.user_repo.delete(user)

    # --- Internal ---

    def _issue_tokens(self, user_id: uuid.UUID) -> TokenResponse:
        access_token = create_access_token(user_id)
        refresh_token, expires_at = create_refresh_token(user_id)
        self.token_repo.create(user_id, hash_token(refresh_token), expires_at)
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)