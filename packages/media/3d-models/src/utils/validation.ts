/**
 * Input Validation Utilities
 */

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export function validateGenerationOptions(params: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  // Validate prompt
  if (!params.prompt || typeof params.prompt !== 'string') {
    errors.push('prompt is required and must be a string');
  } else if (params.prompt.trim().length === 0) {
    errors.push('prompt cannot be empty');
  } else if (params.prompt.length > 1000) {
    errors.push('prompt must be less than 1000 characters');
  }

  // Validate negativePrompt if provided
  if (params.negativePrompt !== undefined && typeof params.negativePrompt !== 'string') {
    errors.push('negativePrompt must be a string');
  }

  // Validate qualityMode
  if (params.qualityMode !== undefined) {
    const validModes = ['fast', 'balanced', 'quality'];
    if (!validModes.includes(params.qualityMode as string)) {
      errors.push(`qualityMode must be one of: ${validModes.join(', ')}`);
    }
  }

  // Validate targetPolyCount
  if (params.targetPolyCount !== undefined) {
    if (typeof params.targetPolyCount !== 'number') {
      errors.push('targetPolyCount must be a number');
    } else if (params.targetPolyCount < 100 || params.targetPolyCount > 1000000) {
      errors.push('targetPolyCount must be between 100 and 1,000,000');
    }
  }

  // Validate textureResolution
  if (params.textureResolution !== undefined) {
    const validResolutions = [1024, 2048, 4096];
    if (!validResolutions.includes(params.textureResolution as number)) {
      errors.push(`textureResolution must be one of: ${validResolutions.join(', ')}`);
    }
  }

  // Validate generateLODs
  if (params.generateLODs !== undefined && typeof params.generateLODs !== 'boolean') {
    errors.push('generateLODs must be a boolean');
  }

  // Validate autoRig
  if (params.autoRig !== undefined && typeof params.autoRig !== 'boolean') {
    errors.push('autoRig must be a boolean');
  }

  // Validate outputFormats
  if (params.outputFormats !== undefined) {
    if (!Array.isArray(params.outputFormats)) {
      errors.push('outputFormats must be an array');
    } else {
      const validFormats = ['fbx', 'obj', 'gltf', 'glb', 'dae'];
      for (const format of params.outputFormats) {
        if (!validFormats.includes(format as string)) {
          errors.push(`Invalid output format: ${format}. Must be one of: ${validFormats.join(', ')}`);
        }
      }
    }
  }

  // Validate seed
  if (params.seed !== undefined) {
    if (typeof params.seed !== 'number') {
      errors.push('seed must be a number');
    } else if (params.seed < 0 || params.seed > 2147483647) {
      errors.push('seed must be between 0 and 2,147,483,647');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
