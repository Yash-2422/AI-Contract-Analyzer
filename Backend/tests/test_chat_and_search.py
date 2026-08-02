"""Tests for Phase 5 chat/RAG and Phase 6 cross-contract search."""

import io

import fitz


def _upload_and_process(client, headers, filename="chat-test.pdf", text="Payment is due within 30 days of invoice."):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()

    upload = client.post(
        "/api/v1/contracts",
        headers=headers,
        files={"file": (filename, io.BytesIO(pdf_bytes), "application/pdf")},
    )
    contract_id = upload.json()["id"]
    client.post(f"/api/v1/contracts/{contract_id}/process", headers=headers)
    return contract_id


def test_chat_session_and_message_flow(client, auth_headers):
    contract_id = _upload_and_process(client, auth_headers)

    session = client.post(
        f"/api/v1/contracts/{contract_id}/chat/sessions", headers=auth_headers, json={}
    )
    assert session.status_code == 201
    session_id = session.json()["id"]

    message = client.post(
        f"/api/v1/chat/sessions/{session_id}/messages",
        headers=auth_headers,
        json={"content": "When is payment due?"},
    )
    assert message.status_code == 201
    assert message.json()["role"] == "assistant"
    assert len(message.json()["cited_chunk_ids"]) > 0  # grounded in real retrieved chunks

    history = client.get(f"/api/v1/chat/sessions/{session_id}/messages", headers=auth_headers)
    roles = [m["role"] for m in history.json()]
    assert roles == ["user", "assistant"]


def test_chat_session_ownership_isolation(client, auth_headers):
    contract_id = _upload_and_process(client, auth_headers)
    session = client.post(
        f"/api/v1/contracts/{contract_id}/chat/sessions", headers=auth_headers, json={}
    )
    session_id = session.json()["id"]

    client.post(
        "/api/v1/auth/register",
        json={"email": "chatintruder@example.com", "password": "supersecret123", "full_name": "X"},
    )
    login = client.post(
        "/api/v1/auth/login", json={"email": "chatintruder@example.com", "password": "supersecret123"}
    )
    intruder_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = client.post(
        f"/api/v1/chat/sessions/{session_id}/messages",
        headers=intruder_headers,
        json={"content": "hi"},
    )
    assert response.status_code == 404


def test_search_finds_chunks_across_contracts(client, auth_headers):
    _upload_and_process(client, auth_headers, "a.pdf", "This contract discusses payment terms in detail.")
    _upload_and_process(client, auth_headers, "b.pdf", "This contract discusses termination clauses.")

    response = client.get("/api/v1/search", headers=auth_headers, params={"query": "payment terms"})
    assert response.status_code == 200
    assert len(response.json()["results"]) > 0


def test_search_only_returns_own_contracts(client, auth_headers):
    _upload_and_process(client, auth_headers)

    client.post(
        "/api/v1/auth/register",
        json={"email": "searchintruder@example.com", "password": "supersecret123", "full_name": "X"},
    )
    login = client.post(
        "/api/v1/auth/login", json={"email": "searchintruder@example.com", "password": "supersecret123"}
    )
    intruder_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = client.get("/api/v1/search", headers=intruder_headers, params={"query": "payment"})
    assert response.json()["results"] == []