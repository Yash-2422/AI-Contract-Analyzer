"""
Document management HTTP routes.

Every route requires an authenticated user, and every lookup goes through
DocumentService.get_owned_or_404 - so there's exactly one place that
enforces "you can only touch your own contracts", not one check per route.
"""

import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.api.v1.dependencies import (
    get_current_user,
    get_document_service,
    get_processing_service,
    get_chunk_repository,
)
from app.models.user import User
from app.repositories.chunk_repository import ChunkRepository
from app.schemas.chunk import ChunkResponse
from app.schemas.contract import ContractListResponse, ContractResponse, RenameContractRequest
from app.services.document_service import DocumentService
from app.services.processing_service import ProcessingService

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


@router.post("/{contract_id}/process", response_model=ContractResponse)
def process_contract(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    processing_service: ProcessingService = Depends(get_processing_service),
):
    """
    Runs extraction -> OCR (if needed) -> chunking -> embedding synchronously
    and returns the contract with its updated status. For large documents or
    high upload volume, wire this behind Celery instead (the service itself
    doesn't change - only how it's invoked).
    """
    contract = document_service.get_owned_or_404(contract_id, current_user.id)
    return processing_service.process(contract)


@router.get("/{contract_id}/chunks", response_model=list[ChunkResponse])
def list_contract_chunks(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    chunk_repo: ChunkRepository = Depends(get_chunk_repository),
):
    document_service.get_owned_or_404(contract_id, current_user.id)  # ownership check
    return chunk_repo.list_for_contract(contract_id)