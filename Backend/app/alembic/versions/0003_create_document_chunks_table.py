"""create document_chunks table

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-28

"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

EMBEDDING_DIMENSIONS = 384


def upgrade() -> None:
    # Required once per database before any `vector` column can be created.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "document_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(EMBEDDING_DIMENSIONS), nullable=False),
    )
    op.create_index("ix_document_chunks_contract_id", "document_chunks", ["contract_id"])

    # IVFFlat index for fast approximate nearest-neighbor search (Phase 6:
    # semantic search / chat retrieval). `lists=100` is a reasonable default
    # for a small-to-medium contract collection; tune upward as row count
    # grows into the hundreds of thousands.
    op.execute(
        "CREATE INDEX ix_document_chunks_embedding "
        "ON document_chunks USING ivfflat (embedding vector_cosine_ops) "
        "WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding")
    op.drop_index("ix_document_chunks_contract_id", table_name="document_chunks")
    op.drop_table("document_chunks")