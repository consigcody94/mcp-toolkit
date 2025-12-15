/**
 * Validation Tests
 */

import { validateGenerationOptions } from '../src/utils/validation.js';

describe('validateGenerationOptions', () => {
  describe('prompt validation', () => {
    it('should accept valid prompt', () => {
      const result = validateGenerationOptions({ prompt: 'a medieval knight' });
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject missing prompt', () => {
      const result = validateGenerationOptions({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('prompt is required and must be a string');
    });

    it('should reject empty prompt', () => {
      const result = validateGenerationOptions({ prompt: '   ' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('prompt cannot be empty');
    });

    it('should reject prompt that is too long', () => {
      const longPrompt = 'a'.repeat(1001);
      const result = validateGenerationOptions({ prompt: longPrompt });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('prompt must be less than 1000 characters');
    });

    it('should reject non-string prompt', () => {
      const result = validateGenerationOptions({ prompt: 123 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('prompt is required and must be a string');
    });
  });

  describe('qualityMode validation', () => {
    it('should accept valid qualityMode fast', () => {
      const result = validateGenerationOptions({ prompt: 'test', qualityMode: 'fast' });
      expect(result.valid).toBe(true);
    });

    it('should accept valid qualityMode balanced', () => {
      const result = validateGenerationOptions({ prompt: 'test', qualityMode: 'balanced' });
      expect(result.valid).toBe(true);
    });

    it('should accept valid qualityMode quality', () => {
      const result = validateGenerationOptions({ prompt: 'test', qualityMode: 'quality' });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid qualityMode', () => {
      const result = validateGenerationOptions({ prompt: 'test', qualityMode: 'ultra' });
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain('qualityMode must be one of');
    });
  });

  describe('targetPolyCount validation', () => {
    it('should accept valid targetPolyCount', () => {
      const result = validateGenerationOptions({ prompt: 'test', targetPolyCount: 30000 });
      expect(result.valid).toBe(true);
    });

    it('should reject targetPolyCount too low', () => {
      const result = validateGenerationOptions({ prompt: 'test', targetPolyCount: 50 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('targetPolyCount must be between 100 and 1,000,000');
    });

    it('should reject targetPolyCount too high', () => {
      const result = validateGenerationOptions({ prompt: 'test', targetPolyCount: 2000000 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('targetPolyCount must be between 100 and 1,000,000');
    });

    it('should reject non-number targetPolyCount', () => {
      const result = validateGenerationOptions({ prompt: 'test', targetPolyCount: '30000' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('targetPolyCount must be a number');
    });
  });

  describe('textureResolution validation', () => {
    it('should accept 1024', () => {
      const result = validateGenerationOptions({ prompt: 'test', textureResolution: 1024 });
      expect(result.valid).toBe(true);
    });

    it('should accept 2048', () => {
      const result = validateGenerationOptions({ prompt: 'test', textureResolution: 2048 });
      expect(result.valid).toBe(true);
    });

    it('should accept 4096', () => {
      const result = validateGenerationOptions({ prompt: 'test', textureResolution: 4096 });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid resolution', () => {
      const result = validateGenerationOptions({ prompt: 'test', textureResolution: 512 });
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain('textureResolution must be one of');
    });
  });

  describe('boolean fields validation', () => {
    it('should accept valid generateLODs', () => {
      const result = validateGenerationOptions({ prompt: 'test', generateLODs: true });
      expect(result.valid).toBe(true);
    });

    it('should reject non-boolean generateLODs', () => {
      const result = validateGenerationOptions({ prompt: 'test', generateLODs: 'yes' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('generateLODs must be a boolean');
    });

    it('should accept valid autoRig', () => {
      const result = validateGenerationOptions({ prompt: 'test', autoRig: false });
      expect(result.valid).toBe(true);
    });

    it('should reject non-boolean autoRig', () => {
      const result = validateGenerationOptions({ prompt: 'test', autoRig: 1 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('autoRig must be a boolean');
    });
  });

  describe('outputFormats validation', () => {
    it('should accept valid formats', () => {
      const result = validateGenerationOptions({ prompt: 'test', outputFormats: ['fbx', 'obj', 'gltf'] });
      expect(result.valid).toBe(true);
    });

    it('should reject non-array outputFormats', () => {
      const result = validateGenerationOptions({ prompt: 'test', outputFormats: 'fbx' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('outputFormats must be an array');
    });

    it('should reject invalid format', () => {
      const result = validateGenerationOptions({ prompt: 'test', outputFormats: ['fbx', 'stl'] });
      expect(result.valid).toBe(false);
      expect(result.errors?.[0]).toContain('Invalid output format: stl');
    });
  });

  describe('seed validation', () => {
    it('should accept valid seed', () => {
      const result = validateGenerationOptions({ prompt: 'test', seed: 12345 });
      expect(result.valid).toBe(true);
    });

    it('should reject negative seed', () => {
      const result = validateGenerationOptions({ prompt: 'test', seed: -1 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('seed must be between 0 and 2,147,483,647');
    });

    it('should reject seed too large', () => {
      const result = validateGenerationOptions({ prompt: 'test', seed: 3000000000 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('seed must be between 0 and 2,147,483,647');
    });

    it('should reject non-number seed', () => {
      const result = validateGenerationOptions({ prompt: 'test', seed: '12345' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('seed must be a number');
    });
  });

  describe('multiple errors', () => {
    it('should accumulate multiple errors', () => {
      const result = validateGenerationOptions({
        prompt: '',
        qualityMode: 'ultra',
        targetPolyCount: 50,
      });
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(1);
    });
  });
});
