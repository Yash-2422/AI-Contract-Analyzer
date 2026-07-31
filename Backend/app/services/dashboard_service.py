"""
Composes dashboard stats from every repository built in earlier phases.
Deliberately has no direct DB session access - it only calls repository
methods, keeping the "one layer touches the DB" rule intact even for
cross-cutting aggregation like this.
"""

import uuid

from app.repositories.chat_repository import ChatRepository
from app.repositories.comparison_repository import ComparisonRepository
from app.repositories.contract_repository import ContractRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.risk_repository import RiskRepository
from app.repositories.summary_repository import SummaryRepository
from app.schemas.dashboard import DashboardResponse, RiskDistribution

RECENT_CONTRACTS_LIMIT = 5


class DashboardService:
    def __init__(
        self,
        contract_repo: ContractRepository,
        risk_repo: RiskRepository,
        chat_repo: ChatRepository,
        summary_repo: SummaryRepository,
        comparison_repo: ComparisonRepository,
        report_repo: ReportRepository,
    ):
        self.contract_repo = contract_repo
        self.risk_repo = risk_repo
        self.chat_repo = chat_repo
        self.summary_repo = summary_repo
        self.comparison_repo = comparison_repo
        self.report_repo = report_repo

    def get_dashboard(self, user_id: uuid.UUID) -> DashboardResponse:
        recent_contracts, total_contracts = self.contract_repo.list_for_user(
            user_id, search=None, page=1, page_size=RECENT_CONTRACTS_LIMIT
        )

        distribution = self.risk_repo.severity_distribution_for_user(user_id)

        return DashboardResponse(
            total_contracts=total_contracts,
            recent_contracts=recent_contracts,
            storage_used_bytes=self.contract_repo.total_storage_bytes_for_user(user_id),
            risk_distribution=RiskDistribution(**distribution),
            chat_sessions_count=self.chat_repo.session_count_for_user(user_id),
            chat_messages_count=self.chat_repo.message_count_for_user(user_id),
            summaries_generated_count=self.summary_repo.count_for_user(user_id),
            comparisons_count=self.comparison_repo.count_for_user(user_id),
            reports_generated_count=self.report_repo.count_for_user(user_id),
        )