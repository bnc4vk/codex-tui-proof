import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCommandLine } from './command-line.mjs';

test('parses executable and arguments', () => {
  assert.deepEqual(parseCommandLine('opencode --model fast'), ['opencode', '--model', 'fast']);
});

test('preserves quoted arguments and empty values', () => {
  assert.deepEqual(
    parseCommandLine('node "path with spaces/app.mjs" --label ""'),
    ['node', 'path with spaces/app.mjs', '--label', '']
  );
});

test('preserves ordinary Windows path separators', () => {
  assert.deepEqual(
    parseCommandLine('"C:\\Program Files\\nodejs\\node.exe" app.mjs'),
    ['C:\\Program Files\\nodejs\\node.exe', 'app.mjs']
  );
});

test('rejects an unterminated quote', () => {
  assert.throws(() => parseCommandLine('node "broken'), /Unterminated/);
});
