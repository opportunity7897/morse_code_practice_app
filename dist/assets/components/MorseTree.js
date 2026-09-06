import { decode, encode, learningPool, maxCodeLength, sequencePrefixes } from '../features/morse/morse-core.js';
import { t } from '../i18n/i18n.js';
const WIDTH = 760;
const HEIGHT = 540;
const ROOT = { x: 380, y: 116 };
const PLATE_NODES = [
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
const PLATE_LAYOUT = {
    nodes: PLATE_NODES,
    nodeBySequence: new Map(PLATE_NODES.map(node => [node.sequence, node])),
    root: ROOT,
    height: HEIGHT,
    generated: false
};
function createGeneratedLayout(codeSet, includeNumbers) {
    const visibleChars = learningPool(codeSet, includeNumbers);
    const sequenceToChar = new Map();
    const sequences = new Set();
    for (const char of visibleChars) {
        const code = encode(char, codeSet);
        if (!code)
            continue;
        sequenceToChar.set(code, char);
        for (let i = 1; i <= code.length; i += 1)
            sequences.add(code.slice(0, i));
    }
    const childMap = new Map();
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
    const leaves = [];
    function collectLeaves(sequence = '') {
        const children = childMap.get(sequence) ?? [];
        if (!children.length) {
            if (sequence)
                leaves.push(sequence);
            return;
        }
        for (const child of children)
            collectLeaves(child);
    }
    collectLeaves();
    const margin = 44;
    const leafStep = (WIDTH - margin * 2) / Math.max(1, leaves.length - 1);
    const points = new Map();
    let leafIndex = 0;
    function place(sequence = '', depth = 0) {
        const children = childMap.get(sequence) ?? [];
        let x = root.x;
        if (!children.length) {
            x = margin + leafIndex * leafStep;
            leafIndex += 1;
        }
        else {
            const childXs = children.map(child => place(child, depth + 1));
            x = childXs.reduce((sum, childX) => sum + childX, 0) / childXs.length;
        }
        if (sequence)
            points.set(sequence, { x, y: root.y + depth * 82 });
        return x;
    }
    place();
    const nodes = [...sequences]
        .sort((a, b) => a.length - b.length || a.localeCompare(b))
        .map((nodeSequence) => {
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
function symbolOrder(symbol) {
    return symbol === '-' ? 0 : 1;
}
function parentPoint(sequence, layout) {
    if (sequence.length === 1)
        return layout.root;
    const parent = layout.nodeBySequence.get(sequence.slice(0, -1));
    return parent ? { x: parent.x, y: parent.y } : layout.root;
}
export function MorseTree({ sequence, targetSequence = '', showNumbers, codeSet, language }) {
    const active = new Set(sequencePrefixes(sequence));
    const target = new Set(sequencePrefixes(targetSequence));
    const layout = codeSet === 'latin' && !showNumbers ? PLATE_LAYOUT : createGeneratedLayout(codeSet, showNumbers);
    return (React.createElement("div", { className: "tree-shell" },
        React.createElement("div", { className: "tree-caption" },
            React.createElement("span", null, t(language, 'treeLegend')),
            React.createElement("span", { className: "tree-scroll-hint" }, "\u2194")),
        React.createElement("div", { className: "tree-scroll", tabIndex: 0 },
            React.createElement("svg", { className: `morse-tree morse-plate ${layout.generated ? 'generated-plate' : 'photo-plate'}`, viewBox: `0 0 ${WIDTH} ${layout.height}`, role: "img", "aria-label": "Morse code tree" },
                React.createElement("rect", { className: "plate-background", x: "20", y: "18", width: "720", height: layout.height - 36, rx: "24" }),
                React.createElement("text", { x: "210", y: "60", textAnchor: "middle", className: "plate-title" }, layout.generated && codeSet === 'wabun' ? 'WABUN' : 'MORSE'),
                React.createElement("text", { x: "550", y: "60", textAnchor: "middle", className: "plate-title" }, "CODE"),
                React.createElement("g", { className: "tree-connectors" }, layout.nodes.map(node => {
                    const parent = parentPoint(node.sequence, layout);
                    const isActive = active.has(node.sequence);
                    const isTarget = !isActive && target.has(node.sequence);
                    return (React.createElement("line", { key: `edge-${node.sequence}`, x1: parent.x, y1: parent.y, x2: node.x, y2: node.y, className: isActive ? `edge-active edge-active-${node.kind}` : isTarget ? 'edge-target' : '' }));
                })),
                React.createElement("g", { className: "tree-transmitter", "aria-hidden": "true" },
                    React.createElement("line", { x1: layout.root.x, y1: "64", x2: layout.root.x, y2: layout.root.y + 4 }),
                    React.createElement("path", { d: `M${layout.root.x - 28} 70 L${layout.root.x} 98 L${layout.root.x + 28} 70` }),
                    React.createElement("path", { d: `M${layout.root.x - 16} 70 L${layout.root.x} 86 L${layout.root.x + 16} 70` }),
                    React.createElement("circle", { cx: layout.root.x, cy: layout.root.y, r: "5" })),
                layout.nodes.map(node => {
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
                    return (React.createElement("g", { key: node.sequence, className: `tree-node ${node.kind}-node ${isCurrent ? 'current' : ''} ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''}` },
                        React.createElement("title", null,
                            node.char ? `${node.char}: ` : '',
                            node.sequence),
                        node.kind === 'dot' ? (React.createElement("circle", { className: "node-shape", cx: node.x, cy: node.y, r: dotRadius })) : node.orientation === 'vertical' ? (React.createElement("rect", { className: "node-shape", x: node.x - verticalDashWidth / 2, y: node.y - verticalDashHeight / 2, width: verticalDashWidth, height: verticalDashHeight, rx: "5" })) : (React.createElement("rect", { className: "node-shape", x: node.x - dashWidth / 2, y: node.y - dashHeight / 2, width: dashWidth, height: dashHeight, rx: "5" })),
                        showLabel && (React.createElement("text", { x: node.labelX, y: node.labelY, textAnchor: labelAnchor, className: "node-label" }, node.char))));
                }))),
        React.createElement("div", { className: "candidate-strip" },
            React.createElement("div", null,
                React.createElement("span", null, "\u2022"),
                React.createElement("strong", null, decode(sequence + '.', codeSet) ?? t(language, 'candidateNone'))),
            React.createElement("div", { className: "candidate-current" },
                React.createElement("span", null, t(language, 'currentCandidate')),
                React.createElement("strong", null, decode(sequence, codeSet) ?? t(language, 'candidateNone'))),
            React.createElement("div", null,
                React.createElement("span", null, "\u2014"),
                React.createElement("strong", null, decode(sequence + '-', codeSet) ?? t(language, 'candidateNone'))))));
}
//# sourceMappingURL=MorseTree.js.map