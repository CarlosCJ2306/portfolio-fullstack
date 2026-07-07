from __future__ import annotations

from base64 import b64encode

from fastapi.testclient import TestClient

from app.database.connection import DATABASE_URL


def test_database_url_is_explicitly_temporary() -> None:
    normalized_url = DATABASE_URL.replace("\\", "/").lower()

    assert normalized_url.startswith("sqlite:///")
    assert "portfolio.db" not in normalized_url
    assert "portfolio_backend_tests_" in normalized_url


def test_valid_image_and_pdf_uploads(
    client: TestClient,
    admin_auth: tuple[str, str],
) -> None:
    image = client.post(
        "/api/admin/media-assets",
        json={
            "asset_type": "image",
            "file_name": "valid.png",
            "mime_type": "image/png",
            "data_base64": "aW1hZ2U=",
        },
        auth=admin_auth,
    )
    document = client.post(
        "/api/admin/media-assets",
        json={
            "asset_type": "document",
            "file_name": "valid.pdf",
            "mime_type": "application/pdf",
            "data_base64": "JVBERi0xLjQKJSVFT0YK",
        },
        auth=admin_auth,
    )

    assert image.status_code == 201
    assert image.json()["asset_type"] == "image"
    assert document.status_code == 201
    assert document.json()["mime_type"] == "application/pdf"


def test_upload_rejects_invalid_mime_and_base64(
    client: TestClient,
    admin_auth: tuple[str, str],
) -> None:
    invalid_mime = client.post(
        "/api/admin/media-assets",
        json={
            "asset_type": "image",
            "file_name": "not-an-image.pdf",
            "mime_type": "application/pdf",
            "data_base64": "aW1hZ2U=",
        },
        auth=admin_auth,
    )
    invalid_base64 = client.post(
        "/api/admin/media-assets",
        json={
            "asset_type": "image",
            "file_name": "invalid.png",
            "mime_type": "image/png",
            "data_base64": "%%%not-base64%%%",
        },
        auth=admin_auth,
    )

    assert invalid_mime.status_code == 422
    assert invalid_base64.status_code == 422
    assert "base64" in str(invalid_base64.json()["detail"]).lower()


def test_image_upload_rejects_payload_over_five_megabytes(
    client: TestClient,
    admin_auth: tuple[str, str],
) -> None:
    oversized_content = b64encode(b"x" * (5 * 1024 * 1024 + 1)).decode("ascii")

    response = client.post(
        "/api/admin/media-assets",
        json={
            "asset_type": "image",
            "file_name": "oversized.png",
            "mime_type": "image/png",
            "data_base64": oversized_content,
        },
        auth=admin_auth,
    )

    assert response.status_code == 422
    assert "5 mb" in str(response.json()["detail"]).lower()


def test_upload_rejects_unsafe_svg(
    client: TestClient,
    admin_auth: tuple[str, str],
) -> None:
    response = client.post(
        "/api/admin/media-assets",
        json={
            "asset_type": "icon_svg",
            "file_name": "unsafe.svg",
            "mime_type": "image/svg+xml",
            "svg_content": (
                '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">'
                "<script>alert(1)</script></svg>"
            ),
        },
        auth=admin_auth,
    )

    assert response.status_code == 422
    detail = str(response.json()["detail"]).lower()
    assert "no permitido" in detail or "evento" in detail
