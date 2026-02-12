"""
Complete seed data: Create users for all roles
"""
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models import User
from app.core.security import get_password_hash

db = SessionLocal()

USERS_DATA = [
    {
        "email": "admin@flota.com",
        "password": "admin123",
        "full_name": "Admin Principal",
        "role": "ADMIN"
    },
    {
        "email": "planner@flota.com",
        "password": "planner123",
        "full_name": "María Planner",
        "role": "PLANNER"
    },
    {
        "email": "tecnico@flota.com",
        "password": "abc123",
        "full_name": "Juan Técnico",
        "role": "TECNICO"
    },
    {
        "email": "chofer@flota.com",
        "password": "chofer123",
        "full_name": "Pedro Chofer",
        "role": "CHOFER"
    }
]

try:
    created_count = 0
    
    for user_data in USERS_DATA:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        
        if existing:
            print(f"ℹ️  Actualizando usuario: {user_data['email']}")
            existing.hashed_password = get_password_hash(user_data["password"])
            existing.full_name = user_data["full_name"]
            existing.role = user_data["role"]
        else:
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"]
            )
            db.add(user)
            created_count += 1
            print(f"✅ Creado: {user_data['email']} ({user_data['role']})")

    
    db.commit()
    
    print("\n" + "=" * 80)
    print(f"🎉 Seed completado: {created_count} usuarios nuevos")
    print("=" * 80)
    
    print("\n📋 CREDENCIALES COMPLETAS POR ROL:\n")
    
    print("👑 ADMIN (Acceso total)")
    print("   Email:    admin@flota.com")
    print("   Password: admin123")
    print("   Menú:     Dashboard, Gestión, Auditoría, Perfil")
    
    print("\n📊 PLANNER (Gestión y análisis)")
    print("   Email:    planner@flota.com")
    print("   Password: planner123")
    print("   Menú:     Dashboard, Gestión, Auditoría, Perfil")
    
    print("\n🔧 TÉCNICO (Ejecución de trabajo)")
    print("   Email:    tecnico@flota.com")
    print("   Password: abc123")
    print("   Menú:     Mis Órdenes, Perfil")
    
    print("\n🚛 CHOFER (Solo inspecciones)")
    print("   Email:    chofer@flota.com")
    print("   Password: chofer123")
    print("   Menú:     Checklist, Perfil")
    
    print("\n" + "=" * 80)

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
