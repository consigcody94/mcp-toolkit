/**
 * ID Generator Tests
 */

import { generateModelId, isValidModelId } from '../src/utils/id-generator.js';

describe('generateModelId', () => {
  it('should generate a valid model ID', () => {
    const id = generateModelId();
    expect(isValidModelId(id)).toBe(true);
  });

  it('should generate unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateModelId());
    }
    expect(ids.size).toBe(100);
  });

  it('should start with mf3d_ prefix', () => {
    const id = generateModelId();
    expect(id.startsWith('mf3d_')).toBe(true);
  });

  it('should contain timestamp', () => {
    const id = generateModelId();
    const parts = id.split('_');
    expect(parts.length).toBe(3);
    expect(parts[1].length).toBe(14); // YYYYMMDDHHMMSS
  });

  it('should contain random suffix', () => {
    const id = generateModelId();
    const parts = id.split('_');
    expect(parts[2].length).toBe(8);
  });
});

describe('isValidModelId', () => {
  it('should validate correct format', () => {
    expect(isValidModelId('mf3d_20251123143025_a7b9c2d4')).toBe(true);
  });

  it('should reject invalid prefix', () => {
    expect(isValidModelId('model_20251123143025_a7b9c2d4')).toBe(false);
  });

  it('should reject invalid timestamp length', () => {
    expect(isValidModelId('mf3d_202511231430_a7b9c2d4')).toBe(false);
  });

  it('should reject invalid random suffix length', () => {
    expect(isValidModelId('mf3d_20251123143025_a7b9c2')).toBe(false);
  });

  it('should reject invalid characters in suffix', () => {
    expect(isValidModelId('mf3d_20251123143025_A7B9C2D4')).toBe(false);
  });

  it('should reject missing underscores', () => {
    expect(isValidModelId('mf3d20251123143025a7b9c2d4')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidModelId('')).toBe(false);
  });
});
