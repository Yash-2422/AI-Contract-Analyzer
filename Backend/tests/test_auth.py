"""Tests for Phase 2 auth: register, login, refresh rotation, profile."""


def test_register_creates_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "alice@example.com", "password": "supersecret123", "full_name": "Alice"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert "hashed_password" not in body  # response schema must never leak the hash


def test_register_duplicate_email_rejected(client):
    payload = {"email": "bob@example.com", "password": "supersecret123", "full_name": "Bob"}
    client.post("/api/v1/auth/register", json=payload)
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


def test_register_weak_password_rejected(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "weak@example.com", "password": "short", "full_name": "Weak"},
    )
    assert response.status_code == 422


def test_login_wrong_password_rejected(client):
    client.post(
        "/api/v1/auth/register",
        json={"email": "carol@example.com", "password": "supersecret123", "full_name": "Carol"},
    )
    response = client.post(
        "/api/v1/auth/login", json={"email": "carol@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_login_returns_tokens(registered_user):
    _, user = registered_user
    assert user["email"].startswith("test-")


def test_me_requires_auth(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401  

def test_me_rejects_garbage_token(client):
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage"})
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200


def test_refresh_token_rotates_and_old_token_is_rejected(client):
    email, password = "dave@example.com", "supersecret123"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Dave"},
    )
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    old_refresh = login.json()["refresh_token"]

    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert refreshed.status_code == 200

    # Rotation: the OLD refresh token must now be rejected, not reusable.
    reused = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert reused.status_code == 401


def test_logout_revokes_refresh_token(client):
    email, password = "erin@example.com", "supersecret123"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Erin"},
    )
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    refresh_token = login.json()["refresh_token"]

    logout = client.post("/api/v1/auth/logout", json={"refresh_token": refresh_token})
    assert logout.status_code == 200

    reused = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert reused.status_code == 401


def test_update_profile(client, auth_headers):
    response = client.patch(
        "/api/v1/auth/me", headers=auth_headers, json={"full_name": "Updated Name"}
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"