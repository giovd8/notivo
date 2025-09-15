#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.dev.yml"

PRUNE_VOLUMES_FLAG=""
if [[ "${1:-}" == "--prune-volumes" ]]; then
  PRUNE_VOLUMES_FLAG="--volumes"
fi

echo "Stopping dev stack..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans $PRUNE_VOLUMES_FLAG

echo "Done."

