import type { Toast } from '../hooks/useToasts';

interface ToastListProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function ToastList({ toasts, onDismiss }: ToastListProps) {
  return (
    <div className="toast-wrap" id="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast"
          role="status"
          onClick={() => onDismiss(t.id)}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <span className="ok-dot" />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
