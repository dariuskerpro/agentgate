import { describe, it, expect } from 'vitest';
import {
  estimateTextTokens,
  estimateAudioMinutes,
  estimatePdfPages,
  estimatePdfTokens,
} from '../token-counter.js';

describe('estimateTextTokens', () => {
  it('estimates tokens as chars / 4, rounded up', () => {
    expect(estimateTextTokens('hello')).toBe(2); // 5/4 = 1.25 → 2
    expect(estimateTextTokens('abcd')).toBe(1); // 4/4 = 1
    expect(estimateTextTokens('')).toBe(0);
  });

  it('handles longer text', () => {
    const text = 'a'.repeat(1000);
    expect(estimateTextTokens(text)).toBe(250);
  });
});

describe('estimateAudioMinutes', () => {
  it('estimates minutes from file size at 128kbps', () => {
    // 16KB/s = 960KB/min
    const oneMinuteBytes = 16_000 * 60; // 960,000 bytes
    expect(estimateAudioMinutes(oneMinuteBytes)).toBeCloseTo(1, 5);
  });

  it('returns 0 for 0 bytes', () => {
    expect(estimateAudioMinutes(0)).toBe(0);
  });

  it('handles large files', () => {
    // 10 minutes of audio
    const tenMinutes = 16_000 * 60 * 10;
    expect(estimateAudioMinutes(tenMinutes)).toBeCloseTo(10, 5);
  });
});

describe('estimatePdfPages', () => {
  it('estimates pages at ~50KB per page', () => {
    expect(estimatePdfPages(50_000)).toBe(1);
    expect(estimatePdfPages(100_000)).toBe(2);
    expect(estimatePdfPages(250_000)).toBe(5);
  });

  it('returns at least 1 page for small files', () => {
    expect(estimatePdfPages(100)).toBe(1);
    expect(estimatePdfPages(0)).toBe(1); // max(1, round(0)) = 1 due to max
  });
});

describe('estimatePdfTokens', () => {
  it('estimates 500 tokens per page', () => {
    expect(estimatePdfTokens(50_000)).toBe(500); // 1 page
    expect(estimatePdfTokens(100_000)).toBe(1000); // 2 pages
    expect(estimatePdfTokens(500_000)).toBe(5000); // 10 pages
  });

  it('returns at least 500 tokens for tiny files', () => {
    expect(estimatePdfTokens(1)).toBe(500);
  });
});
