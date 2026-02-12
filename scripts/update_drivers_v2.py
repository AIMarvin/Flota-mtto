import pandas as pd
from app.db.session import SessionLocal
from app.models.user import User
from app.models.unit import Unit
import os

def update_assignments():
    db = SessionLocal()
    
    file_path = r"c:\Users\L03572099\Desktop\Flota_Mantenimiento_PWA\data_imports\USER_DRIVERS.csv"
    if not os.path.exists(file_path):
        print(f"CSV not found at {file_path}")
        db.close()
        return

    df = pd.read_csv(file_path)
    df.columns = [c.strip() for c in df.columns]

    assigned_count = 0
    units_verified = 0
    
    for index, row in df.iterrows():
        driver_id_val = str(row.get('Numero Conductor', '')).strip()
        vehicle_val = str(row.get('Vehículo Ultimo Evento', '')).strip()
        
        if not driver_id_val or driver_id_val.lower() == 'nan':
            continue
            
        email = f"chofer_{driver_id_val}@steppi.com"
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            continue
            
        if not vehicle_val or vehicle_val.lower() == 'nan' or vehicle_val == '0':
            continue
            
        # Find or create unit
        eco = str(vehicle_val)
        unit = db.query(Unit).filter(Unit.eco_number == eco).first()
        
        if not unit:
            # Create unit if missing (though should have been created in V1)
            unit = Unit(
                eco_number=eco,
                model="Importado",
                status="OPERATIVA",
                vin=f"VIN-{eco}"
            )
            db.add(unit)
            db.flush()
            units_verified += 1
            
        # 1. Assign unit to user (The new many-to-one relationship)
        user.unit_id = unit.id
        
        # 2. Assign user to unit (Legacy primary driver field)
        # We only do this if it's currently empty, to avoid overwriting a primary driver if multiple share.
        if not unit.driver_id:
            unit.driver_id = user.id
            
        assigned_count += 1

    try:
        db.commit()
        print(f"Assignments updated: {assigned_count}")
        print(f"New units created: {units_verified}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_assignments()
