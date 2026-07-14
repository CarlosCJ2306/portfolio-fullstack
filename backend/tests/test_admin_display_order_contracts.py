from __future__ import annotations

import pytest


def _social_link_payload(label: str, **overrides) -> dict:
    payload = {
        "platform": f"Social {label}",
        "url": f"https://example.test/social-{label}",
        "icon_name": "social",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


def _skill_payload(label: str, **overrides) -> dict:
    payload = {
        "name": f"Skill {label}",
        "category": "QA",
        "level": "Avanzado",
        "color": "#3776AB",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


def _project_payload(label: str, **overrides) -> dict:
    payload = {
        "title": f"Proyecto {label}",
        "slug": f"proyecto-{label}",
        "short_description": f"Resumen {label}",
        "description": f"Proyecto de prueba {label}",
        "repository_url": "https://example.test/repository",
        "demo_url": None,
        "is_featured": False,
        "is_active": True,
        "skill_ids": [],
        "gallery_image_ids": [],
    }
    payload.update(overrides)
    return payload


def _experience_payload(label: str, **overrides) -> dict:
    payload = {
        "position": f"Rol {label}",
        "company": f"Empresa {label}",
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "is_current": False,
        "description": f"Experiencia {label}",
        "is_active": True,
        "bullets": [],
    }
    payload.update(overrides)
    return payload


def _education_payload(label: str, **overrides) -> dict:
    payload = {
        "institution": f"Institucion {label}",
        "degree": f"Titulo {label}",
        "field_of_study": "Ingenieria",
        "description": f"Educacion {label}",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


def _certification_payload(label: str, **overrides) -> dict:
    payload = {
        "name": f"Certificacion {label}",
        "issuer": "QA Institute",
        "description": f"Certificacion {label}",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


ENTITY_CONFIGS = (
    {
        "id": "social_links",
        "endpoint": "/api/admin/social-links",
        "payload_factory": _social_link_payload,
        "update_factory": lambda label: {"platform": f"Social editado {label}"},
    },
    {
        "id": "skills",
        "endpoint": "/api/admin/skills",
        "payload_factory": _skill_payload,
        "update_factory": lambda label: {"name": f"Skill editada {label}"},
    },
    {
        "id": "projects",
        "endpoint": "/api/admin/projects",
        "payload_factory": _project_payload,
        "update_factory": lambda label: {"title": f"Proyecto editado {label}"},
    },
    {
        "id": "experience",
        "endpoint": "/api/admin/experience",
        "payload_factory": _experience_payload,
        "update_factory": lambda label: {"position": f"Rol editado {label}"},
    },
    {
        "id": "education",
        "endpoint": "/api/admin/education",
        "payload_factory": _education_payload,
        "update_factory": lambda label: {"degree": f"Titulo editado {label}"},
    },
    {
        "id": "certifications",
        "endpoint": "/api/admin/certifications",
        "payload_factory": _certification_payload,
        "update_factory": lambda label: {"name": f"Certificacion editada {label}"},
    },
)


def _create_entity(client, admin_auth: tuple[str, str], config: dict, label: str, **overrides) -> dict:
    response = client.post(
        config["endpoint"],
        json=config["payload_factory"](label, **overrides),
        auth=admin_auth,
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.parametrize("config", ENTITY_CONFIGS, ids=[config["id"] for config in ENTITY_CONFIGS])
def test_admin_create_assigns_first_display_order_zero_when_omitted(
    client,
    admin_auth: tuple[str, str],
    config: dict,
) -> None:
    created = _create_entity(client, admin_auth, config, "primero")

    assert created["display_order"] == 0


@pytest.mark.parametrize("config", ENTITY_CONFIGS, ids=[config["id"] for config in ENTITY_CONFIGS])
def test_admin_create_uses_max_plus_one_and_respects_inactive_and_manual_zero(
    client,
    admin_auth: tuple[str, str],
    config: dict,
) -> None:
    _create_entity(client, admin_auth, config, "base-cero", display_order=0)
    _create_entity(client, admin_auth, config, "hueco", display_order=2)
    _create_entity(client, admin_auth, config, "inactivo-max", display_order=5, is_active=False)
    explicit_zero = _create_entity(client, admin_auth, config, "manual-cero", display_order=0)
    auto_assigned = _create_entity(client, admin_auth, config, "automatico")

    assert explicit_zero["display_order"] == 0
    assert auto_assigned["display_order"] == 6

    list_response = client.get(config["endpoint"], auth=admin_auth)
    assert list_response.status_code == 200, list_response.text
    assert [item["display_order"] for item in list_response.json()] == [0, 0, 2, 5, 6]


@pytest.mark.parametrize("config", ENTITY_CONFIGS, ids=[config["id"] for config in ENTITY_CONFIGS])
def test_admin_update_preserves_display_order_when_omitted_and_accepts_manual_change(
    client,
    admin_auth: tuple[str, str],
    config: dict,
) -> None:
    created = _create_entity(client, admin_auth, config, "editable", display_order=4)
    entity_id = created["id"]

    keep_order = client.put(
        f"{config['endpoint']}/{entity_id}",
        json=config["update_factory"]("sin-orden"),
        auth=admin_auth,
    )
    assert keep_order.status_code == 200, keep_order.text
    assert keep_order.json()["display_order"] == 4

    manual_change = client.put(
        f"{config['endpoint']}/{entity_id}",
        json={"display_order": 0},
        auth=admin_auth,
    )
    assert manual_change.status_code == 200, manual_change.text
    assert manual_change.json()["display_order"] == 0


@pytest.mark.parametrize("config", ENTITY_CONFIGS, ids=[config["id"] for config in ENTITY_CONFIGS])
def test_admin_delete_does_not_compact_display_order_sequence(
    client,
    admin_auth: tuple[str, str],
    config: dict,
) -> None:
    first = _create_entity(client, admin_auth, config, "uno", display_order=0)
    second = _create_entity(client, admin_auth, config, "dos", display_order=1)
    _create_entity(client, admin_auth, config, "tres", display_order=2)

    delete_response = client.delete(
        f"{config['endpoint']}/{second['id']}",
        auth=admin_auth,
    )
    assert delete_response.status_code == 204, delete_response.text

    created_after_delete = _create_entity(client, admin_auth, config, "cuatro")

    assert first["display_order"] == 0
    assert created_after_delete["display_order"] == 3
