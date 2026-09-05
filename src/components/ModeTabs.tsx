import type { Language } from '../storage/storage.js';
import { t } from '../i18n/i18n.js';

export type PracticeMode = 'learn' | 'keying' | 'listening' | 'free';

interface Props {
  mode: PracticeMode;
  language: Language;
  onChange: (mode: PracticeMode) => void;
}

const MODES: PracticeMode[] = ['learn', 'keying', 'listening', 'free'];

export function ModeTabs({ mode, language, onChange }: Props) {
  return (
    <div className="mode-tabs" role="tablist" aria-label="Practice mode">
      {MODES.map(item => (
        <button
          key={item}
          type="button"
          className={`mode-tab ${mode === item ? 'active' : ''}`}
          role="tab"
          aria-selected={mode === item}
          onClick={() => onChange(item)}
        >
          <span>{t(language, item)}</span>
          <small>{t(language, `modeHelp${item[0].toUpperCase()}${item.slice(1)}`)}</small>
        </button>
      ))}
    </div>
  );
}
