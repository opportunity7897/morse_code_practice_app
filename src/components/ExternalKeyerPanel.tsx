import type { Language } from '../storage/storage.js';
import { t } from '../i18n/i18n.js';

interface Props {
  language: Language;
  onPressStart: () => void;
  onPressEnd: () => void;
  onDot: () => void;
  onDash: () => void;
  onCommit: () => void;
  onUndo: () => void;
}

type SerialStatus = 'idle' | 'connected' | 'unsupported' | 'error';

export function ExternalKeyerPanel({
  language, onPressStart, onPressEnd, onDot, onDash, onCommit, onUndo
}: Props) {
  const [serialStatus, setSerialStatus] = React.useState<SerialStatus>('idle');
  const [baudRate, setBaudRate] = React.useState(9600);
  const portRef = React.useRef<any>(null);
  const readerRef = React.useRef<any>(null);
  const serialPressing = React.useRef(false);
  const heldKeys = React.useRef(new Set<string>());

  React.useEffect(() => () => {
    void disconnectSerial();
  }, []);

  function handleKeyDown(event: any) {
    if (event.key === 'Tab' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta' || event.key === 'CapsLock') return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
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
    if (heldKeys.current.size === 1) onPressStart();
  }

  function handleKeyUp(event: any) {
    if (event.key === 'Tab' || event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta' || event.key === 'CapsLock') return;
    event.preventDefault();
    event.stopPropagation();
    const keyId = event.code || event.key;
    if (!heldKeys.current.has(keyId)) return;
    heldKeys.current.delete(keyId);
    if (heldKeys.current.size === 0) onPressEnd();
  }

  async function connectSerial() {
    const serial = (navigator as any).serial;
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
    } catch {
      setSerialStatus('error');
    }
  }

  async function disconnectSerial() {
    try {
      await readerRef.current?.cancel();
    } catch {
      // Reader cancellation can fail after the device has already been unplugged.
    }
    try {
      await portRef.current?.close();
    } catch {
      // The port may already be closed by the browser or device.
    }
    readerRef.current = null;
    portRef.current = null;
    serialPressing.current = false;
    setSerialStatus('idle');
  }

  async function readSerial(port: any) {
    const decoder = new TextDecoder();
    while (port.readable && portRef.current === port) {
      const reader = port.readable.getReader();
      readerRef.current = reader;
      try {
        while (portRef.current === port) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) handleSerialText(decoder.decode(value, { stream: true }));
        }
      } catch {
        if (portRef.current === port) setSerialStatus('error');
      } finally {
        reader.releaseLock();
      }
    }
  }

  function handleSerialText(text: string) {
    for (const char of text) {
      if (char === '.' || char === '・') {
        onDot();
      } else if (char === '-' || char === '－' || char === 'ー') {
        onDash();
      } else if (char === '1') {
        if (!serialPressing.current) {
          serialPressing.current = true;
          onPressStart();
        }
      } else if (char === '0') {
        if (serialPressing.current) {
          serialPressing.current = false;
          onPressEnd();
        }
      } else if (char === '\n' || char === '\r' || char === ' ' || char === '/') {
        onCommit();
      } else if (char === '\b' || char === '\u007f') {
        onUndo();
      }
    }
  }

  return (
    <section className="external-keyer-card" aria-label={t(language, 'externalKeyer')}>
      <div className="external-keyer-heading">
        <div>
          <strong>{t(language, 'externalKeyer')}</strong>
          <span>{t(language, 'externalKeyerHint')}</span>
        </div>
        <span className={`serial-status ${serialStatus}`}>{t(language, `serialStatus${serialStatus}`)}</span>
      </div>
      <div className="external-keyer-grid">
        <button type="button" className="capture-keyer" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
          <span>{t(language, 'keyerCapture')}</span>
          <small>{t(language, 'keyerCaptureHint')}</small>
        </button>
        <div className="serial-controls">
          <label>
            <span>{t(language, 'baudRate')}</span>
            <select value={baudRate} onChange={(event: any) => setBaudRate(Number(event.currentTarget.value))} disabled={serialStatus === 'connected'}>
              {[9600, 19200, 38400, 57600, 115200].map(rate => <option key={rate} value={rate}>{rate}</option>)}
            </select>
          </label>
          {serialStatus === 'connected' ? (
            <button type="button" onClick={() => void disconnectSerial()}>{t(language, 'serialDisconnect')}</button>
          ) : (
            <button type="button" onClick={() => void connectSerial()}>{t(language, 'serialConnect')}</button>
          )}
        </div>
      </div>
    </section>
  );
}
