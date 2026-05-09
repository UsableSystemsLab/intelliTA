#!/bin/bash
set -e

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

cd /var/www/intellita.courses/src

PREV_SHA=$(git rev-parse HEAD)
git pull origin main
NEW_SHA=$(git rev-parse HEAD)

if [ "$PREV_SHA" = "$NEW_SHA" ]; then
  CHANGED=""
else
  CHANGED=$(git diff --name-only "$PREV_SHA" "$NEW_SHA")
fi

changed() {
  [ -z "$CHANGED" ] && return 1
  echo "$CHANGED" | grep -qE "$1"
}

COMPOSE="docker compose --env-file .env.prod -f docker-compose.prod.yml"

# Decide which services need a rebuild based on what changed.
SERVICES=()
changed '^api_server/'                            && SERVICES+=(api_server)
changed '^llm/server/'                            && SERVICES+=(llm_server)
changed '^llm/(Dockerfile|entrypoint\.sh)'        && SERVICES+=(ollama)
changed '^whisper_server/'                        && SERVICES+=(whisper_server)
changed '^docker-compose\.prod\.yml$'             && SERVICES=(api_server llm_server ollama whisper_server)

if [ ${#SERVICES[@]} -gt 0 ]; then
  echo ">>> Rebuilding: ${SERVICES[*]}"
  $COMPOSE build "${SERVICES[@]}"
  $COMPOSE up -d "${SERVICES[@]}"
else
  echo ">>> No backend service changes; ensuring stack is up."
  $COMPOSE up -d
fi

# Frontend: only rebuild when react_app changed.
if [ -z "$CHANGED" ] || changed '^react_app/'; then
  echo ">>> Rebuilding react_app"
  cd react_app
  set -a; . ../.env.prod; set +a
  npm ci
  npm run build

  rm -rf /var/www/intellita.courses/assets
  rm -f /var/www/intellita.courses/index.html
  cp -r dist/* /var/www/intellita.courses/

  chmod -R a+rX /var/www/intellita.courses/assets
  chmod a+r /var/www/intellita.courses/index.html
  cd ..
else
  echo ">>> No react_app changes; skipping frontend build."
fi

echo ">>> Deploy complete: $NEW_SHA"
