import os
import tempfile
import whisper
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="Whisper Transcription Service")

# Load model on startup
MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")
print(f"Loading Whisper model: {MODEL_SIZE}")
model = whisper.load_model(MODEL_SIZE)
print("Model loaded successfully")


@app.get("/health")
async def health():
    return {"status": "healthy", "model": MODEL_SIZE}


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str = "en"
):
    """
    Transcribe an audio file using OpenAI Whisper.

    Args:
        file: Audio file (WAV, MP3, etc.)
        language: Language code (default: "en")

    Returns:
        JSON with text, language, duration, and segments
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save uploaded file to temp location
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_path = temp_file.name
            content = await file.read()
            temp_file.write(content)

        # Transcribe with Whisper
        result = model.transcribe(
            temp_path,
            language=language,
            verbose=False
        )

        # Format response
        segments = []
        for segment in result.get("segments", []):
            segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"].strip()
            })

        return JSONResponse(content={
            "text": result["text"].strip(),
            "language": result.get("language", language),
            "duration": segments[-1]["end"] if segments else 0,
            "segments": segments
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("WHISPER_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
