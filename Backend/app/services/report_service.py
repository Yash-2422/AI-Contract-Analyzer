"""
Generates downloadable PDF reports: summary, risk, clause (risk findings
grouped by category), and comparison. Built with reportlab - pure Python,
no system dependencies (unlike WeasyPrint/wkhtmltopdf), which matters for
keeping the Docker image simple.

Every generate_* method returns raw PDF bytes and logs the generation via
ReportRepository - it never writes to disk, so there's no report file
storage/cleanup to manage.
"""

import io
import uuid
from collections import defaultdict

from fastapi import HTTPException, status
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.contract import Contract
from app.models.comparison import ContractComparison
from app.models.report import ReportType
from app.repositories.comparison_repository import ComparisonRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.risk_repository import RiskRepository
from app.repositories.summary_repository import SummaryRepository

SEVERITY_COLORS = {
    "low": colors.HexColor("#2b8a3e"),
    "medium": colors.HexColor("#e8590c"),
    "high": colors.HexColor("#c92a2a"),
    "critical": colors.HexColor("#862e2e"),
}


class ReportService:
    def __init__(
        self,
        summary_repo: SummaryRepository,
        risk_repo: RiskRepository,
        comparison_repo: ComparisonRepository,
        report_repo: ReportRepository,
    ):
        self.summary_repo = summary_repo
        self.risk_repo = risk_repo
        self.comparison_repo = comparison_repo
        self.report_repo = report_repo
        self.styles = getSampleStyleSheet()

    def generate_summary_report(self, user_id: uuid.UUID, contract: Contract) -> bytes:
        summary = self.summary_repo.get_latest_for_contract(contract.id)
        if summary is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No summary has been generated for this contract yet.",
            )

        elements = [
            self._title(f"Summary Report: {contract.display_name}"),
            self._meta_line(f"Generated from: {contract.original_filename}"),
            Spacer(1, 0.3 * inch),
            Paragraph(summary.content.replace("\n", "<br/>"), self.styles["BodyText"]),
        ]
        pdf_bytes = self._render(elements)
        self.report_repo.log_generation(user_id, ReportType.SUMMARY, contract.id)
        return pdf_bytes

    def generate_risk_report(self, user_id: uuid.UUID, contract: Contract) -> bytes:
        findings = self.risk_repo.list_for_contract(contract.id)

        elements = [
            self._title(f"Risk Report: {contract.display_name}"),
            self._meta_line(f"{len(findings)} finding(s) identified"),
            Spacer(1, 0.3 * inch),
        ]

        if not findings:
            elements.append(Paragraph("No risk analysis has been run for this contract yet.", self.styles["BodyText"]))
        else:
            for f in findings:
                severity_value = f.severity.value if hasattr(f.severity, "value") else f.severity
                severity_style = ParagraphStyle(
                    "Severity",
                    parent=self.styles["BodyText"],
                    textColor=SEVERITY_COLORS.get(severity_value, colors.black),
                    fontName="Helvetica-Bold",
                )
                category_value = f.category.value if hasattr(f.category, "value") else f.category
                elements.append(Paragraph(f.title, self.styles["Heading3"]))
                elements.append(Paragraph(f"{severity_value.upper()} · {category_value.replace('_', ' ').title()}", severity_style))
                elements.append(Paragraph(f.explanation, self.styles["BodyText"]))
                elements.append(Paragraph(f"<b>Suggestion:</b> {f.suggestion}", self.styles["BodyText"]))
                elements.append(Spacer(1, 0.2 * inch))

        pdf_bytes = self._render(elements)
        self.report_repo.log_generation(user_id, ReportType.RISK, contract.id)
        return pdf_bytes

    def generate_clause_report(self, user_id: uuid.UUID, contract: Contract) -> bytes:
        findings = self.risk_repo.list_for_contract(contract.id)

        by_category: dict[str, list] = defaultdict(list)
        for f in findings:
            category_value = f.category.value if hasattr(f.category, "value") else f.category
            by_category[category_value].append(f)

        elements = [
            self._title(f"Clause Report: {contract.display_name}"),
            self._meta_line(f"Clauses grouped across {len(by_category)} categories"),
            Spacer(1, 0.3 * inch),
        ]

        if not by_category:
            elements.append(Paragraph("No clauses have been categorized for this contract yet. Run risk analysis first.", self.styles["BodyText"]))
        else:
            for category, items in sorted(by_category.items()):
                elements.append(Paragraph(category.replace("_", " ").title(), self.styles["Heading2"]))
                table_data = [["Title", "Severity", "Page"]]
                for item in items:
                    severity_value = item.severity.value if hasattr(item.severity, "value") else item.severity
                    table_data.append([item.title, severity_value.title(), str(item.page_number or "-")])
                table = Table(table_data, colWidths=[3.2 * inch, 1.2 * inch, 0.8 * inch])
                table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eeeeee")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]))
                elements.append(table)
                elements.append(Spacer(1, 0.25 * inch))

        pdf_bytes = self._render(elements)
        self.report_repo.log_generation(user_id, ReportType.CLAUSE, contract.id)
        return pdf_bytes

    def generate_comparison_report(self, user_id: uuid.UUID, comparison: ContractComparison) -> bytes:
        elements = [
            self._title("Contract Comparison Report"),
            self._meta_line(f"Comparison ID: {comparison.id}"),
            Spacer(1, 0.3 * inch),
            Paragraph(comparison.result.replace("\n", "<br/>"), self.styles["BodyText"]),
        ]
        pdf_bytes = self._render(elements)
        self.report_repo.log_generation(user_id, ReportType.COMPARISON, comparison.id)
        return pdf_bytes

    # --- Internal ---

    def _title(self, text: str):
        return Paragraph(text, self.styles["Title"])

    def _meta_line(self, text: str):
        return Paragraph(text, ParagraphStyle("Meta", parent=self.styles["Normal"], textColor=colors.grey))

    def _render(self, elements: list) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
        doc.build(elements)
        return buffer.getvalue()