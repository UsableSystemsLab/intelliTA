import os

# - Postgres 
POSTGRES_USER = os.environ["POSTGRES_USER"]
POSTGRES_PASSWORD = os.environ["POSTGRES_PASSWORD"]
POSTGRES_HOST = os.environ["POSTGRES_HOST"]
POSTGRES_PORT = os.environ["POSTGRES_PORT"]
POSTGRES_DB = os.environ["POSTGRES_DB"]

DATABASE_URL = (
    f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

# - Ollama 
OLLAMA_HOST = os.environ["OLLAMA_HOST"]
OLLAMA_PORT = os.environ["OLLAMA_PORT"]
OLLAMA_BASE_URL = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}"
HINT_MODEL = os.environ["OLLAMA_MODEL"]

# - Thresholds
LONG_MESSAGE_THRESHOLD = 200
MAX_HISTORY_MESSAGES = 10  # Only send the last N messages to the LLM to keep context focused