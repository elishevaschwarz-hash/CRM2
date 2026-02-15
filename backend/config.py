import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env from the backend directory (if it exists locally)
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

# Get environment variables with defaults
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://placeholder.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "placeholder")

# Supabase client singleton
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
