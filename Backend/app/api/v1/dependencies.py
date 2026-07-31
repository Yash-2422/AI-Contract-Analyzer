"""
Shared FastAPI dependencies.

get_current_user is what makes a route "protected": add
`current_user: User = Depends(get_current_user)` to any endpoint's
signature and FastAPI handles extracting + validating the bearer token
before the endpoint body ever runs.
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import TokenType, decode_token
from app.models.user import User
from app.repositories.chat_repository import ChatRepository
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.comparison_repository import ComparisonRepository
from app.repositories.contract_repository import ContractRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.risk_repository import RiskRepository
from app.repositories.summary_repository import SummaryRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.chunking_service import ChunkingService
from app.services.comparison_service import ComparisonService
from app.services.dashboard_service import DashboardService
from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.extraction_service import ExtractionService
from app.services.llm_service import LLMService
from app.services.ocr_service import OCRService
from app.services.processing_service import ProcessingService
from app.services.report_service import ReportService
from app.services.retrieval_service import RetrievalService
from app.services.risk_analysis_service import RiskAnalysisService
from app.services.storage_service import StorageService
from app.services.summary_service import SummaryService

bearer_scheme = HTTPBearer()


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_refresh_token_repository(db: Session = Depends(get_db)) -> RefreshTokenRepository:
    return RefreshTokenRepository(db)


def get_contract_repository(db: Session = Depends(get_db)) -> ContractRepository:
    return ContractRepository(db)


def get_chunk_repository(db: Session = Depends(get_db)) -> ChunkRepository:
    return ChunkRepository(db)


def get_storage_service() -> StorageService:
    return StorageService()


def get_document_service(
    contract_repo: ContractRepository = Depends(get_contract_repository),
    storage: StorageService = Depends(get_storage_service),
) -> DocumentService:
    return DocumentService(contract_repo, storage)


def get_processing_service(
    contract_repo: ContractRepository = Depends(get_contract_repository),
    chunk_repo: ChunkRepository = Depends(get_chunk_repository),
    storage: StorageService = Depends(get_storage_service),
) -> ProcessingService:
    return ProcessingService(
        contract_repo=contract_repo,
        chunk_repo=chunk_repo,
        storage=storage,
        extraction=ExtractionService(),
        ocr=OCRService(),
        chunking=ChunkingService(),
        embedding=EmbeddingService(),
    )


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
    token_repo: RefreshTokenRepository = Depends(get_refresh_token_repository),
) -> AuthService:
    return AuthService(user_repo, token_repo)


def get_summary_repository(db: Session = Depends(get_db)) -> SummaryRepository:
    return SummaryRepository(db)


def get_chat_repository(db: Session = Depends(get_db)) -> ChatRepository:
    return ChatRepository(db)


def get_llm_service() -> LLMService:
    return LLMService()


def get_retrieval_service(
    db: Session = Depends(get_db),
) -> RetrievalService:
    return RetrievalService(db, EmbeddingService())


def get_summary_service(
    chunk_repo: ChunkRepository = Depends(get_chunk_repository),
    summary_repo: SummaryRepository = Depends(get_summary_repository),
    llm: LLMService = Depends(get_llm_service),
) -> SummaryService:
    return SummaryService(chunk_repo, summary_repo, llm)


def get_chat_service(
    chat_repo: ChatRepository = Depends(get_chat_repository),
    retrieval: RetrievalService = Depends(get_retrieval_service),
    llm: LLMService = Depends(get_llm_service),
) -> ChatService:
    return ChatService(chat_repo, retrieval, llm)


def get_risk_repository(db: Session = Depends(get_db)) -> RiskRepository:
    return RiskRepository(db)


def get_comparison_repository(db: Session = Depends(get_db)) -> ComparisonRepository:
    return ComparisonRepository(db)


def get_risk_analysis_service(
    chunk_repo: ChunkRepository = Depends(get_chunk_repository),
    risk_repo: RiskRepository = Depends(get_risk_repository),
    llm: LLMService = Depends(get_llm_service),
) -> RiskAnalysisService:
    return RiskAnalysisService(chunk_repo, risk_repo, llm)


def get_comparison_service(
    chunk_repo: ChunkRepository = Depends(get_chunk_repository),
    comparison_repo: ComparisonRepository = Depends(get_comparison_repository),
    llm: LLMService = Depends(get_llm_service),
) -> ComparisonService:
    return ComparisonService(chunk_repo, comparison_repo, llm)


def get_report_repository(db: Session = Depends(get_db)) -> ReportRepository:
    return ReportRepository(db)


def get_dashboard_service(
    contract_repo: ContractRepository = Depends(get_contract_repository),
    risk_repo: RiskRepository = Depends(get_risk_repository),
    chat_repo: ChatRepository = Depends(get_chat_repository),
    summary_repo: SummaryRepository = Depends(get_summary_repository),
    comparison_repo: ComparisonRepository = Depends(get_comparison_repository),
    report_repo: ReportRepository = Depends(get_report_repository),
) -> DashboardService:
    return DashboardService(
        contract_repo, risk_repo, chat_repo, summary_repo, comparison_repo, report_repo
    )


def get_report_service(
    summary_repo: SummaryRepository = Depends(get_summary_repository),
    risk_repo: RiskRepository = Depends(get_risk_repository),
    comparison_repo: ComparisonRepository = Depends(get_comparison_repository),
    report_repo: ReportRepository = Depends(get_report_repository),
) -> ReportService:
    return ReportService(summary_repo, risk_repo, comparison_repo, report_repo)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != TokenType.ACCESS:
        raise unauthorized

    try:
        user_id = uuid.UUID(payload.get("sub"))
    except (TypeError, ValueError):
        raise unauthorized

    user = user_repo.get_by_id(user_id)
    if user is None or not user.is_active:
        raise unauthorized

    return user