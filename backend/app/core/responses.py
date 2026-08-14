from typing import Any, Optional, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    meta: Optional[dict[str, Any]] = None

def success_response(data: Any, meta: Optional[dict[str, Any]] = None) -> APIResponse:
    return APIResponse(success=True, data=data, meta=meta)

def error_response(message: str) -> APIResponse:
    return APIResponse(success=False, error=message)
