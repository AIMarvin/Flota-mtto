from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.inventory import Product, StockMovement, PurchaseOrder, PurchaseOrderItem, MovementType, PurchaseStatus
from app.schemas.inventory import (
    ProductCreate, ProductResponse, ProductUpdate,
    StockMovementCreate, StockMovementResponse,
    PurchaseOrderCreate, PurchaseOrderResponse, PurchaseOrderUpdate,
    PurchaseOrderItemResponse
)

router = APIRouter()


def _role(current_user: User) -> str:
    return current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

# --- PRODUCTS ---

@router.get("/products", response_model=List[ProductResponse])
def get_products(
    category: Optional[str] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    if category and category != "ALL":
        query = query.filter(Product.category == category)
    
    products = query.all()
    
    if low_stock:
        products = [p for p in products if p.current_stock <= p.min_stock_level]
        
    return products

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if _role(current_user) not in {"ADMIN", "PLANNER", "OPERACIONES"}:
        raise HTTPException(status_code=403, detail="Access denied")
    # Check uniqueness
    if db.query(Product).filter(Product.sku == product_in.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")

    # Create product
    new_product = Product(
        name=product_in.name,
        sku=product_in.sku,
        category=product_in.category,
        description=product_in.description,
        min_stock_level=product_in.min_stock_level,
        cost_price=product_in.cost_price,
        image_url=product_in.image_url,
        current_stock=product_in.initial_stock
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    # If initial stock > 0, create movement
    if product_in.initial_stock > 0:
        mov = StockMovement(
            product_id=new_product.id,
            user_id=current_user.id,
            change_amount=product_in.initial_stock,
            movement_type=MovementType.IN,
            reason="Initial Stock"
        )
        db.add(mov)
        db.commit()
    
    return new_product

@router.get("/products/{id}", response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

@router.put("/products/{id}", response_model=ProductResponse)
def update_product(
    id: int, 
    data: ProductUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if _role(current_user) not in {"ADMIN", "PLANNER", "OPERACIONES"}:
        raise HTTPException(status_code=403, detail="Access denied")
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_dict = data.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(prod, k, v)
        
    db.commit()
    db.refresh(prod)
    return prod

# --- STOCK MOVEMENTS ---

@router.post("/stock/move", response_model=StockMovementResponse)
def create_stock_movement(
    move: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if _role(current_user) not in {"ADMIN", "PLANNER", "OPERACIONES", "TECNICO"}:
        raise HTTPException(status_code=403, detail="Access denied")

    if move.movement_type == MovementType.OUT and move.change_amount > 0:
        raise HTTPException(status_code=400, detail="OUT movement must use a negative amount")
    if move.movement_type == MovementType.IN and move.change_amount < 0:
        raise HTTPException(status_code=400, detail="IN movement must use a positive amount")
    prod = db.query(Product).filter(Product.id == move.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Calculate new stock
    new_stock = prod.current_stock + move.change_amount
    if new_stock < 0:
         raise HTTPException(status_code=400, detail="Insufficient stock")
         
    # Update product
    prod.current_stock = new_stock
    
    # Record movement
    db_mov = StockMovement(
        product_id=move.product_id,
        user_id=current_user.id,
        change_amount=move.change_amount,
        movement_type=move.movement_type,
        reason=move.reason
    )
    
    db.add(db_mov)
    db.commit()
    db.refresh(db_mov)
    
    response = StockMovementResponse.model_validate(db_mov)
    response.product_name = prod.name
    return response

# --- PURCHASE ORDERS ---

@router.get("/purchases", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PurchaseOrder)
    if status and status != "ALL":
        query = query.filter(PurchaseOrder.status == status)
    
    orders = query.order_by(PurchaseOrder.created_at.desc()).all()
    
    # Populate extra fields
    result = []
    for o in orders:
        resp = PurchaseOrderResponse.model_validate(o)
        if o.requested_by:
            resp.requested_by_name = o.requested_by.full_name
        
        # Populate items details
        items_resp = []
        for item in o.items:
            ir = PurchaseOrderItemResponse.model_validate(item)
            ir.product_name = item.product.name
            items_resp.append(ir)
        resp.items = items_resp
        
        result.append(resp)
        
    return result

@router.post("/purchases", response_model=PurchaseOrderResponse)
def create_purchase_order(
    po_in: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if _role(current_user) not in {"ADMIN", "PLANNER", "OPERACIONES"}:
        raise HTTPException(status_code=403, detail="Access denied")
    # Generate collision-resistant display ID (avoids count() race conditions)
    year = datetime.now().year
    display_id = f"PO-{year}-{uuid.uuid4().hex[:8].upper()}"
    
    new_po = PurchaseOrder(
        display_id=display_id,
        status=PurchaseStatus.REQUESTED,
        requested_by_id=current_user.id,
        notes=po_in.notes
    )
    db.add(new_po)
    db.commit()
    db.refresh(new_po)
    
    # Add items
    for item in po_in.items:
        db_item = PurchaseOrderItem(
            purchase_order_id=new_po.id,
            product_id=item.product_id,
            quantity_requested=item.quantity
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(new_po)
    
    # Return response manual construction (to handle relations)
    resp = PurchaseOrderResponse.model_validate(new_po)
    resp.requested_by_name = current_user.full_name
    
    items_resp = []
    for item in new_po.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        ir = PurchaseOrderItemResponse.model_validate(item)
        ir.product_name = prod.name
        items_resp.append(ir)
    resp.items = items_resp
    
    return resp

@router.put("/purchases/{id}/status", response_model=PurchaseOrderResponse)
def update_po_status(
    id: int,
    status_update: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if _role(current_user) not in {"ADMIN", "PLANNER", "OPERACIONES"}:
        raise HTTPException(status_code=403, detail="Access denied")
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Logic for receiving items could go here, for now just status
    if status_update.status:
        # If changing to RECEIVED, filtering logic for stock update is complex 
        # (needs partial receive logic, but let's assume full receive for MVP)
        if status_update.status == PurchaseStatus.RECEIVED and po.status != PurchaseStatus.RECEIVED:
            # Add stock for all items
            for item in po.items:
                item.quantity_received = item.quantity_requested # Auto-fill
                prod = item.product
                prod.current_stock += item.quantity_received
                
                # Log movement
                mov = StockMovement(
                    product_id=prod.id,
                    user_id=current_user.id,
                    change_amount=item.quantity_received,
                    movement_type=MovementType.IN,
                    reason=f"Purchase Order {po.display_id}"
                )
                db.add(mov)

        po.status = status_update.status
        
    if status_update.notes:
        po.notes = status_update.notes
        
    db.commit()
    db.refresh(po)
    
    resp = PurchaseOrderResponse.model_validate(po)
    if po.requested_by:
        resp.requested_by_name = po.requested_by.full_name
        
    items_resp = []
    for item in po.items:
        ir = PurchaseOrderItemResponse.model_validate(item)
        ir.product_name = item.product.name
        items_resp.append(ir)
    resp.items = items_resp
    
    return resp
