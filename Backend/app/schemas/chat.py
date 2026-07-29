import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.chat import MessageRole


class SummaryResponse(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class CreateChatSessionRequest(BaseModel):
    title: str | None = Field(default=None, max_length=255)


class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: MessageRole
    content: str
    cited_chunk_ids: list[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True