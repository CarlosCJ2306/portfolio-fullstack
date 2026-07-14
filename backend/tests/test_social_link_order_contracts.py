from __future__ import annotations


def _social_link_payload(**overrides) -> dict:
    payload = {
        "platform": "LinkedIn",
        "url": "https://example.test/social-link",
        "icon_name": "linkedin",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


def test_social_link_create_autos_assigns_next_display_order(
    client,
    admin_auth: tuple[str, str],
) -> None:
    first_response = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(platform="LinkedIn", url="https://example.test/linkedin"),
        auth=admin_auth,
    )
    assert first_response.status_code == 201, first_response.text
    assert first_response.json()["display_order"] == 0

    explicit_response = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="GitHub",
            url="https://example.test/github",
            display_order=2,
        ),
        auth=admin_auth,
    )
    assert explicit_response.status_code == 201, explicit_response.text
    assert explicit_response.json()["display_order"] == 2

    inactive_response = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="YouTube",
            url="https://example.test/youtube",
            display_order=5,
            is_active=False,
        ),
        auth=admin_auth,
    )
    assert inactive_response.status_code == 201, inactive_response.text
    assert inactive_response.json()["display_order"] == 5

    auto_response = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="Website",
            url="https://example.test/website",
        ),
        auth=admin_auth,
    )
    assert auto_response.status_code == 201, auto_response.text
    assert auto_response.json()["display_order"] == 6

    list_response = client.get("/api/admin/social-links", auth=admin_auth)
    assert list_response.status_code == 200
    assert [item["display_order"] for item in list_response.json()] == [0, 2, 5, 6]


def test_social_link_create_respects_explicit_zero_and_update_without_order_keeps_value(
    client,
    admin_auth: tuple[str, str],
) -> None:
    created_response = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="Instagram",
            url="https://example.test/instagram",
            display_order=4,
        ),
        auth=admin_auth,
    )
    assert created_response.status_code == 201, created_response.text
    social_link_id = created_response.json()["id"]
    assert created_response.json()["display_order"] == 4

    explicit_zero_response = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="Mastodon",
            url="https://example.test/mastodon",
            display_order=0,
        ),
        auth=admin_auth,
    )
    assert explicit_zero_response.status_code == 201, explicit_zero_response.text
    assert explicit_zero_response.json()["display_order"] == 0

    keep_order_response = client.put(
        f"/api/admin/social-links/{social_link_id}",
        json={"platform": "Instagram actualizado"},
        auth=admin_auth,
    )
    assert keep_order_response.status_code == 200, keep_order_response.text
    assert keep_order_response.json()["display_order"] == 4

    manual_zero_update = client.put(
        f"/api/admin/social-links/{social_link_id}",
        json={"display_order": 0},
        auth=admin_auth,
    )
    assert manual_zero_update.status_code == 200, manual_zero_update.text
    assert manual_zero_update.json()["display_order"] == 0


def test_social_link_delete_does_not_compact_display_order(
    client,
    admin_auth: tuple[str, str],
) -> None:
    first = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="Link 1",
            url="https://example.test/link-1",
            display_order=0,
        ),
        auth=admin_auth,
    )
    assert first.status_code == 201, first.text

    middle = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="Link 2",
            url="https://example.test/link-2",
            display_order=1,
        ),
        auth=admin_auth,
    )
    assert middle.status_code == 201, middle.text

    third = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="Link 3",
            url="https://example.test/link-3",
            display_order=2,
        ),
        auth=admin_auth,
    )
    assert third.status_code == 201, third.text

    delete_response = client.delete(
        f"/api/admin/social-links/{middle.json()['id']}",
        auth=admin_auth,
    )
    assert delete_response.status_code == 204, delete_response.text

    auto_response = client.post(
        "/api/admin/social-links",
        json=_social_link_payload(
            platform="Link 4",
            url="https://example.test/link-4",
        ),
        auth=admin_auth,
    )
    assert auto_response.status_code == 201, auto_response.text
    assert auto_response.json()["display_order"] == 3
