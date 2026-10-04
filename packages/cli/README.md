# Liven UI CLI

Internal registry installer and source-registry build utilities. This workspace is maintained locally; its package name does not imply a published npm package.

## Build

Run from the repository root:

```sh
bun run build
```

## Install source into another project

Start the documentation application, then run from the consuming project:

```sh
node /path/to/livenui/packages/cli/dist/index.js add orbs --dir http://localhost:3000/registry
```

Canonical component IDs are `beam`, `orbs`, `metal`, `gooey`, `voice`, `image` and `avatars`. Existing legacy registry aliases remain supported. The installer copies source and legal files, installs required dependencies and respects the consumer aliases in `cli.json`.

The public integration path uses the standard source registry. See [the integration guide](../../apps/docs/content/docs/agents/integration.mdx).
