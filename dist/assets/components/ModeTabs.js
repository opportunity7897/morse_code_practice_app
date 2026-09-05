import { t } from '../i18n/i18n.js';
const MODES = ['learn', 'keying', 'listening', 'free'];
export function ModeTabs({ mode, language, onChange }) {
    return (React.createElement("div", { className: "mode-tabs", role: "tablist", "aria-label": "Practice mode" }, MODES.map(item => (React.createElement("button", { key: item, type: "button", className: `mode-tab ${mode === item ? 'active' : ''}`, role: "tab", "aria-selected": mode === item, onClick: () => onChange(item) },
        React.createElement("span", null, t(language, item)),
        React.createElement("small", null, t(language, `modeHelp${item[0].toUpperCase()}${item.slice(1)}`)))))));
}
//# sourceMappingURL=ModeTabs.js.map