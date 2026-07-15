process.stdout.write('\u001b[36mTUI_PROOF_SMOKE_READY\u001b[0m\r\n');

if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', (data) => {
  const input = data.toString();
  process.stdout.write(`received:${input.replace(/\r/g, '<enter>')}\r\n`);
  if (input.includes('q')) process.exit(0);
});

setInterval(() => {}, 1000);
