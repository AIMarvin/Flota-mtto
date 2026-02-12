from app.core.config import settings

def test_read_root(client):
    response = client.get("/")
    # Redirect check
    assert response.status_code == 200
    assert "/static/index.html" in str(response.url)

def test_health_check(client):
    # Depending on if we have a health check endpoint
    # Usually /api/v1/dashboard/kpis is accessible but protected?
    pass
