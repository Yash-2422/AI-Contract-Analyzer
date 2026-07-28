"""
Business logic for document management.

Validation lives here (not in the endpoint) so the rules - allowed
extensions, size limits, empty-file rejection - are enforced no matter what
calls this service, and are unit-testable without spinning up FastAPI.
"""

import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.models.contract import Contract
from app.repositories.contract_repository import ContractRepository
from app.services.storage_service import StorageService

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class DocumentService:
    def __init__(self, contract_repo: ContractRepository, storage: StorageService):
        self.contract_repo = contract_repo
        self.storage = storage

    def upload(self, user_id: uuid.UUID, file: UploadFile, content: bytes) -> Contract:
        self._validate(file, content)

        relative_path = self.storage.build_relative_path(user_id, file.filename)
        self.storage.save(relative_path, content)

        display_name = Path(file.filename).stem

        return self.contract_repo.create(
            user_id=user_id,
            display_name=display_name,
            original_filename=file.filename,
            stored_path=relative_path,
            mime_type=file.content_type or "application/octet-stream",
            size_bytes=len(content),
        )

    def list(
        self, user_id: uuid.UUID, search: str | None, page: int, page_size: int
    ) -> tuple[list[Contract], int]:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        return self.contract_repo.list_for_user(user_id, search, page, page_size)

    def get_owned_or_404(self, contract_id: uuid.UUID, user_id: uuid.UUID) -> Contract:
        contract = self.contract_repo.get_by_id_for_user(contract_id, user_id)
        if contract is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Contract not found."
            )
        return contract

    def rename(self, contract: Contract, display_name: str) -> Contract:
        return self.contract_repo.rename(contract, display_name)

    def delete(self, contract: Contract) -> None:
        self.storage.delete(contract.stored_path)
        self.contract_repo.delete(contract)

    # --- Internal ---

    def _validate(self, file: UploadFile, content: bytes) -> None:
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No file was provided."
            )

        extension = Path(file.filename).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{extension}'. Only PDF and DOCX are allowed.",
            )

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content does not match a supported contract type (PDF or DOCX).",
            )

        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty."
            )

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB size limit.",
            )