"""
Auth & profile HTTP routes.

Thin by design: parse request -> call AuthService -> return response.
No business logic lives in this file.
"""

from fastapi import APIRouter, Depends, status, Response

from app.api.v1.dependencies import get_auth_service, get_current_user
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    MessageResponse,
    RefreshTokenRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: UserRegisterRequest, auth_service: AuthService = Depends(get_auth_service)
):
    return auth_service.register(data)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLoginRequest, response: Response, auth_service: AuthService = Depends(get_auth_service)):
    tokens = auth_service.login(data)
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        samesite="lax",
        secure=False 
    )
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    data: RefreshTokenRequest, response: Response, auth_service: AuthService = Depends(get_auth_service)
):
    tokens = auth_service.refresh(data.refresh_token)
    # Update the cookie with the new rotated access token
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        samesite="lax",
        secure=False
    )
    return tokens


@router.post("/logout", response_model=MessageResponse)
def logout(
    data: RefreshTokenRequest, response: Response, auth_service: AuthService = Depends(get_auth_service)
):
    auth_service.logout(data.refresh_token)
    # Delete the cookie from the browser
    response.delete_cookie("access_token")
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    return auth_service.update_profile(current_user, data.full_name)


@router.post("/me/change-password", response_model=MessageResponse)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    auth_service.change_password(current_user, data)
    return MessageResponse(message="Password changed. Please log in again.")


@router.delete("/me", response_model=MessageResponse)
def delete_account(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    auth_service.delete_account(current_user)
    return MessageResponse(message="Account deleted.")
