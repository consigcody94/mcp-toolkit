/**
 * Configuration Module
 * Exports configuration schema, loader, and utilities
 */

export { ConfigSchema, defaultConfig } from './config-schema.js';
export type { Config } from './config-schema.js';
export { ConfigLoader, getConfig, loadConfig, saveConfig } from './config-loader.js';
