import { describe, expect, it } from 'vitest';
import { emptyToasts, pushToast, tickToasts } from '../../assets/scripts/ui/toast-queue';

describe('toast queue', () => {
  it('pushes a toast without mutating the source queue', () => {
    const before = structuredClone(emptyToasts);
    const next = pushToast(emptyToasts, '炸弹！', 100);

    expect(emptyToasts).toEqual(before);
    expect(next.items).toEqual([{ id: 0, text: '炸弹！', expiresAt: 2100 }]);
    expect(next.nextId).toBe(1);
  });

  it('removes expired items and keeps active items', () => {
    const q = pushToast(pushToast(emptyToasts, '不要', 0, 1000), '火箭！', 500, 2000);

    expect(tickToasts(q, 1000).items.map((toast) => toast.text)).toEqual(['火箭！']);
    expect(tickToasts(q, 999).items.map((toast) => toast.text)).toEqual(['不要', '火箭！']);
  });

  it('increments ids monotonically', () => {
    const q = pushToast(pushToast(emptyToasts, 'A', 0), 'B', 0);

    expect(q.items.map((toast) => toast.id)).toEqual([0, 1]);
    expect(q.nextId).toBe(2);
  });

  it('keeps at most three items by dropping the oldest', () => {
    const q = ['A', 'B', 'C', 'D'].reduce((queue, text) => pushToast(queue, text, 0), emptyToasts);

    expect(q.items.map((toast) => toast.text)).toEqual(['B', 'C', 'D']);
  });

  it('ticks an empty queue safely', () => {
    expect(tickToasts(emptyToasts, 123)).toEqual(emptyToasts);
  });
});
