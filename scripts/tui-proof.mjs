#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RUNTIME = path.join(PLUGIN_ROOT, 'runtime');
const SERVER = path.join(RUNTIME, 'server.mjs');
const args = process.argv.slice(2);
const action = args[0]?.startsWith('-') ? 'start' : (args.shift() || 'start');
const MIN_NODE_MAJOR = 20;

function fail(message, code = 2) {
  process.stderr.write(`Codex TUI Proof: ${message}\n`);
  process.exit(code);
}

function nodeMajor() {
  return Number(process.versions.node.split('.')[0]);
}

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function npmAvailable() {
  const result = spawnSync(npmCommand(), ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}

function readFlag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail(`--${name} requires a value`);
  return value;
}

function hasFlag(name) {
  return args.includes(`--${name}`);
}

function dependenciesReady() {
  return fs.existsSync(path.join(RUNTIME, 'node_modules', 'node-pty'))
    && fs.existsSync(path.join(RUNTIME, 'node_modules', 'ws'));
}

function installDependencies() {
  if (dependenciesReady()) return;
  if (!npmAvailable()) fail('npm is required for the one-time runtime setup. Install Node.js 20 or newer and retry.', 1);
  process.stderr.write('Codex TUI Proof: installing three locked local runtime dependencies (one time)...\n');
  const result = spawnSync(npmCommand(), ['ci', '--omit=dev', '--no-audit', '--no-fund'], {
    cwd: RUNTIME,
    stdio: 'inherit'
  });
  if (result.status !== 0) fail('runtime dependency installation failed; run `doctor` for setup details.', result.status || 1);
}

if (hasFlag('help') || hasFlag('h')) {
  process.stdout.write(`Codex TUI Proof\n\nUsage:\n  tui-proof.mjs doctor\n  tui-proof.mjs start --command CMD [--cwd DIR] [--cols N] [--rows N] [--port N] [--no-autostart]\n`);
  process.exit(0);
}

if (nodeMajor() < MIN_NODE_MAJOR) {
  fail(`Node.js ${MIN_NODE_MAJOR}+ is required; found ${process.version}.`, 1);
}

if (action === 'doctor') {
  const report = {
    name: 'codex-tui-proof',
    ok: nodeMajor() >= MIN_NODE_MAJOR && npmAvailable(),
    node: process.version,
    minimumNodeMajor: MIN_NODE_MAJOR,
    npmAvailable: npmAvailable(),
    platform: process.platform,
    runtime: RUNTIME,
    dependenciesReady: dependenciesReady(),
    localOnly: true,
    computerUseRequired: false
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(report.ok ? 0 : 1);
}

if (action !== 'start') {
  fail('unknown action. Run with --help for usage.');
}

installDependencies();

const env = {
  ...process.env,
  TUI_COMMAND: readFlag('command', process.env.TUI_COMMAND || 'opencode'),
  TUI_CWD: path.resolve(readFlag('cwd', process.env.TUI_CWD || process.cwd())),
  TUI_COLS: readFlag('cols', process.env.TUI_COLS || '100'),
  TUI_ROWS: readFlag('rows', process.env.TUI_ROWS || '30'),
  PORT: readFlag('port', process.env.PORT || '0'),
  TUI_AUTOSTART: hasFlag('no-autostart') ? '0' : '1'
};

const child = spawn(process.execPath, [SERVER], { cwd: RUNTIME, env, stdio: 'inherit' });
let forwardedSignal = null;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    forwardedSignal = signal;
    child.kill(signal);
  });
}
child.on('exit', (code, signal) => {
  if (code !== null) process.exit(code);
  process.exit((forwardedSignal || signal) === 'SIGINT' ? 130 : 143);
});
