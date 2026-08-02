"""Tests for Phase 7 dashboard aggregation."""

import io

import fitz


def test_dashboard_empty_state(client, auth_headers):
    response = client.get("/api/v1/dashboard", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_contracts"] == 0
    assert body["recent_contracts"] == []


def test_dashboard_reflects_uploaded_contract(client, auth_headers):
    doc = fitz.open()
    doc.new_page().insert_text((50, 72), "test contract")
    pdf_bytes = doc.tobytes()
    doc.close()

    client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("dashboard-test.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )

    response = client.get("/api/v1/dashboard", headers=auth_headers)
    body = response.json()
    assert body["total_contracts"] == 1
    assert body["storage_used_bytes"] > 0
    assert body["recent_contracts"][0]["display_name"] == "dashboard-test"


def test_dashboard_isolated_per_user(client, auth_headers):
    doc = fitz.open()
    doc.new_page().insert_text((50, 72), "user A's contract")
    pdf_bytes = doc.tobytes()
    doc.close()

    client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("mine.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )

    client.post(
        "/api/v1/auth/register",
        json={"email": "dashintruder@example.com", "password": "supersecret123", "full_name": "X"},
    )
    login = client.post(
        "/api/v1/auth/login", json={"email": "dashintruder@example.com", "password": "supersecret123"}
    )
    other_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = client.get("/api/v1/dashboard", headers=other_headers)
    assert response.json()["total_contracts"] == 0