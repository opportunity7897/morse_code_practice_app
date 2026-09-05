import type { Language } from '../storage/storage.js';
import { t } from '../i18n/i18n.js';

interface Props {
  language: Language;
  pressed: boolean;
  pressDuration: number;
  thresholdMs: number;
  onPressStart: () => void;
  onPressEnd: () => void;
  onDot: () => void;
  onDash: () => void;
  onCommit: () => void;
  onUndo: () => void;
  onClear: () => void;
}

export function Keyer(props: Props) {
  const {
    language, pressed, pressDuration, thresholdMs, onPressStart, onPressEnd,
    onDot, onDash, onCommit, onUndo, onClear
  } = props;
  const ratio = Math.min(1, pressDuration / Math.max(thresholdMs * 1.25, 1));

  return (
    <section className="keyer-card" aria-label="Morse keyer">
      <div className="keyer-heading">
        <div>
          <strong>{t(language, 'pressKey')}</strong>
          <span>{t(language, 'keyerHint')}</span>
        </div>
        <span className="threshold-label">{Math.round(thresholdMs)} ms</span>
      </div>
      <button
        type="button"
        className={`paddle ${pressed ? 'pressed' : ''}`}
        onPointerDown={(event: any) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
          onPressStart();
        }}
        onPointerUp={(event: any) => {
          event.preventDefault();
          onPressEnd();
        }}
        onPointerCancel={onPressEnd}
        onContextMenu={(event: any) => event.preventDefault()}
        aria-pressed={pressed}
      >
        <span className="paddle-symbol">{pressed && pressDuration >= thresholdMs ? '—' : '•'}</span>
        <span className="paddle-progress" style={{ transform: `scaleX(${ratio})` }} />
      </button>
      <div className="direct-controls">
        <span className="direct-label">{t(language, 'directInput')}</span>
        <button type="button" onClick={onDot}>• <small>{t(language, 'dot')}</small></button>
        <button type="button" onClick={onDash}>— <small>{t(language, 'dash')}</small></button>
        <button type="button" onClick={onUndo}>⌫ <small>{t(language, 'undo')}</small></button>
        <button type="button" onClick={onCommit}>↵ <small>{t(language, 'commit')}</small></button>
        <button type="button" className="quiet" onClick={onClear}>× <small>{t(language, 'clear')}</small></button>
      </div>
      <div className="keyboard-hint">{t(language, 'keyboardHint')}</div>
    </section>
  );
}
