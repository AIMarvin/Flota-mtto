from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.work_order import WorkOrder, OrderStatus
from app.models.time_log import TimeLog, TimeEventType
from app.models.user import User
from app.schemas.work_order import (
    WorkOrderCreate, 
    WorkOrderUpdate, 
    WorkOrderStatusChange,
    WorkOrderResponse,
    TimeLogResponse
)

router = APIRouter()

def map_order_to_response(order: WorkOrder) -> WorkOrderResponse:
    """Helper to consistently map WorkOrder model to Response schema with relations"""
    data = WorkOrderResponse.model_validate(order)
    if order.technician:
        data.technician_name = order.technician.full_name
    if order.unit:
        data.unit_eco = order.unit.eco_number
    return data

@router.get("/", response_model=List[WorkOrderResponse])
def get_orders(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get work orders with role-based filtering
    - PLANNER: sees all orders
    - TECNICO: sees only their assigned orders
    """
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role not in {"PLANNER", "ADMIN", "OPERACIONES", "TECNICO"}:
        raise HTTPException(status_code=403, detail="Access denied")

    query = db.query(WorkOrder).options(joinedload(WorkOrder.technician), joinedload(WorkOrder.unit))

    if role == "TECNICO":
        # Technicians only see their own orders
        query = query.filter(WorkOrder.technician_id == current_user.id)
    
    orders = query.offset(skip).limit(limit).all()
    return [map_order_to_response(o) for o in orders]

@router.post("/", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new work order (Planner only)"""
    if current_user.role not in ["PLANNER", "OPERACIONES", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Planners can create orders"
        )
    
    db_order = WorkOrder(
        unit_id=order_in.unit_id,
        description=order_in.description,
        priority=order_in.priority,
        technician_id=order_in.technician_id,
        status=OrderStatus.OPEN if order_in.technician_id else OrderStatus.PRE_ORDER
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Reload with relations
    db_order = db.query(WorkOrder).options(joinedload(WorkOrder.technician), joinedload(WorkOrder.unit)).filter(WorkOrder.id == db_order.id).first()
    return map_order_to_response(db_order)

@router.get("/{order_id}", response_model=WorkOrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific order"""
    order = db.query(WorkOrder).options(joinedload(WorkOrder.technician), joinedload(WorkOrder.unit)).filter(WorkOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role == "TECNICO" and order.technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if role not in {"PLANNER", "ADMIN", "OPERACIONES", "TECNICO"}:
        raise HTTPException(status_code=403, detail="Access denied")

    return map_order_to_response(order)

@router.patch("/{order_id}", response_model=WorkOrderResponse)
def update_order(
    order_id: int,
    order_update: WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update order (Planner only - for assignment, priority, etc)"""
    if current_user.role not in ["PLANNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Planners can update orders")
    
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update fields
    if order_update.description is not None:
        order.description = order_update.description
    if order_update.priority is not None:
        order.priority = order_update.priority
    if order_update.technician_id is not None:
        order.technician_id = order_update.technician_id
        if order.status == OrderStatus.PRE_ORDER:
            order.status = OrderStatus.OPEN
    
    db.commit()
    db.refresh(order)
    
    # Reload with relations
    order = db.query(WorkOrder).options(joinedload(WorkOrder.technician), joinedload(WorkOrder.unit)).filter(WorkOrder.id == order.id).first()
    return map_order_to_response(order)

from pydantic import BaseModel
class OrderSchedule(BaseModel):
    scheduled_date: datetime

@router.patch("/{order_id}/schedule", response_model=WorkOrderResponse)
def schedule_order(
    order_id: int,
    schedule_data: OrderSchedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set programmed date for an order (Planner/Admin/Operaciones)"""
    if current_user.role not in ["PLANNER", "ADMIN", "OPERACIONES"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.scheduled_date = schedule_data.scheduled_date
    # If currently pre-order, promote to OPEN
    if order.status == OrderStatus.PRE_ORDER:
        order.status = OrderStatus.OPEN
        
    db.commit()
    db.refresh(order)
    
    # Reload with relations
    order = db.query(WorkOrder).options(joinedload(WorkOrder.technician), joinedload(WorkOrder.unit)).filter(WorkOrder.id == order.id).first()
    return map_order_to_response(order)

@router.patch("/{order_id}/status", response_model=WorkOrderResponse)
def change_order_status(
    order_id: int,
    status_change: WorkOrderStatusChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    CRITICAL: Change order status with automatic time logging
    - IN_PROGRESS: Log START event
    - PAUSED: Log PAUSE event + calculate duration
    - COMPLETED: Log FINISH event + calculate duration
    """
    order = db.query(WorkOrder).options(joinedload(WorkOrder.technician)).filter(WorkOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Technicians can only change status of their own orders
    if current_user.role == "TECNICO" and order.technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your order")
    
    new_status = status_change.status
    now = status_change.timestamp or datetime.utcnow()
    
    # State transition logic
    if new_status == "IN_PROGRESS":
        # Starting or resuming work
        if order.status == OrderStatus.OPEN:
            event_type = TimeEventType.START
            order.started_at = now
        elif order.status == OrderStatus.PAUSED:
            event_type = TimeEventType.RESUME
        else:
            raise HTTPException(status_code=400, detail=f"Cannot start from status {order.status}")
        
        order.status = OrderStatus.IN_PROGRESS
        time_log = TimeLog(work_order_id=order.id, technician_id=current_user.id, event_type=event_type, timestamp=now)
        db.add(time_log)
    
    elif new_status == "PAUSED":
        if order.status != OrderStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Can only pause work that is in progress")
        
        order.status = OrderStatus.PAUSED
        last_log = db.query(TimeLog).filter(TimeLog.work_order_id == order.id).filter(TimeLog.event_type.in_([TimeEventType.START, TimeEventType.RESUME])).order_by(TimeLog.timestamp.desc()).first()
        
        duration_minutes = 0
        if last_log:
            duration = now - last_log.timestamp
            duration_minutes = int(duration.total_seconds() / 60)
        
        reason_text = status_change.reason
        from app.models.inventory import Product, StockMovement, MovementType
        if status_change.product_id and status_change.quantity:
            product = db.query(Product).filter(Product.id == status_change.product_id).first()
            if product:
                if product.current_stock < status_change.quantity:
                    raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")
                product.current_stock -= status_change.quantity
                movement = StockMovement(
                    product_id=product.id, user_id=current_user.id, change_amount=-status_change.quantity,
                    movement_type=MovementType.OUT, reason=f"Pausa Orden #{order.id}: {reason_text or ''}"
                )
                db.add(movement)
                reason_text = f"Refacción: {product.name} (x{status_change.quantity})"

        time_log = TimeLog(work_order_id=order.id, technician_id=current_user.id, event_type=TimeEventType.PAUSE, timestamp=now, duration_minutes=duration_minutes, reason=reason_text)
        db.add(time_log)
    
    elif new_status == "COMPLETED":
        if order.status != OrderStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Can only complete work that is in progress")
        
        order.status = OrderStatus.COMPLETED
        order.completed_at = now
        last_log = db.query(TimeLog).filter(TimeLog.work_order_id == order.id).filter(TimeLog.event_type.in_([TimeEventType.START, TimeEventType.RESUME])).order_by(TimeLog.timestamp.desc()).first()
        
        duration_minutes = 0
        if last_log:
            duration = now - last_log.timestamp
            duration_minutes = int(duration.total_seconds() / 60)
        
        time_log = TimeLog(work_order_id=order.id, technician_id=current_user.id, event_type=TimeEventType.FINISH, timestamp=now, duration_minutes=duration_minutes)
        db.add(time_log)
    
    else:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")
    
    db.commit()
    db.refresh(order)
    
    # Reload with relations
    order = db.query(WorkOrder).options(joinedload(WorkOrder.technician), joinedload(WorkOrder.unit)).filter(WorkOrder.id == order.id).first()
    return map_order_to_response(order)

@router.get("/{order_id}/timelogs", response_model=List[TimeLogResponse])
def get_order_timelogs(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all time logs for an order"""
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role == "TECNICO" and order.technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    logs = db.query(TimeLog).filter(TimeLog.work_order_id == order_id).order_by(TimeLog.timestamp.desc()).all()
    return logs

@router.post("/{order_id}/approve")
def approve_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Approve a completed order and close it (Planner/Admin only)"""
    if current_user.role not in ["PLANNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Planners can approve orders")
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order or order.status != OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Order not found or not completed")
    order.status = OrderStatus.CLOSED
    db.commit()
    db.refresh(order)
    return {"message": "Order approved and closed", "order": order}

@router.post("/{order_id}/reject")
def reject_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Reject a completed order (Planner/Admin only)"""
    if current_user.role not in ["PLANNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Planners can reject orders")
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order or order.status != OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Order not found or not completed")
    order.status = OrderStatus.REJECTED
    db.commit()
    db.refresh(order)
    return {"message": "Order rejected", "order": order}

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete an order (Planner/Admin only)"""
    if current_user.role not in ["PLANNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only Planners can delete orders")
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}
