FROM ollama/ollama:latest

ARG OLLAMA_MODEL 

RUN nohup bash -c "ollama serve &" && \
    sleep 5 && \
    ollama pull ${OLLAMA_MODEL}