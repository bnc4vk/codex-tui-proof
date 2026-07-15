# Prior-art and architecture decision

Research date: 2026-07-11.

## Codex-native search

The search covered official Codex documentation, the `openai/codex` repository tree, installed and available local Codex plugins/skills, GitHub code/repository search, npm, and public skill directories.

The closest official Codex artifact is [`openai/codex/.codex/skills/test-tui`](https://github.com/openai/codex/tree/main/.codex/skills/test-tui). It is a short workflow for starting and interacting with Codex's own TUI. It does not provide browser rendering, screenshot evidence, recording, or a no-desktop-takeover contract.

Official Codex documentation establishes the primitives used here:

- [Browser](https://developers.openai.com/codex/app/browser): the desktop in-app browser can open local web apps, inspect rendered state, interact, and capture screenshots.
- [Build skills](https://developers.openai.com/codex/skills): skills are the reusable workflow format and may include deterministic scripts.
- [Build plugins](https://developers.openai.com/codex/plugins/build): plugins are the distributable unit for skills and presentation assets.

No indexed Codex plugin or skill was found that combines a real local PTY, a live in-app-browser terminal, browser-driven keyboard interaction, structured evidence, and controlled-tab screenshots while prohibiting Computer Use fallback.

This is a bounded search result, not proof that no private or unindexed implementation exists.

## Underlying technology reviewed

| Project | Reusable capability | Decision |
|---|---|---|
| [xterm.js](https://github.com/xtermjs/xterm.js) | Mature browser terminal renderer and canonical node-pty integration | Use directly |
| [node-pty](https://github.com/microsoft/node-pty) | Native PTY used by VS Code-style terminals | Use directly |
| [ttyd](https://github.com/tsl0922/ttyd) | Complete xterm/WebSocket web terminal | Not used: adds an external binary and lacks the Codex evidence contract |
| [WeTTY](https://github.com/butlerx/wetty) | Node-based web terminal | Not used: optimized for terminal/SSH access, not Codex proof |
| [shell-use](https://github.com/microsoft/shell-use) | Agent-native PTY control, assertions, SVG screenshots, recording | Revisit later: strong fit but currently work-in-progress beta and no live browser surface |
| [VirtUI](https://github.com/honeybadge-labs/virtui) | TUI automation and proof for AI agents | Not used: daemon/headless emulator workflow rather than Codex browser proof |
| [Termless](https://termless.dev/) | Semantic TUI testing and screenshots | Complementary test framework, not a live in-app-browser adapter |
| [VHS](https://github.com/charmbracelet/vhs) | Deterministic scripted terminal media | Complementary artifact generator, not live validation |

## Decision

Keep the runtime intentionally small and based on the canonical xterm.js + node-pty + WebSocket composition. Launch the selected executable and parsed arguments directly instead of routing commands through a shell. Make the Codex plugin and `$validate-tui-in-codex` skill the product:

- one-command integrated-terminal startup;
- collision-free localhost URL discovery;
- explicit in-app-browser orchestration;
- stable selectors and evidence APIs;
- controlled-tab screenshot requirements;
- strict prohibition on Computer Use fallback;
- deterministic Codex-pane-sized rendering;
- JSONL input/output/lifecycle recording.

The runtime can later gain an optional shell-use provider when that project stabilizes, without changing the Codex-facing workflow or evidence contract.
