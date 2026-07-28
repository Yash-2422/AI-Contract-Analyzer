"""
One row per chunk of extracted contract text, with its embedding vector.

This is the table Phase 6's semantic search queries directly via pgvector's
cosine-distance operator, and what Phase 5's RAG chat retrieves context
from.
"""

import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.models.base import BaseModel

# bge-small-en-v1.5 produces 384-dimensional embeddings. Hardcoding the
# dimension (rather than reading it off the model at import time) keeps
# table creation independent of whether the embedding model is downloaded
# yet - the schema doesn't need the model present to exist.
EMBEDDING_DIMENSIONS = 384


class DocumentChunk(BaseModel):
    __tablename__ = "document_chunks"

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True
    )

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIMENSIONS), nullable=False)

    contract: Mapped["Contract"] = relationship()