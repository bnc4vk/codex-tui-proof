#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(SCRIPT_DIR, '..');
const launcher = path.join(SCRIPT_DIR, 'tui-proof.mjs');
const command = 'node scripts/smoke-fixture.mjs';
const child = spawn(process.execPath, [
  launcher,
  'start',
  '--command', command,
  '--cwd', PLUGIN_ROOT,
  '--port', '0'
], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';
child.stdout.on('data', (chunk) => { stdout += chunk; });
child.stderr.on('data', (chunk) => { stderr += chunk; });

try {
  const ready = await waitForReady();
  const health = await waitForJson(`${ready.url}/api/health`, (value) => value.ok === true);
  assert.equal(health.harnessVersion, '0.1.0');

  const evidence = await waitForJson(
    `${ready.url}/api/evidence`,
    (value) => value.status === 'running' && value.outputBytes > 0
  );
  assert.equal(evidence.command, command);
  assert.equal(evidence.cols, 100);
  assert.equal(evidence.rows, 30);
  assert.match(evidence.recordingPath, /\.jsonl$/);
  process.stdout.write('Codex TUI Proof smoke test passed.\n');
} finally {
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ]);
}

async function waitForReady() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const line = stdout.split('\n').find((entry) => entry.startsWith('TUI_PROOF_READY '));
    if (line) return JSON.parse(line.slice('TUI_PROOF_READY '.length));
    if (child.exitCode !== null) throw new Error(`launcher exited ${child.exitCode}: ${stderr}`);
    await delay(50);
  }
  throw new Error(`timed out waiting for TUI_PROOF_READY: ${stderr}`);
}

async function waitForJson(url, predicate) {
  const deadline = Date.now() + 10_000;
  let last;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      last = await response.json();
      if (predicate(last)) return last;
    } catch {}
    await delay(75);
  }
  throw new Error(`timed out waiting for ${url}; last response: ${JSON.stringify(last)}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
