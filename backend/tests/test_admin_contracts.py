from __future__ import annotations

from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient


def _valid_project_payload(**overrides) -> dict:
    payload = {
        "title": "Proyecto admin",
        "slug": "proyecto-admin",
        "short_description": "Contrato administrativo",
        "description": "Proyecto creado en SQLite temporal.",
        "repository_url": "https://example.test/repository",
        "demo_url": None,
        "is_featured": False,
        "display_order": 0,
        "is_active": True,
        "skill_ids": [],
        "gallery_image_ids": [],
    }
    payload.update(overrides)
    return payload


def test_admin_requires_basic_auth(client: TestClient) -> None:
    response = client.get("/api/admin/dashboard", auth=("invalid", "invalid"))

    assert response.status_code == 401


def test_admin_contact_message_delete_uses_integer_id_contract(
    client: TestClient,
    admin_auth: tuple[str, str],
) -> None:
    created = client.post(
        "/api/public/contact",
        json={
            "name": "Mensaje QA",
            "email": "qa@example.test",
            "subject": "Contrato DELETE",
            "message": "Mensaje temporal para validar el contrato admin.",
        },
    )
    assert created.status_code == 201, created.text
    contact_message_id = created.json()["contact_message_id"]
    assert isinstance(contact_message_id, int)

    list_response = client.get("/api/admin/contact-messages", auth=admin_auth)
    assert list_response.status_code == 200
    listed_message = next(
        message
        for message in list_response.json()
        if message["id"] == contact_message_id
    )
    assert isinstance(listed_message["id"], int)
    assert "contact_message_id" not in listed_message

    invalid_delete = client.delete(
        "/api/admin/contact-messages/[object Object]",
        auth=admin_auth,
    )
    assert invalid_delete.status_code == 422

    delete_response = client.delete(
        f"/api/admin/contact-messages/{contact_message_id}",
        auth=admin_auth,
    )
    assert delete_response.status_code == 204

    after_delete = client.get("/api/admin/contact-messages", auth=admin_auth)
    assert after_delete.status_code == 200
    assert all(
        message["id"] != contact_message_id
        for message in after_delete.json()
    )


def test_profile_text_update_preserves_avatar_asset_id(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    avatar = upload_asset("avatar")
    initial = client.put(
        "/api/admin/profile",
        json={
            "full_name": "Perfil temporal",
            "professional_title": "Título inicial",
            "summary": "Resumen de prueba",
            "email": "profile@example.test",
            "avatar_asset_id": avatar["id"],
        },
        auth=admin_auth,
    )
    assert initial.status_code == 200, initial.text

    updated = client.put(
        "/api/admin/profile",
        json={"professional_title": "Título actualizado"},
        auth=admin_auth,
    )

    assert updated.status_code == 200
    assert updated.json()["avatar_asset_id"] == avatar["id"]
    assert updated.json()["avatar"]["id"] == avatar["id"]


def test_referenced_assets_cannot_be_deleted(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    avatar = upload_asset("avatar")
    cover = upload_asset("image", file_name="cover.png")
    gallery = upload_asset("image", file_name="gallery.png")
    icon = upload_asset("icon")
    document = upload_asset("document")

    assert client.put(
        "/api/admin/profile",
        json={
            "full_name": "Perfil protegido",
            "professional_title": "QA",
            "summary": "Prueba de referencias",
            "avatar_asset_id": avatar["id"],
        },
        auth=admin_auth,
    ).status_code == 200
    assert client.post(
        "/api/admin/skills",
        json={
            "name": "Skill protegida",
            "category": "QA",
            "level": "Avanzado",
            "icon_asset_id": icon["id"],
        },
        auth=admin_auth,
    ).status_code == 201
    assert client.post(
        "/api/admin/projects",
        json=_valid_project_payload(
            image_asset_id=cover["id"],
            gallery_image_ids=[gallery["id"]],
        ),
        auth=admin_auth,
    ).status_code == 201
    assert client.post(
        "/api/admin/certifications",
        json={
            "name": "Certificación protegida",
            "certificate_file_id": document["id"],
        },
        auth=admin_auth,
    ).status_code == 201

    for asset_id in (
        avatar["id"],
        cover["id"],
        gallery["id"],
        icon["id"],
        document["id"],
    ):
        response = client.delete(
            f"/api/admin/media-assets/{asset_id}",
            auth=admin_auth,
        )
        assert response.status_code == 409
        assert "en uso" in response.json()["detail"].lower()


@pytest.mark.parametrize("asset_type", ["icon", "icon_svg"])
def test_skill_accepts_supported_icon_asset_types(
    asset_type: str,
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    upload_kwargs = {}
    if asset_type == "icon_svg":
        upload_kwargs["svg_content"] = (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">'
            '<path d="M1 1h8v8H1z"/></svg>'
        )

    icon = upload_asset(asset_type, **upload_kwargs)
    response = client.post(
        "/api/admin/skills",
        json={
            "name": f"Skill {asset_type}",
            "category": "QA",
            "level": "Avanzado",
            "icon_asset_id": icon["id"],
        },
        auth=admin_auth,
    )

    assert response.status_code == 201, response.text
    assert response.json()["icon_asset_id"] == icon["id"]
    assert response.json()["icon"]["asset_type"] == asset_type


@pytest.mark.parametrize(
    ("endpoint", "payload_factory"),
    [
        (
            "/api/admin/profile",
            lambda asset_id: {
                "full_name": "Perfil inválido",
                "professional_title": "QA",
                "summary": "Asset incorrecto",
                "avatar_asset_id": asset_id,
            },
        ),
        (
            "/api/admin/projects",
            lambda asset_id: _valid_project_payload(image_asset_id=asset_id),
        ),
        (
            "/api/admin/projects",
            lambda asset_id: _valid_project_payload(gallery_image_ids=[asset_id]),
        ),
        (
            "/api/admin/skills",
            lambda asset_id: {
                "name": "Skill inválida",
                "category": "QA",
                "level": "Inicial",
                "icon_asset_id": asset_id,
            },
        ),
        (
            "/api/admin/certifications",
            lambda asset_id: {
                "name": "Certificación inválida",
                "certificate_file_id": asset_id,
            },
        ),
    ],
)
def test_admin_rejects_invalid_asset_associations(
    endpoint: str,
    payload_factory,
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    wrong_asset = upload_asset("document") if endpoint != "/api/admin/certifications" else upload_asset("image")

    method = client.put if endpoint == "/api/admin/profile" else client.post
    response = method(endpoint, json=payload_factory(wrong_asset["id"]), auth=admin_auth)

    assert response.status_code == 400
    assert "asset" in response.json()["detail"].lower()


def test_admin_returns_422_for_invalid_project_contracts(
    client: TestClient,
    admin_auth: tuple[str, str],
) -> None:
    missing_required = client.post(
        "/api/admin/projects",
        json={"title": "Incompleto"},
        auth=admin_auth,
    )
    invalid_url_length = client.post(
        "/api/admin/projects",
        json=_valid_project_payload(
            slug="url-demasiado-larga",
            repository_url=f"https://example.test/{'x' * 260}",
        ),
        auth=admin_auth,
    )

    assert missing_required.status_code == 422
    assert isinstance(missing_required.json()["detail"], list)
    missing_fields = {error["loc"][-1] for error in missing_required.json()["detail"]}
    assert {"slug", "short_description", "description"}.issubset(missing_fields)
    assert invalid_url_length.status_code == 422
    assert any(
        error["loc"][-1] == "repository_url"
        for error in invalid_url_length.json()["detail"]
    )
