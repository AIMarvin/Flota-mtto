from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

class ChecklistCreate(BaseModel):
    unit_id: int
    answers: Dict[str, str]  # {"aire": "ok", "asientos": "fail", ...}
    has_failed: bool
    comments: Optional[str] = None  # Optional driver comments
    created_at: Optional[datetime] = None

class ChecklistResponse(BaseModel):
    id: int
    unit_id: int
    user_id: int
    answers: Dict[str, str]
    has_failed: bool
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Nested schemas for audit view
class UserNestedSchema(BaseModel):
    id: int
    full_name: str
    role: str
    
    class Config:
        from_attributes = True

class UnitNestedSchema(BaseModel):
    id: int
    eco_number: str
    model: Optional[str] = None
    
    class Config:
        from_attributes = True

class ChecklistDetail(BaseModel):
    """Checklist with nested user and unit data for audit view"""
    id: int
    unit_id: int
    user_id: int
    answers: Dict[str, str]
    has_failed: bool
    comments: Optional[str] = None  # Optional driver comments
    created_at: datetime
    generated_order_id: Optional[int] = None
    # Nested relations
    unit: Optional[UnitNestedSchema] = None
    user: Optional[UserNestedSchema] = None
    is_priority: bool = False
    photos: List[str] = []
    videos: List[str] = []
    
    class Config:
        from_attributes = True

class MediaUploadResponse(BaseModel):
    id: str
    file_path: str
    message: str
