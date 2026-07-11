#!/usr/bin/env bash
set -Eeuo pipefail

exec python -m uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --workers 1 \
  --no-use-colors
