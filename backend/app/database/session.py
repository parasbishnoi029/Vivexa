from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# This will fail if DATABASE_URL is not set, so you can mock it for now if needed.
# For example, using a placeholder string for testing.
engine = create_engine(settings.DATABASE_URL or "sqlite:///./test.db")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
