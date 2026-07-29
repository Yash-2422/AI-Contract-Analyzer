import uuid

from pydantic import BaseModel


class SearchResultItem(BaseModel):
    chunk_id: uuid.UUID
    contract_id: uuid.UUID
    contract_display_name: str
    page_number: int
    content: str
    distance: float  # cosine distance: lower = more relevant


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]