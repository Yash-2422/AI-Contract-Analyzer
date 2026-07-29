from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_current_user, get_retrieval_service
from app.models.user import User
from app.schemas.search import SearchResponse, SearchResultItem
from app.services.retrieval_service import RetrievalService

router = APIRouter()


@router.get("/search", response_model=SearchResponse)
def search_contracts(
    query: str = Query(min_length=1, max_length=500),
    top_k: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    retrieval: RetrievalService = Depends(get_retrieval_service),
):
    results = retrieval.retrieve_across_user_contracts(current_user.id, query, top_k)
    return SearchResponse(
        query=query,
        results=[
            SearchResultItem(
                chunk_id=r.chunk.id,
                contract_id=r.chunk.contract_id,
                contract_display_name=r.chunk.contract.display_name,
                page_number=r.chunk.page_number,
                content=r.chunk.content,
                distance=r.distance,
            )
            for r in results
        ],
    )