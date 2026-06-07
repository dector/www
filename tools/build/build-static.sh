#!/usr/bin/env sh
set -eu

IMAGE_NAME=${IMAGE_NAME:-www-static-build:latest}
OUTPUT_DIR=${1:-dist}
BUILD_DIR=tools/build
CONTAINERFILE=$BUILD_DIR/Containerfile
IGNORE_FILE=$BUILD_DIR/containerignore

command -v podman >/dev/null 2>&1 || {
  echo "podman is required but was not found in PATH" >&2
  exit 1
}

if [ ! -f package.json ] || [ ! -f bun.lock ] || [ ! -f astro.config.mjs ] || [ ! -f "$CONTAINERFILE" ]; then
  echo "Run this script from the repository root:" >&2
  echo "  ./tools/build/build-static.sh" >&2
  exit 1
fi

podman build \
  --ignorefile "$IGNORE_FILE" \
  -f "$CONTAINERFILE" \
  -t "$IMAGE_NAME" \
  .

container=$(podman create "$IMAGE_NAME")
cleanup() {
  podman rm "$container" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
podman cp "$container:/dist/." "$OUTPUT_DIR"

echo "Static site built at: $OUTPUT_DIR"
