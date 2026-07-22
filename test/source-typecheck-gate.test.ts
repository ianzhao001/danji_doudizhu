import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const TSC = fileURLToPath(new URL('./node_modules/.bin/tsc', import.meta.url));
const SOURCE_TSCONFIG = fileURLToPath(new URL('../tsconfig-scan.json', import.meta.url));

describe('production source typecheck gate', () => {
  it('keeps assets/scripts strict-type-safe', () => {
    const result = spawnSync(TSC, ['-p', SOURCE_TSCONFIG], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');

    expect(result.error, output).toBeUndefined();
    expect(result.status, output).toBe(0);
  });
});
