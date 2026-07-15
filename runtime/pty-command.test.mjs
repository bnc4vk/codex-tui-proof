import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPtyProcess } from './pty-command.mjs';

test('passes Unix executables and arguments directly', () => {
  assert.deepEqual(
    buildPtyProcess('node', ['app.mjs'], 'darwin'),
    { executable: 'node', args: ['app.mjs'] }
  );
});

test('uses a fixed PowerShell bridge on Windows', () => {
  const result = buildPtyProcess('node', ['app.mjs', 'value with spaces'], 'win32');
  assert.equal(result.executable, 'powershell.exe');
  assert.deepEqual(result.args.slice(-3), ['node', 'app.mjs', 'value with spaces']);
  assert.equal(result.args[0], '-NoLogo');
  assert.equal(result.args[3], '-Command');
  assert.match(result.args[4], /\$target/);
});
