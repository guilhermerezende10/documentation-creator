import { useCallback, useEffect, useRef, useState } from 'react';

export interface Toast {
  id: number;
  message: string;
}

export interface UseToastsResult {
  toasts: Toast[];
  toast: (message: string, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

const DEFAULT_DURATION_MS = 2000;

export function useToasts(): UseToastsResult {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timeoutsRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, durationMs: number = DEFAULT_DURATION_MS) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message }]);
      const handle = setTimeout(() => {
        timeoutsRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
      timeoutsRef.current.set(id, handle);
    },
    [],
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((handle) => clearTimeout(handle));
      timeouts.clear();
    };
  }, []);

  return { toasts, toast, dismiss };
}
