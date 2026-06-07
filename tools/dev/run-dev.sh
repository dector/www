#!/usr/bin/env sh
set -eu

IMAGE_NAME=${IMAGE_NAME:-www-dev:latest}
PORT=${PORT:-8080}
BUILD_DIR=tools/dev
CONTAINERFILE=$BUILD_DIR/Containerfile
IGNORE_FILE=$BUILD_DIR/containerignore

command -v podman >/dev/null 2>&1 || {
  echo "podman is required but was not found in PATH" >&2
  exit 1
}

if [ ! -f package.json ] || [ ! -f bun.lock ] || [ ! -f astro.config.mjs ] || [ ! -f tsconfig.json ] || [ ! -f "$CONTAINERFILE" ]; then
  echo "Run this script from the repository root:" >&2
  echo "  ./tools/dev/run-dev.sh" >&2
  exit 1
fi

ROOT_DIR=$(pwd)

if command -v ss >/dev/null 2>&1 && ss -H -ltn "sport = :$PORT" | grep -q .; then
  echo "Port $PORT is already in use on the host." >&2
  echo "Stop the process using it or run with another port:" >&2
  echo "  PORT=3000 ./tools/dev/run-dev.sh" >&2
  exit 1
fi

podman build \
  --ignorefile "$IGNORE_FILE" \
  -f "$CONTAINERFILE" \
  -t "$IMAGE_NAME" \
  .

tty_args=
if [ -t 0 ] && [ -t 1 ]; then
  tty_args=-it
fi

echo "Starting Astro dev server: http://localhost:$PORT"

# Mount source files read-only so Astro dev sees live host edits while dependencies
# and generated files stay inside the container filesystem.
# shellcheck disable=SC2086
podman run --rm $tty_args \
  -p "127.0.0.1:$PORT:4321" \
  -v "$ROOT_DIR/astro.config.mjs:/site/astro.config.mjs:Z,ro" \
  -v "$ROOT_DIR/tsconfig.json:/site/tsconfig.json:Z,ro" \
  -v "$ROOT_DIR/package.json:/site/package.json:Z,ro" \
  -v "$ROOT_DIR/bun.lock:/site/bun.lock:Z,ro" \
  -v "$ROOT_DIR/src:/site/src:Z,ro" \
  -v "$ROOT_DIR/public:/site/public:Z,ro" \
  -v "$ROOT_DIR/content:/site/content:Z,ro" \
  "$IMAGE_NAME"
