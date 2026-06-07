# Running Astro dev with Podman

Use the containerized dev workflow to run Astro without installing Bun/npm dependencies on the host.

From the repository root:

```sh
./tools/dev/run-dev.sh
```

Then open:

```text
http://localhost:8080
```

The script checks that it is running from the project root, builds `tools/dev/Containerfile`, and starts Astro with:

```sh
bun run dev -- --host 0.0.0.0 --port 4321
```

## Configuration

The default host port is `8080`, mapped to Astro's container port `4321` on `127.0.0.1`. To use another host port:

```sh
PORT=3000 ./tools/dev/run-dev.sh
```

To override the local image name:

```sh
IMAGE_NAME=www-dev:local ./tools/dev/run-dev.sh
```

## Isolation model

- Bun is pinned by the dev image: `oven/bun:1.3.14`.
- Dependencies are installed inside the image with `bun install --frozen-lockfile`.
- Host `node_modules` is not mounted or used.
- Project source files are mounted read-only into the container so edits on the host are visible to Astro dev.
- Astro-generated files stay inside the disposable container filesystem.
