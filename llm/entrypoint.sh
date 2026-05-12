#!/bin/sh
set -e

ollama serve &
SERVE_PID=$!

until ollama list >/dev/null 2>&1; do
  sleep 1
done

ollama pull qwen2.5-coder:7b
ollama pull codellama:7b

wait $SERVE_PID
