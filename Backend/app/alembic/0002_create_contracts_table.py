"""create contracts table

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-28

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

contract_status_enum = postgresql.ENUM(
    "uploaded", "processing", "processed", "failed", name="contract_status"
)


def upgrade() -> None:
    contract_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "contracts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("stored_path", sa.String(length=500), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("uploaded", "processing", "processed", "failed", name="contract_status", create_type=False),
            nullable=False,
            server_default="uploaded",
        ),
    )
    op.create_index("ix_contracts_user_id", "contracts", ["user_id"])
    op.create_unique_constraint("uq_contracts_stored_path", "contracts", ["stored_path"])


def downgrade() -> None:
    op.drop_constraint("uq_contracts_stored_path", "contracts", type_="unique")
    op.drop_index("ix_contracts_user_id", table_name="contracts")
    op.drop_table("contracts")
    contract_status_enum.drop(op.get_bind(), checkfirst=True)