/**
 * AI Model Factory
 * Creates and manages AI model instances
 */

import { AIModelType } from '../types.js';
import { BaseAIModel } from './base-model.js';
import { Hunyuan3DModel } from './hunyuan3d.js';
import { TripoSRModel } from './triposr.js';
import { DreamFusionModel } from './dreamfusion.js';
import { InstantMeshModel } from './instantmesh.js';

/**
 * Model Factory for creating AI model instances
 */
export class ModelFactory {
  private static instances: Map<AIModelType, BaseAIModel> = new Map();

  /**
   * Get or create an AI model instance
   *
   * @param modelType - Type of AI model to create
   * @returns AI model instance
   */
  static getModel(modelType: AIModelType): BaseAIModel {
    // Return existing instance if available
    if (this.instances.has(modelType)) {
      return this.instances.get(modelType)!;
    }

    // Create new instance based on type
    let model: BaseAIModel;

    switch (modelType) {
      case 'hunyuan3d-2':
        model = new Hunyuan3DModel();
        break;
      case 'triposr':
        model = new TripoSRModel();
        break;
      case 'stable-dreamfusion':
        model = new DreamFusionModel();
        break;
      case 'instantmesh':
        model = new InstantMeshModel();
        break;
      default:
        throw new Error(`Unknown AI model type: ${modelType}`);
    }

    // Cache instance
    this.instances.set(modelType, model);

    return model;
  }

  /**
   * Get all available model types
   */
  static getAvailableModels(): AIModelType[] {
    return ['hunyuan3d-2', 'triposr', 'stable-dreamfusion', 'instantmesh'];
  }

  /**
   * Get information for all models
   */
  static async getAllModelInfo() {
    const models = this.getAvailableModels();
    const info = [];

    for (const modelType of models) {
      const model = this.getModel(modelType);
      const modelInfo = model.getInfo();
      const installed = await model.checkInstalled();

      info.push({
        ...modelInfo,
        type: modelType,
        installed,
      });
    }

    return info;
  }

  /**
   * Clear cached model instances
   */
  static clearCache(): void {
    this.instances.clear();
  }

  /**
   * Unload all loaded models
   */
  static async unloadAll(): Promise<void> {
    const promises = Array.from(this.instances.values()).map((model) =>
      model.unload()
    );

    await Promise.all(promises);
  }
}
