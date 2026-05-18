# syntax=docker/dockerfile:1.6
FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install git+https://github.com/openai/whisper.git
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt
COPY app.py .
EXPOSE 8001
CMD ["python", "app.py"]
