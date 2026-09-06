import assert from 'node:assert/strict';
import {
  MORSE_TABLE, WABUN_MORSE_TABLE, buildTree, classifyPress, decode, dotDurationMs, encode,
  isValidPrefix, learningPool, maxCodeLength, nextCandidates, normalizeCharacter, sequencePrefixes
} from '../dist/assets/features/morse/morse-core.js';

for (const [char, code] of Object.entries(MORSE_TABLE)) {
  assert.equal(encode(char), code, `encode ${char}`);
  assert.equal(decode(code), char, `decode ${code}`);
}
assert.equal(decode('.-'), 'A');
assert.equal(decode('-...'), 'B');
assert.equal(decode('-----'), '0');
assert.equal(decode('.', 'wabun'), 'ヘ');
assert.equal(decode('--.--', 'wabun'), 'ア');
assert.equal(encode('あ', 'wabun'), '--.--');
assert.equal(encode('0', 'wabun'), '-----');
assert.equal(normalizeCharacter('ｶ', 'wabun'), 'カ');
assert.equal(isValidPrefix('.-.'), true);
assert.equal(isValidPrefix('-.---', 'wabun'), true);
assert.equal(isValidPrefix('......'), false);
assert.deepEqual(nextCandidates('.'), { dot: 'I', dash: 'A' });
assert.deepEqual(nextCandidates('', 'wabun'), { dot: 'ヘ', dash: 'ム' });
assert.deepEqual(sequencePrefixes('.-.'), ['.', '.-', '.-.']);
assert.equal(buildTree(4).length, 30);
assert.equal(buildTree(5, 'wabun').find(node => node.sequence === '--.--')?.char, 'ア');
assert.equal(learningPool('wabun', false).includes('ン'), true);
assert.equal(learningPool('wabun', true).includes('〇'), true);
assert.equal(maxCodeLength('wabun', false), 5);
assert.equal(Math.round(dotDurationMs(12)), 100);
assert.equal(classifyPress(120, 12), '.');
assert.equal(classifyPress(250, 12), '-');

for (const [char, code] of Object.entries(WABUN_MORSE_TABLE)) {
  assert.equal(encode(char, 'wabun'), code, `wabun encode ${char}`);
  assert.equal(decode(code, 'wabun'), char, `wabun decode ${code}`);
}
console.log('morse-core tests passed');
