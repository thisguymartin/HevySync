#!/bin/sh
set -eu

exec ./node_modules/.bin/wrangler pages dev dist --port 8788 \
  --binding "HEVY_API_KEY=${HEVY_API_KEY:-}" \
  --binding "OPENAI_API_KEY=${OPENAI_API_KEY:-}" \
  --binding "HEVY_API_BASE=${HEVY_API_BASE:-https://api.hevyapp.com}" \
  --binding "OPENAI_MODEL=${OPENAI_MODEL:-gpt-5-mini}"
