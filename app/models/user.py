from sqlalchemy import Column, Integer, String, Enum as SAEnum, ForeignKey
import enum
from app.db.base import Base

class UserRole(str, enum.Enum):
    PLANNER = "PLANNER"
    TECNICO = "TECNICO"
    OPERACIONES = "OPERACIONES"
    ADMIN = "ADMIN"
    CHOFER = "CHOFER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    full_name = Column(String)
    profile_image = Column(String, nullable=True) # URL or path to image
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
