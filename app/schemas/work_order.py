from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WorkOrderCreate(BaseModel):
    unit_id: int
    description: str
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    technician_id: Optional[int] = None

class WorkOrderUpdate(BaseModel):
    description: Optional[str] = None
    priority: Optional[str] = None
    technician_id: Optional[int] = None

class WorkOrderStatusChange(BaseModel):
    status: str  # IN_PROGRESS, PAUSED, COMPLETED
    timestamp: Optional[datetime] = None
    reason: Optional[str] = None
    product_id: Optional[int] = None
    quantity: Optional[float] = None

class WorkOrderResponse(BaseModel):
    id: int
    unit_id: int
    unit_eco: Optional[str] = None
    technician_id: Optional[int]
    technician_name: Optional[str] = None
    status: str
    priority: str
    description: str
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    scheduled_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class TimeLogResponse(BaseModel):
    id: int
    work_order_id: int
    technician_id: int
    event_type: str
    timestamp: datetime
    duration_minutes: Optional[int]
    reason: Optional[str] = None

    class Config:
        from_attributes = True
