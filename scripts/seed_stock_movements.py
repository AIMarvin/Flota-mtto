"""
Seed script to add sample stock movements for testing the dashboard cards.
This creates sample OUT movements for existing products.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.inventory import Product, StockMovement, MovementType
from app.models.user import User
import random

def seed_stock_movements():
    db = SessionLocal()
    
    try:
        # Get existing products
        products = db.query(Product).all()
        
        if not products:
            print("⚠️ No products found. Creating sample products first...")
            # Create sample products
            sample_products = [
                {"name": "Filtro de Aceite", "sku": "FLT-ACE-001", "category": "Filtros", "cost_price": 450.00, "current_stock": 50},
                {"name": "Filtro de Aire", "sku": "FLT-AIR-001", "category": "Filtros", "cost_price": 680.00, "current_stock": 35},
                {"name": "Balata Trasera", "sku": "FRN-BAL-002", "category": "Frenos", "cost_price": 1200.00, "current_stock": 20},
                {"name": "Amortiguador Cabina", "sku": "SUS-AMO-001", "category": "Suspensión", "cost_price": 8500.00, "current_stock": 8},
                {"name": "Clutch Completo", "sku": "TRN-CLU-001", "category": "Transmisión", "cost_price": 15000.00, "current_stock": 5},
                {"name": "Radiador Principal", "sku": "ENF-RAD-001", "category": "Enfriamiento", "cost_price": 12000.00, "current_stock": 4},
                {"name": "Alternador Reconstruido", "sku": "ELE-ALT-001", "category": "Eléctrico", "cost_price": 7500.00, "current_stock": 6},
                {"name": "Bomba de Agua", "sku": "ENF-BOM-001", "category": "Enfriamiento", "cost_price": 3500.00, "current_stock": 12},
                {"name": "Aceite Motor 15W40 (Cubeta)", "sku": "LUB-ACE-001", "category": "Lubricantes", "cost_price": 2800.00, "current_stock": 25},
                {"name": "Llanta 295/80R22.5", "sku": "LLA-295-001", "category": "Llantas", "cost_price": 9500.00, "current_stock": 16},
            ]
            
            for p in sample_products:
                prod = Product(
                    name=p["name"],
                    sku=p["sku"],
                    category=p["category"],
                    cost_price=p["cost_price"],
                    current_stock=p["current_stock"],
                    min_stock_level=5
                )
                db.add(prod)
            db.commit()
            products = db.query(Product).all()
            print(f"✅ Created {len(products)} sample products.")
        
        # Get a user for reference
        user = db.query(User).first()
        user_id = user.id if user else None
        
        # Create sample OUT movements (consumption)
        movements_created = 0
        for product in products:
            # Create 2-10 random consumption movements per product
            num_movements = random.randint(2, 10)
            for _ in range(num_movements):
                qty = random.randint(1, 5)
                if product.current_stock >= qty:
                    mov = StockMovement(
                        product_id=product.id,
                        user_id=user_id,
                        change_amount=-qty,  # Negative for OUT
                        movement_type=MovementType.OUT,
                        reason=random.choice([
                            "Orden de trabajo #" + str(random.randint(1, 100)),
                            "Mantenimiento preventivo",
                            "Reparación urgente",
                            "Cambio programado"
                        ])
                    )
                    db.add(mov)
                    product.current_stock -= qty
                    movements_created += 1
        
        db.commit()
        print(f"✅ Created {movements_created} sample stock movements (consumption).")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_stock_movements()
