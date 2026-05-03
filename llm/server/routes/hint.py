from fastapi import APIRouter, Query, Depends
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI, APIStatusError, APIConnectionError, AuthenticationError, NotFoundError
import httpx
import json
import logging
import re

from auth import require_bearer_token

logger = logging.getLogger("uvicorn")


def _extract_api_error(e: Exception, model_name: str = "") -> str:
    """Extract a clean, user-friendly error message from API exceptions."""
    if isinstance(e, NotFoundError):
        return f"Model '{model_name}' was not found. Please check the model name and base URL."
    if isinstance(e, AuthenticationError):
        return "Invalid API key. Please check your key and try again."
    if isinstance(e, APIConnectionError):
        return "Could not connect to the API provider. Please check the base URL."
    if isinstance(e, APIStatusError):
        return f"API error (HTTP {e.status_code}): {e.message}" if hasattr(e, 'message') and len(e.message) < 200 else f"API returned an error (HTTP {e.status_code}). Please check your configuration."
    error_str = str(e)
    # If the error contains HTML (e.g. a 404 page), return a generic message
    if "<html" in error_str.lower() or "<body" in error_str.lower() or len(error_str) > 500:
        return f"The API provider returned an error. Please verify the model name '{model_name}' and base URL are correct."
    return error_str

from config import GROQ_HINT_MODEL, OLLAMA_BASE_URL, LONG_MESSAGE_THRESHOLD, MAX_HISTORY_MESSAGES, NODE_API_URL
from database import get_or_create_conversation, save_message, get_messages
from models import HintChatRequest, HintGenerateRequest, ValidateKeyRequest
from groq_client import get_groq_client
from prompts import (
    SYSTEM_PROMPT_TEMPLATE, SHORT_WRAPPER, LONG_WRAPPER,
    CLASSIFY_PROMPT, OFF_TOPIC_RESPONSE, HINT_WRAPPER,
)

router = APIRouter()


async def fetch_external_key(firebase_uid: str, key_id: int, auth_header: str) -> dict | None:
    """Fetch raw API key details from the Node API server."""
    try:
        headers = {"Authorization": auth_header}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{NODE_API_URL}/users/{firebase_uid}/api-keys/{key_id}/raw", headers=headers)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch external key {key_id}: {e}")
        return None


async def is_programming_related(message: str, history: list[dict], model: str) -> bool:
    """Ask the local LLM to classify whether the message is programming-related."""
    # Include last few messages for context so follow-ups are understood
    context = ""
    recent = [m for m in history if m["role"] in ("user", "assistant")][-4:]
    if recent:
        context = "Recent conversation:\n"
        for m in recent:
            context += f"{m['role']}: {m['content'][:150]}\n"
        context += "\n"

    prompt_text = CLASSIFY_PROMPT.format(message=message, context=context)
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json={
                "model": model,
                "messages": [{"role": "user", "content": prompt_text}],
                "stream": False,
                "options": {"temperature": 0.1, "num_predict": 10},
            })
            resp.raise_for_status()
            data = resp.json()
        answer = data["message"]["content"].strip().upper()
        result = answer.startswith("YES")
        logger.info(f"Classifier input: '{message}' | Raw answer: '{answer}' | Is on-topic: {result}")
        return result
    except Exception as e:
        # Classifier now returns false when an exception thrown
        logger.warning(f"Classifier failed: {e}")
        return False


async def is_programming_related_external(message: str, history: list[dict], base_url: str, api_key: str, model: str) -> bool:
    """Classify using an external OpenAI-compatible API."""
    context = ""
    recent = [m for m in history if m["role"] in ("user", "assistant")][-4:]
    if recent:
        context = "Recent conversation:\n"
        for m in recent:
            context += f"{m['role']}: {m['content'][:150]}\n"
        context += "\n"

    prompt_text = CLASSIFY_PROMPT.format(message=message, context=context)
    try:
        client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt_text}],
            temperature=0.1,
            max_tokens=128,
        )
        msg = resp.choices[0].message
        text = (msg.content or "").strip()
        if not text:
            extras = msg.model_dump() if hasattr(msg, "model_dump") else {}
            text = (extras.get("reasoning") or extras.get("reasoning_content") or "").strip()
        matches = re.findall(r"\b(YES|NO)\b", text.upper())
        result = bool(matches) and matches[-1] == "YES"
        logger.info(f"External classifier: '{message}' | answer: '{text[:200]}' | on-topic: {result}")
        return result
    except Exception as e:
        logger.warning(f"External classifier failed: {e}")
        return False


