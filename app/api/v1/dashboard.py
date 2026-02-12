from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.work_order import WorkOrder, OrderStatus, OrderPriority
from app.models.checklist import Checklist
from app.models.time_log import TimeLog, TimeEventType
from app.models.unit import Unit
from app.schemas.dashboard import DashboardKPIs, TopTechnician
from sqlalchemy import desc

router = APIRouter()

@router.get("/kpis", response_model=DashboardKPIs)
def get_dashboard_kpis(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard KPIs for Planner/Admin/Operaciones"""
    if current_user.role not in ["PLANNER", "ADMIN", "OPERACIONES"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Base queries
    order_query = db.query(WorkOrder)
    checklist_query = db.query(Checklist)
    
    # Filter for Operations Manager
    if current_user.role == "OPERACIONES":
        # Join with Unit to filter by manager_id
        order_query = order_query.join(WorkOrder.unit).filter(Unit.manager_id == current_user.id)
        checklist_query = checklist_query.join(Checklist.unit).filter(Unit.manager_id == current_user.id)
        # Note: units_query logic needs adjustment below
    
    # Apply date filters
    if start_date:
        order_query = order_query.filter(WorkOrder.created_at >= start_date)
        checklist_query = checklist_query.filter(Checklist.created_at >= start_date)
    if end_date:
        order_query = order_query.filter(WorkOrder.created_at <= end_date)
        checklist_query = checklist_query.filter(Checklist.created_at <= end_date)

    # 1. Stats
    total_orders = order_query.count()
    pending_orders = order_query.filter(
        WorkOrder.status.in_([OrderStatus.PRE_ORDER, OrderStatus.OPEN, OrderStatus.IN_PROGRESS, OrderStatus.PAUSED])
    ).count()
    completed_orders = order_query.filter(
        WorkOrder.status.in_([OrderStatus.COMPLETED, OrderStatus.CLOSED])
    ).count()

    # 2. Compliance & Availability
    units_query = db.query(Unit)
    if current_user.role == "OPERACIONES":
        units_query = units_query.filter(Unit.manager_id == current_user.id)
        
    total_units = units_query.count()
    
    # New Health Formula: (Total Units - Units with Open Pre-orders) / Total Units
    # For Ops Manager, we need to ensure we only count pre-orders for their units
    preorders_query = db.query(WorkOrder.unit_id).filter(
        WorkOrder.status == OrderStatus.PRE_ORDER
    )
    if current_user.role == "OPERACIONES":
        preorders_query = preorders_query.join(WorkOrder.unit).filter(Unit.manager_id == current_user.id)
        
    units_with_preorders = preorders_query.distinct().count()
    
    fleet_availability = round(((total_units - units_with_preorders) / total_units * 100), 1) if total_units > 0 else 0
    fleet_health = f"{fleet_availability}%"

    checklists_count = checklist_query.count()
    compliance_pct = round((checklists_count / total_units * 100), 1) if total_units > 0 else 0
    
    # 3. Productivity
    completed_work_orders = order_query.filter(
        WorkOrder.status == OrderStatus.COMPLETED
    ).all()
    
    total_minutes = 0
    count = 0
    for order in completed_work_orders:
        finish_logs = db.query(TimeLog).filter(
            TimeLog.work_order_id == order.id,
            TimeLog.event_type.in_([TimeEventType.PAUSE, TimeEventType.FINISH]),
            TimeLog.duration_minutes.isnot(None)
        ).all()
        
        order_total = sum(log.duration_minutes or 0 for log in finish_logs)
        if order_total > 0:
            total_minutes += order_total
            count += 1
    
    avg_minutes = round(total_minutes / count, 1) if count > 0 else None

    # 4. Units stopped > 24h
    yesterday = datetime.utcnow() - timedelta(days=1)
    units_stopped_24h = order_query.filter(
        WorkOrder.status.in_([OrderStatus.IN_PROGRESS, OrderStatus.OPEN]),
        WorkOrder.created_at < yesterday
    ).count()

    # 5. Urgent Orders count
    urgent_orders = order_query.filter(
        WorkOrder.status.in_([OrderStatus.OPEN, OrderStatus.IN_PROGRESS]),
        WorkOrder.priority.in_([OrderPriority.HIGH, OrderPriority.CRITICAL])
    ).count()

    # 6. Chart Data (Power BI style)
    # Helper to convert Enum keys to strings
    # Unit status is current state, so no date filter usually applies, but let's leave it as snapshot
    if current_user.role == "OPERACIONES":
        units_raw = db.query(Unit.status, func.count(Unit.id)).filter(Unit.manager_id == current_user.id).group_by(Unit.status).all()
    else:
        units_raw = db.query(Unit.status, func.count(Unit.id)).group_by(Unit.status).all()
        
    units_by_status = {str(k.value) if hasattr(k, 'value') else str(k): v for k, v in units_raw}

    # Apply filters to orders chart
    orders_raw = order_query.with_entities(WorkOrder.priority, func.count(WorkOrder.id)).group_by(WorkOrder.priority).all()
    orders_by_priority = {str(k.value) if hasattr(k, 'value') else str(k): v for k, v in orders_raw}
    
    # Apply filters to checklists chart
    checklists_raw = checklist_query.with_entities(Checklist.has_failed, func.count(Checklist.id)).group_by(Checklist.has_failed).all()
    checklists_by_status = {('FAIL' if k else 'OK'): v for k, v in checklists_raw}

    # 7. Top Technicians
    top_techs_raw = db.query(
        WorkOrder.technician_id, 
        func.count(WorkOrder.id).label('count')
    ).filter(
        WorkOrder.status == OrderStatus.COMPLETED,
        WorkOrder.technician_id.isnot(None)
    ).group_by(WorkOrder.technician_id).order_by(desc('count')).limit(3).all()

    top_technicians = []
    for tech_id, count in top_techs_raw:
        user = db.query(User).filter(User.id == tech_id).first()
        if user:
            top_technicians.append(TopTechnician(
                id=user.id,
                name=user.full_name,
                avatar=user.profile_image,
                orders_completed=count
            ))

    return DashboardKPIs(
        productivity_avg_minutes=avg_minutes,
        compliance_percentage=compliance_pct,
        units_stopped_24h=units_stopped_24h,
        total_units=total_units,
        total_orders_completed_today=completed_orders,
        total_checklists_today=checklists_count,
        fleet_availability_percentage=fleet_availability,
        units_operativa=units_query.filter(Unit.status == "OPERATIVA").count(),
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        fleet_health=fleet_health,
        urgent_orders_count=urgent_orders,
        units_by_status=units_by_status,
        orders_by_priority=orders_by_priority,
        checklists_by_status=checklists_by_status,
        top_technicians=top_technicians
    )

from app.schemas.dashboard import ActivityFeedItem
from typing import List

@router.get("/activity", response_model=List[ActivityFeedItem])
def get_activity_feed(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent activity feed for Planner/Admin/Operaciones"""
    if current_user.role not in ["PLANNER", "ADMIN", "OPERACIONES"]:
        raise HTTPException(status_code=403, detail="Access denied")

    activities = []

    # 1. Recent Work Orders
    recent_orders_query = db.query(WorkOrder).order_by(WorkOrder.created_at.desc())
    if current_user.role == "OPERACIONES":
        recent_orders_query = recent_orders_query.join(WorkOrder.unit).filter(Unit.manager_id == current_user.id)
        
    recent_orders = recent_orders_query.limit(limit).all()
    for order in recent_orders:
        eco = "Unknown" 
        # Ideally fetch unit eco via join, but lazy load for now or assume cached
        unit = db.query(Unit).filter(Unit.id == order.unit_id).first()
        eco = unit.eco_number if unit else "?"
        
        icon = "🛠️"
        severity = "info"
        if order.priority == OrderPriority.CRITICAL:
            severity = "danger"
            icon = "🚨"
        elif order.status == OrderStatus.COMPLETED:
            severity = "success"
            icon = "✅"

        activities.append(ActivityFeedItem(
            id=f"order_{order.id}",
            type="ORDER",
            title=f"Orden #{order.id} - {order.status}",
            description=f"{(order.description or 'Sin descripción')[:60]}... en unidad {eco}",
            timestamp=order.created_at.isoformat(),
            severity=severity,
            icon=icon,
            user_name="Sistema" # Could fetch assigned tech
        ))

    # 2. Recent Checklists
    recent_checklists_query = db.query(Checklist).order_by(Checklist.created_at.desc())
    if current_user.role == "OPERACIONES":
        recent_checklists_query = recent_checklists_query.join(Checklist.unit).filter(Unit.manager_id == current_user.id)
        
    recent_checklists = recent_checklists_query.limit(limit).all()
    for cl in recent_checklists:
        unit = db.query(Unit).filter(Unit.id == cl.unit_id).first()
        eco = unit.eco_number if unit else "?"
        user = db.query(User).filter(User.id == cl.user_id).first()
        user_name = user.full_name if user else "Conductor"

        if cl.has_failed:
            activities.append(ActivityFeedItem(
                id=f"chk_{cl.id}",
                type="CHECKLIST",
                title=f"Fallo de Inspección",
                description=f"La unidad {eco} reportó problemas.",
                timestamp=cl.created_at.isoformat(),
                severity="danger",
                icon="⚠️",
                user_name=user_name
            ))
        else:
             activities.append(ActivityFeedItem(
                id=f"chk_{cl.id}",
                type="CHECKLIST",
                title=f"Inspección Exitosa",
                description=f"Unidad {eco} verificada correctamente.",
                timestamp=cl.created_at.isoformat(),
                severity="success",
                icon="📋",
                user_name=user_name
            ))

    # Sort and slice
    # Use str comparison for isoformat strings, which works correctly for same timezone
    activities.sort(key=lambda x: x.timestamp, reverse=True)
    return activities[:limit]

from app.schemas.dashboard import TechnicianStats

@router.get("/technician-stats", response_model=TechnicianStats)
def get_technician_stats(
    period: str = "HOY", # HOY, SEMANA, MES, HISTORICO
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get stats for the logged-in technician"""
    # Allow ADMIN/PLANNER to view too, but primarily for TECH
    # If ADMIN/PLANNER calls this, it might return empty or specific tech if implemented, 
    # but for now assume it's for the 'current_user' as a technician context.
    
    # Base query for orders assigned to this user
    query = db.query(WorkOrder).filter(WorkOrder.technician_id == current_user.id)
    
    # Apply Time Filter
    now = datetime.utcnow()
    if period == "HOY":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        # Filter by Updated At or Created At? 
        # Usually completed count is based on 'completed_at', assigned is 'created_at'.
        # For simplicity in this 'Snapshot' view, we check actions within the window?
        # OR just "Current Status" for pending, and "Completed in Timeframe" for history.
        
        # Let's do: 
        # - Pending: Current backlog (ALL time, because they are still pending)
        # - Completed: Completed TODAY
        # - Total Assigned: Pending + Completed TODAY
        pass # Logic applied below
        
    elif period == "SEMANA":
        start_of_week = now - timedelta(days=now.weekday())
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "MES":
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 1. Active/Pending Load (Always all active, regardless of time filter, or maybe assigned in period?)
    # "Productivity" usually implies "What did I do in this Period?" vs "What do I have left?"
    # Let's standardize:
    # COMPLETED: Count orders where status=COMPLETED/CLOSED AND completed_at in period.
    # PENDING: Count orders where status=OPEN/IN_PROGRESS/PAUSED (Snapshot, all time).
    # TOTAL: Completed (in period) + Pending (Snapshot).
    
    pending_count = query.filter(
        WorkOrder.status.in_([OrderStatus.PRE_ORDER, OrderStatus.OPEN, OrderStatus.IN_PROGRESS, OrderStatus.PAUSED])
    ).count()

    completed_query = query.filter(
        WorkOrder.status.in_([OrderStatus.COMPLETED, OrderStatus.CLOSED])
    )
    
    if period == "HOY":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        completed_query = completed_query.filter(WorkOrder.completed_at >= start_date)
    elif period == "SEMANA":
        # Monday
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        completed_query = completed_query.filter(WorkOrder.completed_at >= start_date)
    elif period == "MES":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        completed_query = completed_query.filter(WorkOrder.completed_at >= start_date)
    # HISTORICO: No filter on completed
    
    completed_orders = completed_query.all()
    completed_count = len(completed_orders)
    
    total = pending_count + completed_count
    rate = round((completed_count / total * 100), 1) if total > 0 else 0.0
    
    # Avg Time
    total_minutes = 0
    valid_orders = 0
    for o in completed_orders:
        if o.created_at and o.completed_at:
            mins = (o.completed_at - o.created_at).total_seconds() / 60
            total_minutes += mins
            valid_orders += 1
            
    avg_hours = round((total_minutes / 60) / valid_orders, 1) if valid_orders > 0 else 0.0

    return TechnicianStats(
        period=period,
        total_assigned=total,
        completed=completed_count,
        pending=pending_count,
        completion_rate=rate,
        avg_completion_time_hours=avg_hours
    )

# ======== NEW ENDPOINTS FOR ENHANCED DASHBOARD ========

from app.models.inventory import Product, StockMovement, MovementType

@router.get("/top-parts-consumed")
def get_top_parts_consumed(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Top 5 refacciones más consumidas (salidas de inventario)"""
    if current_user.role not in ["PLANNER", "ADMIN", "OPERACIONES"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Group by product_id, sum negative movements (OUT)
    results = db.query(
        StockMovement.product_id,
        func.sum(func.abs(StockMovement.change_amount)).label('total_consumed')
    ).filter(
        StockMovement.movement_type == MovementType.OUT
    ).group_by(StockMovement.product_id).order_by(
        desc('total_consumed')
    ).limit(limit).all()
    
    top_parts = []
    for product_id, total_consumed in results:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            top_parts.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "category": product.category,
                "total_consumed": float(total_consumed),
                "current_stock": float(product.current_stock),
                "cost_price": float(product.cost_price or 0)
            })
    
    return top_parts


@router.get("/top-expensive-parts")
def get_top_expensive_parts(
    min_price: float = 5000.0,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Top 5 refacciones más costosas (>$5000) más consumidas"""
    if current_user.role not in ["PLANNER", "ADMIN", "OPERACIONES"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get products that cost > min_price, then check consumption
    expensive_products = db.query(Product).filter(Product.cost_price >= min_price).all()
    
    consumption_data = []
    for product in expensive_products:
        total_out = db.query(func.sum(func.abs(StockMovement.change_amount))).filter(
            StockMovement.product_id == product.id,
            StockMovement.movement_type == MovementType.OUT
        ).scalar() or 0
        
        if total_out > 0:
            consumption_data.append({
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "category": product.category,
                "cost_price": float(product.cost_price),
                "total_consumed": float(total_out),
                "total_value_consumed": float(product.cost_price * total_out)
            })
    
    # Sort by total consumed and take top N
    consumption_data.sort(key=lambda x: x['total_consumed'], reverse=True)
    return consumption_data[:limit]


@router.get("/today-workload")
def get_today_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get work orders scheduled for today for the timeline/kanban view"""
    if current_user.role not in ["PLANNER", "ADMIN", "OPERACIONES"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    now = datetime.utcnow()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    # Get orders that are scheduled for today OR are in progress/open today
    query = db.query(WorkOrder).filter(
        (WorkOrder.scheduled_date >= start_of_day) & (WorkOrder.scheduled_date <= end_of_day) |
        WorkOrder.status.in_([OrderStatus.OPEN, OrderStatus.IN_PROGRESS, OrderStatus.PAUSED])
    )
    
    if current_user.role == "OPERACIONES":
        query = query.join(WorkOrder.unit).filter(Unit.manager_id == current_user.id)
    
    orders = query.order_by(WorkOrder.scheduled_date.asc().nulls_last(), WorkOrder.priority.desc()).all()
    
    workload = []
    for order in orders:
        unit = db.query(Unit).filter(Unit.id == order.unit_id).first()
        tech = db.query(User).filter(User.id == order.technician_id).first() if order.technician_id else None
        
        workload.append({
            "id": order.id,
            "unit_eco": unit.eco_number if unit else "N/A",
            "description": (order.description or "Sin descripción")[:80],
            "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
            "priority": order.priority.value if hasattr(order.priority, 'value') else str(order.priority),
            "technician_name": tech.full_name if tech else "Sin asignar",
            "technician_id": order.technician_id,
            "estimated_hours": order.estimated_hours or 1,
            "scheduled_date": order.scheduled_date.isoformat() if order.scheduled_date else None,
            "started_at": order.started_at.isoformat() if order.started_at else None
        })
    
    return workload
