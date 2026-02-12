import pandas as pd
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
import re

def sanitize_email(name):
    # Remove special characters and accents
    name = name.lower()
    name = re.sub(r'[áàäâ]', 'a', name)
    name = re.sub(r'[éèëê]', 'e', name)
    name = re.sub(r'[íìïî]', 'i', name)
    name = re.sub(r'[óòöô]', 'o', name)
    name = re.sub(r'[úùüû]', 'u', name)
    name = re.sub(r'[ñ]', 'n', name)
    # Get first and last parts
    parts = name.split()
    if len(parts) >= 2:
        return f"{parts[0]}.{parts[-1]}@steppi.com"
    return f"{name.replace(' ', '.')}@steppi.com"

def import_technicians():
    db = SessionLocal()
    file_path = r"c:\Users\L03572099\Desktop\Flota_Mantenimiento_PWA\data_imports\HC_MANTENIMIENTOENERO.xls"
    
    try:
        df = pd.read_excel(file_path)
        df.columns = [c.strip() for c in df.columns]

        created_count = 0
        skipped_count = 0
        
        default_password = get_password_hash("tecnico123")

        for index, row in df.iterrows():
            full_name = str(row.get('Nombre', '')).strip()
            if not full_name or full_name.lower() == 'nan':
                continue
            
            email = sanitize_email(full_name)
            
            # Check for duplicates and slightly modify email if needed
            original_email = email
            counter = 1
            while db.query(User).filter(User.email == email).first():
                email = original_email.replace("@steppi.com", f"{counter}@steppi.com")
                counter += 1

            new_user = User(
                email=email,
                full_name=full_name,
                hashed_password=default_password,
                role=UserRole.TECNICO
            )
            db.add(new_user)
            db.flush() # Ensure it's in the session for subsequent query checks
            created_count += 1
            
        db.commit()
        print(f"Technicians imported: {created_count}")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_technicians()
