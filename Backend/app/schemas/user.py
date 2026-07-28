"""
Pydantic request/response schemas for auth and user profile endpoints.

Kept separate from the ORM model (app/models/user.py) on purpose: the
response schema simply has no password field, so it's structurally
impossible to leak a password hash through the API, no matter what a
service accidentally returns.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# --- Requests ---

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UpdateProfileRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


# --- Responses ---

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str