/**
 * ID Generation Utilities
 * Generate unique identifiers for models
 */

/**
 * Generate a unique model ID
 * Format: mf3d_<timestamp>_<random>
 * Example: mf3d_20251123_a7b9c2d4
 */
export function generateModelId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 10);
  return `mf3d_${timestamp}_${random}`;
}

/**
 * Validate a model ID format
 */
export function isValidModelId(id: string): boolean {
  return /^mf3d_\d{14}_[a-z0-9]{8}$/.test(id);
}
