import { describe, it, expect } from 'vitest';
import { askQuit, cancelQuit, closeMenu, initialPause, openMenu } from '../../assets/scripts/ui/pause-menu';

describe('M6-L12 pause menu model', () => {
  it('starts closed and opens/closes menu with new objects', () => {
    expect(initialPause).toEqual({ stage: 'closed' });
    const opened = openMenu(initialPause);
    expect(opened).toEqual({ stage: 'menu' });
    expect(opened).not.toBe(initialPause);
    expect(closeMenu(opened)).toEqual({ stage: 'closed' });
  });

  it('moves from menu to quit confirmation and back', () => {
    const menu = openMenu(initialPause);
    const confirm = askQuit(menu);
    expect(confirm).toEqual({ stage: 'confirm-quit' });
    expect(confirm).not.toBe(menu);
    expect(cancelQuit(confirm)).toEqual({ stage: 'menu' });
  });

  it('leaves illegal transitions unchanged', () => {
    expect(askQuit(initialPause)).toBe(initialPause);
    const menu = openMenu(initialPause);
    expect(cancelQuit(menu)).toBe(menu);
  });
});
