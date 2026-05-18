from pydantic import BaseModel
from typing import Optional


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


class HintChatRequest(BaseModel):
    firebase_uid: str
    activity_id: int
    message: str
    activity_context: Optional[str] = None
    model: Optional[str] = None
    external_key_id: Optional[int] = None


class ValidateKeyRequest(BaseModel):
    base_url: str
    api_key: str
    model_name: str


class HintGenerateRequest(BaseModel):
    firebase_uid: str
    activity_id: int
    checkpoint_instruction: str
    student_code: str
    file_name: str


class StudentFile(BaseModel):
    name: str
    content: str


class HintCheckAndGenerateRequest(BaseModel):
    firebase_uid: str
    activity_id: int
    checkpoint_id: int
    files: list[StudentFile]


class TimeRange(BaseModel):
    start_seconds: int
    end_seconds: int


class QuizSuggestRequest(BaseModel):
    activity_id: int
    time_range: Optional[TimeRange] = None
    interval_minutes: Optional[int] = 5            # minutes per question bucket