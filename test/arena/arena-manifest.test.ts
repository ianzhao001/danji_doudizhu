import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashArenaFiles, hashArenaValue, mergeArenaShards, validateArenaManifest, type ArenaManifest, type ArenaShard } from './arena-manifest';

const manifest: ArenaManifest = {
  version: 1,
  pairing: 'hard', profile: 'full', baseline: 'v19', fixedBid: 'v19',
  seedBase: 100_000, seedCount: 5, shardTotal: 2,
  sourceHash: 'a'.repeat(64), baselineHash: 'b'.repeat(64), tuningHash: 'c'.repeat(64),
};

function shards(): ArenaShard[] {
  return Array.from({ length: manifest.shardTotal }, (_, shardIndex) => ({
    manifest: { ...manifest }, shardIndex,
    games: Array.from({ length: manifest.seedCount }, (_, index) => index)
      .filter((index) => index % manifest.shardTotal === shardIndex)
      .flatMap((index) => ([0, 1, 2] as const).flatMap((targetSeat) => (['new', 'legacy'] as const).map((targetSide) => ({
        seed: manifest.seedBase + index + 1, targetSeat, targetSide,
        targetScore: targetSide === 'new' ? 2 : -2,
        landlord: 0 as const,
      })))),
  }));
}

describe('arena experiment manifest', () => {
  it('merges the complete uneven shard plan in deterministic order, preserving the experiment identity', () => {
    const normal = mergeArenaShards(shards());
    const reversed = shards().reverse().map((shard) => ({ ...shard, games: shard.games.reverse() }));
    expect(mergeArenaShards(reversed)).toEqual(normal);
    expect(normal.manifest).toEqual(manifest);
    expect(normal.games).toHaveLength(30);
    expect([...new Set(normal.games.map((game) => game.seed))]).toEqual([100001, 100002, 100003, 100004, 100005]);
  });

  it('rejects a missing whole shard even though every remaining mirror pair is complete', () => {
    expect(() => mergeArenaShards(shards().slice(0, 1))).toThrow('shard plan incomplete');
  });

  it('rejects a missing whole seed even though every remaining mirror pair is complete', () => {
    const inputs = shards();
    inputs[0]!.games.splice(0, 6);
    expect(() => mergeArenaShards(inputs)).toThrow('seed plan incomplete');
  });

  it.each([
    ['pairing', 'normal'], ['profile', 'weights-only'], ['baseline', 'legacy'], ['fixedBid', 'none'],
    ['seedBase', 100001], ['seedCount', 6], ['shardTotal', 3],
    ['sourceHash', 'd'.repeat(64)], ['baselineHash', 'd'.repeat(64)], ['tuningHash', 'd'.repeat(64)],
  ] as const)('rejects mixed experiments differing in %s', (field, value) => {
    const inputs = shards();
    Object.assign(inputs[1]!.manifest, { [field]: value });
    expect(() => mergeArenaShards(inputs)).toThrow(`shard manifest mismatch: ${field}`);
  });

  it('allows omitted judge flags (SPSA compatibility), but checks explicitly requested conditions', () => {
    expect(mergeArenaShards(shards(), { pairing: 'hard', profile: 'full', baseline: 'v19' }).manifest.fixedBid).toBe('v19');
    expect(() => mergeArenaShards(shards(), { fixedBid: 'none' })).toThrow('requested experiment mismatch: fixedBid');
    expect(() => mergeArenaShards(shards(), { tuningHash: 'd'.repeat(64) })).toThrow('requested experiment mismatch: tuningHash');
    expect(() => mergeArenaShards(shards(), { seedCount: 6 })).toThrow('requested experiment mismatch: seedCount');
  });

  it('rejects legacy unversioned results instead of inventing a complete seed plan', () => {
    expect(() => mergeArenaShards([{ pairing: 'hard', profile: 'full', games: shards()[0]!.games }])).toThrow('legacy results must be rerun');
  });

  it('rejects duplicate shard inputs', () => {
    const inputs = shards();
    expect(() => mergeArenaShards([inputs[0], inputs[0]])).toThrow('duplicate shard');
  });

  it('rejects duplicate games even if the declared count remains correct', () => {
    const inputs = shards();
    inputs[0]!.games[1] = { ...inputs[0]!.games[0]! };
    expect(() => mergeArenaShards(inputs)).toThrow('duplicate game');
  });

  it('rejects seeds assigned to another shard', () => {
    const inputs = shards();
    inputs[0]!.games[0]!.seed = 100002;
    expect(() => mergeArenaShards(inputs)).toThrow('does not belong to shard');
  });

  it('rejects a different landlord under the claimed fixed bidding policy', () => {
    const inputs = shards();
    inputs[0]!.games[1]!.landlord = 1;
    expect(() => mergeArenaShards(inputs)).toThrow('fixed-bid landlord mismatch');
  });

  it('permits landlord differences when bidding varies with the evaluated side', () => {
    const inputs = shards();
    for (const input of inputs) input.manifest.fixedBid = 'none';
    inputs[0]!.games[1]!.landlord = 1;
    expect(mergeArenaShards(inputs).games).toHaveLength(30);
  });

  it.each([
    ['seed', 100000], ['seed', 100006], ['seed', 100001.5],
    ['targetSeat', 3], ['targetSide', 'typo'], ['targetScore', Infinity], ['targetScore', 0],
    ['landlord', undefined],
  ])('rejects invalid game field %s=%s', (field, value) => {
    const inputs = shards();
    Object.assign(inputs[0]!.games[0]!, { [field as string]: value });
    expect(() => mergeArenaShards(inputs)).toThrow();
  });

  it.each([
    { seedBase: -1 }, { seedBase: 0xffff_ffff }, { seedBase: 0xffff_fffe, seedCount: 2 },
    { seedCount: 0 }, { seedCount: 1.5 }, { shardTotal: 0 }, { shardTotal: 6 },
    { sourceHash: 'HEAD' }, { version: 2 }, { pairing: 'typo' },
  ])('rejects malformed or aliasing seed plans: %j', (change) => {
    expect(() => validateArenaManifest({ ...manifest, ...change })).toThrow();
  });

  it('rejects empty inputs and invalid shard indexes', () => {
    expect(() => mergeArenaShards([])).toThrow('at least one');
    const inputs = shards();
    inputs[0]!.shardIndex = 2;
    expect(() => mergeArenaShards(inputs)).toThrow('shardIndex');
  });
});

