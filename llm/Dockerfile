FROM ollama/ollama:latest

RUN nohup bash -c "ollama serve &" && \
    sleep 5 && \
    ollama pull qwen2.5-coder:7b && \
    ollama pull codellama:7b