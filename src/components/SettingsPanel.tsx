import type { Language, Settings, ThemeSetting } from '../storage/storage.js';
import type { CodeSet } from '../features/morse/morse-core.js';
import { t } from '../i18n/i18n.js';

interface Props {
  open: boolean;
  settings: Settings;
  onChange: (next: Settings) => void;
  onClose: () => void;
  onResetStats: () => void;
}

export function SettingsPanel({ open, settings, onChange, onClose, onResetStats }: Props) {
  if (!open) return null;
  const language = settings.language;
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value });

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event: any) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="settings-panel" role="dialog" aria-modal="true" aria-label={t(language, 'settings')}>
        <div className="dialog-header">
          <h2>{t(language, 'settings')}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t(language, 'close')}>×</button>
        </div>
        <div className="setting-row">
          <label>{t(language, 'language')}</label>
          <div className="segmented">
            {(['ja', 'en'] as Language[]).map(item => (
              <button type="button" key={item} className={settings.language === item ? 'active' : ''} onClick={() => update('language', item)}>{item === 'ja' ? '日本語' : 'English'}</button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <label>{t(language, 'codeSet')}</label>
          <div className="segmented">
            {(['latin', 'wabun'] as CodeSet[]).map(item => (
              <button type="button" key={item} className={settings.codeSet === item ? 'active' : ''} onClick={() => update('codeSet', item)}>{t(language, `codeSet${item}`)}</button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <label>{t(language, 'theme')}</label>
          <div className="segmented">
            {(['system', 'light', 'dark'] as ThemeSetting[]).map(item => (
              <button type="button" key={item} className={settings.theme === item ? 'active' : ''} onClick={() => update('theme', item)}>{t(language, item)}</button>
            ))}
          </div>
        </div>
        <label className="range-row">
          <span>{t(language, 'wpm')} <strong>{settings.wpm}</strong></span>
          <input type="range" min="5" max="35" step="1" value={settings.wpm} onChange={(e: any) => update('wpm', Number(e.currentTarget.value))} />
        </label>
        <label className="range-row">
          <span>{t(language, 'frequency')} <strong>{settings.frequency} Hz</strong></span>
          <input type="range" min="350" max="950" step="10" value={settings.frequency} onChange={(e: any) => update('frequency', Number(e.currentTarget.value))} />
        </label>
        <label className="range-row">
          <span>{t(language, 'volume')} <strong>{Math.round(settings.volume * 100)}%</strong></span>
          <input type="range" min="0" max="0.6" step="0.01" value={settings.volume} onChange={(e: any) => update('volume', Number(e.currentTarget.value))} />
        </label>
        <Toggle label={t(language, 'sound')} value={settings.soundEnabled} onChange={value => update('soundEnabled', value)} />
        <Toggle label={t(language, 'autoCommit')} value={settings.autoCommit} onChange={value => update('autoCommit', value)} />
        <Toggle label={t(language, 'includeNumbers')} value={settings.includeNumbers} onChange={value => update('includeNumbers', value)} />
        <Toggle label={t(language, 'weakWeighting')} value={settings.weakWeighting} onChange={value => update('weakWeighting', value)} />
        <button type="button" className="danger-button" onClick={() => { if (window.confirm(t(language, 'resetConfirm'))) onResetStats(); }}>{t(language, 'resetStats')}</button>
        <p className="privacy-note">{t(language, 'localOnly')}</p>
      </section>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={(e: any) => onChange(e.currentTarget.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  );
}
