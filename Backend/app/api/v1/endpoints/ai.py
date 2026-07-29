"""
AI feature routes: contract summaries and RAG chat.

Ownership is checked via DocumentService.get_owned_or_404 before any AI
work happens, and again via ChatService.get_session_owned_or_404 for
session-scoped routes - a user can never summarize, chat with, or read
chat history for a contract that isn't theirs.
"""

import uuid

from fastapi import APIRouter, Depends, status

from app.api.v1.dependencies import (
    get_chat_service,
    get_current_user,
    get_document_service,
    get_summary_service,
)
from app.models.user import User
from app.schemas.chat import (
    ChatMessageResponse,
    ChatSessionResponse,
    CreateChatSessionRequest,
    SendMessageRequest,
    SummaryResponse,
)
from app.services.chat_service import ChatService
from app.services.document_service import DocumentService
from app.services.summary_service import SummaryService

router = APIRouter()


# --- Summary ---


@router.post(
    "/contracts/{contract_id}/summary",
    response_model=SummaryResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_summary(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    summary_service: SummaryService = Depends(get_summary_service),
):
    document_service.get_owned_or_404(contract_id, current_user.id)  # ownership check
    return summary_service.generate(contract_id)


@router.get("/contracts/{contract_id}/summary", response_model=SummaryResponse)
def get_summary(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    summary_service: SummaryService = Depends(get_summary_service),
):
    document_service.get_owned_or_404(contract_id, current_user.id)
    return summary_service.get_latest(contract_id)


# --- Chat ---


@router.post(
    "/contracts/{contract_id}/chat/sessions",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_chat_session(
    contract_id: uuid.UUID,
    data: CreateChatSessionRequest,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    chat_service: ChatService = Depends(get_chat_service),
):
    document_service.get_owned_or_404(contract_id, current_user.id)
    return chat_service.create_session(contract_id, current_user.id, data.title)


@router.get("/contracts/{contract_id}/chat/sessions", response_model=list[ChatSessionResponse])
def list_chat_sessions(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    chat_service: ChatService = Depends(get_chat_service),
):
    document_service.get_owned_or_404(contract_id, current_user.id)
    return chat_service.list_sessions(contract_id, current_user.id)


@router.post(
    "/chat/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    session_id: uuid.UUID,
    data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    session = chat_service.get_session_owned_or_404(session_id, current_user.id)
    return chat_service.send_message(session, data.content)


@router.get("/chat/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
def list_messages(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
):
    chat_service.get_session_owned_or_404(session_id, current_user.id)  # ownership check
    return chat_service.list_messages(session_id)