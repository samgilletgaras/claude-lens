#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

if ! command -v node &>/dev/null; then
  echo "Error: Node.js is not installed." >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Starting AI Lens..."
echo "  Frontend: http://localhost:5173"
echo ""

npm run dev
