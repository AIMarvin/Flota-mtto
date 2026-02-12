from sqlalchemy import Column, Integer, String, Enum as SAEnum, ForeignKey, DateTime
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class TimeEventType(str, enum.Enum):
    START = "START"
    PAUSE = "PAUSE"
    RESUME = "RESUME"
    FINISH = "FINISH"

class TimeLog(Base):
    __tablename__ = "time_logs"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(SAEnum(TimeEventType), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    duration_minutes = Column(Integer, nullable=True)  # Calculated when closing interval
    reason = Column(String(255), nullable=True) # For Pause reasons like "Refacción", "Cambio de Trabajo"
