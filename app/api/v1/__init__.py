from fastapi import APIRouter
from app.api.v1 import auth, units, checklists, orders, dashboard, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(units.router, prefix="/units", tags=["units"])
api_router.include_router(checklists.router, prefix="/checklists", tags=["checklists"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(users.router, prefix="/users", tags=["users"])

from app.api.v1 import inventory, external_data
api_router.include_router(inventory.router, tags=["inventory"])
api_router.include_router(external_data.router, prefix="/external", tags=["external"])

