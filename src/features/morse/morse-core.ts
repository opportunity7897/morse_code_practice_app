export type MorseSymbol = '.' | '-';

export const MORSE_TABLE: Readonly<Record<string, string>> = Object.freeze({
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
});

const REVERSE_TABLE: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(Object.entries(MORSE_TABLE).map(([char, code]) => [code, char]))
);

export function encode(char: string): string | undefined {
  return MORSE_TABLE[char.toUpperCase()];
}

export function decode(sequence: string): string | undefined {
  return REVERSE_TABLE[sequence];
}

export function isValidPrefix(sequence: string): boolean {
  if (!sequence) return true;
  return Object.values(MORSE_TABLE).some(code => code.startsWith(sequence));
}

export function nextCandidates(sequence: string): { dot?: string; dash?: string } {
  return {
    dot: decode(sequence + '.'),
    dash: decode(sequence + '-')
  };
}

export function displaySequence(sequence: string): string {
  return sequence.replaceAll('.', '•').replaceAll('-', '—');
}

export function sequencePrefixes(sequence: string): string[] {
  const out: string[] = [];
  for (let i = 1; i <= sequence.length; i += 1) out.push(sequence.slice(0, i));
  return out;
}

export interface TreeNode {
  sequence: string;
  char?: string;
  depth: number;
  index: number;
}

export function buildTree(maxDepth: number): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const count = 2 ** depth;
    for (let index = 0; index < count; index += 1) {
      let sequence = '';
      for (let bit = depth - 1; bit >= 0; bit -= 1) {
        sequence += ((index >> bit) & 1) === 0 ? '.' : '-';
      }
      nodes.push({ sequence, char: decode(sequence), depth, index });
    }
  }
  return nodes;
}

export function learningPool(includeNumbers: boolean): string[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return includeNumbers ? [...letters, ...'0123456789'.split('')] : letters;
}

export function dotDurationMs(wpm: number): number {
  return 1200 / Math.max(5, Math.min(60, wpm));
}

export function classifyPress(durationMs: number, wpm: number): MorseSymbol {
  return durationMs < dotDurationMs(wpm) * 2 ? '.' : '-';
}

export function randomFromPool(pool: string[], weights?: number[]): string {
  if (!pool.length) return 'E';
  if (!weights || weights.length !== pool.length) {
    return pool[Math.floor(Math.random() * pool.length)] ?? 'E';
  }
  const safeWeights = weights.map(w => Math.max(0.01, w));
  const total = safeWeights.reduce((sum, w) => sum + w, 0);
  let cursor = Math.random() * total;
  for (let i = 0; i < pool.length; i += 1) {
    cursor -= safeWeights[i];
    if (cursor <= 0) return pool[i] ?? 'E';
  }
  return pool[pool.length - 1] ?? 'E';
}
