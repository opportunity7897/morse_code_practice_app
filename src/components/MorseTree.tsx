import { decode, encode, learningPool, maxCodeLength, sequencePrefixes, type CodeSet } from '../features/morse/morse-core.js';
import type { Language } from '../storage/storage.js';
import { t } from '../i18n/i18n.js';

interface Props {
  sequence: string;
  targetSequence?: string;
  showNumbers: boolean;
  codeSet: CodeSet;
  language: Language;
}

const WIDTH = 760;
const HEIGHT = 540;
const ROOT = { x: 380, y: 116 };

type NodeKind = 'dot' | 'dash';
type LabelAnchor = 'start' | 'middle' | 'end';

interface PlateNode {
  sequence: string;
  char?: string;
  kind: NodeKind;
  orientation?: 'horizontal' | 'vertical';
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAnchor?: LabelAnchor;
}

const PLATE_NODES: PlateNode[] = [
  { sequence: '---', char: 'O', kind: 'dash', x: 120, y: 116, labelX: 120, labelY: 94 },
  { sequence: '--', char: 'M', kind: 'dash', x: 220, y: 116, labelX: 220, labelY: 94 },
  { sequence: '-', char: 'T', kind: 'dash', x: 320, y: 116, labelX: 320, labelY: 94 },
  { sequence: '.', char: 'E', kind: 'dot', x: 430, y: 116, labelX: 430, labelY: 94 },
  { sequence: '..', char: 'I', kind: 'dot', x: 500, y: 116, labelX: 500, labelY: 94 },
  { sequence: '...', char: 'S', kind: 'dot', x: 570, y: 116, labelX: 570, labelY: 94 },
  { sequence: '....', char: 'H', kind: 'dot', x: 640, y: 116, labelX: 640, labelY: 94 },

  { sequence: '--.', char: 'G', kind: 'dot', x: 220, y: 188, labelX: 252, labelY: 197, labelAnchor: 'start' },
  { sequence: '--.-', char: 'Q', kind: 'dash', x: 120, y: 188, labelX: 120, labelY: 228 },
  { sequence: '--..', char: 'Z', kind: 'dot', x: 220, y: 260, labelX: 252, labelY: 269, labelAnchor: 'start' },

  { sequence: '-.', char: 'N', kind: 'dot', x: 320, y: 332, labelX: 352, labelY: 341, labelAnchor: 'start' },
  { sequence: '-.-', char: 'K', kind: 'dash', x: 220, y: 332, labelX: 220, labelY: 298 },
  { sequence: '-.--', char: 'Y', kind: 'dash', x: 120, y: 332, labelX: 120, labelY: 298 },
  { sequence: '-.-.', char: 'C', kind: 'dot', x: 220, y: 404, labelX: 252, labelY: 413, labelAnchor: 'start' },
  { sequence: '-..', char: 'D', kind: 'dot', x: 320, y: 436, labelX: 352, labelY: 445, labelAnchor: 'start' },
  { sequence: '-..-', char: 'X', kind: 'dash', x: 220, y: 436, labelX: 188, labelY: 445, labelAnchor: 'end' },
  { sequence: '-...', char: 'B', kind: 'dot', x: 320, y: 500, labelX: 288, labelY: 509, labelAnchor: 'end' },

  { sequence: '..-', char: 'U', kind: 'dash', orientation: 'vertical', x: 500, y: 188, labelX: 468, labelY: 197, labelAnchor: 'end' },
  { sequence: '..-.', char: 'F', kind: 'dot', x: 500, y: 260, labelX: 500, labelY: 300 },
  { sequence: '...-', char: 'V', kind: 'dash', orientation: 'vertical', x: 570, y: 188, labelX: 602, labelY: 197, labelAnchor: 'start' },

  { sequence: '.-', char: 'A', kind: 'dash', orientation: 'vertical', x: 430, y: 332, labelX: 398, labelY: 341, labelAnchor: 'end' },
  { sequence: '.-.', char: 'R', kind: 'dot', x: 500, y: 332, labelX: 500, labelY: 372 },
  { sequence: '.-..', char: 'L', kind: 'dot', x: 570, y: 332, labelX: 602, labelY: 341, labelAnchor: 'start' },
  { sequence: '.--', char: 'W', kind: 'dash', orientation: 'vertical', x: 430, y: 436, labelX: 398, labelY: 445, labelAnchor: 'end' },
  { sequence: '.--.', char: 'P', kind: 'dot', x: 500, y: 436, labelX: 532, labelY: 445, labelAnchor: 'start' },
  { sequence: '.---', char: 'J', kind: 'dash', orientation: 'vertical', x: 430, y: 500, labelX: 462, labelY: 509, labelAnchor: 'start' }
];

