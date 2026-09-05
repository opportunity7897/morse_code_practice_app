import { t } from '../i18n/i18n.js';
export function Keyer(props) {
    const { language, pressed, pressDuration, thresholdMs, onPressStart, onPressEnd, onDot, onDash, onCommit, onUndo, onClear } = props;
    const ratio = Math.min(1, pressDuration / Math.max(thresholdMs * 1.25, 1));
    return (React.createElement("section", { className: "keyer-card", "aria-label": "Morse keyer" },
        React.createElement("div", { className: "keyer-heading" },
            React.createElement("div", null,
                React.createElement("strong", null, t(language, 'pressKey')),
                React.createElement("span", null, t(language, 'keyerHint'))),
            React.createElement("span", { className: "threshold-label" },
                Math.round(thresholdMs),
                " ms")),
        React.createElement("button", { type: "button", className: `paddle ${pressed ? 'pressed' : ''}`, onPointerDown: (event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture?.(event.pointerId);
                onPressStart();
            }, onPointerUp: (event) => {
                event.preventDefault();
                onPressEnd();
            }, onPointerCancel: onPressEnd, onContextMenu: (event) => event.preventDefault(), "aria-pressed": pressed },
            React.createElement("span", { className: "paddle-symbol" }, pressed && pressDuration >= thresholdMs ? '—' : '•'),
            React.createElement("span", { className: "paddle-progress", style: { transform: `scaleX(${ratio})` } })),
        React.createElement("div", { className: "direct-controls" },
            React.createElement("span", { className: "direct-label" }, t(language, 'directInput')),
            React.createElement("button", { type: "button", onClick: onDot },
                "\u2022 ",
                React.createElement("small", null, t(language, 'dot'))),
            React.createElement("button", { type: "button", onClick: onDash },
                "\u2014 ",
                React.createElement("small", null, t(language, 'dash'))),
            React.createElement("button", { type: "button", onClick: onUndo },
                "\u232B ",
                React.createElement("small", null, t(language, 'undo'))),
            React.createElement("button", { type: "button", onClick: onCommit },
                "\u21B5 ",
                React.createElement("small", null, t(language, 'commit'))),
            React.createElement("button", { type: "button", className: "quiet", onClick: onClear },
                "\u00D7 ",
                React.createElement("small", null, t(language, 'clear')))),
        React.createElement("div", { className: "keyboard-hint" }, t(language, 'keyboardHint'))));
}
//# sourceMappingURL=Keyer.js.map