from datetime import datetime
from typing import List
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.models.checklist import Checklist
from app.models.media import Media
from app.models.unit import Unit
from app.models.user import User
from app.models.work_order import OrderPriority, OrderStatus, WorkOrder
from app.schemas.checklist import ChecklistCreate, ChecklistDetail, ChecklistResponse, MediaUploadResponse
from app.services.storage import storage_service
from app.services.upload_validation import ensure_file_size, validate_upload

router = APIRouter()


def _role(current_user: User) -> str:
    return current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)


def _can_access_checklist(checklist: Checklist, current_user: User, db: Session) -> bool:
    role = _role(current_user)
    if role in {"ADMIN", "PLANNER"}:
        return True
    if role == "OPERACIONES":
        unit = db.query(Unit).filter(Unit.id == checklist.unit_id).first()
        return bool(unit and unit.manager_id == current_user.id)
    return checklist.user_id == current_user.id


def _resolve_media_url(path_or_key: str) -> str:
    if path_or_key.startswith("uploads/"):
        return f"/{path_or_key.replace('\\', '/')}"
    if path_or_key.startswith("/uploads/"):
        return path_or_key.replace("\\", "/")
    return storage_service.get_url(path_or_key)


@router.post("/", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
def create_checklist(
    checklist_in: ChecklistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_checklist = Checklist(
        unit_id=checklist_in.unit_id,
        user_id=current_user.id,
        answers=checklist_in.answers,
        has_failed=checklist_in.has_failed,
        comments=checklist_in.comments,
        created_at=checklist_in.created_at or datetime.utcnow(),
    )
    db.add(db_checklist)
    db.flush()

    if checklist_in.has_failed:
        failed_items = [k for k, v in checklist_in.answers.items() if str(v).lower() == "fail"]
        pre_order = WorkOrder(
            unit_id=checklist_in.unit_id,
            status=OrderStatus.PRE_ORDER,
            priority=OrderPriority.MEDIUM,
            description=f"Auto-generada por Checklist (ID: {db_checklist.id}). Fallos: {', '.join(failed_items)}",
        )
        db.add(pre_order)
        db.flush()
        db_checklist.generated_order_id = pre_order.id

    db.commit()
    db.refresh(db_checklist)
    return db_checklist


@router.post("/media", response_model=MediaUploadResponse)
async def upload_media(
    related_id: int = Form(...),
    related_type: str = Form(...),
    media_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    related_type = related_type.upper()
    media_type = media_type.upper()
    validate_upload(file, media_type)

    if related_type == "CHECKLIST":
        checklist = db.query(Checklist).filter(Checklist.id == related_id).first()
        if not checklist:
            raise HTTPException(status_code=404, detail="Checklist not found")
        if not _can_access_checklist(checklist, current_user, db):
            raise HTTPException(status_code=403, detail="Access denied")
    elif related_type == "ORDER":
        order = db.query(WorkOrder).filter(WorkOrder.id == related_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        role = _role(current_user)
        if role == "TECNICO" and order.technician_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        raise HTTPException(status_code=400, detail="Invalid related_type")

    content = await file.read()
    ensure_file_size(content)

    media_id = str(uuid.uuid4())
    object_key, public_url = storage_service.save_bytes(
        content=content,
        filename=file.filename or f"{media_id}.bin",
        folder="media",
        content_type=file.content_type,
    )

    db_media = Media(
        id=media_id,
        related_id=related_id,
        related_type=related_type,
        media_type=media_type,
        file_path=object_key,
    )
    db.add(db_media)
    db.commit()

    return MediaUploadResponse(id=media_id, file_path=public_url, message="Media uploaded successfully")


@router.get("/", response_model=List[ChecklistDetail])
def get_checklists(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = _role(current_user)
    if role not in {"PLANNER", "ADMIN", "OPERACIONES"}:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(Checklist).options(joinedload(Checklist.user), joinedload(Checklist.unit))
    if role == "OPERACIONES":
        query = query.join(Checklist.unit).filter(Unit.manager_id == current_user.id)

    return query.order_by(Checklist.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/detailed", response_model=List[ChecklistDetail])
def get_checklists_detailed(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = _role(current_user)
    query = db.query(Checklist).options(joinedload(Checklist.user), joinedload(Checklist.unit))
    if role == "OPERACIONES":
        query = query.join(Checklist.unit).filter(Unit.manager_id == current_user.id)
    elif role not in {"PLANNER", "ADMIN"}:
        raise HTTPException(status_code=403, detail="Access denied")
    return query.order_by(Checklist.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{checklist_id}", response_model=ChecklistDetail)
def get_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checklist = (
        db.query(Checklist)
        .options(joinedload(Checklist.user), joinedload(Checklist.unit))
        .filter(Checklist.id == checklist_id)
        .first()
    )
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    if not _can_access_checklist(checklist, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    media_items = (
        db.query(Media)
        .filter(Media.related_id == checklist_id)
        .filter(Media.related_type == "CHECKLIST")
        .all()
    )
    photos = []
    videos = []
    for item in media_items:
        url = _resolve_media_url(item.file_path)
        if item.media_type == "IMAGE":
            photos.append(url)
        elif item.media_type == "VIDEO":
            videos.append(url)

    return {
        "id": checklist.id,
        "unit_id": checklist.unit_id,
        "user_id": checklist.user_id,
        "answers": checklist.answers,
        "has_failed": checklist.has_failed,
        "generated_order_id": checklist.generated_order_id,
        "created_at": checklist.created_at,
        "unit": checklist.unit,
        "user": checklist.user,
        "is_priority": checklist.is_priority,
        "photos": photos,
        "videos": videos,
    }


@router.get("/{checklist_id}/media", response_model=List[dict])
def get_checklist_media(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    if not _can_access_checklist(checklist, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    media_files = (
        db.query(Media).filter(Media.related_id == checklist_id).filter(Media.related_type == "CHECKLIST").all()
    )
    return [
        {
            "id": item.id,
            "media_type": item.media_type,
            "file_path": _resolve_media_url(item.file_path),
            "uploaded_at": item.uploaded_at.isoformat(),
        }
        for item in media_files
    ]


@router.patch("/{checklist_id}/priority")
def set_checklist_priority(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if _role(current_user) not in {"OPERACIONES", "ADMIN"}:
        raise HTTPException(status_code=403, detail="Solo Gerentes de Operaciones o Admin pueden priorizar fallas.")

    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    if not checklist.has_failed:
        raise HTTPException(status_code=400, detail="Solo se pueden priorizar inspecciones con fallos.")

    checklist.is_priority = True
    if checklist.generated_order_id:
        work_order = db.query(WorkOrder).filter(WorkOrder.id == checklist.generated_order_id).first()
        if work_order:
            work_order.priority = OrderPriority.HIGH
            db.add(work_order)

    db.commit()
    db.refresh(checklist)
    return {"message": "Prioridad actualizada", "is_priority": True}
