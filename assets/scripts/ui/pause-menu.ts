export type PauseStage = 'closed' | 'menu' | 'confirm-quit';

export interface PauseState {
  stage: PauseStage;
}

export const initialPause: PauseState = { stage: 'closed' };

function state(stage: PauseStage): PauseState {
  return { stage };
}

export function openMenu(_s: PauseState): PauseState {
  return state('menu');
}

export function closeMenu(_s: PauseState): PauseState {
  return state('closed');
}

export function askQuit(s: PauseState): PauseState {
  return s.stage === 'menu' ? state('confirm-quit') : s;
}

export function cancelQuit(s: PauseState): PauseState {
  return s.stage === 'confirm-quit' ? state('menu') : s;
}
