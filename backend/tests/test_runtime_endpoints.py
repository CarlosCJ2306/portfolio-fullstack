from __future__ import annotations

from fastapi.testclient import TestClient

import app.main as main_module
from app.core.config import settings


def test_health_is_public_and_minimal(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ready_returns_200_with_available_sqlite(client: TestClient):
    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_ready_returns_503_without_internal_details(
    client: TestClient,
    monkeypatch,
):
    class BrokenEngine:
        def connect(self):
            raise RuntimeError("sensitive db path must not leak")

    monkeypatch.setattr(main_module, "engine", BrokenEngine())

    response = client.get("/ready")

    assert response.status_code == 503
    assert response.json() == {"status": "unavailable"}
    assert "sensitive" not in response.text


def test_cors_allows_configured_origin(client: TestClient):
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization,If-None-Match",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "Authorization" in response.headers["access-control-allow-headers"]


def test_cors_blocks_unconfigured_origin(client: TestClient):
    response = client.options(
        "/health",
        headers={
            "Origin": "https://blocked.example.invalid",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_trusted_host_blocks_unconfigured_host(client: TestClient):
    response = client.get("/health", headers={"Host": "blocked.example.invalid"})

    assert response.status_code == 400


def test_docs_follow_settings(client: TestClient, admin_auth: tuple[str, str]):
    response = client.get("/openapi.json", auth=admin_auth)

    expected_status = 200 if settings.api_docs_enabled else 404
    assert response.status_code == expected_status


def test_admin_auth_requires_basic_credentials(client: TestClient):
    response = client.get("/api/admin/profile")

    assert response.status_code == 401
    assert response.headers["www-authenticate"].lower() == "basic"


def test_admin_auth_accepts_configured_credentials(
    client: TestClient,
    admin_auth: tuple[str, str],
):
    response = client.post("/api/admin/auth/login", auth=admin_auth)

    assert response.status_code == 200


def test_admin_auth_rejects_invalid_password(
    client: TestClient,
    admin_auth: tuple[str, str],
):
    response = client.post(
        "/api/admin/auth/login",
        auth=(admin_auth[0], "invalid-password"),
    )

    assert response.status_code == 401
    assert "invalid-password" not in response.text
