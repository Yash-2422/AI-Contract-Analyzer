import uuid

from fastapi import APIRouter, Depends, status

from app.api.v1.dependencies import (
    get_comparison_service,
    get_current_user,
    get_document_service,
)
from app.models.user import User
from app.schemas.comparison import CompareContractsRequest, ComparisonResponse
from app.services.comparison_service import ComparisonService
from app.services.document_service import DocumentService

router = APIRouter()


@router.post(
    "/contracts/compare", response_model=ComparisonResponse, status_code=status.HTTP_201_CREATED
)
def compare_contracts(
    data: CompareContractsRequest,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    comparison_service: ComparisonService = Depends(get_comparison_service),
):
    # Ownership checked for BOTH contracts - a user can't compare a
    # contract they don't own against one they do (or against anything).
    document_service.get_owned_or_404(data.contract_a_id, current_user.id)
    document_service.get_owned_or_404(data.contract_b_id, current_user.id)
    return comparison_service.compare(current_user.id, data.contract_a_id, data.contract_b_id)


@router.get("/comparisons/{comparison_id}", response_model=ComparisonResponse)
def get_comparison(
    comparison_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    comparison_service: ComparisonService = Depends(get_comparison_service),
):
    return comparison_service.get_owned_or_404(comparison_id, current_user.id)