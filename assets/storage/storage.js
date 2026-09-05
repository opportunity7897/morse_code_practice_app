const SETTINGS_KEY = 'morse-path-trainer.settings.v1';
const STATS_KEY = 'morse-path-trainer.stats.v1';
export function defaultLanguage() {
    return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}
export function defaultSettings() {
    return {
        language: defaultLanguage(),
        theme: 'system',
        wpm: 12,
        frequency: 650,
        volume: 0.22,
        soundEnabled: true,
        autoCommit: true,
        includeNumbers: false,
        weakWeighting: true
    };
}
export function loadSettings() {
    const fallback = defaultSettings();
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw)
            return fallback;
        return { ...fallback, ...JSON.parse(raw) };
    }
    catch {
        return fallback;
    }
}
export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
export function loadStats() {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        return raw ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
}
export function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
export function recordAttempt(stats, char, correct, elapsedMs) {
    const previous = stats[char] ?? { attempts: 0, correct: 0, totalMs: 0, lastSeen: 0 };
    return {
        ...stats,
        [char]: {
            attempts: previous.attempts + 1,
            correct: previous.correct + (correct ? 1 : 0),
            totalMs: previous.totalMs + Math.max(0, elapsedMs),
            lastSeen: Date.now()
        }
    };
}
export function accuracy(stat) {
    if (!stat?.attempts)
        return 0;
    return stat.correct / stat.attempts;
}
export function averageMs(stat) {
    if (!stat?.attempts)
        return 0;
    return stat.totalMs / stat.attempts;
}
export function practiceWeight(stat) {
    if (!stat || stat.attempts < 2)
        return 2.25;
    const missWeight = 1 + (1 - accuracy(stat)) * 4;
    const speedWeight = Math.min(1.5, averageMs(stat) / 3500);
    return missWeight + speedWeight;
}
export function resetStats() {
    localStorage.removeItem(STATS_KEY);
}
//# sourceMappingURL=storage.js.map