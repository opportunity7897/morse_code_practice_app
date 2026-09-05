import { AudioEngine } from './audio/audio-engine.js';
import { Keyer } from './components/Keyer.js';
import { ModeTabs, type PracticeMode } from './components/ModeTabs.js';
import { MorseTree } from './components/MorseTree.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { StatsPanel } from './components/StatsPanel.js';
import {
  classifyPress, decode, displaySequence, dotDurationMs, encode, learningPool, randomFromPool
} from './features/morse/morse-core.js';
import { t } from './i18n/i18n.js';
import {
  accuracy, loadSettings, loadStats, practiceWeight, recordAttempt, resetStats,
  saveSettings, saveStats, type Settings, type StatsMap
} from './storage/storage.js';

const audio = new AudioEngine();

export function App() {
  const [settings, setSettings] = React.useState<Settings>(() => loadSettings());
  const [stats, setStats] = React.useState<StatsMap>(() => loadStats());
  const [mode, setMode] = React.useState<PracticeMode>('learn');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [sequence, setSequence] = React.useState('');
  const [pressed, setPressed] = React.useState(false);
  const [pressDuration, setPressDuration] = React.useState(0);
  const [feedback, setFeedback] = React.useState<'right' | 'wrong' | null>(null);
  const [transcript, setTranscript] = React.useState('');
  const [learnDepth, setLearnDepth] = React.useState(1);
  const [learnChar, setLearnChar] = React.useState('E');
  const [target, setTarget] = React.useState('E');
  const [listeningPlayed, setListeningPlayed] = React.useState(false);

  const pressStartedAt = React.useRef<number | null>(null);
  const pressTicker = React.useRef<number | null>(null);
  const questionStartedAt = React.useRef(performance.now());
  const commitTimer = React.useRef<number | null>(null);

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
    if (meta) meta.setAttribute('content', settings.theme === 'dark' ? '#202124' : '#f8fafd');
  }, [settings]);

  React.useEffect(() => saveStats(stats), [stats]);

  React.useEffect(() => {
    if (!settings.autoCommit || !sequence || pressed || mode === 'listening') return;
    if (commitTimer.current) window.clearTimeout(commitTimer.current);
    commitTimer.current = window.setTimeout(() => commitSequence(), autoCommitMs);
    return () => {
      if (commitTimer.current) window.clearTimeout(commitTimer.current);
    };
  }, [sequence, pressed, settings.autoCommit, autoCommitMs, mode]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const targetEl = event.target as HTMLElement | null;
      const typing = targetEl?.tagName === 'INPUT' || targetEl?.tagName === 'TEXTAREA' || targetEl?.tagName === 'SELECT';
      if (typing) return;
      if (event.code === 'Space') {
        if (!event.repeat && mode !== 'listening') {
          event.preventDefault();
          beginPress();
        }
        return;
      }
      if (event.key === '.' && mode !== 'listening') { event.preventDefault(); appendSymbol('.'); return; }
      if (event.key === '-' && mode !== 'listening') { event.preventDefault(); appendSymbol('-'); return; }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (mode === 'listening') void playListening(); else commitSequence();
        return;
      }
      if (event.key === 'Backspace' && mode !== 'listening') { event.preventDefault(); undoSymbol(); return; }
      if (event.key === 'Escape') { event.preventDefault(); clearInput(); setSettingsOpen(false); return; }
      if (mode === 'listening' && /^[a-zA-Z0-9]$/.test(event.key)) {
        const answer = event.key.toUpperCase();
        if (learningPool(settings.includeNumbers).includes(answer)) submitListening(answer);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
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
    if (mode === 'keying' || mode === 'listening') newQuestion();
  }, [mode, settings.includeNumbers]);

  function setAndPersistSettings(next: Settings) {
    setSettings(next);
  }

  function appendSymbol(symbol: '.' | '-') {
    if (sequence.length >= 5) return;
    setFeedback(null);
    setSequence(prev => prev + symbol);
    if (settings.soundEnabled) void audio.playElement(symbol, settings.wpm, settings.frequency, settings.volume);
  }

  function beginPress() {
    if (pressed || pressStartedAt.current !== null) return;
    setPressed(true);
    setFeedback(null);
    pressStartedAt.current = performance.now();
    setPressDuration(0);
    if (settings.soundEnabled) audio.startTone(settings.frequency, settings.volume);
    pressTicker.current = window.setInterval(() => {
      if (pressStartedAt.current !== null) setPressDuration(performance.now() - pressStartedAt.current);
    }, 16);
  }

  function endPress() {
    if (pressStartedAt.current === null) return;
    const duration = performance.now() - pressStartedAt.current;
    pressStartedAt.current = null;
    if (pressTicker.current) window.clearInterval(pressTicker.current);
    pressTicker.current = null;
    setPressed(false);
    setPressDuration(duration);
    audio.stopTone();
    const symbol = classifyPress(duration, settings.wpm);
    setSequence(prev => prev.length < 5 ? prev + symbol : prev);
  }

  function clearInput() {
    if (commitTimer.current) window.clearTimeout(commitTimer.current);
    setSequence('');
    setPressDuration(0);
  }

  function undoSymbol() {
    setSequence(prev => prev.slice(0, -1));
    setFeedback(null);
  }

  function commitSequence() {
    if (!sequence) return;
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
    if (pool.length > 1 && next === target) next = randomFromPool(pool, weights);
    setTarget(next);
    setFeedback(null);
    setListeningPlayed(false);
    setSequence('');
    questionStartedAt.current = performance.now();
  }

  async function playListening() {
    const code = encode(target);
    if (!code) return;
    setListeningPlayed(true);
    questionStartedAt.current = performance.now();
    if (settings.soundEnabled) await audio.playMorse(code, settings.wpm, settings.frequency, settings.volume);
  }

  function submitListening(answer: string) {
    if (!listeningPlayed) return;
    const correct = answer === target;
    const elapsed = performance.now() - questionStartedAt.current;
    setFeedback(correct ? 'right' : 'wrong');
    setStats(prev => recordAttempt(prev, target, correct, elapsed));
    window.setTimeout(() => newQuestion(), 700);
  }

  function chooseLearnChar(char: string) {
    setLearnChar(char);
    setSequence('');
    setFeedback(null);
    questionStartedAt.current = performance.now();
  }

  const targetTreeSequence = mode === 'learn' ? learnCode : '';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true"><span>•</span><span>—</span></div>
        <div className="brand-copy">
          <h1>{t(language, 'appTitle')}</h1>
          <p>{t(language, 'appSubtitle')}</p>
        </div>
        <div className="top-actions">
          <button type="button" className="lang-button" onClick={() => setAndPersistSettings({ ...settings, language: language === 'ja' ? 'en' : 'ja' })}>{language === 'ja' ? 'EN' : '日本語'}</button>
          <button type="button" className="icon-button settings-button" onClick={() => setSettingsOpen(true)} aria-label={t(language, 'settings')}>⚙</button>
        </div>
      </header>

      <main>
        <ModeTabs mode={mode} language={language} onChange={setMode} />
        <div className="workspace">
          <section className="primary-column">
            <ModeHeader mode={mode} language={language} target={target} feedback={feedback} listeningPlayed={listeningPlayed} onPlayListening={() => void playListening()} />

            {mode === 'learn' && (
              <LearnSelector
                language={language}
                selectedDepth={learnDepth}
                onDepth={setLearnDepth}
                selectedChar={learnChar}
                onChar={chooseLearnChar}
                includeNumbers={settings.includeNumbers}
              />
            )}

            <div className="input-summary">
              <div>
                <span>{t(language, 'currentInput')}</span>
                <strong className="morse-sequence">{sequence ? displaySequence(sequence) : '· · ·'}</strong>
              </div>
              <div className={`big-candidate ${feedback === 'right' ? 'ok' : feedback === 'wrong' ? 'bad' : ''}`}>
                <span>{t(language, 'currentCandidate')}</span>
                <strong>{candidate ?? '—'}</strong>
              </div>
              {settings.autoCommit && mode !== 'listening' && <div className="commit-indicator"><span>{t(language, 'autoCommitIn')}</span><strong>{Math.round(autoCommitMs)} {t(language, 'ms')}</strong></div>}
            </div>

            <MorseTree sequence={sequence} targetSequence={targetTreeSequence} showNumbers={settings.includeNumbers} language={language} />

            {mode === 'listening' ? (
              <ListeningAnswers language={language} includeNumbers={settings.includeNumbers} enabled={listeningPlayed} onAnswer={submitListening} />
            ) : (
              <Keyer
                language={language}
                pressed={pressed}
                pressDuration={pressDuration}
                thresholdMs={thresholdMs}
                onPressStart={beginPress}
                onPressEnd={endPress}
                onDot={() => appendSymbol('.')}
                onDash={() => appendSymbol('-')}
                onCommit={commitSequence}
                onUndo={undoSymbol}
                onClear={clearInput}
              />
            )}

            {mode === 'free' && (
              <section className="transcript-card">
                <div className="transcript-heading"><span>{t(language, 'transcript')}</span><button type="button" onClick={() => setTranscript(prev => prev.slice(0, -1))}>⌫ {t(language, 'backspaceTranscript')}</button></div>
                <div className={`transcript ${transcript ? '' : 'empty'}`}>{transcript || t(language, 'emptyTranscript')}</div>
              </section>
            )}
          </section>

          <div className="secondary-column">
            <StatsPanel stats={stats} language={language} />
            <QuickReference language={language} includeNumbers={settings.includeNumbers} />
          </div>
        </div>
      </main>

      <SettingsPanel
        open={settingsOpen}
        settings={settings}
        onChange={setAndPersistSettings}
        onClose={() => setSettingsOpen(false)}
        onResetStats={() => { resetStats(); setStats({}); }}
      />
    </div>
  );
}

