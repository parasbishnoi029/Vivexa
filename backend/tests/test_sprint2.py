import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Vivexa API is running"}

def test_list_workspaces():
    response = client.get("/api/v1/workspaces/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert isinstance(data["data"], list)
    assert data["meta"]["total"] == 1

def test_list_admin_plans():
    response = client.get("/api/v1/admin/plans/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 2

def test_list_admin_users():
    response = client.get("/api/v1/admin/users/?q=alex&role=Admin")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
    assert data["meta"]["total"] == 2

