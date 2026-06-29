export interface Toast {
  id: number;
  text: string;
  expiresAt: number;
}

export interface ToastQueue {
  items: Toast[];
  nextId: number;
}

export const emptyToasts: ToastQueue = { items: [], nextId: 0 };

const DEFAULT_TTL_MS = 2000;
const MAX_TOASTS = 3;

export function pushToast(q: ToastQueue, text: string, now: number, ttlMs = DEFAULT_TTL_MS): ToastQueue {
  const toast: Toast = { id: q.nextId, text, expiresAt: now + Math.max(0, ttlMs) };
  const items = [...q.items, toast].slice(-MAX_TOASTS);
  return { items, nextId: q.nextId + 1 };
}

export function tickToasts(q: ToastQueue, now: number): ToastQueue {
  return {
    items: q.items.filter((toast) => toast.expiresAt > now),
    nextId: q.nextId,
  };
}
