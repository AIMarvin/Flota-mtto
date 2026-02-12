import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_planner():
    try:
        db = SessionLocal()
        email = "planner@steppi.com"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Creating user {email}...")
            user = User(
                email=email,
                hashed_password=get_password_hash("password123"),
                full_name="Planner User",
                role="PLANNER"
            )
            db.add(user)
            db.commit()
            print("User created successfully.")
        else:
            print("User already exists.")
            # Ensure role is PLANNER
            if user.role != "PLANNER":
                user.role = "PLANNER"
                db.commit()
                print("Updated user role to PLANNER.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_planner()
