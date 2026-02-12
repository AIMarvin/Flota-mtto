from app.core.config import settings
import pytest

@pytest.fixture
def auth_header(client):
    # Register and Login
    # Note: DB is cleared per test function in conftest, so we need to recreate user.
    # However, create_duplicate_unit in test_units used separate calls, but db fixture scope is function.
    # So db is fresh.
    client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "planner@test.com",
            "password": "pass",
            "full_name": "Planner",
            "role": "ADMIN"
        }
    )
    login = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "planner@test.com", "password": "pass"}
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_order(client, auth_header):
    # Setup Unit
    response = client.post(
        f"{settings.API_V1_STR}/units/",
        json={"eco_number": "ECO-ORD", "model": "Bus", "vin": "111", "status": "OPERATIVA"},
        headers=auth_header
    )
    assert response.status_code == 201, str(response.json())
    u = response.json()

    # Create Order
    response = client.post(
        f"{settings.API_V1_STR}/orders/",
        json={
            "unit_id": u["id"],
            "description": "Falla de frenos",
            "priority": "HIGH"
            # technician_id is optional
        },
        headers=auth_header
    )
    assert response.status_code == 201
    data = response.json()
    assert data["description"] == "Falla de frenos"
    assert data["status"] == "PRE_ORDER"
