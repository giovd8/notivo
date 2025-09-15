#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.dev.yml"
FRONTEND_URL="https://localhost:443"
API_DOCS_URL="http://localhost:3000/api-docs"

echo "Starting Notivo development stack with API documentation..."
echo ""

# Stop any existing containers
echo "Stopping existing containers..."
docker compose -f "$COMPOSE_FILE" down

# Start all services
echo "Starting all services (detached)..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo ""
echo "Waiting for services to be ready..."

# Wait for API documentation (gateway)
echo "Waiting for API documentation..."
ATTEMPTS=60
SLEEP_SECS=2
for ((i=1; i<=ATTEMPTS; i++)); do
  if curl -sf --max-time 2 "http://localhost:3000/health" -o /dev/null; then
    echo "API Gateway is ready"
    break
  fi
  sleep "$SLEEP_SECS"
  if [[ $i -eq $ATTEMPTS ]]; then
    echo "API Gateway took longer than expected to start"
  fi
done

# Wait for frontend
echo "Waiting for frontend..."
for ((i=1; i<=ATTEMPTS; i++)); do
  if curl -skf --max-time 2 "$FRONTEND_URL" -o /dev/null; then
    echo "Frontend is ready"
    break
  fi
  sleep "$SLEEP_SECS"
  if [[ $i -eq $ATTEMPTS ]]; then
    echo "Frontend took longer than expected to start"
  fi
done

echo ""
echo "Development stack is ready!"
echo ""
echo "Available services:"
echo "   Frontend:        $FRONTEND_URL"
echo "   API Docs:        $API_DOCS_URL"
echo "   API JSON:        http://localhost:3000/swagger.json"
echo "   Gateway:         http://localhost:3000"
echo ""

# Open the appropriate URL
if command -v open >/dev/null 2>&1; then
  echo "Opening frontend in browser..."
  open "$FRONTEND_URL"
  echo "To view API documentation, visit: $API_DOCS_URL"
elif command -v xdg-open >/dev/null 2>&1; then
  echo "Opening frontend in browser..."
  xdg-open "$FRONTEND_URL" >/dev/null 2>&1 || true
  echo "To view API documentation, visit: $API_DOCS_URL"
else
  echo "Open your browser and visit:"
  echo "   Frontend: $FRONTEND_URL"
  echo "   API Docs: $API_DOCS_URL"
fi

echo ""
echo "To stop all services: docker compose -f $COMPOSE_FILE down"

