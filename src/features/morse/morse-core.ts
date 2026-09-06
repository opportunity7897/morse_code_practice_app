export type MorseSymbol = '.' | '-';
export type CodeSet = 'latin' | 'wabun';

export const LATIN_MORSE_TABLE: Readonly<Record<string, string>> = Object.freeze({
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
});

export const WABUN_MORSE_TABLE: Readonly<Record<string, string>> = Object.freeze({
  イ: '.-', ロ: '.-.-', ハ: '-...', ニ: '-.-.', ホ: '-..', ヘ: '.', ト: '..-..',
  チ: '..-.', リ: '--.', ヌ: '....', ル: '-.--.', ヲ: '.---', ワ: '-.-',
  カ: '.-..', ヨ: '--', タ: '-.', レ: '---', ソ: '---.', ツ: '.--.',
  ネ: '--.-', ナ: '.-.', ラ: '...', ム: '-', ウ: '..-', ヰ: '.-..-',
  ノ: '..--', オ: '.-...', ク: '...-', ヤ: '.--', マ: '-..-', ケ: '-.--',
  フ: '--..', コ: '----', エ: '-.---', テ: '.-.--', ア: '--.--',
  サ: '-.-.-', キ: '-.-..', ユ: '-..--', メ: '-...-', ミ: '..-.-',
  シ: '--.-.', ヱ: '.--..', ヒ: '--..-', モ: '-..-.', セ: '.---.',
  ス: '---.-', ン: '.-.-.', '゛': '..', '゜': '..--.',
  一: '.----', 二: '..---', 三: '...--', 四: '....-', 五: '.....',
  六: '-....', 七: '--...', 八: '---..', 九: '----.', '〇': '-----',
  'ー': '.--.-', '、': '.-.-.-', '」': '.-.-..', '（': '-.--.-', '）': '.-..-.'
});

export const MORSE_TABLE = LATIN_MORSE_TABLE;

const TABLE_BY_CODE_SET: Readonly<Record<CodeSet, Readonly<Record<string, string>>>> = Object.freeze({
  latin: LATIN_MORSE_TABLE,
  wabun: WABUN_MORSE_TABLE
});

const REVERSE_TABLE_BY_CODE_SET: Readonly<Record<CodeSet, Readonly<Record<string, string>>>> = Object.freeze({
  latin: reverseTable(LATIN_MORSE_TABLE),
  wabun: reverseTable(WABUN_MORSE_TABLE)
});

const LATIN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LATIN_DIGITS = '0123456789'.split('');
const WABUN_KANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲン'.split('');
const WABUN_MARKS = ['゛', '゜'];
const WABUN_DIGITS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '〇'];
const DIGIT_TO_WABUN: Readonly<Record<string, string>> = Object.freeze({
  '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
  '6': '六', '7': '七', '8': '八', '9': '九', '0': '〇'
});

function reverseTable(table: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(Object.entries(table).map(([char, code]) => [code, char])));
}

function tableFor(codeSet: CodeSet): Readonly<Record<string, string>> {
  return TABLE_BY_CODE_SET[codeSet];
}

export function normalizeCharacter(char: string, codeSet: CodeSet = 'latin'): string {
  const normalized = char.normalize('NFKC');
  if (codeSet === 'latin') return normalized.toUpperCase();
  if (DIGIT_TO_WABUN[normalized]) return DIGIT_TO_WABUN[normalized];
  if (normalized === 'ﾞ' || normalized === '゛' || normalized.includes('\u3099')) return '゛';
  if (normalized === 'ﾟ' || normalized === '゜' || normalized.includes('\u309A')) return '゜';
  if (normalized === '(') return '（';
  if (normalized === ')') return '）';
  const first = normalized[0] ?? '';
  const codePoint = first.codePointAt(0);
  if (codePoint !== undefined && codePoint >= 0x3041 && codePoint <= 0x3096) {
    return String.fromCodePoint(codePoint + 0x60);
  }
  return first;
}

export function encode(char: string, codeSet: CodeSet = 'latin'): string | undefined {
  return tableFor(codeSet)[normalizeCharacter(char, codeSet)];
}

export function decode(sequence: string, codeSet: CodeSet = 'latin'): string | undefined {
  return REVERSE_TABLE_BY_CODE_SET[codeSet][sequence];
}

export function isValidPrefix(sequence: string, codeSet: CodeSet = 'latin'): boolean {
  if (!sequence) return true;
  return Object.values(tableFor(codeSet)).some(code => code.startsWith(sequence));
}

export function nextCandidates(sequence: string, codeSet: CodeSet = 'latin'): { dot?: string; dash?: string } {
  return {
    dot: decode(sequence + '.', codeSet),
    dash: decode(sequence + '-', codeSet)
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

export function buildTree(maxDepth: number, codeSet: CodeSet = 'latin'): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const count = 2 ** depth;
    for (let index = 0; index < count; index += 1) {
      let sequence = '';
      for (let bit = depth - 1; bit >= 0; bit -= 1) {
        sequence += ((index >> bit) & 1) === 0 ? '.' : '-';
      }
      nodes.push({ sequence, char: decode(sequence, codeSet), depth, index });
    }
  }
  return nodes;
}

export function learningPool(codeSetOrIncludeNumbers: CodeSet | boolean, includeNumbers = false): string[] {
  const codeSet = typeof codeSetOrIncludeNumbers === 'boolean' ? 'latin' : codeSetOrIncludeNumbers;
  const numbers = typeof codeSetOrIncludeNumbers === 'boolean' ? codeSetOrIncludeNumbers : includeNumbers;
  if (codeSet === 'wabun') {
    return numbers ? [...WABUN_KANA, ...WABUN_MARKS, ...WABUN_DIGITS] : [...WABUN_KANA, ...WABUN_MARKS];
  }
  return numbers ? [...LATIN_LETTERS, ...LATIN_DIGITS] : [...LATIN_LETTERS];
}

export function maxCodeLength(codeSet: CodeSet, includeNumbers: boolean): number {
  return learningPool(codeSet, includeNumbers)
    .reduce((max, char) => Math.max(max, encode(char, codeSet)?.length ?? 0), 0);
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
