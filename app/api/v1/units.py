from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.checklist import Checklist
from app.models.unit import Unit
from app.models.user import User
from app.models.work_order import OrderStatus, WorkOrder
from app.schemas.unit import UnitCreate, UnitFlota360, UnitResponse, UnitTimelineItem, UnitUpdate

router = APIRouter()


def _role(current_user: User) -> str:
    return current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)


@router.get("/flota360", response_model=List[UnitFlota360])
def get_flota_360(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Unit)
    if _role(current_user) == "OPERACIONES":
        query = query.filter(Unit.manager_id == current_user.id)
    units = query.all()

    result = []
    for unit in units:
        last_checklist = (
            db.query(Checklist)
            .filter(Checklist.unit_id == unit.id)
            .order_by(Checklist.created_at.desc())
            .first()
        )
        open_orders = (
            db.query(WorkOrder)
            .filter(
                WorkOrder.unit_id == unit.id,
                WorkOrder.status.in_(
                    [OrderStatus.PRE_ORDER, OrderStatus.OPEN, OrderStatus.IN_PROGRESS, OrderStatus.PAUSED]
                ),
            )
            .count()
        )
        score = 100
        if last_checklist and last_checklist.has_failed:
            score -= 30
        score -= open_orders * 10
        if unit.status == "EN_TALLER":
            score -= 20
        elif unit.status == "BAJA":
            score = 0
        score = max(0, min(100, score))

        drivers = db.query(User).filter(User.unit_id == unit.id).all()
        driver_names = [d.full_name for d in drivers if d.full_name]
        if not driver_names and unit.driver_id:
            driver = db.query(User).filter(User.id == unit.driver_id).first()
            if driver and driver.full_name:
                driver_names = [driver.full_name]

        result.append(
            UnitFlota360(
                id=unit.id,
                eco_number=unit.eco_number,
                model=unit.model,
                status=unit.status,
                vin=unit.vin,
                last_checklist_date=last_checklist.created_at if last_checklist else None,
                last_checklist_failed=last_checklist.has_failed if last_checklist else False,
                open_orders_count=open_orders,
                health_score=score,
                driver_id=unit.driver_id,
                driver_name=", ".join(driver_names) if driver_names else None,
            )
        )
    return result


@router.get("/", response_model=List[UnitResponse])
def get_units(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Unit)
    if _role(current_user) == "OPERACIONES":
        query = query.filter(Unit.manager_id == current_user.id)
    return query.offset(skip).limit(limit).all()


@router.post("/", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit_in: UnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if _role(current_user) not in {"ADMIN", "PLANNER", "OPERACIONES"}:
        raise HTTPException(status_code=403, detail="Access denied")
    existing_unit = db.query(Unit).filter(Unit.eco_number == unit_in.eco_number).first()
    if existing_unit:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Eco number already exists")

    db_unit = Unit(**unit_in.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.get("/{unit_id}", response_model=UnitResponse)
def get_unit(unit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    if _role(current_user) == "OPERACIONES" and unit.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return unit


@router.put("/{unit_id}", response_model=UnitResponse)
def update_unit(
    unit_id: int,
    unit_update: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if _role(current_user) not in {"ADMIN", "PLANNER", "OPERACIONES"}:
        raise HTTPException(status_code=403, detail="Access denied")
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    if _role(current_user) == "OPERACIONES" and unit.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    for field, value in unit_update.model_dump(exclude_unset=True).items():
        setattr(unit, field, value)
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


@router.delete("/{unit_id}")
def delete_unit(unit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if _role(current_user) not in {"ADMIN", "PLANNER"}:
        raise HTTPException(status_code=403, detail="Access denied")
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    db.delete(unit)
    db.commit()
    return {"message": "Unit deleted"}


@router.get("/{unit_id}/timeline", response_model=List[UnitTimelineItem])
def get_unit_timeline(
    unit_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    if _role(current_user) == "OPERACIONES" and unit.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    timeline: List[UnitTimelineItem] = []
    orders = (
        db.query(WorkOrder).filter(WorkOrder.unit_id == unit.id).order_by(WorkOrder.created_at.desc()).limit(limit).all()
    )
    for order in orders:
        icon = "🛠️"
        color = "#3b82f6"
        if order.status == OrderStatus.COMPLETED:
            icon = "✅"
            color = "#10b981"
        elif str(order.priority) == "CRITICAL" or (
            hasattr(order.priority, "value") and order.priority.value == "CRITICAL"
        ):
            icon = "🚨"
            color = "#ef4444"

        timeline.append(
            UnitTimelineItem(
                id=f"ord_{order.id}",
                type="ORDER",
                title=f"Orden #{order.id} - {order.status}",
                description=order.description or "Sin descripción",
                timestamp=order.created_at.isoformat(),
                icon=icon,
                color=color,
                user_name="Técnico",
            )
        )

    checklists = (
        db.query(Checklist).filter(Checklist.unit_id == unit.id).order_by(Checklist.created_at.desc()).limit(limit).all()
    )
    for checklist in checklists:
        user = db.query(User).filter(User.id == checklist.user_id).first()
        user_name = user.full_name if user else "Conductor"
        if checklist.has_failed:
            title = "Inspección Fallida"
            if checklist.is_priority:
                title += " (ALTA PRIORIDAD 🔥)"
            timeline.append(
                UnitTimelineItem(
                    id=f"chk_{checklist.id}",
                    type="CHECKLIST",
                    title=title,
                    description="Se reportaron problemas durante la inspección.",
                    timestamp=checklist.created_at.isoformat(),
                    icon="⚠️",
                    color="#ef4444",
                    user_name=user_name,
                )
            )
        else:
            timeline.append(
                UnitTimelineItem(
                    id=f"chk_{checklist.id}",
                    type="CHECKLIST",
                    title="Inspección Correcta",
                    description="Unidad verificada sin novedades.",
                    timestamp=checklist.created_at.isoformat(),
                    icon="📋",
                    color="#10b981",
                    user_name=user_name,
                )
            )

    timeline.sort(key=lambda x: x.timestamp, reverse=True)
    return timeline[:limit]
