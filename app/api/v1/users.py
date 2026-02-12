from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_current_user, get_db
from app.api.rbac import ensure_self_or_roles
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserResponse
from app.services.storage import storage_service
from app.services.upload_validation import ensure_file_size, validate_upload

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/technicians", response_model=List[UserResponse])
def get_technicians(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role not in {"PLANNER", "ADMIN"}:
        raise HTTPException(status_code=403, detail="Access denied")
    return db.query(User).filter(User.role == UserRole.TECNICO).all()


@router.get("/", response_model=List[UserResponse])
def get_users(role: str = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role not in {"ADMIN", "PLANNER", "OPERACIONES"}:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(User)
    if role:
        try:
            query = query.filter(User.role == UserRole(role))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role filter")
    return query.all()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role not in {"ADMIN", "PLANNER"}:
        raise HTTPException(status_code=403, detail="Access denied")

    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=UserRole(user_in.role),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role != "ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.post("/{user_id}/avatar")
async def upload_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_self_or_roles(user_id, current_user, {"ADMIN", "PLANNER"})
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    validate_upload(file, "IMAGE")
    content = await file.read()
    ensure_file_size(content)

    object_key, public_url = storage_service.save_bytes(
        content=content,
        filename=file.filename,
        folder="avatars",
        content_type=file.content_type,
    )
    user.profile_image = public_url
    db.commit()
    return {"profile_image": public_url, "object_key": object_key}
