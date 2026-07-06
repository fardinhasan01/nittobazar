import { useEffect } from 'react';

/** Radix dialogs can leave body overflow:hidden on Android WebView — call after close. */
export function unlockAdminBodyScroll(): void {
  if (typeof document === 'undefined') return;
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('padding-right');
  document.body.style.removeProperty('pointer-events');
  document.body.removeAttribute('data-scroll-locked');
  document.documentElement.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('padding-right');
}

export function useAdminScrollUnlock(open: boolean): void {
  useEffect(() => {
    if (!open) {
      const id = window.setTimeout(unlockAdminBodyScroll, 50);
      return () => window.clearTimeout(id);
    }
  }, [open]);
}
