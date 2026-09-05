import type { Language, StatsMap } from '../storage/storage.js';
import { accuracy, averageMs } from '../storage/storage.js';
import { t } from '../i18n/i18n.js';

export function StatsPanel({ stats, language }: { stats: StatsMap; language: Language }) {
  const entries = Object.entries(stats);
  const attempts = entries.reduce((sum, [, stat]) => sum + stat.attempts, 0);
  const correct = entries.reduce((sum, [, stat]) => sum + stat.correct, 0);
  const totalMs = entries.reduce((sum, [, stat]) => sum + stat.totalMs, 0);
  const weak = entries
    .filter(([, stat]) => stat.attempts >= 2)
    .sort((a, b) => accuracy(a[1]) - accuracy(b[1]) || averageMs(b[1]) - averageMs(a[1]))
    .slice(0, 6)
    .map(([char]) => char);

  return (
    <aside className="stats-panel">
      <div className="section-kicker">{t(language, 'stats')}</div>
      {attempts === 0 ? (
        <p className="muted">{t(language, 'noStats')}</p>
      ) : (
        <div className="stats-grid">
          <div><strong>{attempts}</strong><span>{t(language, 'attempts')}</span></div>
          <div><strong>{Math.round((correct / attempts) * 100)}%</strong><span>{t(language, 'accuracy')}</span></div>
          <div><strong>{(totalMs / attempts / 1000).toFixed(1)}s</strong><span>{t(language, 'avgTime')}</span></div>
          <div><strong>{weak.length ? weak.join(' ') : '—'}</strong><span>{t(language, 'weakChars')}</span></div>
        </div>
      )}
    </aside>
  );
}
