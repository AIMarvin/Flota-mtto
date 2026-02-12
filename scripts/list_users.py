"""
List all users in the database
"""
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models import User

db = SessionLocal()

try:
    users = db.query(User).all()
    
    print("=" * 60)
    print("👥 USUARIOS REGISTRADOS EN EL SISTEMA")
    print("=" * 60)
    
    if not users:
        print("\n❌ No hay usuarios registrados")
        print("\nEjecuta: python create_test_data.py")
    else:
        for user in users:
            print(f"\n📧 Email: {user.email}")
            print(f"   Nombre: {user.full_name}")
            print(f"   Rol: {user.role}")
            print(f"   ID: {user.id}")
            print("-" * 60)
        
        print(f"\nTotal de usuarios: {len(users)}")
    
    print("\n" + "=" * 60)

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
