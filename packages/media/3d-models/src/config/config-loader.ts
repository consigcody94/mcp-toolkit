/**
 * Configuration Loader
 * Loads and validates .model-forge-3d.json configuration
 */

import * as fs from 'fs/promises';
import { ConfigSchema, Config, defaultConfig } from './config-schema.js';
import { logger } from '../utils/logger.js';

export class ConfigLoader {
  private static instance: ConfigLoader | null = null;
  private config: Config;
  private configPath: string;

  private constructor() {
    this.config = defaultConfig;
    this.configPath = '.model-forge-3d.json';
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Load configuration from file
   *
   * @param configPath - Path to config file (defaults to .model-forge-3d.json in cwd)
   */
  async load(configPath?: string): Promise<Config> {
    if (configPath) {
      this.configPath = configPath;
    }

    try {
      // Check if config file exists
      const exists = await fs.access(this.configPath)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        logger.info(`No config file found at ${this.configPath}, using defaults`);
        return this.config;
      }

      // Read and parse config file
      const fileContent = await fs.readFile(this.configPath, 'utf-8');
      const parsedConfig = JSON.parse(fileContent);

      // Validate against schema (fills in defaults for missing fields)
      const validationResult = ConfigSchema.safeParse(parsedConfig);

      if (!validationResult.success) {
        logger.error('Configuration validation failed:', validationResult.error);
        logger.warning('Using default configuration');
        return this.config;
      }

      this.config = validationResult.data;
      logger.info(`Configuration loaded from ${this.configPath}`);
      return this.config;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to load configuration: ${errorMessage}`);
      logger.warning('Using default configuration');
      return this.config;
    }
  }

  /**
   * Save current configuration to file
   */
  async save(configPath?: string): Promise<boolean> {
    const savePath = configPath || this.configPath;

    try {
      const configJson = JSON.stringify(this.config, null, 2);
      await fs.writeFile(savePath, configJson, 'utf-8');
      logger.info(`Configuration saved to ${savePath}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to save configuration: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Create default configuration file
   */
  async createDefault(configPath?: string): Promise<boolean> {
    const savePath = configPath || this.configPath;

    try {
      const configJson = JSON.stringify(defaultConfig, null, 2);
      await fs.writeFile(savePath, configJson, 'utf-8');
      logger.info(`Default configuration created at ${savePath}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to create default configuration: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * Update configuration (partial update)
   */
  updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = defaultConfig;
  }

  /**
   * Get configuration value by path
   *
   * @param path - Dot-separated path (e.g., 'models.gpu.enabled')
   */
  get(path: string): unknown {
    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set configuration value by path
   *
   * @param path - Dot-separated path (e.g., 'models.gpu.enabled')
   * @param value - Value to set
   */
  set(path: string, value: unknown): void {
    const keys = path.split('.');
    let current: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}

/**
 * Get global config instance
 */
export function getConfig(): Config {
  return ConfigLoader.getInstance().getConfig();
}

/**
 * Load configuration
 */
export async function loadConfig(configPath?: string): Promise<Config> {
  return ConfigLoader.getInstance().load(configPath);
}

/**
 * Save configuration
 */
export async function saveConfig(configPath?: string): Promise<boolean> {
  return ConfigLoader.getInstance().save(configPath);
}
