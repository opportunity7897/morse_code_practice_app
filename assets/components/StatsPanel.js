import { accuracy, averageMs } from '../storage/storage.js';
import { t } from '../i18n/i18n.js';
export function StatsPanel({ stats, language }) {
    const entries = Object.entries(stats);
    const attempts = entries.reduce((sum, [, stat]) => sum + stat.attempts, 0);
    const correct = entries.reduce((sum, [, stat]) => sum + stat.correct, 0);
    const totalMs = entries.reduce((sum, [, stat]) => sum + stat.totalMs, 0);
    const weak = entries
        .filter(([, stat]) => stat.attempts >= 2)
        .sort((a, b) => accuracy(a[1]) - accuracy(b[1]) || averageMs(b[1]) - averageMs(a[1]))
        .slice(0, 6)
        .map(([char]) => char);
    return (React.createElement("aside", { className: "stats-panel" },
        React.createElement("div", { className: "section-kicker" }, t(language, 'stats')),
        attempts === 0 ? (React.createElement("p", { className: "muted" }, t(language, 'noStats'))) : (React.createElement("div", { className: "stats-grid" },
            React.createElement("div", null,
                React.createElement("strong", null, attempts),
                React.createElement("span", null, t(language, 'attempts'))),
            React.createElement("div", null,
                React.createElement("strong", null,
                    Math.round((correct / attempts) * 100),
                    "%"),
                React.createElement("span", null, t(language, 'accuracy'))),
            React.createElement("div", null,
                React.createElement("strong", null,
                    (totalMs / attempts / 1000).toFixed(1),
                    "s"),
                React.createElement("span", null, t(language, 'avgTime'))),
            React.createElement("div", null,
                React.createElement("strong", null, weak.length ? weak.join(' ') : '—'),
                React.createElement("span", null, t(language, 'weakChars')))))));
}
//# sourceMappingURL=StatsPanel.js.map