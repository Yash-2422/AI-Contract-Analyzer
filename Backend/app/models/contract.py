"""
Contract table - one row per uploaded document.

`status` tracks the document through the pipeline that Phase 4 (extraction,
OCR, chunking, embeddings) will drive. Keeping it here now means Phase 4
only needs to add columns for extracted_text/chunks, not another migration
for status tracking.
"""

import enum
import uuid

from sqlalchemy import BigInteger, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ContractStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class Contract(BaseModel):
    __tablename__ = "contracts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # User-facing name (renamable). Defaults to the uploaded filename.
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Original filename as uploaded by the browser - kept for reference only,
    # never used to build a filesystem path (see storage_service).
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # Path relative to settings.UPLOAD_DIR, e.g. "<user_id>/<uuid>.pdf"
    stored_path: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)

    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)

    status: Mapped[ContractStatus] = mapped_column(
        Enum(ContractStatus, name="contract_status"),
        default=ContractStatus.UPLOADED,
        nullable=False,
    )

    user: Mapped["User"] = relationship()