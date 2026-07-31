"""
Report endpoints. Every PDF is generated on the fly and streamed directly
in the response - nothing is written to disk, so there's no report file
storage or cleanup to manage. ReportService logs each generation via
ReportRepository purely for the dashboard's "Reports Generated" stat.
"""

import io
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.v1.dependencies import (
    get_comparison_service,
    get_current_user,
    get_document_service,
    get_report_service,
)
from app.models.user import User
from app.services.comparison_service import ComparisonService
from app.services.document_service import DocumentService
from app.services.report_service import ReportService

router = APIRouter()


def _pdf_response(pdf_bytes: bytes, filename: str) -> StreamingResponse:
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/contracts/{contract_id}/reports/summary")
def download_summary_report(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    report_service: ReportService = Depends(get_report_service),
):
    contract = document_service.get_owned_or_404(contract_id, current_user.id)
    pdf_bytes = report_service.generate_summary_report(current_user.id, contract)
    return _pdf_response(pdf_bytes, f"{contract.display_name}-summary.pdf")


@router.get("/contracts/{contract_id}/reports/risk")
def download_risk_report(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    report_service: ReportService = Depends(get_report_service),
):
    contract = document_service.get_owned_or_404(contract_id, current_user.id)
    pdf_bytes = report_service.generate_risk_report(current_user.id, contract)
    return _pdf_response(pdf_bytes, f"{contract.display_name}-risk.pdf")


@router.get("/contracts/{contract_id}/reports/clauses")
def download_clause_report(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    document_service: DocumentService = Depends(get_document_service),
    report_service: ReportService = Depends(get_report_service),
):
    contract = document_service.get_owned_or_404(contract_id, current_user.id)
    pdf_bytes = report_service.generate_clause_report(current_user.id, contract)
    return _pdf_response(pdf_bytes, f"{contract.display_name}-clauses.pdf")


@router.get("/comparisons/{comparison_id}/reports/comparison")
def download_comparison_report(
    comparison_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    comparison_service: ComparisonService = Depends(get_comparison_service),
    report_service: ReportService = Depends(get_report_service),
):
    comparison = comparison_service.get_owned_or_404(comparison_id, current_user.id)
    pdf_bytes = report_service.generate_comparison_report(current_user.id, comparison)
    return _pdf_response(pdf_bytes, f"comparison-{comparison_id}.pdf")