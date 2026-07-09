"""
Módulo: app.schemas.admin_schema

Schemas de entrada y lectura para el panel administrativo.
"""

from __future__ import annotations

import re
from base64 import b64decode
from binascii import Error as BinasciiError
from datetime import date, datetime
from pathlib import Path
from typing import ClassVar
from xml.etree import ElementTree

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.public_schema import (
    CertificationRead,
    EducationRead,
    ExperienceRead,
    ProjectGalleryImageRead,
    ProfileRead,
    ProjectRead,
    SocialLinkRead,
    SkillRead,
)


def _strip_text(value):
    if isinstance(value, str):
        return value.strip()

    return value


def _strip_optional_text(value):
    value = _strip_text(value)

    if value == "":
        return None

    return value


def _validate_date_range(
    issue_date: date | None,
    expiration_date: date | None,
) -> None:
    if (
        issue_date is not None
        and expiration_date is not None
        and expiration_date < issue_date
    ):
        raise ValueError(
            "La fecha de vencimiento no puede ser anterior a la fecha de emisión."
        )


_FORBIDDEN_SVG_ELEMENTS = {
    "a",
    "animate",
    "animatemotion",
    "animatetransform",
    "audio",
    "canvas",
    "discard",
    "embed",
    "feimage",
    "foreignobject",
    "handler",
    "iframe",
    "image",
    "link",
    "listener",
    "mpath",
    "object",
    "script",
    "set",
    "style",
    "video",
}
_ALLOWED_SVG_ELEMENT_NAMESPACES = {
    "",
    "http://www.w3.org/2000/svg",
}
_ALLOWED_SVG_ATTRIBUTE_NAMESPACES = {
    "",
    "http://www.w3.org/1999/xlink",
    "http://www.w3.org/XML/1998/namespace",
}
_LOCAL_SVG_URL_PATTERN = re.compile(
    r"url\(\s*['\"]?#[A-Za-z_][\w:.-]*['\"]?\s*\)",
    re.IGNORECASE,
)


def _split_xml_name(name: str) -> tuple[str, str]:
    if name.startswith("{") and "}" in name:
        namespace, local_name = name[1:].split("}", 1)
        return namespace, local_name

    return "", name


def _has_unsafe_svg_url(value: str) -> bool:
    normalized_value = re.sub(r"[\x00-\x20\x7f]+", "", value).lower()

    if any(
        scheme in normalized_value
        for scheme in ("javascript:", "vbscript:", "data:")
    ):
        return True

    without_local_urls = _LOCAL_SVG_URL_PATTERN.sub("", value)
    return "url(" in without_local_urls.lower()


