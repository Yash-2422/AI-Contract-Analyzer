"""
Document management HTTP routes.

Every route requires an authenticated user, and every lookup goes through
DocumentService.get_owned_or_404 - so there's exactly one place that
enforces "you can only touch your own contracts", not one check per route.
"""

import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.api.v1.dependencies import get_current_user, get_document_service
from app.models.user import User
from app.schemas.contract import ContractListResponse, ContractResponse, RenameContractRequest
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def upload_contract(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    content = await file.read()
    return document_service.upload(current_user.id, file, content)


@router.get("", response_model=ContractListResponse)
def list_contracts(
    search: str | None = Query(default=None, description="Search by filename"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    items, total = document_service.list(current_user.id, search, page, page_size)
    return ContractListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    return document_service.get_owned_or_404(contract_id, current_user.id)


@router.patch("/{contract_id}", response_model=ContractResponse)
def rename_contract(
    contract_id: uuid.UUID,
    data: RenameContractRequest,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    contract = document_service.get_owned_or_404(contract_id, current_user.id)
    return document_service.rename(contract, data.display_name)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
):
    contract = document_service.get_owned_or_404(contract_id, current_user.id)
    document_service.delete(contract)