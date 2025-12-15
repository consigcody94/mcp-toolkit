/**
 * Master Claude MCP - Configuration Management
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { MasterClaudeConfig } from './types.js';

const CONFIG_DIR = join(homedir(), '.config', 'master-claude');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: MasterClaudeConfig = {
  routingRules: [
    {
      keywords: ['code', 'programming', 'debug', 'function', 'class'],
      preferredProvider: 'deepseek',
      requireCapabilities: ['code'],
    },
    {
      keywords: ['explain', 'analyze', 'reasoning', 'think', 'logic'],
      preferredProvider: 'claude',
      requireCapabilities: ['reasoning'],
    },
    {
      keywords: ['quick', 'fast', 'simple question'],
      preferredProvider: 'gemini',
      maxCost: 1,
    },
    {
      keywords: ['image', 'picture', 'photo', 'visual', 'diagram'],
      requireCapabilities: ['vision'],
    },
  ],
  costOptimization: true,
  speedOptimization: false,
  qualityOptimization: true,
  enableConsensus: false,
  consensusMinModels: 3,
  consensusMaxModels: 5,
};

/**
 * Load configuration from file
 */
export async function loadConfig(): Promise<MasterClaudeConfig> {
  try {
    const configData = await readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData) as MasterClaudeConfig;

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_CONFIG,
      ...config,
      routingRules: config.routingRules || DEFAULT_CONFIG.routingRules,
    };
  } catch (error) {
    // If config doesn't exist, return default
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: MasterClaudeConfig): Promise<void> {
  try {
    await mkdir(CONFIG_DIR, { recursive: true });
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save config: ${errorMessage}`);
  }
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}
