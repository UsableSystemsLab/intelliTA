from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Union
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import MetaData, Table, Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, text
import httpx
import json
import os
import asyncio
import logging

logger = logging.getLogger("uvicorn")

app = FastAPI(title="LLM Server", version="1.0.0")

# ── Database Setup ──────────────────────────────────────────────────────────────

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "changeme")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres16")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "mydb")

DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_async_engine(DATABASE_URL, pool_size=5, max_overflow=10)

metadata = MetaData()

conversations = Table(
    "conversations", metadata,
    Column("conversation_id", Integer, primary_key=True),
    Column("firebase_uid", String(128), nullable=False),
    Column("activity_id", Integer, nullable=False),
    Column("created_at", DateTime, server_default=text("NOW()")),
    Column("updated_at", DateTime, server_default=text("NOW()")),
    UniqueConstraint("firebase_uid", "activity_id"),
)

chat_messages = Table(
    "chat_messages", metadata,
    Column("message_id", Integer, primary_key=True),
    Column("conversation_id", Integer, ForeignKey("conversations.conversation_id", ondelete="CASCADE"), nullable=False),
    Column("role", String(10), nullable=False),
    Column("content", Text, nullable=False),
    Column("created_at", DateTime, server_default=text("NOW()")),
)

# Used to get check if there is a conversation or not, if not create new one
async def get_or_create_conversation(firebase_uid: str, activity_id: int) -> int:
    async with engine.begin() as conn:
        result = await conn.execute(
            conversations.select().where(
                (conversations.c.firebase_uid == firebase_uid) &
                (conversations.c.activity_id == activity_id)
            )
        )
        row = result.first()
        if row:
            return row.conversation_id
        result = await conn.execute(
            conversations.insert()
            .values(firebase_uid=firebase_uid, activity_id=activity_id)
            .returning(conversations.c.conversation_id)
        )
        return result.scalar_one()

# Inserts a new message
async def save_message(conversation_id: int, role: str, content: str):
    async with engine.begin() as conn:
        await conn.execute(
            chat_messages.insert().values(
                conversation_id=conversation_id, role=role, content=content,
            )
        )
        await conn.execute(
            conversations.update()
            .where(conversations.c.conversation_id == conversation_id)
            .values(updated_at=text("NOW()"))
        )


async def get_messages(conversation_id: int) -> list[dict]:
    async with engine.connect() as conn:
        result = await conn.execute(
            chat_messages.select()
            .where(chat_messages.c.conversation_id == conversation_id)
            .order_by(chat_messages.c.created_at.asc())
        )
        return [
            {
                "role": row.role,
                "content": row.content,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in result.fetchall()
        ]

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
HINT_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")


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


SYSTEM_PROMPT_TEMPLATE = """You are IntelliTA, a helpful teaching assistant for a programming course. \
Your role is to guide students through coding activities by providing hints, explanations, and encouragement. \
Do NOT give away full solutions directly — instead, help students think through the problem step by step.

CRITICAL: You MUST keep responses very short (1-2 sentences only). No bullet points, no lists, no detailed explanations. Just one brief hint or question to guide the student.

{activity_context}"""


class HintChatRequest(BaseModel):
    firebase_uid: str
    activity_id: int
    message: str
    activity_context: Optional[str] = None


@app.post("/hint/chat")
async def hint_chat(request: HintChatRequest):
    conversation_id = await get_or_create_conversation(
        request.firebase_uid, request.activity_id
    )

    # Load previous messages from DB
    history = await get_messages(conversation_id)

    # Build system prompt
    activity_section = ""
    if request.activity_context:
        activity_section = f"\n\nHere is the current activity context:\n{request.activity_context}"
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(activity_context=activity_section)

    # Build messages array for Ollama
    ollama_messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        if msg["role"] != "system":
            ollama_messages.append({"role": msg["role"], "content": msg["content"]})
    ollama_messages.append({"role": "user", "content": request.message})

    # Save user message to DB
    await save_message(conversation_id, "user", request.message)

    payload = {
        "model": HINT_MODEL,
        "messages": ollama_messages,
        "stream": True,
        "options": {"temperature": 0.7},
    }
    # Stream the response, not sending it as a whole responese
    async def stream_response():
        full_response = ""
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream(
                    "POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload
                ) as response:
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            token = data.get("message", {}).get("content", "")
                            if token:
                                full_response += token
                                yield f"data: {json.dumps({'token': token})}\n\n"
                            if data.get("done"):
                                break
                        except json.JSONDecodeError:
                            continue
        except httpx.ConnectError:
            yield f"data: {json.dumps({'error': 'Ollama service unavailable'})}\n\n"
        finally:
            # Save the complete assistant response
            if full_response:
                await save_message(conversation_id, "assistant", full_response)
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


@app.get("/hint/history")
async def hint_history(
    firebase_uid: str = Query(...),
    activity_id: int = Query(...),
):
    conversation_id = await get_or_create_conversation(firebase_uid, activity_id)
    messages = await get_messages(conversation_id)
    # Filter out system messages
    return [msg for msg in messages if msg["role"] != "system"]


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("LLM_SERVER_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)