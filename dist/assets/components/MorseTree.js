import { buildTree, decode, sequencePrefixes } from '../features/morse/morse-core.js';
import { t } from '../i18n/i18n.js';
const WIDTH = 1120;
const ROOT_Y = 50;
const LEVEL_GAP = 102;
function nodePoint(sequence) {
    const depth = sequence.length;
    let index = 0;
    for (const symbol of sequence)
        index = index * 2 + (symbol === '-' ? 1 : 0);
    const count = 2 ** depth;
    return {
        x: ((index + 0.5) / count) * WIDTH,
        y: ROOT_Y + depth * LEVEL_GAP
    };
}
export function MorseTree({ sequence, targetSequence = '', showNumbers, language }) {
    const maxDepth = showNumbers ? 5 : 4;
    const nodes = buildTree(maxDepth);
    const active = new Set(sequencePrefixes(sequence));
    const target = new Set(sequencePrefixes(targetSequence));
    const root = { x: WIDTH / 2, y: ROOT_Y };
    const height = ROOT_Y + maxDepth * LEVEL_GAP + 60;
    return (React.createElement("div", { className: "tree-shell" },
        React.createElement("div", { className: "tree-caption" },
            React.createElement("span", null, t(language, 'treeLegend')),
            React.createElement("span", { className: "tree-scroll-hint" }, "\u2194")),
        React.createElement("div", { className: "tree-scroll", tabIndex: 0 },
            React.createElement("svg", { className: "morse-tree", viewBox: `0 0 ${WIDTH} ${height}`, role: "img", "aria-label": "Morse code tree" },
                React.createElement("g", { className: "tree-connectors" }, nodes.map(node => {
                    const child = nodePoint(node.sequence);
                    const parentSequence = node.sequence.slice(0, -1);
                    const parent = parentSequence ? nodePoint(parentSequence) : root;
                    const isActive = active.has(node.sequence);
                    const isTarget = !isActive && target.has(node.sequence);
                    return (React.createElement("line", { key: `edge-${node.sequence}`, x1: parent.x, y1: parent.y, x2: child.x, y2: child.y, className: isActive ? 'edge-active' : isTarget ? 'edge-target' : '' }));
                })),
                React.createElement("g", null,
                    React.createElement("circle", { cx: root.x, cy: root.y, r: "21", className: "tree-root" }),
                    React.createElement("text", { x: root.x, y: root.y + 4, textAnchor: "middle", className: "tree-root-text" }, t(language, 'start'))),
                nodes.map(node => {
                    const p = nodePoint(node.sequence);
                    const isCurrent = sequence === node.sequence;
                    const isActive = active.has(node.sequence);
                    const isTarget = !isActive && target.has(node.sequence);
                    const char = node.char ?? '';
                    const symbol = node.sequence.at(-1) === '.' ? '•' : '—';
                    return (React.createElement("g", { key: node.sequence, className: `tree-node ${isCurrent ? 'current' : ''} ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''}` },
                        React.createElement("circle", { cx: p.x, cy: p.y, r: node.depth === 5 ? 15 : 18 }),
                        React.createElement("text", { x: p.x, y: p.y + 5, textAnchor: "middle", className: "node-char" }, char || '·'),
                        React.createElement("text", { x: p.x, y: p.y - 26, textAnchor: "middle", className: "node-symbol" }, symbol)));
                }))),
        React.createElement("div", { className: "candidate-strip" },
            React.createElement("div", null,
                React.createElement("span", null, "\u2022"),
                React.createElement("strong", null, decode(sequence + '.') ?? t(language, 'candidateNone'))),
            React.createElement("div", { className: "candidate-current" },
                React.createElement("span", null, t(language, 'currentCandidate')),
                React.createElement("strong", null, decode(sequence) ?? t(language, 'candidateNone'))),
            React.createElement("div", null,
                React.createElement("span", null, "\u2014"),
                React.createElement("strong", null, decode(sequence + '-') ?? t(language, 'candidateNone'))))));
}
//# sourceMappingURL=MorseTree.js.map