def validate_safe_svg_content(svg_content: str) -> str:
    """Valida SVG inline con una politica estricta antes de persistirlo."""

    normalized_svg_content = svg_content.strip()
    lowered_svg_content = normalized_svg_content.lower()

    if "<!doctype" in lowered_svg_content or "<!entity" in lowered_svg_content:
        raise ValueError("El SVG no puede contener declaraciones DOCTYPE o ENTITY.")

    content_without_xml_declaration = re.sub(
        r"^\s*<\?xml\s+[^?]*\?>",
        "",
        normalized_svg_content,
        count=1,
        flags=re.IGNORECASE,
    )

    if "<?" in content_without_xml_declaration:
        raise ValueError("El SVG no puede contener instrucciones de procesamiento.")

    try:
        root = ElementTree.fromstring(normalized_svg_content)
    except ElementTree.ParseError as error:
        raise ValueError("El campo 'svg_content' no contiene XML SVG valido.") from error

    root_namespace, root_local_name = _split_xml_name(root.tag)

    if (
        root_local_name.lower() != "svg"
        or root_namespace not in _ALLOWED_SVG_ELEMENT_NAMESPACES
    ):
        raise ValueError("El elemento raiz del archivo debe ser un SVG valido.")

    for element in root.iter():
        element_namespace, element_local_name = _split_xml_name(element.tag)
        normalized_element_name = element_local_name.lower()

        if element_namespace not in _ALLOWED_SVG_ELEMENT_NAMESPACES:
            raise ValueError("El SVG contiene elementos de un namespace no permitido.")

        if normalized_element_name in _FORBIDDEN_SVG_ELEMENTS:
            raise ValueError(
                f"El SVG contiene el elemento no permitido '{element_local_name}'."
            )

        for attribute_name, attribute_value in element.attrib.items():
            attribute_namespace, attribute_local_name = _split_xml_name(attribute_name)
            normalized_attribute_name = attribute_local_name.lower()

            if attribute_namespace not in _ALLOWED_SVG_ATTRIBUTE_NAMESPACES:
                raise ValueError(
                    "El SVG contiene atributos de un namespace no permitido."
                )

            if normalized_attribute_name.startswith("on"):
                raise ValueError(
                    f"El SVG contiene el evento no permitido '{attribute_local_name}'."
                )

            if normalized_attribute_name in {"style", "base"}:
                raise ValueError(
                    f"El SVG contiene el atributo no permitido '{attribute_local_name}'."
                )

            if _has_unsafe_svg_url(attribute_value):
                raise ValueError("El SVG contiene una referencia URL no segura.")

            if normalized_attribute_name in {"href", "src"}:
                reference = attribute_value.strip()

                if reference and not reference.startswith("#"):
                    raise ValueError(
                        "El SVG solo puede usar referencias internas que empiecen por '#'."
                    )

    return normalized_svg_content


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, max_length=150)
    professional_title: str | None = Field(default=None, max_length=150)
    summary: str | None = None
    location: str | None = Field(default=None, max_length=150)
    email: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=50)
    cv_url: str | None = Field(default=None, max_length=255)
    avatar_asset_id: int | None = None

    @field_validator(
        "full_name",
        "professional_title",
        "summary",
        "location",
        "email",
        "phone",
        "cv_url",
        mode="before"
    )
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class SocialLinkCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    platform: str = Field(..., min_length=2, max_length=80)
    url: str = Field(..., min_length=3, max_length=255)
    icon_name: str | None = Field(default=None, max_length=80)
    display_order: int = 0
    is_active: bool = True

    @field_validator("platform", "url", "icon_name", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class SocialLinkUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    platform: str | None = Field(default=None, max_length=80)
    url: str | None = Field(default=None, max_length=255)
    icon_name: str | None = Field(default=None, max_length=80)
    display_order: int | None = None
    is_active: bool | None = None

    @field_validator("platform", "url", "icon_name", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class SkillCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., min_length=2, max_length=100)
    level: str = Field(..., min_length=2, max_length=50)
    icon_asset_id: int | None = None
    color: str | None = Field(default=None, max_length=50)
    display_order: int = 0
    is_active: bool = True

    @field_validator("name", "category", "level", "color", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class SkillUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    level: str | None = Field(default=None, max_length=50)
    icon_asset_id: int | None = None
    color: str | None = Field(default=None, max_length=50)
    display_order: int | None = None
    is_active: bool | None = None

    @field_validator("name", "category", "level", "color", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=2, max_length=150)
    slug: str = Field(..., min_length=2, max_length=180)
    short_description: str = Field(..., min_length=2, max_length=255)
    description: str
    is_confidential: bool = False
    confidentiality_note: str | None = Field(default=None, max_length=500)
    client_display_name: str | None = Field(default=None, max_length=180)
    allow_public_images: bool = True
    image_asset_id: int | None = None
    repository_url: str | None = Field(default=None, max_length=255)
    demo_url: str | None = Field(default=None, max_length=255)
    is_featured: bool = False
    display_order: int = 0
    is_active: bool = True
    skill_ids: list[int] = Field(default_factory=list)
    gallery_image_ids: list[int] = Field(default_factory=list)

    @field_validator("title", "slug", "short_description", "description", "repository_url", "demo_url", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)

    @field_validator("confidentiality_note", "client_display_name", mode="before")
    @classmethod
    def clean_optional_public_fields(cls, value):
        return _strip_optional_text(value)

    @field_validator("gallery_image_ids")
    @classmethod
    def validate_gallery_image_ids(cls, value: list[int]) -> list[int]:
        if len(value) != len(set(value)):
            raise ValueError("No se permiten IDs duplicados en 'gallery_image_ids'.")

        return value


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, max_length=150)
    slug: str | None = Field(default=None, max_length=180)
    short_description: str | None = Field(default=None, max_length=255)
    description: str | None = None
    is_confidential: bool | None = None
    confidentiality_note: str | None = Field(default=None, max_length=500)
    client_display_name: str | None = Field(default=None, max_length=180)
    allow_public_images: bool | None = None
    image_asset_id: int | None = None
    repository_url: str | None = Field(default=None, max_length=255)
    demo_url: str | None = Field(default=None, max_length=255)
    is_featured: bool | None = None
    display_order: int | None = None
    is_active: bool | None = None
    skill_ids: list[int] | None = None
    gallery_image_ids: list[int] | None = None

    @field_validator("title", "slug", "short_description", "description", "repository_url", "demo_url", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)

    @field_validator("confidentiality_note", "client_display_name", mode="before")
    @classmethod
    def clean_optional_public_fields(cls, value):
        return _strip_optional_text(value)

    @field_validator("gallery_image_ids")
    @classmethod
    def validate_gallery_image_ids(cls, value: list[int] | None) -> list[int] | None:
        if value is None:
            return value

        if len(value) != len(set(value)):
            raise ValueError("No se permiten IDs duplicados en 'gallery_image_ids'.")

        return value


class ExperienceBulletPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str = Field(..., min_length=2)

    @field_validator("description", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class ExperienceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: str = Field(..., min_length=2, max_length=150)
    company: str = Field(..., min_length=2, max_length=150)
    country: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    start_date: date
    end_date: date | None = None
    is_current: bool = False
    description: str | None = None
    display_order: int = 0
    is_active: bool = True
    bullets: list[ExperienceBulletPayload] = Field(default_factory=list)

    @field_validator("position", "company", "country", "city", "description", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class ExperienceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: str | None = Field(default=None, max_length=150)
    company: str | None = Field(default=None, max_length=150)
    country: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, max_length=100)
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    description: str | None = None
    display_order: int | None = None
    is_active: bool | None = None
    bullets: list[ExperienceBulletPayload] | None = None

    @field_validator("position", "company", "country", "city", "description", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class EducationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    institution: str = Field(..., min_length=2, max_length=180)
    degree: str = Field(..., min_length=2, max_length=180)
    field_of_study: str | None = Field(default=None, max_length=180)
    start_year: int | None = None
    end_year: int | None = None
    description: str | None = None
    display_order: int = 0
    is_active: bool = True

    @field_validator("institution", "degree", "field_of_study", "description", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class EducationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    institution: str | None = Field(default=None, max_length=180)
    degree: str | None = Field(default=None, max_length=180)
    field_of_study: str | None = Field(default=None, max_length=180)
    start_year: int | None = None
    end_year: int | None = None
    description: str | None = None
    display_order: int | None = None
    is_active: bool | None = None

    @field_validator("institution", "degree", "field_of_study", "description", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)


class CertificationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=180)
    issuer: str | None = Field(default=None, max_length=180)
    issue_date: date | None = None
    expiration_date: date | None = None
    credential_url: str | None = Field(default=None, max_length=255)
    description: str | None = None
    certificate_file_id: int | None = None
    display_order: int = 0
    is_active: bool = True

    @field_validator("name", "issuer", "credential_url", "description", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)

    @model_validator(mode="after")
    def validate_certification_dates(self):
        _validate_date_range(self.issue_date, self.expiration_date)
        return self


class CertificationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, max_length=180)
    issuer: str | None = Field(default=None, max_length=180)
    issue_date: date | None = None
    expiration_date: date | None = None
    credential_url: str | None = Field(default=None, max_length=255)
    description: str | None = None
    certificate_file_id: int | None = None
    display_order: int | None = None
    is_active: bool | None = None

    @field_validator("name", "issuer", "credential_url", "description", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)

    @model_validator(mode="after")
    def validate_certification_dates(self):
        _validate_date_range(self.issue_date, self.expiration_date)
        return self


class ContactMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    subject: str | None = None
    message: str
    is_read: bool
    created_at: datetime
    updated_at: datetime


class AdminDashboardRead(BaseModel):
    profile_exists: bool
    total_social_links: int
    total_skills: int
    total_projects: int
    featured_projects: int
    total_experience: int
    total_education: int
    total_certifications: int
    total_contact_messages: int
    unread_contact_messages: int


class AdminProfileRead(ProfileRead):
    model_config = ConfigDict(from_attributes=True)

    avatar_asset_id: int | None = None


class SocialLinkAdminRead(SocialLinkRead):
    model_config = ConfigDict(from_attributes=True)

    is_active: bool


class SkillAdminRead(SkillRead):
    model_config = ConfigDict(from_attributes=True)

    icon_asset_id: int | None = None
    is_active: bool


class ProjectAdminRead(ProjectRead):
    model_config = ConfigDict(from_attributes=True)

    image_asset_id: int | None = None
    gallery_images: list[ProjectGalleryImageRead] = Field(default_factory=list)
    is_active: bool


class ExperienceAdminRead(ExperienceRead):
    model_config = ConfigDict(from_attributes=True)

    is_active: bool


class EducationAdminRead(EducationRead):
    model_config = ConfigDict(from_attributes=True)

    is_active: bool


class CertificationAdminRead(CertificationRead):
    model_config = ConfigDict(from_attributes=True)

    certificate_file_id: int | None = None
    is_active: bool


class MediaAssetCreate(BaseModel):
    """
    Schema para subir un nuevo media asset (imagen base64 o SVG inline).
    Se requiere al menos uno: data_base64 o svg_content.
    """

    model_config = ConfigDict(extra="forbid")

    ALLOWED_ASSET_TYPES: ClassVar[set[str]] = {
        "avatar",
        "image",
        "icon",
        "icon_svg",
        "document",
    }
    MAX_BYTES_BY_ASSET_TYPE: ClassVar[dict[str, int]] = {
        "avatar": 2 * 1024 * 1024,
        "image": 5 * 1024 * 1024,
        "icon": 5 * 1024 * 1024,
        "icon_svg": 5 * 1024 * 1024,
        "document": 10 * 1024 * 1024,
    }
    ALLOWED_MIME_TYPES_BY_ASSET_TYPE: ClassVar[dict[str, set[str]]] = {
        "avatar": {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
        },
        "image": {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
        },
        "icon": {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
        },
        "icon_svg": {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
        },
        "document": {
            "application/pdf",
        },
    }
    ALLOWED_EXTENSIONS_BY_ASSET_TYPE: ClassVar[dict[str, set[str]]] = {
        "avatar": {".jpg", ".jpeg", ".png", ".webp", ".svg"},
        "image": {".jpg", ".jpeg", ".png", ".webp", ".svg"},
        "icon": {".jpg", ".jpeg", ".png", ".webp", ".svg"},
        "icon_svg": {".jpg", ".jpeg", ".png", ".webp", ".svg"},
        "document": {".pdf"},
    }
    MIME_TYPE_BY_EXTENSION: ClassVar[dict[str, str]] = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
    }
    DUBIOUS_MIME_TYPES: ClassVar[set[str]] = {
        "",
        "application/octet-stream",
    }

    asset_type: str = Field(
        ...,
        max_length=80,
        description=(
            "Tipo de asset: 'avatar', 'image', 'icon', 'icon_svg' o 'document'."
        )
    )
    file_name: str | None = Field(default=None, max_length=180)
    mime_type: str | None = Field(default=None, max_length=100)
    data_base64: str | None = Field(
        default=None,
        description="Contenido de imagen en Base64 (para PNG/JPG/WebP)."
    )
    svg_content: str | None = Field(
        default=None,
        description="Contenido SVG en texto plano (para íconos SVG)."
    )
    alt_text: str | None = Field(default=None, max_length=180)

    @field_validator("asset_type", "file_name", "mime_type", "alt_text", mode="before")
    @classmethod
    def clean_text_fields(cls, value):
        return _strip_text(value)

    @field_validator("asset_type")
    @classmethod
    def validate_asset_type(cls, value: str) -> str:
        if value not in cls.ALLOWED_ASSET_TYPES:
            allowed_values = ", ".join(sorted(cls.ALLOWED_ASSET_TYPES))
            raise ValueError(
                f"Tipo de asset invalido. Valores permitidos: {allowed_values}."
            )

        return value

    @classmethod
    def _get_file_extension(cls, file_name: str | None) -> str:
        if not file_name:
            return ""

        return Path(file_name).suffix.lower()

    @classmethod
    def _format_max_size(cls, size_in_bytes: int) -> str:
        size_in_mb = size_in_bytes / (1024 * 1024)

        if size_in_mb.is_integer():
            return f"{int(size_in_mb)} MB"

        return f"{size_in_mb:.1f} MB"

    @classmethod
    def _resolve_effective_mime_type(
        cls,
        mime_type: str | None,
        file_extension: str
    ) -> str | None:
        normalized_mime_type = (mime_type or "").strip().lower()

        if (
            normalized_mime_type
            and normalized_mime_type not in cls.DUBIOUS_MIME_TYPES
        ):
            return normalized_mime_type

        return cls.MIME_TYPE_BY_EXTENSION.get(file_extension)

    @model_validator(mode="after")
    def require_content(self):
        if not self.data_base64 and not self.svg_content:
            raise ValueError("Se requiere 'data_base64' o 'svg_content'.")

        file_extension = self._get_file_extension(self.file_name)
        allowed_extensions = self.ALLOWED_EXTENSIONS_BY_ASSET_TYPE[self.asset_type]
        allowed_mime_types = self.ALLOWED_MIME_TYPES_BY_ASSET_TYPE[self.asset_type]
        max_bytes = self.MAX_BYTES_BY_ASSET_TYPE[self.asset_type]
        normalized_mime_type = (self.mime_type or "").strip().lower()

        if file_extension and file_extension not in allowed_extensions:
            allowed_extensions_text = ", ".join(sorted(allowed_extensions))
            raise ValueError(
                f"La extension '{file_extension}' no es valida para assets de tipo "
                f"'{self.asset_type}'. Extensiones permitidas: {allowed_extensions_text}."
            )

        if (
            not file_extension
            and (
                not normalized_mime_type
                or normalized_mime_type in self.DUBIOUS_MIME_TYPES
            )
        ):
            raise ValueError(
                "No se pudo validar el archivo: falta una extension reconocible o "
                "un mime_type confiable."
            )

        if (
            normalized_mime_type
            and normalized_mime_type not in self.DUBIOUS_MIME_TYPES
            and normalized_mime_type not in allowed_mime_types
        ):
            allowed_mime_types_text = ", ".join(sorted(allowed_mime_types))
            raise ValueError(
                f"El mime_type '{normalized_mime_type}' no es valido para assets de tipo "
                f"'{self.asset_type}'. Mime types permitidos: {allowed_mime_types_text}."
            )

        effective_mime_type = self._resolve_effective_mime_type(
            normalized_mime_type,
            file_extension
        )

        if effective_mime_type not in allowed_mime_types:
            allowed_mime_types_text = ", ".join(sorted(allowed_mime_types))
            raise ValueError(
                f"No se pudo determinar un mime_type valido para assets de tipo "
                f"'{self.asset_type}'. Mime types permitidos: {allowed_mime_types_text}."
            )

        self.mime_type = effective_mime_type

        if self.data_base64:
            normalized_base64 = "".join(self.data_base64.split())

            try:
                decoded_content = b64decode(normalized_base64, validate=True)
            except (BinasciiError, ValueError) as error:
                raise ValueError(
                    "El campo 'data_base64' no contiene un Base64 valido."
                ) from error

            if not decoded_content:
                raise ValueError(
                    "El campo 'data_base64' no puede estar vacio."
                )

            if len(decoded_content) > max_bytes:
                raise ValueError(
                    f"El archivo supera el limite permitido de "
                    f"{self._format_max_size(max_bytes)} para assets de tipo "
                    f"'{self.asset_type}'."
                )

            self.data_base64 = normalized_base64

        if self.svg_content:
            normalized_svg_content = self.svg_content.strip()

            if not normalized_svg_content:
                raise ValueError(
                    "El campo 'svg_content' no puede estar vacio."
                )

            if "<svg" not in normalized_svg_content.lower():
                raise ValueError(
                    "El campo 'svg_content' no contiene un SVG valido."
                )

            normalized_svg_content = validate_safe_svg_content(
                normalized_svg_content
            )

            if len(normalized_svg_content.encode("utf-8")) > max_bytes:
                raise ValueError(
                    f"El contenido SVG supera el limite permitido de "
                    f"{self._format_max_size(max_bytes)} para assets de tipo "
                    f"'{self.asset_type}'."
                )

            self.svg_content = normalized_svg_content

        if self.data_base64 and self.svg_content:
            raise ValueError(
                "Solo se permite uno de los campos 'data_base64' o 'svg_content'."
            )

        if self.asset_type == "document":
            if not self.data_base64:
                raise ValueError(
                    "Los assets de tipo 'document' requieren 'data_base64'."
                )

            if self.svg_content:
                raise ValueError(
                    "Los assets de tipo 'document' no aceptan 'svg_content'."
                )

        if self.svg_content and self.mime_type != "image/svg+xml":
            raise ValueError(
                "El campo 'svg_content' solo se permite con mime_type 'image/svg+xml'."
            )

        if self.mime_type == "image/svg+xml" and not self.svg_content:
            raise ValueError(
                "Los archivos SVG deben enviarse usando el campo 'svg_content'."
            )

        return self


class MediaAssetAdminRead(BaseModel):
    """
    Schema de respuesta para assets multimedia en el panel admin.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_type: str
    file_name: str | None = None
    mime_type: str | None = None
    data_base64: str | None = None
    svg_content: str | None = None
    alt_text: str | None = None
    is_active: bool
    created_at: datetime


__all__ = [
    "ProfileUpdate",
    "SocialLinkCreate",
    "SocialLinkUpdate",
    "SkillCreate",
    "SkillUpdate",
    "ProjectCreate",
    "ProjectUpdate",
    "ExperienceBulletPayload",
    "ExperienceCreate",
    "ExperienceUpdate",
    "EducationCreate",
    "EducationUpdate",
    "CertificationCreate",
    "CertificationUpdate",
    "ContactMessageRead",
    "AdminDashboardRead",
    "AdminProfileRead",
    "SocialLinkAdminRead",
    "SkillAdminRead",
    "ProjectAdminRead",
    "ExperienceAdminRead",
    "EducationAdminRead",
    "CertificationAdminRead",
    "MediaAssetCreate",
    "MediaAssetAdminRead",
    "ProfileRead",
    "SocialLinkRead",
    "SkillRead",
    "ProjectGalleryImageRead",
    "ProjectRead",
    "ExperienceRead",
    "EducationRead",
    "CertificationRead",
]
