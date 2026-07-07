from __future__ import annotations

from collections.abc import Callable

from fastapi.testclient import TestClient


def _project_payload(**overrides) -> dict:
    payload = {
        "title": "Proyecto de prueba",
        "slug": "proyecto-prueba",
        "short_description": "Contrato público de proyecto",
        "description": "Descripción creada exclusivamente en SQLite temporal.",
        "repository_url": "https://example.test/repository",
        "demo_url": "https://example.test/demo",
        "is_featured": False,
        "display_order": 0,
        "is_active": True,
        "skill_ids": [],
        "gallery_image_ids": [],
    }
    payload.update(overrides)
    return payload


def test_public_home_empty_contract_has_no_invented_profile(client: TestClient) -> None:
    response = client.get("/api/public/home")

    assert response.status_code == 200
    assert response.json() == {
        "profile": None,
        "social_links": [],
        "skills": [],
        "featured_projects": [],
        "experience": [],
        "education": [],
        "certifications": [],
    }


def test_public_projects_keep_cover_and_ordered_additional_gallery(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    cover = upload_asset("image", file_name="cover.png")
    gallery_second = upload_asset("image", file_name="gallery-second.png")
    gallery_first = upload_asset("image", file_name="gallery-first.png")

    without_gallery = client.post(
        "/api/admin/projects",
        json=_project_payload(
            title="Sin galería",
            slug="sin-galeria",
            repository_url=None,
            demo_url=None,
            display_order=0,
        ),
        auth=admin_auth,
    )
    assert without_gallery.status_code == 201

    with_gallery = client.post(
        "/api/admin/projects",
        json=_project_payload(
            title="Con portada y galería",
            slug="con-galeria",
            image_asset_id=cover["id"],
            gallery_image_ids=[gallery_first["id"], gallery_second["id"]],
            display_order=1,
            is_featured=True,
        ),
        auth=admin_auth,
    )
    assert with_gallery.status_code == 201, with_gallery.text
    admin_project = with_gallery.json()
    assert admin_project["image_asset_id"] == cover["id"]

    response = client.get("/api/public/projects")

    assert response.status_code == 200
    projects = response.json()
    assert projects[0]["slug"] == "sin-galeria"
    assert projects[0]["image"] is None
    assert projects[0]["gallery_images"] == []

    project = projects[1]
    assert project["image"]["id"] == cover["id"]
    assert [item["media_asset_id"] for item in project["gallery_images"]] == [
        gallery_first["id"],
        gallery_second["id"],
    ]
    assert [item["display_order"] for item in project["gallery_images"]] == [0, 1]


def test_public_certification_separates_credential_url_and_pdf(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    document = upload_asset("document")
    credential_url = "https://example.test/credential/qa"

    created = client.post(
        "/api/admin/certifications",
        json={
            "name": "Certificación temporal",
            "issuer": "QA",
            "issue_date": "2026-07-06",
            "credential_url": credential_url,
            "description": "Documento de prueba",
            "certificate_file_id": document["id"],
            "display_order": 0,
            "is_active": True,
        },
        auth=admin_auth,
    )
    assert created.status_code == 201, created.text
    assert created.json()["certificate_file_id"] == document["id"]

    response = client.get("/api/public/certifications")

    assert response.status_code == 200
    certification = response.json()[0]
    assert certification["credential_url"] == credential_url
    assert certification["certificate_file"]["id"] == document["id"]
    assert certification["certificate_file"]["mime_type"] == "application/pdf"


def test_contact_accepts_valid_payload_and_rejects_invalid_email(
    client: TestClient,
) -> None:
    valid_payload = {
        "name": "Persona QA",
        "email": "qa@example.test",
        "subject": "Prueba temporal",
        "message": "Mensaje válido creado únicamente en la base temporal.",
    }
    created = client.post("/api/public/contact", json=valid_payload)
    invalid = client.post(
        "/api/public/contact",
        json={**valid_payload, "email": "correo-invalido"},
    )

    assert created.status_code == 201
    assert created.json()["success"] is True
    assert isinstance(created.json()["contact_message_id"], int)
    assert invalid.status_code == 422
    assert isinstance(invalid.json()["detail"], list)
    assert any(error["loc"][-1] == "email" for error in invalid.json()["detail"])
