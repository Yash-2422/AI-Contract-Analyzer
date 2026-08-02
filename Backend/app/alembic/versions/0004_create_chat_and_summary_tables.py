"""create chat and summary tables

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-29

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

message_role_enum = postgresql.ENUM("user", "assistant", name="message_role")


def upgrade() -> None:
    op.create_table(
        "contract_summaries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
    )
    op.create_index("ix_contract_summaries_contract_id", "contract_summaries", ["contract_id"])

    message_role_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False, server_default="New conversation"),
    )
    op.create_index("ix_chat_sessions_contract_id", "chat_sessions", ["contract_id"])
    op.create_index("ix_chat_sessions_user_id", "chat_sessions", ["user_id"])

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM("user", "assistant", name="message_role", create_type=False),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "cited_chunk_ids",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            nullable=False,
            server_default="{}",
        ),
    )
    op.create_index("ix_chat_messages_session_id", "chat_messages", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_messages_session_id", table_name="chat_messages")
    op.drop_table("chat_messages")

    op.drop_index("ix_chat_sessions_user_id", table_name="chat_sessions")
    op.drop_index("ix_chat_sessions_contract_id", table_name="chat_sessions")
    op.drop_table("chat_sessions")

    message_role_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_index("ix_contract_summaries_contract_id", table_name="contract_summaries")
    op.drop_table("contract_summaries")