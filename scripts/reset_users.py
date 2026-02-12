import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def reset_users():
    db = SessionLocal()
    
    users = [
        {"email": "admin@flota.com", "pass": "admin123", "role": "ADMIN", "name": "Admin Sistema"},
        {"email": "planner@flota.com", "pass": "planner123", "role": "PLANNER", "name": "Jefe de Taller"},
        {"email": "tech@flota.com", "pass": "tech123", "role": "TECNICO", "name": "Tecnico Especialista"},
        {"email": "driver@flota.com", "pass": "driver123", "role": "CHOFER", "name": "Juan Perez (Chofer)"},
    ]

    print("--- Updating/Creating Users ---")
    for u_data in users:
        user = db.query(User).filter(User.email == u_data["email"]).first()
        if not user:
            print(f"Creating {u_data['email']}...")
            user = User(
                email=u_data["email"],
                hashed_password=get_password_hash(u_data["pass"]),
                full_name=u_data["name"],
                role=u_data["role"]
            )
            db.add(user)
        else:
            print(f"Updating {u_data['email']} (resetting password)...")
            user.hashed_password = get_password_hash(u_data["pass"])
            user.role = u_data["role"]
            user.full_name = u_data["name"]
        
    db.commit()
    print("--- Done ---")
    db.close()

if __name__ == "__main__":
    reset_users()
