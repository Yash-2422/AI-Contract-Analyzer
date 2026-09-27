"""
Detects risky/notable clauses in a contract and assigns an overall risk
score.

Uses structured JSON output from the LLM (not free-form prose) so findings
can be stored as real rows with a category/severity, not just a paragraph
of text - that's what lets the frontend filter/sort/highlight findings.

Long contracts are analyzed in multiple context-sized batches rather than
truncated to a single window - a single MAX_CONTEXT_CHARS cutoff silently
drops everything after it, which for a multi-page contract can mean the
most consequential clauses (often near the end - termination terms,
addenda, signature-page conditions) never reach the model at all.
"""

import json
import logging
import uuid

from fastapi import HTTPException, status

from app.models.risk import SEVERITY_WEIGHTS, ClauseCategory, RiskSeverity
from app.repositories.chunk_repository import ChunkRepository
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

RISK_SYSTEM_PROMPT = """You are a contract risk analysis assistant. Analyze the \
contract text and identify risky, one-sided, or notable clauses. For each \
finding, provide:
- category: one of {categories}
- severity: "low", "medium", "high", or "critical"
- title: under 8 words
- explanation: exactly one sentence, plain English
- suggestion: exactly one sentence, a safer alternative or negotiation point
- page_number: page number from context, or null if unclear

Respond with ONLY a compact JSON array — no extra whitespace, no markdown \
fences, no preamble. Example:
[{{"category":"termination","severity":"high","title":"...","explanation":"...","suggestion":"...","page_number":2}}]

This may be one section of a longer contract - not every category needs to \
appear. If this excerpt has nothing worth flagging, respond with: []

Contract text:
{context}
"""

# Per-batch limit, NOT a total-document cap. A contract longer than this
# is split into multiple batches (see _build_context_batches) and each
# batch gets its own LLM call - this is what changed from a single-window
# truncation, which silently dropped everything past the cutoff.
MAX_CONTEXT_CHARS_PER_BATCH = 6000


class RiskAnalysisService:
    def __init__(self, chunk_repo: ChunkRepository, risk_repo: RiskRepository, llm: LLMService):
        self.chunk_repo = chunk_repo
        self.risk_repo = risk_repo
        self.llm = llm

    def analyze(self, contract_id: uuid.UUID) -> tuple[list, int]:
        chunks = self.chunk_repo.list_for_contract(contract_id)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This contract hasn't been processed yet. Call /process first.",
            )

        batches = self._build_context_batches(chunks)
        category_list = ", ".join(f'"{c.value}"' for c in ClauseCategory)

        all_parsed: list[dict] = []
        for batch_context in batches:
            prompt = RISK_SYSTEM_PROMPT.format(categories=category_list, context=batch_context)
            raw_response = self.llm.generate(
                system_prompt=prompt,
                messages=[{"role": "user", "content": "Analyze this contract excerpt."}],
            )
            all_parsed.extend(self._parse_findings(raw_response))

        findings = self.risk_repo.replace_findings(contract_id, all_parsed)
        overall_score = self._compute_overall_score(findings)
        return findings, overall_score  

    def get_latest(self, contract_id: uuid.UUID) -> tuple[list, int]:
        findings = self.risk_repo.list_for_contract(contract_id)
        overall_score = self._compute_overall_score(findings)
        return findings, overall_score

    # --- Internal ---

    def _build_context_batches(self, chunks) -> list[str]:
        """
        Splits every chunk into one or more batches under the per-call char
        budget, instead of truncating - a large contract gets fully analyzed
        across several sequential LLM calls rather than losing its later
        pages silently.
        """
        batches: list[str] = []
        current_parts: list[str] = []
        current_len = 0

        for chunk in chunks:
            piece = f"[Page {chunk.page_number}]\n{chunk.content}\n"
            if current_len + len(piece) > MAX_CONTEXT_CHARS_PER_BATCH and current_parts:
                batches.append("\n".join(current_parts))
                current_parts = []
                current_len = 0
            current_parts.append(piece)
            current_len += len(piece)

        if current_parts:
            batches.append("\n".join(current_parts))

        return batches

    def _parse_findings(self, raw_response: str) -> list[dict]:
        """
        LLMs occasionally wrap JSON in markdown fences or add stray text
        despite instructions - strip common wrappers before parsing, and
        fail with a clear 502 (not a silent empty result) if it's still
        not valid JSON, so the problem is visible rather than hidden.
        """
        text = raw_response.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        try:
            raw_findings = json.loads(text)
        except json.JSONDecodeError:
            logger.error("LLM risk analysis response was not valid JSON: %r", raw_response[:500])
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The AI model returned an unexpected response format. Please try again.",
            )

        valid_categories = {c.value for c in ClauseCategory}
        valid_severities = {s.value for s in RiskSeverity}

        findings = []
        for item in raw_findings:
            category = item.get("category") if item.get("category") in valid_categories else ClauseCategory.OTHER.value
            severity = item.get("severity") if item.get("severity") in valid_severities else RiskSeverity.LOW.value
            findings.append(
                {
                    "category": category,
                    "severity": severity,
                    "title": str(item.get("title", "Untitled finding"))[:255],
                    "explanation": str(item.get("explanation", "")),
                    "suggestion": str(item.get("suggestion", "")),
                    "page_number": item.get("page_number") if isinstance(item.get("page_number"), int) else None,
                }
            )
        return findings

    def _compute_overall_score(self, findings) -> int:
        """
        0-100 score, weighted by severity (see SEVERITY_WEIGHTS) so one
        critical finding moves the score far more than several low ones.
        Capped at 100 rather than growing unbounded with finding count.
        """
        if not findings:
            return 0
        raw = sum(SEVERITY_WEIGHTS[f.severity if isinstance(f.severity, RiskSeverity) else RiskSeverity(f.severity)] for f in findings)
        return min(100, raw * 4)