from pydantic import BaseModel
from typing import Optional

class DashboardKPIs(BaseModel):
    """Dashboard KPIs for Planner/Admin"""
    productivity_avg_minutes: Optional[float] = None
    compliance_percentage: float
    units_stopped_24h: int
    total_units: int
    total_orders_completed_today: int
    total_checklists_today: int
    fleet_availability_percentage: float
    units_operativa: int
    total_orders: int
    pending_orders: int
    completed_orders: int
    fleet_health: str
    urgent_orders_count: int
    # Data for Power BI style charts
    units_by_status: dict
    orders_by_priority: dict
    checklists_by_status: dict
    top_technicians: list = []

class TopTechnician(BaseModel):
    id: int
    name: str
    avatar: Optional[str] = None
    orders_completed: int

class ChecklistDetailResponse(BaseModel):
    """Detailed checklist response with user info"""
    id: int
    unit_id: int
    unit_eco_number: Optional[str]
    user_id: int
    user_name: str
    answers: dict
    has_failed: bool
    created_at: str

    class Config:
        from_attributes = True

class ActivityFeedItem(BaseModel):
    id: str  # unique id for frontend key
    type: str # ORDER, CHECKLIST, UNIT, USER
    title: str
    description: str
    timestamp: str 
    severity: str # info, success, warning, danger
    icon: str
    user_name: Optional[str] = None

class TechnicianStats(BaseModel):
    """Stats for technician dashboard"""
    period: str # HOY, SEMANA, HISTORICO
    total_assigned: int
    completed: int
    pending: int
    completion_rate: float
    avg_completion_time_hours: Optional[float] = 0.0
