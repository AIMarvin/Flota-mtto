from pydantic import BaseModel
from typing import Literal, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: Literal["PLANNER", "TECNICO", "OPERACIONES", "ADMIN", "CHOFER"]

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    profile_image: Optional[str] = None
    unit_id: Optional[int] = None

    class Config:
        from_attributes = True
