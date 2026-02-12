from sqlalchemy import Column, Integer, ForeignKey, Boolean, JSON, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Checklist(Base):
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answers = Column(JSON, nullable=False)  # Store as JSON: {question1: "ok", question2: "fail"}
    has_failed = Column(Boolean, default=False)
    is_priority = Column(Boolean, default=False)
    comments = Column(Text, nullable=True)  # Optional driver comments
    generated_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships for eager loading
    user = relationship("User", foreign_keys=[user_id])
    unit = relationship("Unit", foreign_keys=[unit_id])
