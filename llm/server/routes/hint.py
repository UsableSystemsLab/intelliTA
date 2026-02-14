from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import json
import logging

logger = logging.getLogger("uvicorn")

from config import GROQ_HINT_MODEL, LONG_MESSAGE_THRESHOLD, MAX_HISTORY_MESSAGES
from database import get_or_create_conversation, save_message, get_messages
from models import HintChatRequest, HintGenerateRequest
from groq_client import get_groq_client
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

    prompt_text = CLASSIFY_PROMPT.format(message=message, context=context)
    try:
        client = get_groq_client()
        resp = await client.chat.completions.create(
            model=GROQ_HINT_MODEL,
            messages=[{"role": "user", "content": prompt_text}],
            temperature=0.1,
            max_tokens=100,
            stream=False,
        )
        answer = resp.choices[0].message.content.strip().upper()
        result = answer.startswith("YES")
        logger.info(f"Classifier input: '{message}' | Raw answer: '{answer}' | Is on-topic: {result}")
        return result
    except Exception as e:
        # Classifier now returns false when an exception thrown
        logger.warning(f"Classifier failed: {e}")
        return False


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

    # Build messages array (only use recent history to keep context focused)
    messages = [{"role": "system", "content": system_prompt}]
    recent_history = [m for m in history if m["role"] != "system"][-MAX_HISTORY_MESSAGES:]
    for msg in recent_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    # Pick wrapper based on message length
    is_long = len(request.message) > LONG_MESSAGE_THRESHOLD
    wrapper = LONG_WRAPPER if is_long else SHORT_WRAPPER
    wrapped_message = wrapper.format(message=request.message)
    messages.append({"role": "user", "content": wrapped_message})

    chat_model = request.model or GROQ_HINT_MODEL
    logger.info(f"Hint chat using model: {chat_model}")

    async def stream_response():
        full_response = ""
        try:
            client = get_groq_client()
            stream = await client.chat.completions.create(
                model=chat_model,
                messages=messages,
                temperature=0.7,
                stream=True,
            )
            async for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    full_response += token
                    yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            logger.error(f"Groq streaming error: {e}")
            yield f"data: {json.dumps({'error': 'Hint service unavailable'})}\n\n"
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

    try:
        client = get_groq_client()
        resp = await client.chat.completions.create(
            model=GROQ_HINT_MODEL,
            messages=[
                {"role": "system", "content": "You are a programming teaching assistant. Follow the instructions exactly."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=300,
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
):
    conversation_id = await get_or_create_conversation(firebase_uid, activity_id)
    messages = await get_messages(conversation_id)
    # Filter out system messages
    return [msg for msg in messages if msg["role"] != "system"]
