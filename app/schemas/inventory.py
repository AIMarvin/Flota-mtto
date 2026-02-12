from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class MovementType(str, Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"

class PurchaseStatus(str, Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"

# Product Schemas
class ProductBase(BaseModel):
    name: str
    sku: str
    category: Optional[str] = "General"
    description: Optional[str] = None
    min_stock_level: float = 5.0
    cost_price: float = 0.0
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    initial_stock: float = 0.0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    min_stock_level: Optional[float] = None
    cost_price: Optional[float] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    current_stock: float

    class Config:
        from_attributes = True

# Movement Schemas
class StockMovementCreate(BaseModel):
    product_id: int
    change_amount: float
    movement_type: MovementType
    reason: Optional[str] = None

class StockMovementResponse(StockMovementCreate):
    id: int
    user_id: Optional[int] = None
    product_name: Optional[str] = None # Calculated
    created_at: datetime
    
    class Config:
        from_attributes = True

# Purchase Order Schemas
class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: float

class PurchaseOrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity_requested: float
    quantity_received: float
    
    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    items: List[PurchaseOrderItemCreate]
    notes: Optional[str] = None

class PurchaseOrderUpdate(BaseModel):
    status: Optional[PurchaseStatus] = None
    notes: Optional[str] = None

class PurchaseOrderResponse(BaseModel):
    id: int
    display_id: str
    status: PurchaseStatus
    created_at: datetime
    requested_by_id: Optional[int]
    requested_by_name: Optional[str] = None
    notes: Optional[str] = None
    items: List[PurchaseOrderItemResponse]

    class Config:
        from_attributes = True
