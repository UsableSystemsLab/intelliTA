from fastapi import APIRouter, HTTPException
import httpx

from config import OLLAMA_BASE_URL

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.get("/ollama/status")
async def ollama_status():
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            return {"status": "connected", "ollama_url": OLLAMA_BASE_URL}
        except httpx.ConnectError:
            return {"status": "disconnected", "ollama_url": OLLAMA_BASE_URL, "error": "Cannot connect to Ollama"}
        except httpx.HTTPError as e:
            return {"status": "error", "ollama_url": OLLAMA_BASE_URL, "error": str(e)}


@router.get("/models")
async def list_models():
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            return response.json()
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Ollama service unavailable - cannot connect")
        except httpx.HTTPError as e:
            raise HTTPException(status_code=503, detail=f"Ollama service error: {str(e)}")
