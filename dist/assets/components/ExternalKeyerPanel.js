import { t } from '../i18n/i18n.js';
export function ExternalKeyerPanel({ language, onPressStart, onPressEnd, onDot, onDash, onCommit, onUndo }) {
    const [serialStatus, setSerialStatus] = React.useState('idle');
    const [baudRate, setBaudRate] = React.useState(9600);
    const portRef = React.useRef(null);
    const readerRef = React.useRef(null);
    const serialPressing = React.useRef(false);
    const heldKeys = React.useRef(new Set());
    React.useEffect(() => () => {
        void disconnectSerial();
    }, []);
    function handleKeyDown(event) {
        if (event.key === 'Tab' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta' || event.key === 'CapsLock')
            return;
        event.preventDefault();
        event.stopPropagation();
        if (event.repeat)
            return;
        if (event.key === 'Escape') {
            event.currentTarget.blur();
            return;
        }
        if (event.key === 'Enter') {
            onCommit();
            return;
        }
        if (event.key === 'Backspace' || event.key === 'Delete') {
            onUndo();
            return;
        }
        if (event.key === '.') {
            onDot();
            return;
        }
        if (event.key === '-' || event.key === 'ー') {
            onDash();
            return;
        }
        heldKeys.current.add(event.code || event.key);
        if (heldKeys.current.size === 1)
            onPressStart();
    }
    function handleKeyUp(event) {
        if (event.key === 'Tab' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta' || event.key === 'CapsLock')
            return;
        event.preventDefault();
        event.stopPropagation();
        const keyId = event.code || event.key;
        if (!heldKeys.current.has(keyId))
            return;
        heldKeys.current.delete(keyId);
        if (heldKeys.current.size === 0)
            onPressEnd();
    }
    async function connectSerial() {
        const serial = navigator.serial;
        if (!serial) {
            setSerialStatus('unsupported');
            return;
        }
        try {
            const port = await serial.requestPort();
            await port.open({ baudRate });
            portRef.current = port;
            setSerialStatus('connected');
            void readSerial(port);
        }
        catch {
            setSerialStatus('error');
        }
    }
    async function disconnectSerial() {
        try {
            await readerRef.current?.cancel();
        }
        catch {
            // Reader cancellation can fail after the device has already been unplugged.
        }
        try {
            await portRef.current?.close();
        }
        catch {
            // The port may already be closed by the browser or device.
        }
        readerRef.current = null;
        portRef.current = null;
        serialPressing.current = false;
        setSerialStatus('idle');
    }
    async function readSerial(port) {
        const decoder = new TextDecoder();
        while (port.readable && portRef.current === port) {
            const reader = port.readable.getReader();
            readerRef.current = reader;
            try {
                while (portRef.current === port) {
                    const { value, done } = await reader.read();
                    if (done)
                        break;
                    if (value)
                        handleSerialText(decoder.decode(value, { stream: true }));
                }
            }
            catch {
                if (portRef.current === port)
                    setSerialStatus('error');
            }
            finally {
                reader.releaseLock();
            }
        }
    }
    function handleSerialText(text) {
        for (const char of text) {
            if (char === '.' || char === '・') {
                onDot();
            }
            else if (char === '-' || char === '－' || char === 'ー') {
                onDash();
            }
            else if (char === '1') {
                if (!serialPressing.current) {
                    serialPressing.current = true;
                    onPressStart();
                }
            }
            else if (char === '0') {
                if (serialPressing.current) {
                    serialPressing.current = false;
                    onPressEnd();
                }
            }
            else if (char === '\n' || char === '\r' || char === ' ' || char === '/') {
                onCommit();
            }
            else if (char === '\b' || char === '\u007f') {
                onUndo();
            }
        }
    }
    return (React.createElement("section", { className: "external-keyer-card", "aria-label": t(language, 'externalKeyer') },
        React.createElement("div", { className: "external-keyer-heading" },
            React.createElement("div", null,
                React.createElement("strong", null, t(language, 'externalKeyer')),
                React.createElement("span", null, t(language, 'externalKeyerHint'))),
            React.createElement("span", { className: `serial-status ${serialStatus}` }, t(language, `serialStatus${serialStatus}`))),
        React.createElement("div", { className: "external-keyer-grid" },
            React.createElement("button", { type: "button", className: "capture-keyer", onKeyDown: handleKeyDown, onKeyUp: handleKeyUp },
                React.createElement("span", null, t(language, 'keyerCapture')),
                React.createElement("small", null, t(language, 'keyerCaptureHint'))),
            React.createElement("div", { className: "serial-controls" },
                React.createElement("label", null,
                    React.createElement("span", null, t(language, 'baudRate')),
                    React.createElement("select", { value: baudRate, onChange: (event) => setBaudRate(Number(event.currentTarget.value)), disabled: serialStatus === 'connected' }, [9600, 19200, 38400, 57600, 115200].map(rate => React.createElement("option", { key: rate, value: rate }, rate)))),
                serialStatus === 'connected' ? (React.createElement("button", { type: "button", onClick: () => void disconnectSerial() }, t(language, 'serialDisconnect'))) : (React.createElement("button", { type: "button", onClick: () => void connectSerial() }, t(language, 'serialConnect')))))));
}
//# sourceMappingURL=ExternalKeyerPanel.js.map