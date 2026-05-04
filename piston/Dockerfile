FROM ghcr.io/engineer-man/piston:latest

ARG PISTON_LANGS

COPY install-languages.js /piston-init/install-languages.js

RUN mkdir -p /piston/packages /piston/jobs \
    && nohup bash -c "cd /piston_api && node src > /tmp/piston.log 2>&1 &" \
    && sleep 5 \
    && PISTON_URL=http://localhost:2000 \
       PISTON_LANGS="${PISTON_LANGS}" \
       node /piston-init/install-languages.js
