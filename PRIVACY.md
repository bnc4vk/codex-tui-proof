# Privacy policy

Effective date: July 15, 2026

Codex TUI Proof runs locally. It does not provide a hosted service, create an account, collect telemetry, or send session content to the developer.

## Data processed locally

The plugin launches the executable selected by the user or Codex and records the PTY session as JSONL. A recording may contain:

- the command and working-directory path;
- terminal input, including typed characters;
- terminal output;
- timestamps, terminal dimensions, process status, and byte counts.

Recordings are stored under `runtime/recordings/` in the installed plugin copy. Screenshots are saved only when Codex or the user requests them, at the path shown in the task.

Do not enter passwords, tokens, private keys, or other secrets during a proof session. Delete local recordings and screenshots when they are no longer needed.

## Network access

The proof server binds to `127.0.0.1` and is not intended for remote access. On first use, npm downloads the dependencies pinned in `runtime/package-lock.json`. A target command may make its own network requests; those requests are governed by that command, not by Codex TUI Proof.

## Sharing and retention

Codex TUI Proof does not transmit recordings or screenshots to the developer and has no server-side retention. Any sharing performed through ChatGPT, Codex, GitHub, or another service is governed by that service and the user's choices.

## Contact

Open a privacy question at https://github.com/bnc4vk/codex-tui-proof/issues.
