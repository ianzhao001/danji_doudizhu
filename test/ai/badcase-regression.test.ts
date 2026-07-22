import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { hardStrategy } from '../../assets/scripts/ai/levels/hard';
import type { GameEvent, GameSnapshot } from '../../assets/scripts/game';
import { createRng, type Card } from '../../assets/scripts/rules';
import { isCard, isRecord } from '../../assets/scripts/rules/guards';

interface BadcaseFixture {
  logId: string;
  eventIndex: number;
  note: string;
  snapshot: GameSnapshot;
  history: GameEvent[];
  bannedCards: Card[];
}

const FIXTURE_DIR = fileURLToPath(new URL('./badcase/fixtures/', import.meta.url));
const FILES = readdirSync(FIXTURE_DIR).filter((name) => name.endsWith('.json')).sort();

function parseFixture(filename: string): BadcaseFixture {
  const value = JSON.parse(readFileSync(`${FIXTURE_DIR}/${filename}`, 'utf8')) as unknown;
  if (!isRecord(value)
    || typeof value.logId !== 'string'
    || !Number.isInteger(value.eventIndex)
    || typeof value.note !== 'string'
    || !isRecord(value.snapshot)
    || !Array.isArray(value.history)
    || !Array.isArray(value.bannedCards)
    || !value.bannedCards.every(isCard)) {
    throw new Error(`invalid badcase fixture: ${filename}`);
  }
  return value as unknown as BadcaseFixture;
}

function canonicalCards(cards: readonly Card[]): string[] {
  return cards.map((card) => `${card.rank}:${card.suit}`).sort();
}

describe('sota2-R4 badcase 回归', () => {
  if (FILES.length === 0) {
    it.skip('fixtures 为空：暂无已确认坏例', () => {});
    return;
  }

  for (const filename of FILES) {
    it(`${filename}：不再选择已证败着`, () => {
      const fixture = parseFixture(filename);
      const action = hardStrategy(fixture.snapshot, createRng(0), fixture.history);
      const actualCards = action.type === 'play' ? action.cards : [];
      expect(
        canonicalCards(actualCards),
        `${fixture.logId} event ${fixture.eventIndex}: ${fixture.note}`,
      ).not.toEqual(canonicalCards(fixture.bannedCards));
    });
  }
});
