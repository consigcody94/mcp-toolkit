/**
 * Code Guardian - Security scanner for AI-generated code
 *
 * Main exports for programmatic usage
 */

export { SecurityScanner } from './scanner.js';
export { TerminalReporter, JSONReporter, SARIFReporter } from './reporters.js';
export { SECURITY_PATTERNS, AI_PATTERNS } from './patterns.js';
export * from './types.js';