interface TreeLayout {
  nodes: PlateNode[];
  nodeBySequence: Map<string, PlateNode>;
  root: { x: number; y: number };
  height: number;
  generated: boolean;
}

const PLATE_LAYOUT: TreeLayout = {
  nodes: PLATE_NODES,
  nodeBySequence: new Map(PLATE_NODES.map(node => [node.sequence, node])),
  root: ROOT,
  height: HEIGHT,
  generated: false
};

function createGeneratedLayout(codeSet: CodeSet, includeNumbers: boolean): TreeLayout {
  const visibleChars = learningPool(codeSet, includeNumbers);
  const sequenceToChar = new Map<string, string>();
  const sequences = new Set<string>();

  for (const char of visibleChars) {
    const code = encode(char, codeSet);
    if (!code) continue;
    sequenceToChar.set(code, char);
    for (let i = 1; i <= code.length; i += 1) sequences.add(code.slice(0, i));
  }

  const childMap = new Map<string, string[]>();
  for (const sequence of sequences) {
    const parent = sequence.slice(0, -1);
    const children = childMap.get(parent) ?? [];
    children.push(sequence);
    childMap.set(parent, children);
  }

  for (const children of childMap.values()) {
    children.sort((a, b) => symbolOrder(a.at(-1)) - symbolOrder(b.at(-1)));
  }

  const root = { x: WIDTH / 2, y: 82 };
  const maxDepth = Math.max(1, maxCodeLength(codeSet, includeNumbers));
  const height = Math.max(HEIGHT, root.y + maxDepth * 82 + 58);
  const leaves: string[] = [];

  function collectLeaves(sequence = '') {
    const children = childMap.get(sequence) ?? [];
    if (!children.length) {
      if (sequence) leaves.push(sequence);
      return;
    }
    for (const child of children) collectLeaves(child);
  }

  collectLeaves();

  const margin = 44;
  const leafStep = (WIDTH - margin * 2) / Math.max(1, leaves.length - 1);
  const points = new Map<string, { x: number; y: number }>();
  let leafIndex = 0;

  function place(sequence = '', depth = 0): number {
    const children = childMap.get(sequence) ?? [];
    let x = root.x;
    if (!children.length) {
      x = margin + leafIndex * leafStep;
      leafIndex += 1;
    } else {
      const childXs = children.map(child => place(child, depth + 1));
      x = childXs.reduce((sum, childX) => sum + childX, 0) / childXs.length;
    }
    if (sequence) points.set(sequence, { x, y: root.y + depth * 82 });
    return x;
  }

  place();

  const nodes = [...sequences]
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .map((nodeSequence): PlateNode => {
      const point = points.get(nodeSequence) ?? root;
      return {
        sequence: nodeSequence,
        char: sequenceToChar.get(nodeSequence),
        kind: nodeSequence.at(-1) === '.' ? 'dot' : 'dash',
        x: point.x,
        y: point.y,
        labelX: point.x,
        labelY: point.y + 33
      };
    });

  return {
    nodes,
    nodeBySequence: new Map(nodes.map(node => [node.sequence, node])),
    root,
    height,
    generated: true
  };
}

function symbolOrder(symbol?: string): number {
  return symbol === '-' ? 0 : 1;
}

function parentPoint(sequence: string, layout: TreeLayout): { x: number; y: number } {
  if (sequence.length === 1) return layout.root;
  const parent = layout.nodeBySequence.get(sequence.slice(0, -1));
  return parent ? { x: parent.x, y: parent.y } : layout.root;
}

