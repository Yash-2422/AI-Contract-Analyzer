import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.report import GeneratedReport, ReportType


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def log_generation(
        self, user_id: uuid.UUID, report_type: ReportType, reference_id: uuid.UUID
    ) -> GeneratedReport:
        record = GeneratedReport(user_id=user_id, report_type=report_type, reference_id=reference_id)
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def count_for_user(self, user_id: uuid.UUID) -> int:
        return (
            self.db.query(func.count(GeneratedReport.id))
            .filter(GeneratedReport.user_id == user_id)
            .scalar()
        )