import { t } from '../i18n/i18n.js';
export function SettingsPanel({ open, settings, onChange, onClose, onResetStats }) {
    if (!open)
        return null;
    const language = settings.language;
    const update = (key, value) => onChange({ ...settings, [key]: value });
    return (React.createElement("div", { className: "dialog-backdrop", role: "presentation", onMouseDown: (event) => { if (event.target === event.currentTarget)
            onClose(); } },
        React.createElement("section", { className: "settings-panel", role: "dialog", "aria-modal": "true", "aria-label": t(language, 'settings') },
            React.createElement("div", { className: "dialog-header" },
                React.createElement("h2", null, t(language, 'settings')),
                React.createElement("button", { type: "button", className: "icon-button", onClick: onClose, "aria-label": t(language, 'close') }, "\u00D7")),
            React.createElement("div", { className: "setting-row" },
                React.createElement("label", null, t(language, 'language')),
                React.createElement("div", { className: "segmented" }, ['ja', 'en'].map(item => (React.createElement("button", { type: "button", key: item, className: settings.language === item ? 'active' : '', onClick: () => update('language', item) }, item === 'ja' ? '日本語' : 'English'))))),
            React.createElement("div", { className: "setting-row" },
                React.createElement("label", null, t(language, 'codeSet')),
                React.createElement("div", { className: "segmented" }, ['latin', 'wabun'].map(item => (React.createElement("button", { type: "button", key: item, className: settings.codeSet === item ? 'active' : '', onClick: () => update('codeSet', item) }, t(language, `codeSet${item}`)))))),
            React.createElement("div", { className: "setting-row" },
                React.createElement("label", null, t(language, 'theme')),
                React.createElement("div", { className: "segmented" }, ['system', 'light', 'dark'].map(item => (React.createElement("button", { type: "button", key: item, className: settings.theme === item ? 'active' : '', onClick: () => update('theme', item) }, t(language, item)))))),
            React.createElement("label", { className: "range-row" },
                React.createElement("span", null,
                    t(language, 'wpm'),
                    " ",
                    React.createElement("strong", null, settings.wpm)),
                React.createElement("input", { type: "range", min: "5", max: "35", step: "1", value: settings.wpm, onChange: (e) => update('wpm', Number(e.currentTarget.value)) })),
            React.createElement("label", { className: "range-row" },
                React.createElement("span", null,
                    t(language, 'frequency'),
                    " ",
                    React.createElement("strong", null,
                        settings.frequency,
                        " Hz")),
                React.createElement("input", { type: "range", min: "350", max: "950", step: "10", value: settings.frequency, onChange: (e) => update('frequency', Number(e.currentTarget.value)) })),
            React.createElement("label", { className: "range-row" },
                React.createElement("span", null,
                    t(language, 'volume'),
                    " ",
                    React.createElement("strong", null,
                        Math.round(settings.volume * 100),
                        "%")),
                React.createElement("input", { type: "range", min: "0", max: "0.6", step: "0.01", value: settings.volume, onChange: (e) => update('volume', Number(e.currentTarget.value)) })),
            React.createElement(Toggle, { label: t(language, 'sound'), value: settings.soundEnabled, onChange: value => update('soundEnabled', value) }),
            React.createElement(Toggle, { label: t(language, 'autoCommit'), value: settings.autoCommit, onChange: value => update('autoCommit', value) }),
            React.createElement(Toggle, { label: t(language, 'includeNumbers'), value: settings.includeNumbers, onChange: value => update('includeNumbers', value) }),
            React.createElement(Toggle, { label: t(language, 'weakWeighting'), value: settings.weakWeighting, onChange: value => update('weakWeighting', value) }),
            React.createElement("button", { type: "button", className: "danger-button", onClick: () => { if (window.confirm(t(language, 'resetConfirm')))
                    onResetStats(); } }, t(language, 'resetStats')),
            React.createElement("p", { className: "privacy-note" }, t(language, 'localOnly')))));
}
function Toggle({ label, value, onChange }) {
    return (React.createElement("label", { className: "toggle-row" },
        React.createElement("span", null, label),
        React.createElement("input", { type: "checkbox", checked: value, onChange: (e) => onChange(e.currentTarget.checked) }),
        React.createElement("span", { className: "switch", "aria-hidden": "true" })));
}
//# sourceMappingURL=SettingsPanel.js.map