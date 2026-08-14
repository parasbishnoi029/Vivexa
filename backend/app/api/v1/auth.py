from fastapi import APIRouter, Depends
from app.api.deps import get_current_user, get_current_admin_user, User

router = APIRouter(tags=["Auth"])

@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the current authenticated user's profile.
    """
    return current_user

@router.get("/admin-only")
async def admin_only_route(current_user: User = Depends(get_current_admin_user)):
    """
    Returns a success message if the user is an admin.
    """
    return {"message": f"Welcome Admin {current_user.email}"}
