import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CompareContractsRequest(BaseModel):
    contract_a_id: uuid.UUID
    contract_b_id: uuid.UUID


class ComparisonResponse(BaseModel):
    id: uuid.UUID
    contract_a_id: uuid.UUID
    contract_b_id: uuid.UUID
    result: str
    created_at: datetime

    class Config:
        from_attributes = True