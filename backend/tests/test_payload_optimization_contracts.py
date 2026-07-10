from __future__ import annotations

from collections.abc import Callable

from fastapi.testclient import TestClient
from sqlalchemy import update

from app.database.connection import SessionLocal
from app.models.media_asset_model import MediaAsset


def _project_payload(**overrides) -> dict:
    payload = {
        "title": "Proyecto payload",
        "slug": "proyecto-payload",
        "short_description": "Contrato de payload ligero",
        "description": "Proyecto creado solo en SQLite temporal.",
        "is_featured": False,
        "display_order": 0,
        "is_active": True,
        "skill_ids": [],
        "gallery_image_ids": [],
    }
    payload.update(overrides)
    return payload


def _assert_light_asset(asset: dict) -> None:
    assert "content_url" in asset
    assert "data_base64" not in asset
    assert "svg_content" not in asset


def test_public_content_endpoint_allows_only_public_references(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    avatar = upload_asset("avatar", file_name="avatar.png")
    cover = upload_asset("image", file_name="cover.png")
    gallery = upload_asset("image", file_name="gallery.png")
    hidden = upload_asset("image", file_name="hidden.png")
    document = upload_asset("document", file_name="certificate.pdf")
    orphan = upload_asset("image", file_name="orphan.png")

    profile = client.put(
        "/api/admin/profile",
        json={
            "full_name": "QA",
            "professional_title": "QA",
            "summary": "Perfil temporal",
            "avatar_asset_id": avatar["id"],
        },
        auth=admin_auth,
    )
    assert profile.status_code == 200, profile.text

    visible_project = client.post(
        "/api/admin/projects",
        json=_project_payload(
            image_asset_id=cover["id"],
            gallery_image_ids=[gallery["id"]],
            allow_public_images=True,
        ),
        auth=admin_auth,
    )
    hidden_project = client.post(
        "/api/admin/projects",
        json=_project_payload(
            title="Proyecto oculto",
            slug="proyecto-oculto",
            image_asset_id=hidden["id"],
            allow_public_images=False,
        ),
        auth=admin_auth,
    )
    inactive_certification = client.post(
        "/api/admin/certifications",
        json={
            "name": "Certificacion inactiva",
            "certificate_file_id": document["id"],
            "is_active": False,
        },
        auth=admin_auth,
    )
    assert visible_project.status_code == 201, visible_project.text
    assert hidden_project.status_code == 201, hidden_project.text
    assert inactive_certification.status_code == 201, inactive_certification.text

    for asset in (avatar, cover, gallery):
        response = client.get(f"/api/public/media-assets/{asset['id']}/content")
        assert response.status_code == 200
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["cache-control"] == "public, max-age=3600"
        assert "inline;" in response.headers["content-disposition"]
        assert response.content

    assert client.get(f"/api/public/media-assets/{hidden['id']}/content").status_code == 404
    assert client.get(f"/api/public/media-assets/{document['id']}/content").status_code == 404
    assert client.get(f"/api/public/media-assets/{orphan['id']}/content").status_code == 404
    assert client.get("/api/public/media-assets/999999/content").status_code == 404


def test_admin_content_endpoint_is_authenticated_and_serves_bytes(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    asset = upload_asset("image", file_name='report"\r\n.png')

    unauthorized = client.get(f"/api/admin/media-assets/{asset['id']}/content")
    authorized = client.get(
        f"/api/admin/media-assets/{asset['id']}/content",
        auth=admin_auth,
    )
    not_found = client.get("/api/admin/media-assets/999999/content", auth=admin_auth)

    assert unauthorized.status_code == 401
    assert authorized.status_code == 200
    assert authorized.headers["x-content-type-options"] == "nosniff"
    assert authorized.headers["cache-control"] == "private, no-store"
    assert "\r" not in authorized.headers["content-disposition"]
    assert "\n" not in authorized.headers["content-disposition"]
    assert authorized.content
    assert not_found.status_code == 404


def test_admin_content_endpoint_accepts_inactive_assets(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    asset = upload_asset("image", file_name="inactive.png")

    with SessionLocal.begin() as session:
        session.execute(
            update(MediaAsset)
            .where(MediaAsset.id == asset["id"])
            .values(is_active=False)
        )

    response = client.get(
        f"/api/admin/media-assets/{asset['id']}/content",
        auth=admin_auth,
    )

    assert response.status_code == 200
    assert response.headers["cache-control"] == "private, no-store"
    assert response.content


def test_general_json_uses_light_media_metadata(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    avatar = upload_asset("avatar")
    image = upload_asset("image")

    assert client.put(
        "/api/admin/profile",
        json={
            "full_name": "QA",
            "professional_title": "QA",
            "summary": "Perfil temporal",
            "avatar_asset_id": avatar["id"],
        },
        auth=admin_auth,
    ).status_code == 200
    assert client.post(
        "/api/admin/projects",
        json=_project_payload(image_asset_id=image["id"]),
        auth=admin_auth,
    ).status_code == 201

    public_home = client.get("/api/public/home")
    admin_assets = client.get("/api/admin/media-assets", auth=admin_auth)
    admin_projects = client.get("/api/admin/projects", auth=admin_auth)

    assert public_home.status_code == 200
    assert admin_assets.status_code == 200
    assert admin_projects.status_code == 200

    public_profile_avatar = public_home.json()["profile"]["avatar"]
    admin_asset = admin_assets.json()[0]
    admin_project_image = admin_projects.json()[0]["image"]

    _assert_light_asset(public_profile_avatar)
    _assert_light_asset(admin_asset)
    _assert_light_asset(admin_project_image)

    for response in (public_home, admin_assets, admin_projects):
      text = response.text
      assert "data_base64" not in text
      assert "svg_content" not in text


def test_public_content_endpoint_supports_etag_304(
    client: TestClient,
    admin_auth: tuple[str, str],
    upload_asset: Callable[..., dict],
) -> None:
    avatar = upload_asset("avatar")

    assert client.put(
        "/api/admin/profile",
        json={
            "full_name": "QA",
            "professional_title": "QA",
            "summary": "Perfil temporal",
            "avatar_asset_id": avatar["id"],
        },
        auth=admin_auth,
    ).status_code == 200

    first_response = client.get(f"/api/public/media-assets/{avatar['id']}/content")

    assert first_response.status_code == 200
    assert "etag" in first_response.headers

    second_response = client.get(
        f"/api/public/media-assets/{avatar['id']}/content",
        headers={"If-None-Match": first_response.headers["etag"]},
    )

    assert second_response.status_code == 304
    assert not second_response.content
    assert second_response.headers["etag"] == first_response.headers["etag"]
