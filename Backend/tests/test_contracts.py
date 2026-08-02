"""Tests for Phase 3 document management: upload, list, ownership isolation."""

import io


def _pdf_bytes() -> bytes:
    return b"%PDF-1.4 test contract content for pytest"


def test_upload_valid_pdf(client, auth_headers):
    response = client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("contract.pdf", io.BytesIO(_pdf_bytes()), "application/pdf")},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "uploaded"
    assert body["original_filename"] == "contract.pdf"


def test_upload_rejects_wrong_extension(client, auth_headers):
    response = client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("virus.exe", io.BytesIO(b"MZ"), "application/octet-stream")},
    )
    assert response.status_code == 400


def test_upload_rejects_empty_file(client, auth_headers):
    response = client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")},
    )
    assert response.status_code == 400


def test_upload_requires_auth(client):
    response = client.post(
        "/api/v1/contracts",
        files={"file": ("contract.pdf", io.BytesIO(_pdf_bytes()), "application/pdf")},
    )
    assert response.status_code == 403


def test_list_contracts_only_shows_own(client, auth_headers):
    client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("mine.pdf", io.BytesIO(_pdf_bytes()), "application/pdf")},
    )
    response = client.get("/api/v1/contracts", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_contract_ownership_isolation(client, auth_headers, registered_user):
    upload = client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("private.pdf", io.BytesIO(_pdf_bytes()), "application/pdf")},
    )
    contract_id = upload.json()["id"]

    # A second, different user must not be able to see or touch it.
    client.post(
        "/api/v1/auth/register",
        json={"email": "intruder@example.com", "password": "supersecret123", "full_name": "Intruder"},
    )
    login = client.post(
        "/api/v1/auth/login", json={"email": "intruder@example.com", "password": "supersecret123"}
    )
    intruder_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    assert client.get(f"/api/v1/contracts/{contract_id}", headers=intruder_headers).status_code == 404
    assert (
        client.delete(f"/api/v1/contracts/{contract_id}", headers=intruder_headers).status_code
        == 404
    )
    assert client.get("/api/v1/contracts", headers=intruder_headers).json()["total"] == 0


def test_rename_contract(client, auth_headers):
    upload = client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("original.pdf", io.BytesIO(_pdf_bytes()), "application/pdf")},
    )
    contract_id = upload.json()["id"]

    response = client.patch(
        f"/api/v1/contracts/{contract_id}", headers=auth_headers, json={"display_name": "Renamed"}
    )
    assert response.status_code == 200
    assert response.json()["display_name"] == "Renamed"


def test_delete_contract(client, auth_headers):
    upload = client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("todelete.pdf", io.BytesIO(_pdf_bytes()), "application/pdf")},
    )
    contract_id = upload.json()["id"]

    assert client.delete(f"/api/v1/contracts/{contract_id}", headers=auth_headers).status_code == 204
    assert client.get(f"/api/v1/contracts/{contract_id}", headers=auth_headers).status_code == 404


def test_process_and_generate_summary_end_to_end(client, auth_headers):
    """Exercises Phase 4 (extraction/chunking/embedding) and Phase 5
    (summary generation) together against real PyMuPDF extraction and a
    real pgvector-backed chunk store, with only the LLM/embedding model
    weights faked (see conftest._fake_ai_models)."""
    import fitz

    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "This is a real extractable contract clause for testing.")
    pdf_bytes = doc.tobytes()
    doc.close()

    upload = client.post(
        "/api/v1/contracts",
        headers=auth_headers,
        files={"file": ("real.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
    )
    contract_id = upload.json()["id"]

    process = client.post(f"/api/v1/contracts/{contract_id}/process", headers=auth_headers)
    assert process.status_code == 200
    assert process.json()["status"] == "processed"

    chunks = client.get(f"/api/v1/contracts/{contract_id}/chunks", headers=auth_headers)
    assert chunks.status_code == 200
    assert len(chunks.json()) > 0

    summary = client.post(f"/api/v1/contracts/{contract_id}/summary", headers=auth_headers)
    assert summary.status_code == 201
    assert len(summary.json()["content"]) > 0