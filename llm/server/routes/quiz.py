import asyncio
import json
import logging
import httpx
from fastapi import APIRouter, Depends

from auth import require_bearer_token
from config import GROQ_HINT_MODEL, NODE_API_URL
from groq_client import get_groq_client
from models import QuizSuggestRequest

logger = logging.getLogger("uvicorn")

router = APIRouter()

DEFAULT_BUCKET_MINUTES = 5
MIN_BUCKET_MINUTES = 1

_SYSTEM_PROMPT = (
    "You are an expert educational quiz generator. "
    "You create clear, accurate quiz questions based on video transcripts. "
    "Always return valid JSON only — no markdown fences, no extra text."
)


_QUESTION_TYPES = ["mcq", "true_false", "fill_blank"]


def _build_chunk_prompt(text: str, start_s: int, end_s: int, bucket_index: int = 0) -> str:
    forced_type = _QUESTION_TYPES[bucket_index % len(_QUESTION_TYPES)]

    return f"""Generate exactly 1 quiz question based on the transcript segment below.
This segment covers {start_s}s–{end_s}s of the video.

Requirements:
- Set `time` to an integer (seconds) between {start_s} and {end_s} that best matches where the topic appears
- The question type MUST be "{forced_type}" — do not use any other type
- mcq: 3-4 distinct options, correctAnswer = 0-based index (integer)
- true_false: correctAnswer = boolean (true or false)
- fill_blank: correctAnswer = a single word (no spaces, no punctuation)
- Base the answer strictly on the transcript content
- Use Markdown formatting in the question text (e.g. **bold**, `code`, lists, etc.) when it improves clarity
- MCQ options may also use inline Markdown like `code` or **bold** where appropriate

Return ONLY this JSON object, nothing else:
{{
  "quizzes": [
    {{
      "time": <integer seconds>,
      "type": "mcq" | "true_false" | "fill_blank",
      "question": "<question text>",
      "options": ["option A", "option B", "option C"],
      "correctAnswer": <integer | boolean | "string">
    }}
  ]
}}

Transcript segment:
{text[:4000]}"""


async def _generate_chunk(groq_client, text: str, start_s: int, end_s: int, bucket_index: int = 0) -> list:
    if not text.strip():
        return []
    try:
        resp = await groq_client.chat.completions.create(
            model=GROQ_HINT_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": _build_chunk_prompt(text, start_s, end_s, bucket_index)},
            ],
            temperature=0.7,
            max_tokens=1000,
            response_format={"type": "json_object"},
            stream=False,
        )
        result = json.loads(resp.choices[0].message.content.strip())
        return result.get("quizzes", [])
    except Exception as e:
        logger.error(f"Chunk {start_s}–{end_s}s failed: {e}")
        return []


def _segments_to_text(segments: list, start_s: int, end_s: int) -> str:
    bucket = [s for s in segments if start_s <= s.get("start", 0) < end_s]
    return " ".join(s.get("text", "") for s in bucket)


def _slice_text_proportional(full_text: str, start_s: int, end_s: int, total_s: int) -> str:
    """Fallback when no segment timestamps are available."""
    chars = len(full_text)
    s = int(start_s / max(total_s, 1) * chars)
    e = int(end_s   / max(total_s, 1) * chars)
    return full_text[s:e]


@router.post("/quiz/suggest")
async def suggest_quiz_questions(
    request: QuizSuggestRequest,
    auth_header: str = Depends(require_bearer_token),
):
    forward_headers = {"Authorization": auth_header}
# Fetch transcript meta data
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            meta_resp = await client.get(
                f"{NODE_API_URL}/transcripts/activities/{request.activity_id}",
                headers=forward_headers,
            )
    except Exception as e:
        logger.error(f"Failed to reach Node API: {e}")
        return {"error": "node_unreachable", "message": "Could not reach the API server."}

    if meta_resp.status_code == 404:
        return {
            "error": "no_transcript",
            "message": "No transcript found for this activity. Make sure the video has been processed.",
        }
    if meta_resp.status_code != 200:
        return {"error": "fetch_failed", "message": "Failed to fetch transcript metadata."}

    meta = meta_resp.json()

    if meta.get("status") != "completed":
        status = meta.get("status", "unknown")
        return {
            "error": "not_ready",
            "status": status,
            "message": f"Transcript is not ready yet (status: {status}). Please try again later.",
        }

    transcript_id    = meta.get("transcript_id")
    duration_seconds = meta.get("duration_seconds") or 0

    # Fetch transcript content 
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            content_resp = await client.get(
                f"{NODE_API_URL}/transcripts/{transcript_id}/content",
                headers=forward_headers,
            )
    except Exception as e:
        logger.error(f"Failed to fetch transcript content: {e}")
        return {"error": "content_failed", "message": "Failed to fetch transcript content."}

    if content_resp.status_code != 200:
        logger.error(f"Transcript content endpoint returned {content_resp.status_code}: {content_resp.text[:300]}")
        return {"error": "content_failed", "message": "Failed to fetch transcript content."}

    transcript_data = content_resp.json()
    full_text       = transcript_data.get("text", "")
    segments        = transcript_data.get("segments", [])
    groq = get_groq_client()

    # Build bucker list
    if request.time_range:
        range_start = request.time_range.start_seconds
        range_end   = request.time_range.end_seconds
    else:
        range_start = 0
        range_end   = duration_seconds or max(1, len(full_text) // 10)

    interval = max(MIN_BUCKET_MINUTES, request.interval_minutes or DEFAULT_BUCKET_MINUTES)
    range_duration_min = max(1, (range_end - range_start) // 60)
    interval = min(interval, range_duration_min)
    bucket_seconds = interval * 60

    bucket_starts = list(range(range_start, range_end, bucket_seconds))
    if not bucket_starts:
        bucket_starts = [range_start]

    # Generate 1 question per bucket in parallel 
    tasks = []
    for bucket_index, b_start in enumerate(bucket_starts):
        b_end = min(b_start + bucket_seconds, range_end)
        if segments:
            text = _segments_to_text(segments, b_start, b_end)
        else:
            text = _slice_text_proportional(full_text, b_start, b_end, range_end)

        if text.strip():
            tasks.append(_generate_chunk(groq, text, b_start, b_end, bucket_index))

    if not tasks:
        return {"error": "no_content", "message": "No transcript content found for the requested range."}

    results  = await asyncio.gather(*tasks)
    quizzes  = [q for chunk in results for q in chunk]
    return {"quizzes": quizzes}
