from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
from app.core.responses import success_response

router = APIRouter()

# DTOs
class WorkspaceCreate(BaseModel):
    name: str
    is_personal: bool = False

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    business_goal: Optional[str] = None
    color: Optional[str] = "indigo"
    icon: Optional[str] = "folder"
    tags: Optional[List[str]] = []

class ProjectResponse(ProjectCreate):
    id: int
    workspace_id: int
    owner_id: str
    status: str
    is_favorite: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime

class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

# Mock dependency
def get_current_user():
    return {"id": "user123", "role": "admin"}

@router.post("/workspaces/", tags=["Workspaces"])
async def create_workspace(workspace: WorkspaceCreate, current_user: dict = Depends(get_current_user)):
    data = {"id": 1, **workspace.dict(), "created_at": datetime.now()}
    return success_response(data)

@router.get("/workspaces/", tags=["Workspaces"])
async def list_workspaces(
    q: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    data = [{"id": 1, "name": "Personal Workspace", "is_personal": True}]
    return success_response(data, meta={"page": page, "limit": limit, "total": 1})

@router.post("/workspaces/{workspace_id}/projects/", tags=["Projects"])
async def create_project(workspace_id: int, project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    data = {
        "id": 1,
        "workspace_id": workspace_id,
        "owner_id": current_user["id"],
        "status": "active",
        "is_favorite": False,
        "is_archived": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        **project.dict()
    }
    return success_response(data)

@router.get("/workspaces/{workspace_id}/projects/", tags=["Projects"])
async def list_projects(
    workspace_id: int, 
    q: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    return success_response([], meta={"page": page, "limit": limit, "total": 0})

@router.get("/notifications/", tags=["Notifications"])
async def list_notifications(
    page: int = 1, limit: int = 10, current_user: dict = Depends(get_current_user)
):
    return success_response([], meta={"page": page, "limit": limit, "total": 0})

@router.post("/notifications/{notification_id}/read", tags=["Notifications"])
async def mark_notification_read(notification_id: int, current_user: dict = Depends(get_current_user)):
    return success_response({"success": True})

@router.get("/activity/", tags=["Activity"])
async def list_activity(
    q: Optional[str] = None, page: int = 1, limit: int = 10, current_user: dict = Depends(get_current_user)
):
    return success_response([], meta={"page": page, "limit": limit, "total": 0})

@router.get("/admin/users/", tags=["Admin"])
async def list_all_users(
    q: Optional[str] = None,
    role: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    mock_users = [
        {"id": 1, "name": "Alex Davies", "email": "alex@example.com", "role": "Admin", "plan": "Enterprise", "projects": 12, "storage": "4.2 GB", "lastLogin": "Today", "status": "Active", "avatar": "AD"},
        {"id": 2, "name": "Sarah Connor", "email": "sarah@example.com", "role": "User", "plan": "Pro", "projects": 4, "storage": "1.1 GB", "lastLogin": "Yesterday", "status": "Active", "avatar": "SC"},
    ]
    return success_response(mock_users, meta={"page": page, "limit": limit, "total": 2})

@router.get("/admin/plans/", tags=["Admin"])
async def list_plans(current_user: dict = Depends(get_current_user)):
    mock_plans = [
        {"id": 1, "name": "Free", "price": "$0", "billing": "forever", "users": 1, "storage": "1 GB", "projects": 3, "features": ["Basic Analytics", "Community Support"], "color": "slate"},
        {"id": 2, "name": "Pro", "price": "$29", "billing": "per user/month", "users": "1-5", "storage": "10 GB", "projects": "Unlimited", "features": ["Advanced Analytics", "Priority Support"], "color": "indigo"},
    ]
    return success_response(mock_plans)

@router.get("/admin/features/", tags=["Admin"])
async def list_feature_flags(current_user: dict = Depends(get_current_user)):
    mock_flags = [
        {"id": "ff_analytics", "name": "Analytics Dashboard", "description": "Enable advanced data visualization", "status": "enabled", "rollout": "100%", "environment": "Production"}
    ]
    return success_response(mock_flags)

@router.get("/admin/audit-logs/", tags=["Admin"])
async def list_audit_logs(
    q: Optional[str] = None, page: int = 1, limit: int = 10, current_user: dict = Depends(get_current_user)
):
    logs = [
        {"id": 101, "timestamp": "2026-08-08 14:23:45", "user": "Alex Davies", "email": "alex@example.com", "action": "User Login", "resource": "System", "ip": "192.168.1.101", "color": "emerald"}
    ]
    return success_response(logs, meta={"page": page, "limit": limit, "total": 1})

@router.get("/admin/stats/", tags=["Admin"])
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    data = {
        "total_users": 12450,
        "active_users": 8231,
        "total_projects": 45210,
        "total_storage_tb": 48.2
    }
    return success_response(data)
