import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pty from 'node-pty';
import WebSocket, { WebSocketServer } from 'ws';
import { parseCommandLine } from './command-line.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const RECORDINGS = path.join(ROOT, 'recordings');
const HOST = '127.0.0.1';
const REQUESTED_PORT = Number(process.env.PORT ?? 4173);
const DEFAULT_COMMAND = process.env.TUI_COMMAND || 'opencode';
const DEFAULT_CWD = path.resolve(process.env.TUI_CWD || process.cwd());
const DEFAULT_COLS = clamp(Number(process.env.TUI_COLS || 100), 40, 240);
const DEFAULT_ROWS = clamp(Number(process.env.TUI_ROWS || 30), 12, 80);
const AUTOSTART = process.env.TUI_AUTOSTART === '1';
const HARNESS_VERSION = '0.1.0';
const CONTRACT_VERSION = 1;
const MAX_TRANSCRIPT_BYTES = 1024 * 1024;

fs.mkdirSync(RECORDINGS, { recursive: true });

const clients = new Set();
let child = null;
let recording = null;
let transcript = '';
let state = {
  status: 'stopped',
  sessionId: null,
  pid: null,
  command: DEFAULT_COMMAND,
  cwd: DEFAULT_CWD,
  cols: DEFAULT_COLS,
  rows: DEFAULT_ROWS,
  startedAt: null,
  stoppedAt: null,
  exitCode: null,
  signal: null,
  recordingPath: null,
  outputBytes: 0,
  inputBytes: 0,
  error: null
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.trunc(value) : min));
}

function safeState() {
  return { ...state, transcript };
}

function evidenceState() {
  return {
    contractVersion: CONTRACT_VERSION,
    harnessVersion: HARNESS_VERSION,
    ...state
  };
}

function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}

function broadcast(message) {
  for (const ws of clients) send(ws, message);
}

function broadcastState() {
  broadcast({ type: 'state', state: safeState() });
}

function record(direction, data, extra = {}) {
  if (!recording) return;
  recording.write(`${JSON.stringify({ at: new Date().toISOString(), direction, data, ...extra })}\n`);
}

function startSession(options = {}) {
  stopSession('restart');

  const command = String(options.command || state.command || DEFAULT_COMMAND).trim();
  const cwd = path.resolve(String(options.cwd || state.cwd || DEFAULT_CWD));
  const cols = clamp(Number(options.cols || state.cols), 40, 240);
  const rows = clamp(Number(options.rows || state.rows), 12, 80);

  if (!command) throw new Error('Command cannot be empty');
  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    throw new Error(`Working directory does not exist: ${cwd}`);
  }

  const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
  const recordingPath = path.join(RECORDINGS, `${sessionId}.jsonl`);
  transcript = '';
  recording = fs.createWriteStream(recordingPath, { flags: 'a' });
  state = {
    ...state,
    status: 'starting',
    sessionId,
    pid: null,
    command,
    cwd,
    cols,
    rows,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    exitCode: null,
    signal: null,
    recordingPath,
    outputBytes: 0,
    inputBytes: 0,
    error: null
  };
  record('meta', '', { event: 'start', command, cwd, cols, rows });

  const terminalEnv = {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    FORCE_COLOR: '3',
    LC_ALL: process.env.LC_ALL || 'en_US.UTF-8',
    LANG: process.env.LANG || 'en_US.UTF-8'
  };
  delete terminalEnv.NO_COLOR;

  const [executable, ...commandArgs] = parseCommandLine(command);

  let session;
  try {
    session = pty.spawn(executable, commandArgs, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env: terminalEnv
    });
  } catch (error) {
    state.status = 'error';
    state.error = error.message;
    state.stoppedAt = new Date().toISOString();
    record('meta', '', { event: 'error', error: error.message });
    recording?.end();
    recording = null;
    broadcastState();
    throw error;
  }
  child = session;

  state.status = 'running';
  state.pid = session.pid;
  session.onData((data) => {
    if (child !== session) return;
    state.outputBytes += Buffer.byteLength(data);
    transcript = (transcript + data).slice(-MAX_TRANSCRIPT_BYTES);
    record('output', data);
    broadcast({ type: 'output', data });
    broadcast({ type: 'metrics', inputBytes: state.inputBytes, outputBytes: state.outputBytes });
  });
  session.onExit(({ exitCode, signal }) => {
    if (child !== session) return;
    state.status = 'exited';
    state.exitCode = exitCode;
    state.signal = signal;
    state.stoppedAt = new Date().toISOString();
    state.pid = null;
    record('meta', '', { event: 'exit', exitCode, signal });
    recording?.end();
    recording = null;
    child = null;
    broadcastState();
  });
  broadcast({ type: 'reset' });
  broadcastState();
}

