from groq import AsyncGroq
from config import GROQ_API_KEY

_client = AsyncGroq(api_key=GROQ_API_KEY)


def get_groq_client() -> AsyncGroq:
    return _client
