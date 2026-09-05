declare namespace React {
  type ReactNode = any;
  type CSSProperties = Record<string, string | number | undefined>;
}

declare const React: {
  createElement: (...args: any[]) => any;
  Fragment: any;
  useState: <T>(initial: T | (() => T)) => [T, (value: T | ((prev: T) => T)) => void];
  useEffect: (effect: () => void | (() => void), deps?: readonly any[]) => void;
  useMemo: <T>(factory: () => T, deps: readonly any[]) => T;
  useRef: <T>(initial: T) => { current: T };
  useCallback: <T extends (...args: any[]) => any>(fn: T, deps: readonly any[]) => T;
};

declare const ReactDOM: {
  createRoot: (element: Element | DocumentFragment) => { render: (node: any) => void };
};

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