function stopSession(reason = 'stop') {
  if (!child) return;
  record('meta', '', { event: reason });
  const running = child;
  child = null;
  try { running.kill('SIGTERM'); } catch {}
  recording?.end();
  recording = null;
  state.status = 'stopped';
  state.pid = null;
  state.stoppedAt = new Date().toISOString();
  broadcastState();
}

function handleSocketMessage(ws, raw) {
  let message;
  try { message = JSON.parse(raw.toString()); } catch { return; }
  try {
    if (message.type === 'input' && child) {
      const data = String(message.data || '');
      state.inputBytes += Buffer.byteLength(data);
      record('input', data);
      child.write(data);
      broadcast({ type: 'metrics', inputBytes: state.inputBytes, outputBytes: state.outputBytes });
    } else if (message.type === 'resize' && child) {
      const cols = clamp(Number(message.cols), 40, 240);
      const rows = clamp(Number(message.rows), 12, 80);
      child.resize(cols, rows);
      state.cols = cols;
      state.rows = rows;
      record('meta', '', { event: 'resize', cols, rows });
      broadcastState();
    } else if (message.type === 'start' || message.type === 'restart') {
      startSession(message);
    } else if (message.type === 'stop') {
      stopSession();
    }
  } catch (error) {
    state.error = error.message;
    send(ws, { type: 'error', message: error.message });
    broadcastState();
  }
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2'
};

function serveFile(res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const filename = path.resolve(PUBLIC, relative);
  if (!filename.startsWith(`${PUBLIC}${path.sep}`) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': mimeTypes[path.extname(filename)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    ...securityHeaders()
  });
  fs.createReadStream(filename).pipe(res);
}

const server = http.createServer((req, res) => {
  const host = req.headers.host || '';
  if (!isLoopbackHost(host)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  const url = new URL(req.url, `http://${host}`);
  if (url.pathname === '/api/health') {
    respondJson(res, { ok: true, harnessVersion: HARNESS_VERSION, status: state.status });
    return;
  }
  if (url.pathname === '/api/evidence') {
    respondJson(res, evidenceState());
    return;
  }
  if (url.pathname === '/api/state') {
    respondJson(res, safeState());
    return;
  }
  if (url.pathname.startsWith('/vendor/xterm/')) {
    const file = path.basename(url.pathname);
    const vendor = file === 'xterm.js'
      ? path.join(ROOT, 'node_modules/@xterm/xterm/lib/xterm.js')
      : path.join(ROOT, 'node_modules/@xterm/xterm/css/xterm.css');
    serveAbsolute(res, vendor);
    return;
  }
  serveFile(res, url.pathname);
});

function respondJson(res, value) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...securityHeaders()
  });
  res.end(JSON.stringify(value));
}

function serveAbsolute(res, filename) {
  if (!fs.existsSync(filename)) return res.writeHead(404).end('Not found');
  res.writeHead(200, {
    'Content-Type': mimeTypes[path.extname(filename)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
    ...securityHeaders()
  });
  fs.createReadStream(filename).pipe(res);
}

const wss = new WebSocketServer({
  server,
  path: '/ws',
  verifyClient: ({ origin, req }) => {
    const host = req.headers.host || '';
    return isLoopbackHost(host) && origin === `http://${host}`;
  }
});
wss.on('connection', (ws) => {
  clients.add(ws);
  send(ws, { type: 'state', state: safeState() });
  ws.on('message', (raw) => handleSocketMessage(ws, raw));
  ws.on('close', () => clients.delete(ws));
});

server.listen(REQUESTED_PORT, HOST, () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : REQUESTED_PORT;
  const ready = {
    url: `http://${HOST}:${port}`,
    host: HOST,
    port,
    command: DEFAULT_COMMAND,
    cwd: DEFAULT_CWD,
    cols: DEFAULT_COLS,
    rows: DEFAULT_ROWS,
    autostart: AUTOSTART
  };
  console.log(`TUI_PROOF_READY ${JSON.stringify(ready)}`);
  if (AUTOSTART) {
    try {
      startSession();
    } catch (error) {
      console.error(`Codex TUI Proof could not start the session: ${error.message}`);
    }
  }
});

function shutdown() {
  stopSession('shutdown');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function isLoopbackHost(value) {
  return /^127\.0\.0\.1:\d+$/.test(value);
}

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; connect-src 'self' ws://127.0.0.1:*; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'"
  };
}
