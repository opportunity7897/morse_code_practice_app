import { AudioEngine } from './audio/audio-engine.js';
import { Keyer } from './components/Keyer.js';
import { ModeTabs } from './components/ModeTabs.js';
import { MorseTree } from './components/MorseTree.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { StatsPanel } from './components/StatsPanel.js';
import { classifyPress, decode, displaySequence, dotDurationMs, encode, learningPool, randomFromPool } from './features/morse/morse-core.js';
import { t } from './i18n/i18n.js';
import { loadSettings, loadStats, practiceWeight, recordAttempt, resetStats, saveSettings, saveStats } from './storage/storage.js';
const audio = new AudioEngine();
export function App() {
    const [settings, setSettings] = React.useState(() => loadSettings());
    const [stats, setStats] = React.useState(() => loadStats());
    const [mode, setMode] = React.useState('learn');
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [sequence, setSequence] = React.useState('');
    const [pressed, setPressed] = React.useState(false);
    const [pressDuration, setPressDuration] = React.useState(0);
    const [feedback, setFeedback] = React.useState(null);
    const [transcript, setTranscript] = React.useState('');
    const [learnDepth, setLearnDepth] = React.useState(1);
    const [learnChar, setLearnChar] = React.useState('E');
    const [target, setTarget] = React.useState('E');
    const [listeningPlayed, setListeningPlayed] = React.useState(false);
    const pressStartedAt = React.useRef(null);
    const pressTicker = React.useRef(null);
    const questionStartedAt = React.useRef(performance.now());
    const commitTimer = React.useRef(null);
    const language = settings.language;
    const dotMs = dotDurationMs(settings.wpm);
    const thresholdMs = dotMs * 2;
    const autoCommitMs = Math.max(360, dotMs * 3);
    const candidate = decode(sequence);
    const learnCode = encode(learnChar) ?? '';
    const targetCode = encode(target) ?? '';
    React.useEffect(() => {
        saveSettings(settings);
        document.documentElement.lang = settings.language;
        document.documentElement.dataset.theme = settings.theme;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta)
            meta.setAttribute('content', settings.theme === 'dark' ? '#202124' : '#f8fafd');
    }, [settings]);
    React.useEffect(() => saveStats(stats), [stats]);
    React.useEffect(() => {
        if (!settings.autoCommit || !sequence || pressed || mode === 'listening')
            return;
        if (commitTimer.current)
            window.clearTimeout(commitTimer.current);
        commitTimer.current = window.setTimeout(() => commitSequence(), autoCommitMs);
        return () => {
            if (commitTimer.current)
                window.clearTimeout(commitTimer.current);
        };
    }, [sequence, pressed, settings.autoCommit, autoCommitMs, mode]);
    React.useEffect(() => {
        const onKeyDown = (event) => {
            const targetEl = event.target;
            const typing = targetEl?.tagName === 'INPUT' || targetEl?.tagName === 'TEXTAREA' || targetEl?.tagName === 'SELECT';
            if (typing)
                return;
            if (event.code === 'Space') {
                if (!event.repeat && mode !== 'listening') {
                    event.preventDefault();
                    beginPress();
                }
                return;
            }
            if (event.key === '.' && mode !== 'listening') {
                event.preventDefault();
                appendSymbol('.');
                return;
            }
            if (event.key === '-' && mode !== 'listening') {
                event.preventDefault();
                appendSymbol('-');
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                if (mode === 'listening')
                    void playListening();
                else
                    commitSequence();
                return;
            }
            if (event.key === 'Backspace' && mode !== 'listening') {
                event.preventDefault();
                undoSymbol();
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                clearInput();
                setSettingsOpen(false);
                return;
            }
            if (mode === 'listening' && /^[a-zA-Z0-9]$/.test(event.key)) {
                const answer = event.key.toUpperCase();
                if (learningPool(settings.includeNumbers).includes(answer))
                    submitListening(answer);
            }
        };
        const onKeyUp = (event) => {
            if (event.code === 'Space' && mode !== 'listening') {
                event.preventDefault();
                endPress();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    });
    React.useEffect(() => {
        clearInput();
        setFeedback(null);
        if (mode === 'keying' || mode === 'listening')
            newQuestion();
    }, [mode, settings.includeNumbers]);
    function setAndPersistSettings(next) {
        setSettings(next);
    }
    function appendSymbol(symbol) {
        if (sequence.length >= 5)
            return;
        setFeedback(null);
        setSequence(prev => prev + symbol);
        if (settings.soundEnabled)
            void audio.playElement(symbol, settings.wpm, settings.frequency, settings.volume);
    }
    function beginPress() {
        if (pressed || pressStartedAt.current !== null)
            return;
        setPressed(true);
        setFeedback(null);
        pressStartedAt.current = performance.now();
        setPressDuration(0);
        if (settings.soundEnabled)
            audio.startTone(settings.frequency, settings.volume);
        pressTicker.current = window.setInterval(() => {
            if (pressStartedAt.current !== null)
                setPressDuration(performance.now() - pressStartedAt.current);
        }, 16);
    }
    function endPress() {
        if (pressStartedAt.current === null)
            return;
        const duration = performance.now() - pressStartedAt.current;
        pressStartedAt.current = null;
        if (pressTicker.current)
            window.clearInterval(pressTicker.current);
        pressTicker.current = null;
        setPressed(false);
        setPressDuration(duration);
        audio.stopTone();
        const symbol = classifyPress(duration, settings.wpm);
        setSequence(prev => prev.length < 5 ? prev + symbol : prev);
    }
    function clearInput() {
        if (commitTimer.current)
            window.clearTimeout(commitTimer.current);
        setSequence('');
        setPressDuration(0);
    }
    function undoSymbol() {
        setSequence(prev => prev.slice(0, -1));
        setFeedback(null);
    }
    function commitSequence() {
        if (!sequence)
            return;
        const answer = decode(sequence);
        const elapsed = performance.now() - questionStartedAt.current;
        if (mode === 'free') {
            setTranscript(prev => prev + (answer ?? '·'));
            clearInput();
            return;
        }
        if (mode === 'learn') {
            const correct = answer === learnChar;
            setFeedback(correct ? 'right' : 'wrong');
            setStats(prev => recordAttempt(prev, learnChar, correct, elapsed));
            clearInput();
            questionStartedAt.current = performance.now();
            return;
        }
        if (mode === 'keying') {
            const correct = answer === target;
            setFeedback(correct ? 'right' : 'wrong');
            setStats(prev => recordAttempt(prev, target, correct, elapsed));
            clearInput();
            window.setTimeout(() => newQuestion(), 650);
        }
    }
    function newQuestion() {
        const pool = learningPool(settings.includeNumbers);
        const weights = settings.weakWeighting ? pool.map(char => practiceWeight(stats[char])) : undefined;
        let next = randomFromPool(pool, weights);
        if (pool.length > 1 && next === target)
            next = randomFromPool(pool, weights);
        setTarget(next);
        setFeedback(null);
        setListeningPlayed(false);
        setSequence('');
        questionStartedAt.current = performance.now();
    }
    async function playListening() {
        const code = encode(target);
        if (!code)
            return;
        setListeningPlayed(true);
        questionStartedAt.current = performance.now();
        if (settings.soundEnabled)
            await audio.playMorse(code, settings.wpm, settings.frequency, settings.volume);
    }
    function submitListening(answer) {
        if (!listeningPlayed)
            return;
        const correct = answer === target;
        const elapsed = performance.now() - questionStartedAt.current;
        setFeedback(correct ? 'right' : 'wrong');
        setStats(prev => recordAttempt(prev, target, correct, elapsed));
        window.setTimeout(() => newQuestion(), 700);
    }
    function chooseLearnChar(char) {
        setLearnChar(char);
        setSequence('');
        setFeedback(null);
        questionStartedAt.current = performance.now();
    }
    const targetTreeSequence = mode === 'learn' ? learnCode : '';
    return (React.createElement("div", { className: "app-shell" },
        React.createElement("header", { className: "topbar" },
            React.createElement("div", { className: "brand-mark", "aria-hidden": "true" },
                React.createElement("span", null, "\u2022"),
                React.createElement("span", null, "\u2014")),
            React.createElement("div", { className: "brand-copy" },
                React.createElement("h1", null, t(language, 'appTitle')),
                React.createElement("p", null, t(language, 'appSubtitle'))),
            React.createElement("div", { className: "top-actions" },
                React.createElement("button", { type: "button", className: "lang-button", onClick: () => setAndPersistSettings({ ...settings, language: language === 'ja' ? 'en' : 'ja' }) }, language === 'ja' ? 'EN' : '日本語'),
                React.createElement("button", { type: "button", className: "icon-button settings-button", onClick: () => setSettingsOpen(true), "aria-label": t(language, 'settings') }, "\u2699"))),
        React.createElement("main", null,
            React.createElement(ModeTabs, { mode: mode, language: language, onChange: setMode }),
            React.createElement("div", { className: "workspace" },
                React.createElement("section", { className: "primary-column" },
                    React.createElement(ModeHeader, { mode: mode, language: language, target: target, feedback: feedback, listeningPlayed: listeningPlayed, onPlayListening: () => void playListening() }),
                    mode === 'learn' && (React.createElement(LearnSelector, { language: language, selectedDepth: learnDepth, onDepth: setLearnDepth, selectedChar: learnChar, onChar: chooseLearnChar, includeNumbers: settings.includeNumbers })),
                    React.createElement("div", { className: "input-summary" },
                        React.createElement("div", null,
                            React.createElement("span", null, t(language, 'currentInput')),
                            React.createElement("strong", { className: "morse-sequence" }, sequence ? displaySequence(sequence) : '· · ·')),
                        React.createElement("div", { className: `big-candidate ${feedback === 'right' ? 'ok' : feedback === 'wrong' ? 'bad' : ''}` },
                            React.createElement("span", null, t(language, 'currentCandidate')),
                            React.createElement("strong", null, candidate ?? '—')),
                        settings.autoCommit && mode !== 'listening' && React.createElement("div", { className: "commit-indicator" },
                            React.createElement("span", null, t(language, 'autoCommitIn')),
                            React.createElement("strong", null,
                                Math.round(autoCommitMs),
                                " ",
                                t(language, 'ms')))),
                    React.createElement(MorseTree, { sequence: sequence, targetSequence: targetTreeSequence, showNumbers: settings.includeNumbers, language: language }),
                    mode === 'listening' ? (React.createElement(ListeningAnswers, { language: language, includeNumbers: settings.includeNumbers, enabled: listeningPlayed, onAnswer: submitListening })) : (React.createElement(Keyer, { language: language, pressed: pressed, pressDuration: pressDuration, thresholdMs: thresholdMs, onPressStart: beginPress, onPressEnd: endPress, onDot: () => appendSymbol('.'), onDash: () => appendSymbol('-'), onCommit: commitSequence, onUndo: undoSymbol, onClear: clearInput })),
                    mode === 'free' && (React.createElement("section", { className: "transcript-card" },
                        React.createElement("div", { className: "transcript-heading" },
                            React.createElement("span", null, t(language, 'transcript')),
                            React.createElement("button", { type: "button", onClick: () => setTranscript(prev => prev.slice(0, -1)) },
                                "\u232B ",
                                t(language, 'backspaceTranscript'))),
                        React.createElement("div", { className: `transcript ${transcript ? '' : 'empty'}` }, transcript || t(language, 'emptyTranscript'))))),
                React.createElement("div", { className: "secondary-column" },
                    React.createElement(StatsPanel, { stats: stats, language: language }),
                    React.createElement(QuickReference, { language: language, includeNumbers: settings.includeNumbers })))),
        React.createElement(SettingsPanel, { open: settingsOpen, settings: settings, onChange: setAndPersistSettings, onClose: () => setSettingsOpen(false), onResetStats: () => { resetStats(); setStats({}); } })));
}
function ModeHeader({ mode, language, target, feedback, listeningPlayed, onPlayListening }) {
    if (mode === 'learn')
        return React.createElement("section", { className: "mode-header" },
            React.createElement("div", null,
                React.createElement("span", { className: "section-kicker" }, t(language, 'learn')),
                React.createElement("h2", null, t(language, 'learnTitle')),
                React.createElement("p", null, t(language, 'learnHelp'))));
    if (mode === 'keying')
        return React.createElement("section", { className: "mode-header challenge" },
            React.createElement("div", null,
                React.createElement("span", { className: "section-kicker" }, t(language, 'keying')),
                React.createElement("h2", null, t(language, 'keyingTitle'))),
            React.createElement("div", { className: "target-char" },
                React.createElement("span", null, t(language, 'target')),
                React.createElement("strong", null, target)),
            React.createElement(Feedback, { feedback: feedback, language: language, target: target }));
    if (mode === 'listening')
        return React.createElement("section", { className: "mode-header challenge" },
            React.createElement("div", null,
                React.createElement("span", { className: "section-kicker" }, t(language, 'listening')),
                React.createElement("h2", null, t(language, 'listeningTitle')),
                React.createElement("p", null, listeningPlayed ? t(language, 'chooseAnswer') : t(language, 'listeningReady'))),
            React.createElement("button", { type: "button", className: "play-button", onClick: onPlayListening },
                "\u25B6 ",
                listeningPlayed ? t(language, 'replay') : t(language, 'play')),
            React.createElement(Feedback, { feedback: feedback, language: language, target: target }));
    return React.createElement("section", { className: "mode-header" },
        React.createElement("div", null,
            React.createElement("span", { className: "section-kicker" }, t(language, 'free')),
            React.createElement("h2", null, t(language, 'freeTitle'))));
}
function Feedback({ feedback, language, target }) {
    if (!feedback)
        return null;
    return React.createElement("div", { className: `feedback-chip ${feedback}` }, feedback === 'right' ? `✓ ${t(language, 'feedbackRight')}` : `× ${t(language, 'feedbackWrong')} · ${t(language, 'expected')} ${target}`);
}
function LearnSelector({ language, selectedDepth, onDepth, selectedChar, onChar, includeNumbers }) {
    const depths = includeNumbers ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
    const chars = learningPool(includeNumbers).filter(char => encode(char)?.length === selectedDepth);
    return (React.createElement("section", { className: "learn-selector" },
        React.createElement("div", { className: "depth-tabs" }, depths.map(depth => React.createElement("button", { type: "button", key: depth, className: selectedDepth === depth ? 'active' : '', onClick: () => onDepth(depth) }, t(language, depth === 5 ? 'depth5' : `depth${depth}`)))),
        React.createElement("div", { className: "char-grid compact" }, chars.map(char => React.createElement("button", { type: "button", key: char, className: selectedChar === char ? 'active' : '', onClick: () => onChar(char) },
            React.createElement("strong", null, char),
            React.createElement("span", null, displaySequence(encode(char) ?? ''))))),
        React.createElement("div", { className: "learn-selected" },
            React.createElement("span", null, t(language, 'selectedCode')),
            React.createElement("strong", null, selectedChar),
            React.createElement("code", null, displaySequence(encode(selectedChar) ?? '')),
            React.createElement("small", null, t(language, 'tryKeying')))));
}
function ListeningAnswers({ language, includeNumbers, enabled, onAnswer }) {
    return (React.createElement("section", { className: `listening-answers ${enabled ? '' : 'disabled'}` },
        React.createElement("div", { className: "listening-hint" }, t(language, 'typeAnswer')),
        React.createElement("div", { className: "char-grid answer-grid" }, learningPool(includeNumbers).map(char => React.createElement("button", { type: "button", key: char, disabled: !enabled, onClick: () => onAnswer(char) }, char)))));
}
function QuickReference({ language, includeNumbers }) {
    const pool = learningPool(includeNumbers);
    return (React.createElement("aside", { className: "reference-panel" },
        React.createElement("div", { className: "section-kicker" },
            "Morse A\u2013Z",
            includeNumbers ? ' / 0–9' : ''),
        React.createElement("div", { className: "reference-grid" }, pool.map(char => React.createElement("div", { key: char },
            React.createElement("strong", null, char),
            React.createElement("code", null, displaySequence(encode(char) ?? '')))))));
}
//# sourceMappingURL=App.js.map