# syntax=docker/dockerfile:1.6
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

COPY . .

ARG PORT=8000
ENV LLM_SERVER_PORT=${PORT}

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${LLM_SERVER_PORT}"]
