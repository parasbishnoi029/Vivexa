from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    """
    Creates and returns a Supabase client using the URL and Key from settings.
    This client is intended for verifying tokens and backend-driven ops.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
