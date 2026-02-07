from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import asyncio
import os
import logging
from config import OLLAMA_BASE_URL, HINT_MODEL
from routes import health, chat, hint

logger = logging.getLogger("uvicorn")

app = FastAPI(title="LLM Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(hint.router)


# Warmup: pre-load the model into memory on startup
@app.on_event("startup")
async def warmup_ollama():
    async def _warmup():
        logger.info(f"Warming up Ollama model: {HINT_MODEL}")
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                # Send a tiny generate request to force model loading
                await client.post(f"{OLLAMA_BASE_URL}/api/generate", json={
                    "model": HINT_MODEL,
                    "prompt": "hi",
                    "options": {"num_predict": 1},
                })
                logger.info("Ollama model warmup complete")
            except Exception as e:
                logger.warning(f"Ollama warmup failed (model will load on first request): {e}")
    # Run in background so it doesn't block server startup
    asyncio.create_task(_warmup())


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("LLM_SERVER_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)