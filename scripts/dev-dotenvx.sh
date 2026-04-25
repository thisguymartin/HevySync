#!/bin/sh
set -eu

hevy_key="${HEVY_API_KEY:-${HEAVY_API:-}}"
openai_key="${OPENAI_API_KEY:-${OPENAI_KEY:-}}"
hevy_base="${HEVY_API_BASE:-https://api.hevyapp.com}"
openai_model="${OPENAI_MODEL:-gpt-5-mini}"

export HEVY_API_KEY="$hevy_key"
export OPENAI_API_KEY="$openai_key"
export HEVY_API_BASE="$hevy_base"
export OPENAI_MODEL="$openai_model"

./node_modules/.bin/tsc -b
./node_modules/.bin/vite build
./node_modules/.bin/concurrently -n client,server -c blue,green \
  "./node_modules/.bin/vite" \
  "sh scripts/wrangler-dev-bindings.sh"
