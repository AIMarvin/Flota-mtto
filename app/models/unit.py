from sqlalchemy import Column, Integer, String, Enum as SAEnum, ForeignKey
import enum
from app.db.base import Base

class UnitStatus(str, enum.Enum):
    OPERATIVA = "OPERATIVA"
    EN_TALLER = "EN_TALLER"
    BAJA = "BAJA"

class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    eco_number = Column(String, unique=True, index=True, nullable=False)
    vin = Column(String)
    status = Column(SAEnum(UnitStatus), default=UnitStatus.OPERATIVA, nullable=False)
    model = Column(String)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
