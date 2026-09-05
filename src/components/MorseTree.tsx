import { buildTree, decode, sequencePrefixes } from '../features/morse/morse-core.js';
import type { Language } from '../storage/storage.js';
import { t } from '../i18n/i18n.js';

interface Props {
  sequence: string;
  targetSequence?: string;
  showNumbers: boolean;
  language: Language;
}

const WIDTH = 1120;
const ROOT_Y = 50;
const LEVEL_GAP = 102;

function nodePoint(sequence: string): { x: number; y: number } {
  const depth = sequence.length;
  let index = 0;
  for (const symbol of sequence) index = index * 2 + (symbol === '-' ? 1 : 0);
  const count = 2 ** depth;
  return {
    x: ((index + 0.5) / count) * WIDTH,
    y: ROOT_Y + depth * LEVEL_GAP
  };
}

export function MorseTree({ sequence, targetSequence = '', showNumbers, language }: Props) {
  const maxDepth = showNumbers ? 5 : 4;
  const nodes = buildTree(maxDepth);
  const active = new Set(sequencePrefixes(sequence));
  const target = new Set(sequencePrefixes(targetSequence));
  const root = { x: WIDTH / 2, y: ROOT_Y };
  const height = ROOT_Y + maxDepth * LEVEL_GAP + 60;

  return (
    <div className="tree-shell">
      <div className="tree-caption">
        <span>{t(language, 'treeLegend')}</span>
        <span className="tree-scroll-hint">↔</span>
      </div>
      <div className="tree-scroll" tabIndex={0}>
        <svg className="morse-tree" viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label="Morse code tree">
          <g className="tree-connectors">
            {nodes.map(node => {
              const child = nodePoint(node.sequence);
              const parentSequence = node.sequence.slice(0, -1);
              const parent = parentSequence ? nodePoint(parentSequence) : root;
              const isActive = active.has(node.sequence);
              const isTarget = !isActive && target.has(node.sequence);
              return (
                <line
                  key={`edge-${node.sequence}`}
                  x1={parent.x}
                  y1={parent.y}
                  x2={child.x}
                  y2={child.y}
                  className={isActive ? 'edge-active' : isTarget ? 'edge-target' : ''}
                />
              );
            })}
          </g>
          <g>
            <circle cx={root.x} cy={root.y} r="21" className="tree-root" />
            <text x={root.x} y={root.y + 4} textAnchor="middle" className="tree-root-text">{t(language, 'start')}</text>
          </g>
          {nodes.map(node => {
            const p = nodePoint(node.sequence);
            const isCurrent = sequence === node.sequence;
            const isActive = active.has(node.sequence);
            const isTarget = !isActive && target.has(node.sequence);
            const char = node.char ?? '';
            const symbol = node.sequence.at(-1) === '.' ? '•' : '—';
            return (
              <g key={node.sequence} className={`tree-node ${isCurrent ? 'current' : ''} ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''}`}>
                <circle cx={p.x} cy={p.y} r={node.depth === 5 ? 15 : 18} />
                <text x={p.x} y={p.y + 5} textAnchor="middle" className="node-char">{char || '·'}</text>
                <text x={p.x} y={p.y - 26} textAnchor="middle" className="node-symbol">{symbol}</text>
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
