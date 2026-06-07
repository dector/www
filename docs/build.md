# Building the static site with Podman

This project can build the Astro static site inside a rootless Podman container. The goal is to keep Bun/npm dependency installation and `node_modules` isolated from the host machine.

## Build

Run the script from the repository root:

```sh
./tools/build/build-static.sh
```

The script checks that it is running from the project root before starting the container build.

The script:

1. Builds `tools/build/Containerfile` using the repository root as context.
2. Installs dependencies with `bun install --frozen-lockfile` inside the image.
3. Runs `bun run build` inside the image.
4. Copies the generated static site from the image to `./dist`.

To write output somewhere else, pass a directory:

```sh
./tools/build/build-static.sh /tmp/www-dist
```

## Files

- `tools/build/Containerfile` — multi-stage Bun/Astro build image. Bun is pinned to `oven/bun:1.3.14`.
- `tools/build/containerignore` — excludes host artifacts such as `node_modules`, `.git`, and `dist` from the build context.
- `tools/build/build-static.sh` — convenience script for building and extracting the static output.

## Notes

- Run Podman rootless when possible.
- Dependency installation still needs network access during `podman build` unless the base image and package cache are already available locally.
- Host `node_modules` is not used or created by this workflow.
- JavaScript dependency versions are locked by `bun.lock` and installed with `bun install --frozen-lockfile`.
