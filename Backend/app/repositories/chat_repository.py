import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage, ChatSession, MessageRole


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(
        self, contract_id: uuid.UUID, user_id: uuid.UUID, title: str
    ) -> ChatSession:
        session = ChatSession(contract_id=contract_id, user_id=user_id, title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def list_sessions(self, contract_id: uuid.UUID, user_id: uuid.UUID) -> list[ChatSession]:
        return (
            self.db.query(ChatSession)
            .filter(ChatSession.contract_id == contract_id, ChatSession.user_id == user_id)
            .order_by(ChatSession.created_at.desc())
            .all()
        )

    def get_session_for_user(
        self, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> ChatSession | None:
        return (
            self.db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .first()
        )

    def create_message(
        self,
        session_id: uuid.UUID,
        role: MessageRole,
        content: str,
        cited_chunk_ids: list[uuid.UUID],
    ) -> ChatMessage:
        message = ChatMessage(
            session_id=session_id, role=role, content=content, cited_chunk_ids=cited_chunk_ids
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def list_messages(self, session_id: uuid.UUID) -> list[ChatMessage]:
        return (
            self.db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
            .all()
        )

    def session_count_for_user(self, user_id: uuid.UUID) -> int:
        return (
            self.db.query(func.count(ChatSession.id))
            .filter(ChatSession.user_id == user_id)
            .scalar()
        )

    def message_count_for_user(self, user_id: uuid.UUID) -> int:
        return (
            self.db.query(func.count(ChatMessage.id))
            .join(ChatSession, ChatSession.id == ChatMessage.session_id)
            .filter(ChatSession.user_id == user_id)
            .scalar()
        )