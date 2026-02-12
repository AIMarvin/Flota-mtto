
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models import User, Unit
from app.models.user import UserRole
from app.core.security import get_password_hash

def seed_manager():
    db = SessionLocal()
    try:
        email = "gerente@flota.com"
        password = "gerente123"
        role = UserRole.OPERACIONES
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Creating user {email}...")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name="Carlos Gerente",
                role=role
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print(f"User {email} exists. Updating role...")
            user.role = role
            # ensure password is correct/updated if needed, but let's skip for now
            db.commit()
            
        print(f"User ID: {user.id}")
        
        # Assign some units to this manager
        units = db.query(Unit).limit(3).all()
        print(f"Assigning {len(units)} units to manager {user.full_name}")
        for unit in units:
            unit.manager_id = user.id
            print(f"  - Unit {unit.eco_number} assigned to manager")
            
        db.commit()
        print("Done!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_manager()
