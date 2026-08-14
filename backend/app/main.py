from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import health, auth
from app.api.sprint2 import router as sprint2_router
from app.core.exceptions import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler
)
from app.core.logging import logger

app = FastAPI(
    title="Vivexa AI Decision Intelligence Platform API",
    description="Enterprise API for data analytics, machine learning, and decision intelligence.",
    version="1.0.0"
)

# Exception handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(sprint2_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up Vivexa API")

@app.get("/")
def root():
    return {"message": "Welcome to Vivexa API"}
