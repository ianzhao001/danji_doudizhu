/** Versioned experiment identity and complete seed/shard-plan validation. */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ArenaGame } from './arena-lib';

export type Pairing = 'hard' | 'normal' | 'simple' | 'self' | 'crippled';
export type Profile = 'full' | 'weights-only';
export type Baseline = 'legacy' | 'v19';
export type FixedBid = 'none' | 'new' | 'legacy' | 'v19';

export interface ArenaManifest {
  version: 1;
  pairing: Pairing;
  profile: Profile;
  baseline: Baseline;
  fixedBid: FixedBid;
  /** The actual seeds are seedBase + 1 through seedBase + seedCount, inclusive. */
  seedBase: number;
  seedCount: number;
  shardTotal: number;
  sourceHash: string;
  baselineHash: string;
  tuningHash: string;
}

export interface ArenaShard {
  manifest: ArenaManifest;
  shardIndex: number;
  games: ArenaGame[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Hash the effective tuning values, independent of JSON formatting or key order. */
export function hashArenaValue(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

/** Hash current file contents (including uncommitted edits), paths and file boundaries. */
export function hashArenaFiles(root: string, paths: readonly string[]): string {
  const files: string[] = [];
  function visit(path: string): void {
    if (statSync(path).isDirectory()) {
      for (const name of readdirSync(path).sort()) visit(join(path, name));
    } else if (/\.(ts|json)$/.test(path)) files.push(path);
  }
  for (const path of paths) visit(join(root, path));
  const hash = createHash('sha256');
  for (const path of [...new Set(files)].sort()) {
    const content = readFileSync(path);
    hash.update(JSON.stringify([relative(root, path).replace(/\\/g, '/'), content.length]));
    hash.update('\0').update(content).update('\0');
  }
  return hash.digest('hex');
}

function integer(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer in [${min}, ${max}]`);
  }
  return value;
}

function option<T extends string>(value: unknown, label: string, choices: readonly T[]): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) {
    throw new Error(`${label} must be one of ${choices.join(', ')}`);
  }
  return value as T;
}

export function validateArenaManifest(value: unknown): ArenaManifest {
  if (!isRecord(value) || value.version !== 1) {
    throw new Error('arena manifest version 1 required; legacy results must be rerun');
  }
  const seedBase = integer(value.seedBase, 'seedBase', 0, 0xffff_fffe);
  const seedCount = integer(value.seedCount, 'seedCount', 1, 0xffff_ffff - seedBase);
  for (const field of ['sourceHash', 'baselineHash', 'tuningHash'] as const) {
    if (typeof value[field] !== 'string' || !/^[a-f0-9]{64}$/.test(value[field])) {
      throw new Error(`manifest ${field} must be a SHA-256 digest`);
    }
  }
  return {
    version: 1,
    pairing: option(value.pairing, 'pairing', ['hard', 'normal', 'simple', 'self', 'crippled']),
    profile: option(value.profile, 'profile', ['full', 'weights-only']),
    baseline: option(value.baseline, 'baseline', ['legacy', 'v19']),
    fixedBid: option(value.fixedBid, 'fixedBid', ['none', 'new', 'legacy', 'v19']),
    seedBase,
    seedCount,
    shardTotal: integer(value.shardTotal, 'shardTotal', 1, seedCount),
    sourceHash: value.sourceHash as string,
    baselineHash: value.baselineHash as string,
    tuningHash: value.tuningHash as string,
  };
}

/** Fail closed before computing any statistics; complete pairs alone cannot prove a complete experiment. */
export function mergeArenaShards(inputs: readonly unknown[], expected: Partial<ArenaManifest> = {}): {
  manifest: ArenaManifest;
  games: ArenaGame[];
} {
  if (inputs.length === 0) throw new Error('at least one arena shard required');
  let manifest: ArenaManifest | undefined;
  const seenShards = new Set<number>();
  const games: ArenaGame[] = [];
  const landlords = new Map<number, number>();
  for (const input of inputs) {
    if (!isRecord(input)) throw new Error('invalid arena shard');
    const current = validateArenaManifest(input.manifest);
    if (!manifest) manifest = current;
    for (const field of Object.keys(manifest) as (keyof ArenaManifest)[]) {
      if (current[field] !== manifest[field]) throw new Error(`shard manifest mismatch: ${field}`);
      if (expected[field] !== undefined && current[field] !== expected[field]) {
        throw new Error(`requested experiment mismatch: ${field}`);
      }
    }
    const index = integer(input.shardIndex, 'shardIndex', 0, current.shardTotal - 1);
    if (seenShards.has(index)) throw new Error(`duplicate shard: ${index}`);
    seenShards.add(index);
    if (!Array.isArray(input.games)) throw new Error(`shard ${index}: games must be an array`);
    const seedCount = Math.floor((current.seedCount - 1 - index) / current.shardTotal) + 1;
    if (input.games.length !== seedCount * 6) throw new Error(`shard ${index}: seed plan incomplete, expected ${seedCount * 6} games`);
    const seenGames = new Set<string>();
    for (const value of input.games) {
      if (!isRecord(value)) throw new Error(`shard ${index}: invalid game`);
      const seed = integer(value.seed, 'game seed', current.seedBase + 1, current.seedBase + current.seedCount);
      if ((seed - current.seedBase - 1) % current.shardTotal !== index) {
        throw new Error(`seed ${seed} does not belong to shard ${index}`);
      }
      const targetSeat = integer(value.targetSeat, 'targetSeat', 0, 2) as 0 | 1 | 2;
      const targetSide = option(value.targetSide, 'targetSide', ['new', 'legacy']);
      const targetScore = integer(value.targetScore, 'targetScore', -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
      if (targetScore === 0) throw new Error('settled targetScore cannot be zero');
      const landlord = integer(value.landlord, 'landlord', 0, 2) as 0 | 1 | 2;
      const key = `${seed}/${targetSeat}/${targetSide}`;
      if (seenGames.has(key)) throw new Error(`duplicate game: ${key}`);
      seenGames.add(key);
      if (current.fixedBid !== 'none') {
        if (landlords.has(seed) && landlords.get(seed) !== landlord) {
          throw new Error(`fixed-bid landlord mismatch for seed ${seed}`);
        }
        landlords.set(seed, landlord);
      }
      games.push({ seed, targetSeat, targetSide, targetScore, landlord });
    }
  }
  if (seenShards.size !== manifest!.shardTotal) {
    throw new Error(`shard plan incomplete: received ${seenShards.size}/${manifest!.shardTotal}`);
  }
  games.sort((a, b) => a.seed - b.seed || a.targetSeat - b.targetSeat || a.targetSide.localeCompare(b.targetSide));
  return { manifest: manifest!, games };
}
