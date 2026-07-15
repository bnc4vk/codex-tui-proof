# OpenAI plugin submission packet

Prepared for a **Skills only** submission at https://platform.openai.com/plugins.

## Publisher prerequisites

- Publisher identity: **Ben Cohen** — confirm this matches the verified identity in the OpenAI Platform organization.
- Submitter role: Apps Management **Write**.
- Support URL: `https://github.com/bnc4vk/codex-tui-proof/issues`
- Privacy URL: `https://github.com/bnc4vk/codex-tui-proof/blob/main/PRIVACY.md`
- Terms URL: `https://github.com/bnc4vk/codex-tui-proof/blob/main/TERMS.md`
- Website: `https://github.com/bnc4vk/codex-tui-proof`
- Category: **Developer Tools**
- Countries/regions: confirm at sign-off; default recommendation is all regions where the Plugins Directory and Browser are available.

## Listing

**Name:** Codex TUI Proof

**Short description:** Visual proof for real terminal UIs without desktop takeover.

**Long description:** Launch a real local PTY in a deterministic browser terminal, let Codex exercise keyboard and resize flows through its in-app browser, and return controlled-tab screenshots plus structured session evidence. Designed for interactive CLI and TUI development; runs locally and never falls back to Computer Use.

**Capabilities:** Interactive, Local, Visual validation

## Starter prompts

1. `Visually validate this TUI at 100x30 and attach proof.`
2. `Check this command palette flow and capture the final state.`
3. `Verify this TUI resize fix at two terminal sizes.`

## Five positive test cases

### 1. Basic visual proof

- Prompt: `Use $validate-tui-in-codex to run node scripts/smoke-fixture.mjs in this plugin checkout at 100x30 and attach proof.`
- Expected behavior: starts the local harness, parses `TUI_PROOF_READY`, opens the returned URL in the in-app browser, verifies status and geometry, and captures a controlled-tab screenshot.
- Expected result: command, cwd, 100x30 geometry, running or cleanly exited status, recording path, no browser errors, and an attached screenshot.
- Fixture: public plugin repository checkout with Node.js 20+ and npm.

### 2. Keyboard interaction

- Prompt: `Run node scripts/smoke-fixture.mjs with $validate-tui-in-codex, type hello followed by Enter, and prove the resulting state.`
- Expected behavior: locates the terminal textbox, sends literal `hello` separately from Enter, and observes `received:hello<enter>` in the terminal.
- Expected result: screenshot and evidence showing input/output byte counts above zero and the observed response.
- Fixture: public plugin repository checkout.

### 3. Deterministic resize

- Prompt: `Use $validate-tui-in-codex to run node scripts/smoke-fixture.mjs, resize it to 80x24, and verify the dimensions.`
- Expected behavior: changes the Cols and Rows controls, verifies `data-testid="dimensions"` reports `80 × 24`, and captures the resized state.
- Expected result: screenshot and `/api/evidence` both report 80 columns and 24 rows.
- Fixture: public plugin repository checkout.

### 4. Restart lifecycle

- Prompt: `Use $validate-tui-in-codex to run node scripts/smoke-fixture.mjs, stop it, restart it, and report both status transitions.`
- Expected behavior: uses visible controls, observes stopped then running, and does not infer success from clicks alone.
- Expected result: lifecycle observations, new session ID after restart, recording path, and final screenshot.
- Fixture: public plugin repository checkout.

### 5. Real TUI validation

- Prompt: `Use $validate-tui-in-codex to open an installed interactive TUI, exercise one reversible menu path, and attach visual proof.`
- Expected behavior: chooses the smallest safe keyboard flow, avoids paid/external actions, verifies resulting browser and API state, then cleans up.
- Expected result: command, cwd, geometry, interaction, resulting state, recording path, browser-log status, and screenshot.
- Fixture: a reviewer-selected local TUI with a non-destructive menu path.

## Three negative test cases

### 1. Ordinary non-interactive output

- Prompt: `Run npm test and tell me whether it passes.`
- Expected behavior: does not trigger the visual TUI workflow; uses ordinary command execution.
- Why: non-interactive output does not benefit from a PTY browser or screenshot proof.

### 2. Native terminal-specific behavior

- Prompt: `Prove that this Kitty graphics protocol image renders correctly in Kitty.`
- Expected behavior: explains that xterm.js cannot prove renderer-specific Kitty behavior and asks for an appropriate native-terminal validation route.
- Why: the plugin must not overstate proof beyond its renderer.

### 3. Browser unavailable

- Scenario: the in-app Browser plugin is unavailable or disabled.
- Expected behavior: stops and reports the missing capability without invoking Computer Use, Terminal.app, iTerm, or desktop automation.
- Why: the no-desktop-takeover boundary is a core safety and product guarantee.

## Initial release notes

Initial skills-only release of Codex TUI Proof. It provides a localhost-only PTY/browser bridge, a Codex workflow for deterministic keyboard and resize validation, controlled-tab screenshots, evidence APIs, and local JSONL recordings. The runtime uses three locked npm dependencies and includes diagnostics, smoke tests, cross-platform CI, privacy documentation, and an explicit no-Computer-Use boundary.

## Reviewer notes

- No authentication or external service is required.
- The server binds only to `127.0.0.1`, validates the HTTP host, and accepts only an exact same-origin WebSocket connection.
- First use runs `npm ci` against the committed lockfile.
- Terminal input and output are recorded locally; the skill instructs users not to enter secrets.
- The plugin intentionally refuses native-terminal-specific proof and any fallback to desktop automation.
