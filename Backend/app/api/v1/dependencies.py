"""
Shared FastAPI dependencies.

get_current_user is what makes a route "protected": add
`current_user: User = Depends(get_current_user)` to any endpoint's
signature and FastAPI handles extracting + validating the bearer token
before the endpoint body ever runs.
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import TokenType, decode_token
from app.models.user import User
from app.repositories.contract_repository import ContractRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.document_service import DocumentService
from app.services.storage_service import StorageService

bearer_scheme = HTTPBearer()


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_refresh_token_repository(db: Session = Depends(get_db)) -> RefreshTokenRepository:
    return RefreshTokenRepository(db)


def get_contract_repository(db: Session = Depends(get_db)) -> ContractRepository:
    return ContractRepository(db)


def get_storage_service() -> StorageService:
    return StorageService()


def get_document_service(
    contract_repo: ContractRepository = Depends(get_contract_repository),
    storage: StorageService = Depends(get_storage_service),
) -> DocumentService:
    return DocumentService(contract_repo, storage)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
    token_repo: RefreshTokenRepository = Depends(get_refresh_token_repository),
) -> AuthService:
    return AuthService(user_repo, token_repo)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != TokenType.ACCESS:
        raise unauthorized

    try:
        user_id = uuid.UUID(payload.get("sub"))
    except (TypeError, ValueError):
        raise unauthorized

    user = user_repo.get_by_id(user_id)
    if user is None or not user.is_active:
        raise unauthorized

    return user