function ModeHeader({ mode, language, target, feedback, listeningPlayed, onPlayListening }: {
  mode: PracticeMode; language: Settings['language']; target: string; feedback: 'right' | 'wrong' | null; listeningPlayed: boolean; onPlayListening: () => void;
}) {
  if (mode === 'learn') return <section className="mode-header"><div><span className="section-kicker">{t(language, 'learn')}</span><h2>{t(language, 'learnTitle')}</h2><p>{t(language, 'learnHelp')}</p></div></section>;
  if (mode === 'keying') return <section className="mode-header challenge"><div><span className="section-kicker">{t(language, 'keying')}</span><h2>{t(language, 'keyingTitle')}</h2></div><div className="target-char"><span>{t(language, 'target')}</span><strong>{target}</strong></div><Feedback feedback={feedback} language={language} target={target} /></section>;
  if (mode === 'listening') return <section className="mode-header challenge"><div><span className="section-kicker">{t(language, 'listening')}</span><h2>{t(language, 'listeningTitle')}</h2><p>{listeningPlayed ? t(language, 'chooseAnswer') : t(language, 'listeningReady')}</p></div><button type="button" className="play-button" onClick={onPlayListening}>▶ {listeningPlayed ? t(language, 'replay') : t(language, 'play')}</button><Feedback feedback={feedback} language={language} target={target} /></section>;
  return <section className="mode-header"><div><span className="section-kicker">{t(language, 'free')}</span><h2>{t(language, 'freeTitle')}</h2></div></section>;
}

