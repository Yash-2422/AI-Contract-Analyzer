"""Tests for Phase 6 risk analysis: JSON parsing, scoring, replace-not-accumulate."""

import io
import json

import fitz


def _upload_and_process(client, headers, text="Confidentiality clause with no time limit."):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()

    upload = client.post(
        "/api/v1/contracts",
        headers=headers,
        files={"file": ("risk-test.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    contract_id = upload.json()["id"]
    client.post(f"/api/v1/contracts/{contract_id}/process", headers=headers)
    return contract_id


def test_risk_analysis_requires_processed_contract(client, auth_headers):
    upload = client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("unprocessed.pdf", io.BytesIO(b"%PDF-1.4 x"), "application/pdf")},
    )
    contract_id = upload.json()["id"]

    response = client.post(f"/api/v1/contracts/{contract_id}/risk-analysis", headers=auth_headers)
    assert response.status_code == 400


def test_risk_analysis_parses_structured_findings(client, auth_headers, monkeypatch):
    from app.services import llm_service as llm_module

    def fake_generate(self, system_prompt, messages):
        if "risk analysis assistant" in system_prompt:
            return json.dumps(
                [
                    {
                        "category": "confidentiality",
                        "severity": "critical",
                        "title": "No expiration",
                        "explanation": "Runs forever.",
                        "suggestion": "Add a term limit.",
                        "page_number": 1,
                    }
                ]
            )
        return "n/a"

    monkeypatch.setattr(llm_module.LLMService, "generate", fake_generate)

    contract_id = _upload_and_process(client, auth_headers)
    response = client.post(f"/api/v1/contracts/{contract_id}/risk-analysis", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body["findings"]) == 1
    assert body["findings"][0]["severity"] == "critical"
    assert body["overall_risk_score"] > 0


def test_risk_analysis_rerun_replaces_not_accumulates(client, auth_headers, monkeypatch):
    from app.services import llm_service as llm_module

    def fake_generate(self, system_prompt, messages):
        return json.dumps(
            [{"category": "other", "severity": "low", "title": "X", "explanation": "Y", "suggestion": "Z", "page_number": None}]
        )

    monkeypatch.setattr(llm_module.LLMService, "generate", fake_generate)

    contract_id = _upload_and_process(client, auth_headers)
    client.post(f"/api/v1/contracts/{contract_id}/risk-analysis", headers=auth_headers)
    second = client.post(f"/api/v1/contracts/{contract_id}/risk-analysis", headers=auth_headers)

    assert len(second.json()["findings"]) == 1  # not 2 - replaced, not appended


def test_risk_analysis_malformed_llm_response_returns_502(client, auth_headers, monkeypatch):
    from app.services import llm_service as llm_module

    monkeypatch.setattr(
        llm_module.LLMService, "generate", lambda self, system_prompt, messages: "not valid json"
    )

    contract_id = _upload_and_process(client, auth_headers)
    response = client.post(f"/api/v1/contracts/{contract_id}/risk-analysis", headers=auth_headers)
    assert response.status_code == 502


def test_risk_analysis_ownership_isolation(client, auth_headers):
    contract_id = _upload_and_process(client, auth_headers)

    client.post(
        "/api/v1/auth/register",
        json={"email": "riskintruder@example.com", "password": "supersecret123", "full_name": "X"},
    )
    login = client.post(
        "/api/v1/auth/login", json={"email": "riskintruder@example.com", "password": "supersecret123"}
    )
    intruder_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = client.post(f"/api/v1/contracts/{contract_id}/risk-analysis", headers=intruder_headers)
    assert response.status_code == 404