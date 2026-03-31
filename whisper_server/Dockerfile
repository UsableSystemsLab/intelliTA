FROM python:3.11-slim
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir git+https://github.com/openai/whisper.git
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 8001
CMD ["python", "app.py"]
