import assert from 'node:assert/strict';
import {
  MORSE_TABLE, buildTree, classifyPress, decode, dotDurationMs, encode,
  isValidPrefix, nextCandidates, sequencePrefixes
} from '../dist/assets/features/morse/morse-core.js';

for (const [char, code] of Object.entries(MORSE_TABLE)) {
  assert.equal(encode(char), code, `encode ${char}`);
  assert.equal(decode(code), char, `decode ${code}`);
}
assert.equal(decode('.-'), 'A');
assert.equal(decode('-...'), 'B');
assert.equal(decode('-----'), '0');
assert.equal(isValidPrefix('.-.'), true);
assert.equal(isValidPrefix('......'), false);
assert.deepEqual(nextCandidates('.'), { dot: 'I', dash: 'A' });
assert.deepEqual(sequencePrefixes('.-.'), ['.', '.-', '.-.']);
assert.equal(buildTree(4).length, 30);
assert.equal(Math.round(dotDurationMs(12)), 100);
assert.equal(classifyPress(120, 12), '.');
assert.equal(classifyPress(250, 12), '-');
console.log('morse-core tests passed');
