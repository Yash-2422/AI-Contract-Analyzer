import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.contract import ContractStatus


class ContractResponse(BaseModel):
    id: uuid.UUID
    display_name: str
    original_filename: str
    mime_type: str
    size_bytes: int
    status: ContractStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContractListResponse(BaseModel):
    items: list[ContractResponse]
    total: int
    page: int
    page_size: int


class RenameContractRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=255)