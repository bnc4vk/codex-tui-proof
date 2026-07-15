const term = new Terminal({
  cols: 100,
  rows: 30,
  cursorBlink: false,
  cursorStyle: 'block',
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  fontSize: 11,
  fontWeight: '400',
  lineHeight: 1.12,
  letterSpacing: 0,
  scrollback: 5000,
  allowProposedApi: false,
  theme: {
    background: '#0b0e14',
    foreground: '#c0caf5',
    cursor: '#c0caf5',
    cursorAccent: '#0b0e14',
    selectionBackground: '#33467c',
    black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68',
    blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
    brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a', brightYellow: '#e0af68',
    brightBlue: '#7aa2f7', brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5'
  }
});

const $ = (id) => document.getElementById(id);
const elements = {
  command: $('command'), cwd: $('cwd'), cols: $('cols'), rows: $('rows'),
  restart: $('restart'), stop: $('stop'), status: $('status'), statusDot: $('status-dot'),
  sessionLabel: $('session-label'), dimensions: $('dimensions'), metrics: $('metrics'), recording: $('recording')
};

term.open($('terminal'));
term.focus();

let socket;
let firstState = true;
let reconnectTimer;

function connect() {
  clearTimeout(reconnectTimer);
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${location.host}/ws`);
  socket.addEventListener('open', () => setConnection('connected'));
  socket.addEventListener('close', () => {
    setConnection('disconnected');
    reconnectTimer = setTimeout(connect, 750);
  });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.type === 'output') term.write(message.data);
    if (message.type === 'reset') term.reset();
    if (message.type === 'state') renderState(message.state);
    if (message.type === 'metrics') renderMetrics(message);
    if (message.type === 'error') term.writeln(`\r\n\x1b[31mHarness error: ${message.message}\x1b[0m`);
  });
}

function setConnection(label) {
  if (label !== 'connected') {
    elements.status.textContent = label;
    elements.statusDot.className = 'stopped';
  }
}

function renderState(state) {
  elements.status.textContent = state.status;
  elements.statusDot.className = state.status;
  elements.sessionLabel.textContent = state.sessionId ? `${state.command} · ${state.sessionId}` : 'No active session';
  elements.dimensions.textContent = `${state.cols} × ${state.rows}`;
  renderMetrics(state);
  elements.recording.textContent = state.recordingPath ? `Recording ${state.recordingPath.split('/').pop()}` : 'Recordings stay local';
  if (firstState) {
    elements.command.value = state.command;
    elements.cwd.value = state.cwd;
    elements.cols.value = state.cols;
    elements.rows.value = state.rows;
    term.resize(state.cols, state.rows);
    if (state.transcript) term.write(state.transcript);
    firstState = false;
  }
}

function renderMetrics({ inputBytes, outputBytes }) {
  elements.metrics.textContent = `${formatBytes(inputBytes)} in · ${formatBytes(outputBytes)} out`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function send(message) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function sessionOptions(type) {
  return {
    type,
    command: elements.command.value,
    cwd: elements.cwd.value,
    cols: Number(elements.cols.value),
    rows: Number(elements.rows.value)
  };
}

term.onData((data) => send({ type: 'input', data }));
elements.restart.addEventListener('click', () => {
  term.reset();
  term.resize(Number(elements.cols.value), Number(elements.rows.value));
  send(sessionOptions('restart'));
  term.focus();
});
elements.stop.addEventListener('click', () => send({ type: 'stop' }));
function requestResize() {
  const cols = Number(elements.cols.value);
  const rows = Number(elements.rows.value);
  if (!Number.isInteger(cols) || cols < 40 || cols > 240) return;
  if (!Number.isInteger(rows) || rows < 12 || rows > 80) return;
  term.resize(cols, rows);
  send({ type: 'resize', cols, rows });
}

for (const input of [elements.cols, elements.rows]) {
  input.addEventListener('input', requestResize);
}

connect();