@router.post("/hint/chat")
async def hint_chat(
    request: HintChatRequest,
    auth_header: str = Depends(require_bearer_token),
):
    conversation_id = await get_or_create_conversation(
        request.firebase_uid, request.activity_id
    )

    # Load history early so classifier can use it for context
    history = await get_messages(conversation_id)

    # Save user message to DB
    await save_message(conversation_id, "user", request.message)

    # Determine if using external model
    use_external = False
    ext_key_data = None
    if request.external_key_id is not None:
        ext_key_data = await fetch_external_key(request.firebase_uid, request.external_key_id, auth_header)
        if ext_key_data:
            use_external = True
        else:
            async def error_stream():
                yield f"data: {json.dumps({'error': 'Could not retrieve API key. Please check your settings.'})}\n\n"
                yield "data: [DONE]\n\n"
            return StreamingResponse(error_stream(), media_type="text/event-stream")

    if use_external:
        chat_model = ext_key_data["model_name"]
        logger.info(f"Hint chat using external model: {chat_model} via {ext_key_data['base_url']}")
    else:
        chat_model = request.model or "qwen2.5-coder:7b"
        logger.info(f"Hint chat using local model: {chat_model}")

    # Classify: reject off-topic messages before generating
    if use_external:
        is_on_topic = await is_programming_related_external(
            request.message, history,
            ext_key_data["base_url"], ext_key_data["api_key"], chat_model,
        )
    else:
        is_on_topic = await is_programming_related(request.message, history, chat_model)

    if not is_on_topic:
        await save_message(conversation_id, "assistant", OFF_TOPIC_RESPONSE)

        async def off_topic_stream():
            yield f"data: {json.dumps({'token': OFF_TOPIC_RESPONSE})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(off_topic_stream(), media_type="text/event-stream")

    # Build system prompt
    activity_section = ""
    if request.activity_context:
        activity_section = f"\n\nHere is the current activity context:\n{request.activity_context}"
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(activity_context=activity_section)

    # Build messages array (only use recent history to keep context focused)
    recent_history = [m for m in history if m["role"] != "system"][-MAX_HISTORY_MESSAGES:]
    # Pick wrapper based on message length
    is_long = len(request.message) > LONG_MESSAGE_THRESHOLD
    wrapper = LONG_WRAPPER if is_long else SHORT_WRAPPER
    wrapped_message = wrapper.format(message=request.message)

    if use_external:
        # Some models don't support "system" role, so prepend instructions as a user message
        messages = [{"role": "user", "content": f"[Instructions]\n{system_prompt}\n[End Instructions]"},
                    {"role": "assistant", "content": "Understood. I will follow these instructions."}]
        for msg in recent_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": wrapped_message})
    else:
        messages = [{"role": "system", "content": system_prompt}]
        for msg in recent_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": wrapped_message})

    if use_external:
        # Stream via external OpenAI-compatible API
        async def stream_external():
            full_response = ""
            try:
                client = AsyncOpenAI(api_key=ext_key_data["api_key"], base_url=ext_key_data["base_url"])
                stream = await client.chat.completions.create(
                    model=chat_model,
                    messages=messages,
                    temperature=0.7,
                    stream=True,
                )
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        token = chunk.choices[0].delta.content
                        full_response += token
                        yield f"data: {json.dumps({'token': token})}\n\n"
            except Exception as e:
                logger.error(f"External API streaming error: {e}")
                error_msg = _extract_api_error(e, chat_model)
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
            finally:
                if full_response:
                    await save_message(conversation_id, "assistant", full_response)
                yield "data: [DONE]\n\n"

        return StreamingResponse(stream_external(), media_type="text/event-stream")
    else:
        # Stream via local Ollama
        ollama_payload = {
            "model": chat_model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": 0.7},
        }

        async def stream_response():
            full_response = ""
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/chat", json=ollama_payload) as resp:
                        async for line in resp.aiter_lines():
                            if line:
                                data = json.loads(line)
                                token = data.get("message", {}).get("content", "")
                                if token:
                                    full_response += token
                                    yield f"data: {json.dumps({'token': token})}\n\n"
            except Exception as e:
                logger.error(f"Ollama streaming error: {e}")
                yield f"data: {json.dumps({'error': 'Chat service unavailable'})}\n\n"
            finally:
                # Save the complete assistant response
                if full_response:
                    await save_message(conversation_id, "assistant", full_response)
                yield "data: [DONE]\n\n"

        return StreamingResponse(stream_response(), media_type="text/event-stream")


@router.post("/validate-key")
async def validate_key(
    request: ValidateKeyRequest,
    auth_header: str = Depends(require_bearer_token),
):
    """Validate an API key by making a minimal test call."""
    try:
        client = AsyncOpenAI(api_key=request.api_key, base_url=request.base_url)
        resp = await client.chat.completions.create(
            model=request.model_name,
            messages=[{"role": "user", "content": "Hi"}],
            max_tokens=5,
        )
        return {"valid": True}
    except Exception as e:
        logger.warning(f"Key validation failed: {e}")
        error_msg = _extract_api_error(e, request.model_name)
        return {"invalid": False, "error": error_msg}


@router.post("/hint/generate")
async def hint_generate(
    request: HintGenerateRequest,
    auth_header: str = Depends(require_bearer_token),
):
    """Generate a focused hint for a checkpoint challenge (non-streaming)."""
    prompt = HINT_WRAPPER.format(
        checkpoint_instruction=request.checkpoint_instruction,
        student_code=request.student_code,
        file_name=request.file_name,
    )

    try:
        client = get_groq_client()
        resp = await client.chat.completions.create(
            model=GROQ_HINT_MODEL,
            messages=[
                {"role": "system", "content": "You are a programming teaching assistant. Follow the instructions exactly."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=400,
            stream=False,
        )
        hint_text = resp.choices[0].message.content.strip()
        return {"hint": hint_text}
    except Exception as e:
        logger.error(f"Hint generation failed: {e}")
        return {"hint": "Hint service is currently unavailable. Please try again later."}


@router.get("/hint/history")
async def hint_history(
    firebase_uid: str = Query(...),
    activity_id: int = Query(...),
    auth_header: str = Depends(require_bearer_token),
):
    conversation_id = await get_or_create_conversation(firebase_uid, activity_id)
    messages = await get_messages(conversation_id)
    # Filter out system messages
    return [msg for msg in messages if msg["role"] != "system"]
