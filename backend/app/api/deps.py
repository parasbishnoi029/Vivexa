from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from sqlalchemy.orm import Session
from app.core.supabase import get_supabase_client
from app.database.session import get_db
from app.models.user import User as DBUser
from pydantic import BaseModel

security = HTTPBearer()

class User(BaseModel):
    id: str
    email: str
    role: str = "user"

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase_client),
    db: Session = Depends(get_db)
) -> User:
    """
    Verify the Supabase JWT using the Supabase client.
    Supabase's get_user() will automatically decode and verify the token.
    """
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_data = response.user
        
        # Fetch additional user roles from the users table in our database
        db_user = db.query(DBUser).filter(DBUser.id == user_data.id).first()
        role = db_user.role if db_user else "user"
        
        return User(id=user_data.id, email=user_data.email, role=role)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Require admin role.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user
