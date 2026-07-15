# Contributing

Thanks for improving Codex TUI Proof.

## Setup

Use Node.js 20 or newer:

```sh
npm ci --prefix runtime
npm run check --prefix runtime
npm test --prefix runtime
```

## Pull requests

- Keep the localhost-only and no-Computer-Use boundaries intact.
- Add or update evidence-contract documentation when selectors, API fields, or recording fields change.
- Include a deterministic smoke test for launcher or runtime behavior changes.
- Visually validate browser-terminal changes with `$validate-tui-in-codex` and attach the controlled-tab screenshot.
- Do not commit `runtime/node_modules/`, local JSONL recordings, or screenshots containing secrets.

For security problems, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
