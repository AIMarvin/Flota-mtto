from app.core.config import settings

def _auth_header(client):
    client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "admin-units@test.com",
            "password": "pass",
            "full_name": "Admin Units",
            "role": "ADMIN",
        },
    )
    login = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={"username": "admin-units@test.com", "password": "pass"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_get_unit(client):
    headers = _auth_header(client)
    # Create
    response = client.post(
        f"{settings.API_V1_STR}/units/",
        json={
            "eco_number": "ECO-999",
            "model": "Test Bus",
            "vin": "VIN123456789",
            "status": "OPERATIVA"
        },
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    unit_id = data["id"]
    
    # Get
    response = client.get(f"{settings.API_V1_STR}/units/{unit_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["eco_number"] == "ECO-999"

def test_create_duplicate_unit(client):
    headers = _auth_header(client)
    unit_data = {
        "eco_number": "ECO-DUP",
        "model": "Test Bus",
        "vin": "VIN_DUP",
        "status": "OPERATIVA"
    }
    client.post(f"{settings.API_V1_STR}/units/", json=unit_data, headers=headers)
    
    # Duplicate
    response = client.post(f"{settings.API_V1_STR}/units/", json=unit_data, headers=headers)
    assert response.status_code == 400
