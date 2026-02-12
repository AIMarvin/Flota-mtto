from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_EXT = {".mp4", ".webm", ".mov"}


def validate_upload(file: UploadFile, media_type: str) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")

    ext = Path(file.filename).suffix.lower()
    if media_type == "IMAGE":
        if file.content_type not in ALLOWED_IMAGE_TYPES or ext not in ALLOWED_IMAGE_EXT:
            raise HTTPException(status_code=400, detail="Invalid image format")
    elif media_type == "VIDEO":
        if file.content_type not in ALLOWED_VIDEO_TYPES or ext not in ALLOWED_VIDEO_EXT:
            raise HTTPException(status_code=400, detail="Invalid video format")
    else:
        raise HTTPException(status_code=400, detail="Invalid media type")


def ensure_file_size(content: bytes) -> None:
    max_bytes = settings.MEDIA_MAX_UPLOAD_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max allowed is {settings.MEDIA_MAX_UPLOAD_MB}MB",
        )
