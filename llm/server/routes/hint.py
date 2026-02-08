from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import httpx
import json
import logging

logger = logging.getLogger("uvicorn")

from config import OLLAMA_BASE_URL, HINT_MODEL, LONG_MESSAGE_THRESHOLD, MAX_HISTORY_MESSAGES
from database import get_or_create_conversation, save_message, get_messages
from models import HintChatRequest, HintGenerateRequest
from prompts import (
    SYSTEM_PROMPT_TEMPLATE, SHORT_WRAPPER, LONG_WRAPPER,
    CLASSIFY_PROMPT, OFF_TOPIC_RESPONSE, HINT_WRAPPER,
)

router = APIRouter()


async def is_programming_related(message: str, history: list[dict]) -> bool:
    """Ask the LLM to classify whether the message is programming-related."""
    # Include last few messages for context so follow-ups are understood
    context = ""
    recent = [m for m in history if m["role"] in ("user", "assistant")][-4:]
    if recent:
        context = "Recent conversation:\n"
        for m in recent:
            context += f"{m['role']}: {m['content'][:150]}\n"
        context += "\n"

    payload = {
        "model": HINT_MODEL,
        "prompt": CLASSIFY_PROMPT.format(message=message, context=context),
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 100},
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            answer = resp.json().get("response", "").strip().upper()
            result = answer.startswith("YES")
            logger.info(f"Classifier input: '{message}' | Raw answer: '{answer}' | Is on-topic: {result}")
            return result
    except Exception as e:
        # If classification fails, allow the message through
        logger.warning(f"Classifier failed: {e}")
        return True


@router.post("/hint/chat")
async def hint_chat(request: HintChatRequest):
    conversation_id = await get_or_create_conversation(
        request.firebase_uid, request.activity_id
    )

    # Load history early so classifier can use it for context
    history = await get_messages(conversation_id)

    # Save user message to DB
    await save_message(conversation_id, "user", request.message)

    # Classify: reject off-topic messages before generating
    # Always run the classifier — no shortcuts based on message length
    # Old code was skipping classifier if the message length was < 10. Now it checks every message
    is_on_topic = await is_programming_related(request.message, history)
    if not is_on_topic:
        # Save the canned refusal and return immediately
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

    # Build messages array for Ollama (only use recent history to keep context focused)
    ollama_messages = [{"role": "system", "content": system_prompt}]
    recent_history = [m for m in history if m["role"] != "system"][-MAX_HISTORY_MESSAGES:]
    for msg in recent_history:
        ollama_messages.append({"role": msg["role"], "content": msg["content"]})
    # Pick wrapper based on message length
    is_long = len(request.message) > LONG_MESSAGE_THRESHOLD
    wrapper = LONG_WRAPPER if is_long else SHORT_WRAPPER
    wrapped_message = wrapper.format(message=request.message)
    ollama_messages.append({"role": "user", "content": wrapped_message})

    payload = {
        "model": HINT_MODEL,
        "messages": ollama_messages,
        "stream": True,
        "options": {"temperature": 0.7},
    }

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


@router.post("/hint/generate")
async def hint_generate(request: HintGenerateRequest):
    """Generate a focused hint for a checkpoint challenge (non-streaming)."""
    prompt = HINT_WRAPPER.format(
        checkpoint_instruction=request.checkpoint_instruction,
        student_code=request.student_code,
        file_name=request.file_name,
    )

    payload = {
        "model": HINT_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 300},
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            hint_text = resp.json().get("response", "").strip()
            return {"hint": hint_text}
    except httpx.ConnectError:
        return {"hint": "Hint service is currently unavailable. Please try again later."}
    except Exception as e:
        logger.error(f"Hint generation failed: {e}")
        return {"hint": "Failed to generate hint. Please try again."}


@router.get("/hint/history")
async def hint_history(
    firebase_uid: str = Query(...),
    activity_id: int = Query(...),
):
    conversation_id = await get_or_create_conversation(firebase_uid, activity_id)
    messages = await get_messages(conversation_id)
    # Filter out system messages
    return [msg for msg in messages if msg["role"] != "system"]
