"""
Test script to create sample units for testing the checklist module
"""
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models import *  # Import all models
from app.core.security import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

# Create session
db = SessionLocal()

try:
    # Create test user (Tecnico)
    existing_user = db.query(User).filter(User.email == "tecnico@flota.com").first()
    if not existing_user:
        user = User(
            email="tecnico@flota.com",
            hashed_password=get_password_hash("abc123"),
            full_name="Juan Técnico",
            role="TECNICO"
        )
        db.add(user)
        print("✅ Created user: tecnico@flota.com / abc123")
    else:
        print("ℹ️ User already exists: tecnico@flota.com")

    # Create test units
    units_data = [
        {"eco_number": "ECO001", "vin": "VIN001", "model": "Volvo 9700"},
        {"eco_number": "ECO002", "vin": "VIN002", "model": "Mercedes-Benz O500"},
        {"eco_number": "ECO003", "vin": "VIN003", "model": "Scania K360"},
        {"eco_number": "ECO004", "vin": "VIN004", "model": "Irizar i6"},
        {"eco_number": "ECO005", "vin": "VIN005", "model": "MAN Lions Coach"},
    ]

    for unit_data in units_data:
        existing_unit = db.query(Unit).filter(Unit.eco_number == unit_data["eco_number"]).first()
        if not existing_unit:
            unit = Unit(**unit_data, status="OPERATIVA")
            db.add(unit)
            print(f"✅ Created unit: {unit_data['eco_number']} - {unit_data['model']}")
        else:
            print(f"ℹ️ Unit already exists: {unit_data['eco_number']}")

    db.commit()
    print("\n🎉 Test data created successfully!")
    print("\nLogin credentials:")
    print("  Email: tecnico@flota.com")
    print("  Password: abc123")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
