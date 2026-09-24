#!/bin/bash
set -euo pipefail

# Only needed in Claude Code on the web; local machines manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# bun.lock is the project's lockfile; fall back to npm if bun is missing.
if command -v bun >/dev/null 2>&1; then
  bun install
else
  npm install
fi
