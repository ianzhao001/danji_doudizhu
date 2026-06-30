import type { GameEvent } from './types';
import { isRecord } from '../rules/guards';
import { isGameEvent } from './seat';

export const REPLAY_VERSION = 1;

function corrupted(reason: string): never {
  throw new Error(`corrupted replay: ${reason}`);
}

function parseEvents(value: unknown): GameEvent[] {
  if (!Array.isArray(value)) corrupted('events must be an array');
  if (!value.every(isGameEvent)) corrupted('events contains invalid entry');
  return value;
}

export function encodeReplay(events: GameEvent[]): string {
  return JSON.stringify({ version: REPLAY_VERSION, events });
}

export function decodeReplay(text: string): GameEvent[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    corrupted('invalid JSON');
  }
  if (!isRecord(parsed)) corrupted('expected object');
  if (parsed.version !== REPLAY_VERSION) corrupted(`unsupported version: ${String(parsed.version)}`);
  return parseEvents(parsed.events);
}
