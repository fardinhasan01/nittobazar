type ErrorPayload = {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  type: 'error' | 'unhandledrejection';
};

const MAX_LOGS = 50;
const errorLog: ErrorPayload[] = [];

const pushLog = (entry: ErrorPayload) => {
  errorLog.push(entry);
  if (errorLog.length > MAX_LOGS) {
    errorLog.shift();
  }
};

export const getRecentErrors = (): ErrorPayload[] => [...errorLog];

export const initErrorMonitoring = (): void => {
  if (typeof window === 'undefined') return;

  const previousOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    pushLog({
      type: 'error',
      message: String(message),
      source: source ?? undefined,
      lineno: lineno ?? undefined,
      colno: colno ?? undefined,
      stack: error?.stack,
    });
    console.error('[AdminError]', message, { source, lineno, colno, error });
    return previousOnError?.(message, source, lineno, colno, error) ?? false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection');
    pushLog({
      type: 'unhandledrejection',
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    console.error('[AdminError] Unhandled rejection:', reason);
  });
};
