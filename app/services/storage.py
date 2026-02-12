import os
import uuid
from pathlib import Path
from typing import Optional

from app.core.config import settings

try:
    import boto3
except Exception:  # pragma: no cover - optional dependency for local dev
    boto3 = None


class StorageService:
    def __init__(self) -> None:
        self.use_s3 = settings.USE_S3 and bool(settings.S3_BUCKET) and boto3 is not None
        self.s3 = None
        if self.use_s3:
            self.s3 = boto3.client(
                "s3",
                region_name=settings.S3_REGION,
                endpoint_url=f"https://{settings.S3_ENDPOINT}" if settings.S3_ENDPOINT else None,
                aws_access_key_id=settings.S3_KEY,
                aws_secret_access_key=settings.S3_SECRET,
            )

    def save_bytes(
        self,
        content: bytes,
        filename: str,
        folder: str,
        content_type: Optional[str] = None,
    ) -> tuple[str, str]:
        ext = Path(filename).suffix.lower()
        object_key = f"{folder}/{uuid.uuid4()}{ext}"

        if self.use_s3 and self.s3 is not None:
            extra_args = {"ContentType": content_type} if content_type else {}
            self.s3.put_object(
                Bucket=settings.S3_BUCKET,
                Key=object_key,
                Body=content,
                **extra_args,
            )
            return object_key, self.get_url(object_key)

        local_path = Path("uploads") / object_key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as fp:
            fp.write(content)
        return object_key, f"/uploads/{object_key}"

    def get_url(self, object_key: str, expires_seconds: int = 3600) -> str:
        if self.use_s3 and self.s3 is not None:
            return self.s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.S3_BUCKET, "Key": object_key},
                ExpiresIn=expires_seconds,
            )
        return f"/uploads/{object_key}"


storage_service = StorageService()
