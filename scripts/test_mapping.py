from app.db.session import SessionLocal
from app.models.work_order import WorkOrder
from app.schemas.work_order import WorkOrderResponse
from sqlalchemy.orm import joinedload

db = SessionLocal()
order = db.query(WorkOrder).options(joinedload(WorkOrder.technician), joinedload(WorkOrder.unit)).first()

if order:
    print(f"SQLAlchemy Tech: {order.technician.full_name if order.technician else 'None'}")
    
    # Try mapping to pydantic
    data = WorkOrderResponse.model_validate(order)
    print(f"Pydantic Name before manual set: {data.technician_name}")
    
    if order.technician:
        data.technician_name = order.technician.full_name
    
    print(f"Pydantic Name after manual set: {data.technician_name}")
    print(f"Pydantic Unit Eco: {data.unit_eco}")

db.close()
