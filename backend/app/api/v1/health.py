from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])

class HealthResponse(BaseModel):
    status: str
    message: str
    version: str

@router.get("/health", response_model=HealthResponse)
async def check_health():
    """
    Health check endpoint for the Vivexa API.
    """
    return HealthResponse(
        status="success",
        message="Vivexa API is running optimally.",
        version="1.0.0"
    )
