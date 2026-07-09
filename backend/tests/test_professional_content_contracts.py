"""Contratos C1 para confidencialidad de proyectos y vencimiento."""

from __future__ import annotations

from collections.abc import Callable

from fastapi.testclient import TestClient


def _project_payload(**overrides) -> dict:
    payload = {
        "title": "Proyecto C1",
        "slug": "proyecto-c1",
        "short_description": "Contrato profesional C1",
        "description": "Datos creados solo en SQLite temporal.",
        "is_featured": False,
        "display_order": 0,
        "is_active": True,
        "skill_ids": [],
        "gallery_image_ids": [],
    }
    payload.update(overrides)
    return payload


def test_project_admin_defaults_and_partial_updates(
    client: TestClient,
    admin_auth: tuple[str, str],
) -> None:
    created = client.post(
        "/api/admin/projects",
        json=_project_payload(),
        auth=admin_auth,
    )
    assert created.status_code == 201, created.text
    project = created.json()
    assert project["is_confidential"] is False
    assert project["confidentiality_note"] is None
    assert project["client_display_name"] is None
    assert project["allow_public_images"] is True

    text_only = client.put(
        f"/api/admin/projects/{project['id']}",
        json={"title": "Proyecto C1 actualizado"},
        auth=admin_auth,
    )
    assert text_only.status_code == 200
    assert text_only.json()["allow_public_images"] is True
    assert text_only.json()["is_confidential"] is False

    changed = client.put(
        f"/api/admin/projects/{project['id']}",
        json={
            "is_confidential": True,
            "confidentiality_note": "  Información pública limitada.  ",
            "client_display_name": "  Organización cliente confidencial  ",
            "allow_public_images": False,
        },
        auth=admin_auth,
    )
    assert changed.status_code == 200, changed.text
    assert changed.json()["is_confidential"] is True
    assert changed.json()["confidentiality_note"] == "Información pública limitada."
    assert changed.json()["client_display_name"] == "Organización cliente confidencial"
    assert changed.json()["allow_public_images"] is False


def test_public_image_policy_does_not_remove_admin_associations(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    cover = upload_asset("image", file_name="cover-c1.png")
    gallery = upload_asset("image", file_name="gallery-c1.png")

    visible = client.post(
        "/api/admin/projects",
        json=_project_payload(
            slug="confidential-visible-images",
            image_asset_id=cover["id"],
            gallery_image_ids=[gallery["id"]],
            is_confidential=True,
            allow_public_images=True,
        ),
        auth=admin_auth,
    )
    hidden = client.post(
        "/api/admin/projects",
        json=_project_payload(
            title="Proyecto sin multimedia pública",
            slug="confidential-hidden-images",
            image_asset_id=cover["id"],
            gallery_image_ids=[gallery["id"]],
            is_confidential=True,
            allow_public_images=False,
            display_order=1,
        ),
        auth=admin_auth,
    )
    assert visible.status_code == 201, visible.text
    assert hidden.status_code == 201, hidden.text

    public_projects = client.get("/api/public/projects")
    assert public_projects.status_code == 200
    by_slug = {item["slug"]: item for item in public_projects.json()}
    assert by_slug["confidential-visible-images"]["image"]["id"] == cover["id"]
    assert by_slug["confidential-visible-images"]["gallery_images"][0]["media_asset_id"] == gallery["id"]
    assert by_slug["confidential-hidden-images"]["image"] is None
    assert by_slug["confidential-hidden-images"]["gallery_images"] == []

    admin_projects = client.get("/api/admin/projects", auth=admin_auth)
    assert admin_projects.status_code == 200
    admin_hidden = next(
        item for item in admin_projects.json()
        if item["slug"] == "confidential-hidden-images"
    )
    assert admin_hidden["image_asset_id"] == cover["id"]
    assert admin_hidden["image"]["id"] == cover["id"]
    assert admin_hidden["gallery_images"][0]["media_asset_id"] == gallery["id"]


def test_certification_expiration_contract_and_partial_validation(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    document = upload_asset("document")
    credential_url = "https://example.test/credential/c1"
    valid = client.post(
        "/api/admin/certifications",
        json={
            "name": "Certificación C1",
            "issue_date": "2025-01-10",
            "expiration_date": "2026-01-10",
            "credential_url": credential_url,
            "certificate_file_id": document["id"],
        },
        auth=admin_auth,
    )
    no_expiration = client.post(
        "/api/admin/certifications",
        json={"name": "Certificación sin vencimiento"},
        auth=admin_auth,
    )
    invalid = client.post(
        "/api/admin/certifications",
        json={
            "name": "Certificación inválida",
            "issue_date": "2025-01-10",
            "expiration_date": "2025-01-09",
        },
        auth=admin_auth,
    )

    assert valid.status_code == 201, valid.text
    assert no_expiration.status_code == 201
    assert no_expiration.json()["expiration_date"] is None
    assert invalid.status_code == 422

    partial_invalid = client.put(
        f"/api/admin/certifications/{valid.json()['id']}",
        json={"expiration_date": "2024-12-31"},
        auth=admin_auth,
    )
    equal_dates = client.put(
        f"/api/admin/certifications/{valid.json()['id']}",
        json={"expiration_date": "2025-01-10"},
        auth=admin_auth,
    )
    assert partial_invalid.status_code == 422
    assert equal_dates.status_code == 200

    public = client.get("/api/public/certifications")
    assert public.status_code == 200
    public_item = next(item for item in public.json() if item["id"] == valid.json()["id"])
    assert public_item["issue_date"] == "2025-01-10"
    assert public_item["expiration_date"] == "2025-01-10"
    assert public_item["credential_url"] == credential_url
    assert public_item["certificate_file"]["id"] == document["id"]
