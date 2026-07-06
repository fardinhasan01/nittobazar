import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { get, onValue, ref, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';

const SESSION_KEY = 'ab-visitor-session-counted';
const LOCAL_FALLBACK_KEY = 'ab-visitor-count-local';

const VisitorCounter = () => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const visitorRef = ref(database, 'settings/visitorCount');
    let unsub: (() => void) | undefined;

    const recordVisit = async () => {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      try {
        const snap = await get(visitorRef);
        const currentCount = Number((snap.val() as { count?: number } | null)?.count || 0);
        if (!snap.exists()) {
          await set(visitorRef, { count: 1 });
        } else {
          await update(visitorRef, { count: currentCount + 1 });
        }
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        const local = Number(localStorage.getItem(LOCAL_FALLBACK_KEY) || '0') + 1;
        localStorage.setItem(LOCAL_FALLBACK_KEY, String(local));
        setCount(local);
      }
    };

    recordVisit();

    try {
      unsub = onValue(
        visitorRef,
        (snap) => {
          const value = snap.val() as { count?: number } | null;
          if (value) {
            setCount(Number(value.count ?? 0));
          } else {
            setCount(0);
          }
        },
        () => {
          const local = Number(localStorage.getItem(LOCAL_FALLBACK_KEY) || '0');
          setCount(local || null);
        }
      );
    } catch {
      const local = Number(localStorage.getItem(LOCAL_FALLBACK_KEY) || '0');
      setCount(local || null);
    }

    return () => unsub?.();
  }, []);

  const display = count != null ? count.toLocaleString() : '—';

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
      <Eye className="w-3.5 h-3.5 text-brand-green" />
      <span>
        <span className="font-semibold text-brand-green">{display}</span> visitors
      </span>
    </div>
  );
};

export default VisitorCounter;
