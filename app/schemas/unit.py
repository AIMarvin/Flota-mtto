from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UnitBase(BaseModel):
    eco_number: str
    model: Optional[str] = None
    status: str = "OPERATIVA"
    vin: Optional[str] = None
    driver_id: Optional[int] = None

class UnitCreate(UnitBase):
    pass

class UnitUpdate(BaseModel):
    eco_number: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    vin: Optional[str] = None
    driver_id: Optional[int] = None

class UnitResponse(UnitBase):
    id: int
    
    class Config:
        from_attributes = True

class UnitFlota360(UnitResponse):
    last_checklist_date: Optional[datetime] = None
    last_checklist_failed: bool = False
    open_orders_count: int = 0
    health_score: int = 100
    driver_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class UnitTimelineItem(BaseModel):
    id: str  # unique key
    type: str # ORDER, CHECKLIST, STATUS_CHANGE
    title: str
    description: str
    timestamp: str
    icon: str
    color: str # hex color
    user_name: Optional[str] = None
