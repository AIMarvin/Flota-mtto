from sqlalchemy import Column, Integer, String, Enum as SAEnum, DateTime
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class RelatedType(str, enum.Enum):
    CHECKLIST = "CHECKLIST"
    ORDER = "ORDER"

class MediaType(str, enum.Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"

class Media(Base):
    __tablename__ = "media"

    id = Column(String, primary_key=True)  # UUID
    related_id = Column(Integer, nullable=False)
    related_type = Column(SAEnum(RelatedType), nullable=False)
    media_type = Column(SAEnum(MediaType), nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