export function MorseTree({ sequence, targetSequence = '', showNumbers, codeSet, language }: Props) {
  const active = new Set(sequencePrefixes(sequence));
  const target = new Set(sequencePrefixes(targetSequence));
  const layout = codeSet === 'latin' && !showNumbers ? PLATE_LAYOUT : createGeneratedLayout(codeSet, showNumbers);

  return (
    <div className="tree-shell">
      <div className="tree-caption">
        <span>{t(language, 'treeLegend')}</span>
        <span className="tree-scroll-hint">↔</span>
      </div>
      <div className="tree-scroll" tabIndex={0}>
        <svg className={`morse-tree morse-plate ${layout.generated ? 'generated-plate' : 'photo-plate'}`} viewBox={`0 0 ${WIDTH} ${layout.height}`} role="img" aria-label="Morse code tree">
          <rect className="plate-background" x="20" y="18" width="720" height={layout.height - 36} rx="24" />
          <text x="210" y="60" textAnchor="middle" className="plate-title">{layout.generated && codeSet === 'wabun' ? 'WABUN' : 'MORSE'}</text>
          <text x="550" y="60" textAnchor="middle" className="plate-title">CODE</text>
          <g className="tree-connectors">
            {layout.nodes.map(node => {
              const parent = parentPoint(node.sequence, layout);
              const isActive = active.has(node.sequence);
              const isTarget = !isActive && target.has(node.sequence);
              return (
                <line
                  key={`edge-${node.sequence}`}
                  x1={parent.x}
                  y1={parent.y}
                  x2={node.x}
                  y2={node.y}
                  className={isActive ? `edge-active edge-active-${node.kind}` : isTarget ? 'edge-target' : ''}
                />
              );
            })}
          </g>
          <g className="tree-transmitter" aria-hidden="true">
            <line x1={layout.root.x} y1="64" x2={layout.root.x} y2={layout.root.y + 4} />
            <path d={`M${layout.root.x - 28} 70 L${layout.root.x} 98 L${layout.root.x + 28} 70`} />
            <path d={`M${layout.root.x - 16} 70 L${layout.root.x} 86 L${layout.root.x + 16} 70`} />
            <circle cx={layout.root.x} cy={layout.root.y} r="5" />
          </g>
          {layout.nodes.map(node => {
            const isCurrent = sequence === node.sequence;
            const isActive = active.has(node.sequence);
            const isTarget = !isActive && target.has(node.sequence);
            const labelAnchor = node.labelAnchor ?? 'middle';
            const showLabel = node.char && (!layout.generated || node.sequence.length <= 2 || isActive || isTarget || isCurrent);
            const dotRadius = layout.generated ? 10 : 19;
            const dashWidth = layout.generated ? 26 : 54;
            const dashHeight = layout.generated ? 16 : 26;
            const verticalDashWidth = layout.generated ? 18 : 24;
            const verticalDashHeight = layout.generated ? 38 : 50;
            return (
              <g
                key={node.sequence}
                className={`tree-node ${node.kind}-node ${isCurrent ? 'current' : ''} ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''}`}
              >
                <title>{node.char ? `${node.char}: ` : ''}{node.sequence}</title>
                {node.kind === 'dot' ? (
                  <circle className="node-shape" cx={node.x} cy={node.y} r={dotRadius} />
                ) : node.orientation === 'vertical' ? (
                  <rect className="node-shape" x={node.x - verticalDashWidth / 2} y={node.y - verticalDashHeight / 2} width={verticalDashWidth} height={verticalDashHeight} rx="5" />
                ) : (
                  <rect className="node-shape" x={node.x - dashWidth / 2} y={node.y - dashHeight / 2} width={dashWidth} height={dashHeight} rx="5" />
                )}
                {showLabel && (
                  <text x={node.labelX} y={node.labelY} textAnchor={labelAnchor} className="node-label">{node.char}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="candidate-strip">
        <div><span>•</span><strong>{decode(sequence + '.', codeSet) ?? t(language, 'candidateNone')}</strong></div>
        <div className="candidate-current"><span>{t(language, 'currentCandidate')}</span><strong>{decode(sequence, codeSet) ?? t(language, 'candidateNone')}</strong></div>
        <div><span>—</span><strong>{decode(sequence + '-', codeSet) ?? t(language, 'candidateNone')}</strong></div>
      </div>
    </div>
  );
}
