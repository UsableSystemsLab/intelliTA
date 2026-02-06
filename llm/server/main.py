from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Union
import httpx
import os

app = FastAPI(title="LLM Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "ollama")
OLLAMA_PORT = os.getenv("OLLAMA_PORT", "11434")
OLLAMA_BASE_URL = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}"


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    stream: Optional[bool] = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None


class GenerateRequest(BaseModel):
    model: str
    prompt: str
    stream: Optional[bool] = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None


class ChatResponse(BaseModel):
    model: str
    message: ChatMessage
    done: bool


class GenerateResponse(BaseModel):
    model: str
    response: str
    done: bool


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/ollama/status")
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


@app.get("/models")
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


@app.post("/chat", response_model=None)
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


@app.post("/generate", response_model=None)
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


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("LLM_SERVER_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