describe('arena content identity', () => {
  const roots: string[] = [];
  afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
  });

  it('hashes effective tuning independently of property order and reacts to changed values', () => {
    expect(hashArenaValue({ a: 1, nested: { b: 2, c: 3 } })).toBe(hashArenaValue({ nested: { c: 3, b: 2 }, a: 1 }));
    expect(hashArenaValue({ a: 1 })).not.toBe(hashArenaValue({ a: 2 }));
  });

  it('identifies dirty source contents independently of checkout location and input path order', () => {
    for (let index = 0; index < 2; index += 1) {
      const root = mkdtempSync(join(tmpdir(), 'arena-hash-'));
      roots.push(root);
      mkdirSync(join(root, 'ai'));
      writeFileSync(join(root, 'ai', 'policy.ts'), 'export const weight = 1;');
      writeFileSync(join(root, 'rules.ts'), 'export const cards = 54;');
    }
    const before = hashArenaFiles(roots[0]!, ['ai', 'rules.ts']);
    expect(hashArenaFiles(roots[1]!, ['rules.ts', 'ai'])).toBe(before);
    writeFileSync(join(roots[0]!, 'ai', 'policy.ts'), 'export const weight = 2;');
    expect(hashArenaFiles(roots[0]!, ['ai', 'rules.ts'])).not.toBe(before);
    writeFileSync(join(roots[1]!, 'ai', 'new-policy.ts'), 'export const other = true;');
    expect(hashArenaFiles(roots[1]!, ['ai', 'rules.ts'])).not.toBe(before);
  });
});
