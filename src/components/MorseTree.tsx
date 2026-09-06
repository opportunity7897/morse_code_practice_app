import { decode, sequencePrefixes } from '../features/morse/morse-core.js';
import type { Language } from '../storage/storage.js';
import { t } from '../i18n/i18n.js';

interface Props {
  sequence: string;
  targetSequence?: string;
  showNumbers: boolean;
  language: Language;
}

const WIDTH = 760;
const HEIGHT = 540;
const ROOT = { x: 380, y: 116 };

type NodeKind = 'dot' | 'dash';
type LabelAnchor = 'start' | 'middle' | 'end';

interface PlateNode {
  sequence: string;
  char: string;
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

const NODE_BY_SEQUENCE = new Map(PLATE_NODES.map(node => [node.sequence, node]));

function parentPoint(sequence: string): { x: number; y: number } {
  if (sequence.length === 1) return ROOT;
  const parent = NODE_BY_SEQUENCE.get(sequence.slice(0, -1));
  return parent ? { x: parent.x, y: parent.y } : ROOT;
}

export function MorseTree({ sequence, targetSequence = '', showNumbers, language }: Props) {
  const active = new Set(sequencePrefixes(sequence));
  const target = new Set(sequencePrefixes(targetSequence));

  return (
    <div className="tree-shell">
      <div className="tree-caption">
        <span>{t(language, 'treeLegend')}</span>
        <span className="tree-scroll-hint">↔</span>
      </div>
      <div className="tree-scroll" tabIndex={0}>
        <svg className="morse-tree morse-plate" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Morse code tree">
          <rect className="plate-background" x="20" y="18" width="720" height="504" rx="24" />
          <text x="210" y="60" textAnchor="middle" className="plate-title">MORSE</text>
          <text x="550" y="60" textAnchor="middle" className="plate-title">CODE</text>
          <g className="tree-connectors">
            {PLATE_NODES.map(node => {
              const parent = parentPoint(node.sequence);
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
            <line x1={ROOT.x} y1="64" x2={ROOT.x} y2={ROOT.y + 4} />
            <path d={`M${ROOT.x - 28} 70 L${ROOT.x} 98 L${ROOT.x + 28} 70`} />
            <path d={`M${ROOT.x - 16} 70 L${ROOT.x} 86 L${ROOT.x + 16} 70`} />
            <circle cx={ROOT.x} cy={ROOT.y} r="5" />
          </g>
          {PLATE_NODES.map(node => {
            const isCurrent = sequence === node.sequence;
            const isActive = active.has(node.sequence);
            const isTarget = !isActive && target.has(node.sequence);
            const labelAnchor = node.labelAnchor ?? 'middle';
            return (
              <g
                key={node.sequence}
                className={`tree-node ${node.kind}-node ${isCurrent ? 'current' : ''} ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''}`}
              >
                <title>{node.char}: {node.sequence}</title>
                {node.kind === 'dot' ? (
                  <circle className="node-shape" cx={node.x} cy={node.y} r="19" />
                ) : node.orientation === 'vertical' ? (
                  <rect className="node-shape" x={node.x - 12} y={node.y - 25} width="24" height="50" rx="5" />
                ) : (
                  <rect className="node-shape" x={node.x - 27} y={node.y - 13} width="54" height="26" rx="5" />
                )}
                <text x={node.labelX} y={node.labelY} textAnchor={labelAnchor} className="node-label">{node.char}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="candidate-strip">
        <div><span>•</span><strong>{decode(sequence + '.') ?? t(language, 'candidateNone')}</strong></div>
        <div className="candidate-current"><span>{t(language, 'currentCandidate')}</span><strong>{decode(sequence) ?? t(language, 'candidateNone')}</strong></div>
        <div><span>—</span><strong>{decode(sequence + '-') ?? t(language, 'candidateNone')}</strong></div>
      </div>
    </div>
  );
}
