"""
Create test work orders for testing Phase 3
"""
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models import *

db = SessionLocal()

try:
    # Get a test unit and technician
    unit = db.query(Unit).filter(Unit.eco_number == "ECO001").first()
    tech = db.query(User).filter(User.email == "tecnico@flota.com").first()
    
    if not unit or not tech:
        print("❌ Run create_test_data.py first")
        exit(1)

    # Create test orders
    orders_data = [
        {
            "unit_id": unit.id,
            "description": "Revisión general del sistema de frenos y ajuste de pastillas",
            "priority": "HIGH",
            "status": "OPEN",
            "technician_id": tech.id
        },
        {
            "unit_id": db.query(Unit).filter(Unit.eco_number == "ECO002").first().id,
            "description": "Cambio de aceite y filtro. Revisión de niveles",
            "priority": "MEDIUM",
            "status": "OPEN",
            "technician_id": tech.id
        },
        {
            "unit_id": db.query(Unit).filter(Unit.eco_number == "ECO003").first().id,
            "description": "Reparación del sistema de aire acondicionado - fuga detectada",
            "priority": "CRITICAL",
            "status": "PRE_ORDER",
            "technician_id": None
        },
    ]

    for order_data in orders_data:
        order = WorkOrder(**order_data)
        db.add(order)
        print(f"✅ Created order: {order_data['description'][:50]}... (Status: {order_data['status']})")

    db.commit()
    print("\n🎉 Test orders created!")
    print(f"\nTechnician login: tecnico@flota.com / abc123")
    print("Assigned orders: 2")
    print("Unassigned pre-orders: 1")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
