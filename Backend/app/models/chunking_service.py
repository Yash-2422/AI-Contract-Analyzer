import uuid
from datetime import datetime

from pydantic import BaseModel


class ChunkResponse(BaseModel):
    id: uuid.UUID
    chunk_index: int
    page_number: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True