function Feedback({ feedback, language, target }: { feedback: 'right' | 'wrong' | null; language: Settings['language']; target: string }) {
  if (!feedback) return null;
  return <div className={`feedback-chip ${feedback}`}>{feedback === 'right' ? `✓ ${t(language, 'feedbackRight')}` : `× ${t(language, 'feedbackWrong')} · ${t(language, 'expected')} ${target}`}</div>;
}

function LearnSelector({ language, selectedDepth, onDepth, selectedChar, onChar, includeNumbers }: {
  language: Settings['language']; selectedDepth: number; onDepth: (depth: number) => void; selectedChar: string; onChar: (char: string) => void; includeNumbers: boolean;
}) {
  const depths = includeNumbers ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
  const chars = learningPool(includeNumbers).filter(char => encode(char)?.length === selectedDepth);
  return (
    <section className="learn-selector">
      <div className="depth-tabs">
        {depths.map(depth => <button type="button" key={depth} className={selectedDepth === depth ? 'active' : ''} onClick={() => onDepth(depth)}>{t(language, depth === 5 ? 'depth5' : `depth${depth}`)}</button>)}
      </div>
      <div className="char-grid compact">
        {chars.map(char => <button type="button" key={char} className={selectedChar === char ? 'active' : ''} onClick={() => onChar(char)}><strong>{char}</strong><span>{displaySequence(encode(char) ?? '')}</span></button>)}
      </div>
      <div className="learn-selected"><span>{t(language, 'selectedCode')}</span><strong>{selectedChar}</strong><code>{displaySequence(encode(selectedChar) ?? '')}</code><small>{t(language, 'tryKeying')}</small></div>
    </section>
  );
}

function ListeningAnswers({ language, includeNumbers, enabled, onAnswer }: { language: Settings['language']; includeNumbers: boolean; enabled: boolean; onAnswer: (char: string) => void }) {
  return (
    <section className={`listening-answers ${enabled ? '' : 'disabled'}`}>
      <div className="listening-hint">{t(language, 'typeAnswer')}</div>
      <div className="char-grid answer-grid">
        {learningPool(includeNumbers).map(char => <button type="button" key={char} disabled={!enabled} onClick={() => onAnswer(char)}>{char}</button>)}
      </div>
    </section>
  );
}

function QuickReference({ language, includeNumbers }: { language: Settings['language']; includeNumbers: boolean }) {
  const pool = learningPool(includeNumbers);
  return (
    <aside className="reference-panel">
      <div className="section-kicker">Morse A–Z{includeNumbers ? ' / 0–9' : ''}</div>
      <div className="reference-grid">
        {pool.map(char => <div key={char}><strong>{char}</strong><code>{displaySequence(encode(char) ?? '')}</code></div>)}
      </div>
    </aside>
  );
}
