from sqlalchemy import Column, Integer, String, Text, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class OrderStatus(str, enum.Enum):
    PRE_ORDER = "PRE_ORDER"
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"

class OrderPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.PRE_ORDER, nullable=False)
    priority = Column(SAEnum(OrderPriority), default=OrderPriority.MEDIUM, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Integer, default=1, nullable=True)  # Horas estimadas para el trabajo

    # Relationships
    unit = relationship("app.models.unit.Unit")
    technician = relationship("app.models.user.User")
