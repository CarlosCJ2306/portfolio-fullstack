from __future__ import annotations

import base64
import binascii
import hashlib
import re
from dataclasses import dataclass

from fastapi import HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.models.certification_model import Certification
from app.models.media_asset_model import MediaAsset
from app.models.profile_model import Profile
from app.models.project_model import Project, ProjectImage
from app.models.skill_model import Skill


@dataclass(frozen=True)
class MediaContent:
    body: bytes
    mime_type: str
    file_name: str
    cache_control: str


_CONTROL_CHARS_PATTERN = re.compile(r"[\x00-\x1f\x7f]+")
_SAFE_FILENAME_PATTERN = re.compile(r"[^A-Za-z0-9._-]+")


def build_public_content_url(asset_id: int) -> str:
    return f"/api/public/media-assets/{asset_id}/content"


def build_admin_content_url(asset_id: int) -> str:
    return f"/api/admin/media-assets/{asset_id}/content"


def sanitize_download_file_name(file_name: str | None, fallback: str) -> str:
    candidate = (file_name or fallback or "media-asset").strip()
    candidate = candidate.replace("\\", "/").split("/")[-1]
    candidate = _CONTROL_CHARS_PATTERN.sub("", candidate)
    candidate = _SAFE_FILENAME_PATTERN.sub("_", candidate).strip("._")
    return candidate or fallback or "media-asset"


def build_content_response(
    media_content: MediaContent,
    request: Request,
) -> Response:
    etag = hashlib.sha256(media_content.body).hexdigest()
    quoted_etag = f'"{etag}"'

    if request.headers.get("if-none-match") == quoted_etag:
        return Response(
            status_code=status.HTTP_304_NOT_MODIFIED,
            headers={
                "Cache-Control": media_content.cache_control,
                "ETag": quoted_etag,
                "X-Content-Type-Options": "nosniff",
            },
        )

    return Response(
        content=media_content.body,
        media_type=media_content.mime_type,
        headers={
            "Cache-Control": media_content.cache_control,
            "Content-Disposition": (
                f'inline; filename="{media_content.file_name}"'
            ),
            "Content-Length": str(len(media_content.body)),
            "ETag": quoted_etag,
            "X-Content-Type-Options": "nosniff",
        },
    )


class MediaContentService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _get_asset(self, asset_id: int) -> MediaAsset | None:
        return (
            self.db.query(MediaAsset)
            .filter(MediaAsset.id == asset_id, MediaAsset.is_active.is_(True))
            .first()
        )

    def _get_admin_asset(self, asset_id: int) -> MediaAsset | None:
        return self.db.query(MediaAsset).filter(MediaAsset.id == asset_id).first()

    def _decode_asset(self, asset: MediaAsset, *, cache_control: str) -> MediaContent:
        mime_type = asset.mime_type or "application/octet-stream"
        file_name = sanitize_download_file_name(
            asset.file_name,
            f"media-asset-{asset.id}",
        )

        if asset.svg_content:
            if mime_type != "image/svg+xml":
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="El asset multimedia no tiene un MIME valido.",
                )

            body = asset.svg_content.encode("utf-8")
        elif asset.data_base64:
            try:
                body = base64.b64decode(asset.data_base64, validate=True)
            except (binascii.Error, ValueError) as error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No se pudo leer el contenido multimedia.",
                ) from error
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contenido multimedia no encontrado.",
            )

        return MediaContent(
            body=body,
            mime_type=mime_type,
            file_name=file_name,
            cache_control=cache_control,
        )

    def _is_publicly_referenced(self, asset_id: int) -> bool:
        profile_reference = (
            self.db.query(Profile.id)
            .filter(Profile.avatar_asset_id == asset_id)
            .first()
        )
        if profile_reference:
            return True

        skill_reference = (
            self.db.query(Skill.id)
            .filter(
                Skill.is_active.is_(True),
                Skill.icon_asset_id == asset_id,
            )
            .first()
        )
        if skill_reference:
            return True

        project_reference = (
            self.db.query(Project.id)
            .filter(
                Project.is_active.is_(True),
                Project.allow_public_images.is_(True),
                Project.image_asset_id == asset_id,
            )
            .first()
        )
        if project_reference:
            return True

        gallery_reference = (
            self.db.query(ProjectImage.project_id)
            .join(Project, Project.id == ProjectImage.project_id)
            .filter(
                Project.is_active.is_(True),
                Project.allow_public_images.is_(True),
                ProjectImage.media_asset_id == asset_id,
            )
            .first()
        )
        if gallery_reference:
            return True

        certification_reference = (
            self.db.query(Certification.id)
            .filter(
                Certification.is_active.is_(True),
                Certification.certificate_file_id == asset_id,
            )
            .first()
        )
        return certification_reference is not None

    def get_public_content(self, asset_id: int) -> MediaContent:
        asset = self._get_asset(asset_id)

        if asset is None or not self._is_publicly_referenced(asset_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contenido multimedia no encontrado.",
            )

        return self._decode_asset(asset, cache_control="public, max-age=3600")

    def get_admin_content(self, asset_id: int) -> MediaContent:
        asset = self._get_admin_asset(asset_id)

        if asset is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media asset no encontrado.",
            )

        return self._decode_asset(asset, cache_control="private, no-store")
