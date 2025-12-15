/**
 * Base AI Model Interface
 * Abstract base class for all text-to-3D AI models
 */

import { GenerationOptions, Mesh3D } from '../types.js';

export interface ModelInfo {
  name: string;
  version: string;
  description: string;
  speedRating: number; // 1-5 (1=slow, 5=fast)
  qualityRating: number; // 1-5 (1=low, 5=high)
  supportsCharacters: boolean;
  supportsProps: boolean;
  supportsTextures: boolean;
  supportsRigging: boolean;
  modelSize: string; // e.g., "8GB"
  installed: boolean;
}

export abstract class BaseAIModel {
  protected modelName: string;
  protected modelPath: string;
  protected isLoaded: boolean = false;

  constructor(modelName: string, modelPath: string = '') {
    this.modelName = modelName;
    this.modelPath = modelPath;
  }

  /**
   * Get model information
   */
  abstract getInfo(): ModelInfo;

  /**
   * Check if model is installed
   */
  abstract checkInstalled(): Promise<boolean>;

  /**
   * Install the model
   */
  abstract install(): Promise<boolean>;

  /**
   * Load the model into memory
   */
  abstract load(): Promise<boolean>;

  /**
   * Unload the model from memory
   */
  abstract unload(): Promise<void>;

  /**
   * Generate 3D mesh from text prompt
   *
   * @param options - Generation options
   * @returns Generated 3D mesh
   */
  abstract generate(options: GenerationOptions): Promise<Mesh3D>;

  /**
   * Validate generation options for this model
   */
  protected validateOptions(options: GenerationOptions): void {
    if (!options.prompt || options.prompt.length === 0) {
      throw new Error('Prompt is required');
    }

    if (options.prompt.length > 1000) {
      throw new Error('Prompt must be 1000 characters or less');
    }
  }

  /**
   * Check if model is currently loaded
   */
  public isModelLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Get model name
   */
  public getName(): string {
    return this.modelName;
  }
}
