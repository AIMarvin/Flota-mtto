from app.core.config import settings

def test_register_user(client):
    response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "newtest@flota.com",
            "password": "securepassword",
            "full_name": "New Test User",
            "role": "ADMIN"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newtest@flota.com"
    assert "id" in data
    assert "hashed_password" not in data  # Security check

def test_login_user(client):
    # 1. Register
    reg_response = client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "login@flota.com",
            "password": "loginpass",
            "full_name": "Login User",
            "role": "ADMIN"
        }
    )
    assert reg_response.status_code == 201

    # 2. Login
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": "login@flota.com",
            "password": "loginpass"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_user(client):
    response = client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": "nonexistent@flota.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
