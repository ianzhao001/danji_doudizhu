import { describe, it, expect } from 'vitest';
import { helpSections } from '../../assets/scripts/ui/help-content';

describe('M3-42 helpSections', () => {
  it('returns stable required sections with non-empty content', () => {
    const sections = helpSections();
    expect(sections.map((section) => section.id)).toEqual(['patterns', 'compare', 'bidding', 'scoring']);
    for (const section of sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.lines.length).toBeGreaterThan(0);
      expect(section.lines.every((line) => line.length > 0)).toBe(true);
    }
  });

  it('contains key rule terms from RULES.md', () => {
    const text = helpSections().flatMap((section) => [section.title, ...section.lines]).join('\n');
    expect(text).toContain('火箭');
    expect(text).toContain('春天');
    expect(text).toContain('连乘');
    expect(text).toContain('抢地主');
  });

  it('returns defensive copies', () => {
    const first = helpSections();
    first[0].lines.push('mutated');
    expect(helpSections()[0].lines).not.toContain('mutated');
  });
});
