from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Union
import httpx

from config import OLLAMA_BASE_URL
from models import ChatRequest, ChatResponse, ChatMessage, GenerateRequest, GenerateResponse

router = APIRouter()


@router.post("/chat", response_model=None)
async def chat(request: ChatRequest) -> Union[ChatResponse, StreamingResponse]:
    payload = {
        "model": request.model,
        "messages": [msg.model_dump() for msg in request.messages],
        "stream": request.stream,
        "options": {
            "temperature": request.temperature,
        }
    }
    if request.max_tokens:
        payload["options"]["num_predict"] = request.max_tokens

    if request.stream:
        async def stream_response():
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload) as response:
                    async for line in response.aiter_lines():
                        if line:
                            yield f"data: {line}\n\n"

        return StreamingResponse(stream_response(), media_type="text/event-stream")
    else:
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
                response.raise_for_status()
                data = response.json()
                return ChatResponse(
                    model=data["model"],
                    message=ChatMessage(
                        role=data["message"]["role"],
                        content=data["message"]["content"]
                    ),
                    done=data["done"]
                )
            except httpx.ConnectError:
                raise HTTPException(status_code=503, detail="Ollama service unavailable - cannot connect")
            except httpx.HTTPError as e:
                raise HTTPException(status_code=503, detail=f"Ollama service error: {str(e)}")


@router.post("/generate", response_model=None)
async def generate(request: GenerateRequest) -> Union[GenerateResponse, StreamingResponse]:
    payload = {
        "model": request.model,
        "prompt": request.prompt,
        "stream": request.stream,
        "options": {
            "temperature": request.temperature,
        }
    }
    if request.max_tokens:
        payload["options"]["num_predict"] = request.max_tokens

    if request.stream:
        async def stream_response():
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/generate", json=payload) as response:
                    async for line in response.aiter_lines():
                        if line:
                            yield f"data: {line}\n\n"

        return StreamingResponse(stream_response(), media_type="text/event-stream")
    else:
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                response = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
                response.raise_for_status()
                data = response.json()
                return GenerateResponse(
                    model=data["model"],
                    response=data["response"],
                    done=data["done"]
                )
            except httpx.ConnectError:
                raise HTTPException(status_code=503, detail="Ollama service unavailable - cannot connect")
            except httpx.HTTPError as e:
                raise HTTPException(status_code=503, detail=f"Ollama service error: {str(e)}")
