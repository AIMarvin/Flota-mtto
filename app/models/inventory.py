from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.db.base import Base

class MovementType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"

class PurchaseStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    RECEIVED = "RECEIVED"
    CANCELLED = "CANCELLED"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, index=True)
    description = Column(Text, nullable=True)
    
    current_stock = Column(Float, default=0.0, nullable=False)
    min_stock_level = Column(Float, default=5.0, nullable=False)
    cost_price = Column(Float, default=0.0)
    
    image_url = Column(String, nullable=True)
    
    # Relationships
    movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")
    po_items = relationship("PurchaseOrderItem", back_populates="product")

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    change_amount = Column(Float, nullable=False) # e.g. +10 or -5.5
    movement_type = Column(SAEnum(MovementType), nullable=False)
    reason = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="movements")
    user = relationship("app.models.user.User")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    display_id = Column(String, unique=True, index=True) # e.g. PO-2024-001
    
    status = Column(SAEnum(PurchaseStatus), default=PurchaseStatus.REQUESTED, nullable=False)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    notes = Column(Text, nullable=True)

    # Relationships
    items = relationship("PurchaseOrderItem", back_populates="order", cascade="all, delete-orphan")
    requested_by = relationship("app.models.user.User")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity_requested = Column(Float, nullable=False)
    quantity_received = Column(Float, default=0.0)
    
    # Relationships
    order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product", back_populates="po_items")
