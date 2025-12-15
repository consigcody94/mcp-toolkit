/**
 * Configuration Schema
 * Zod schema for .model-forge-3d.json configuration file
 */

import { z } from 'zod';

/**
 * User configuration schema
 */
export const ConfigSchema = z.object({
  // General settings
  general: z.object({
    outputDir: z.string().default('./output'),
    tempDir: z.string().default('./temp'),
    logLevel: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR']).default('INFO'),
    maxConcurrentTasks: z.number().min(1).max(10).default(3),
  }).default({}),

  // AI Model paths and settings
  models: z.object({
    modelDir: z.string().default('./models'),
    autoDownload: z.boolean().default(false),
    paths: z.object({
      hunyuan3d: z.string().optional(),
      triposr: z.string().optional(),
      dreamfusion: z.string().optional(),
      instantmesh: z.string().optional(),
    }).default({}),
    gpu: z.object({
      enabled: z.boolean().default(true),
      deviceId: z.number().default(0),
      memoryLimit: z.number().optional(), // GB
    }).default({}),
  }).default({}),

  // Blender settings
  blender: z.object({
    executablePath: z.string().optional(),
    timeout: z.number().default(300), // seconds
    headless: z.boolean().default(true),
  }).default({}),

  // Generation defaults
  defaults: z.object({
    qualityMode: z.enum(['fast', 'balanced', 'quality']).default('balanced'),
    targetPolyCount: z.number().min(100).max(1000000).default(30000),
    textureResolution: z.union([z.literal(1024), z.literal(2048), z.literal(4096)]).default(2048),
    generateLODs: z.boolean().default(true),
    autoRig: z.boolean().default(true),
    outputFormats: z.array(z.enum(['fbx', 'obj', 'gltf', 'glb', 'dae'])).default(['fbx', 'obj', 'gltf']),
  }).default({}),

  // Platform-specific settings
  platforms: z.object({
    vrchat: z.object({
      enabled: z.boolean().default(true),
      pcPolyLimit: z.number().default(70000),
      questPolyLimit: z.number().default(20000),
    }).default({}),
    imvu: z.object({
      enabled: z.boolean().default(true),
      polyLimit: z.number().default(35000),
    }).default({}),
    secondlife: z.object({
      enabled: z.boolean().default(true),
      polyLimit: z.number().default(65000),
      generateLODs: z.boolean().default(true),
    }).default({}),
  }).default({}),

  // Advanced settings
  advanced: z.object({
    cacheEnabled: z.boolean().default(true),
    cacheSizeMB: z.number().default(1000),
    retryAttempts: z.number().min(0).max(5).default(3),
    retryDelay: z.number().default(1000), // milliseconds
    enablePreview: z.boolean().default(true),
    previewResolution: z.number().default(512),
  }).default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Default configuration
 */
export const defaultConfig: Config = {
  general: {
    outputDir: './output',
    tempDir: './temp',
    logLevel: 'INFO',
    maxConcurrentTasks: 3,
  },
  models: {
    modelDir: './models',
    autoDownload: false,
    paths: {},
    gpu: {
      enabled: true,
      deviceId: 0,
    },
  },
  blender: {
    timeout: 300,
    headless: true,
  },
  defaults: {
    qualityMode: 'balanced',
    targetPolyCount: 30000,
    textureResolution: 2048,
    generateLODs: true,
    autoRig: true,
    outputFormats: ['fbx', 'obj', 'gltf'],
  },
  platforms: {
    vrchat: {
      enabled: true,
      pcPolyLimit: 70000,
      questPolyLimit: 20000,
    },
    imvu: {
      enabled: true,
      polyLimit: 35000,
    },
    secondlife: {
      enabled: true,
      polyLimit: 65000,
      generateLODs: true,
    },
  },
  advanced: {
    cacheEnabled: true,
    cacheSizeMB: 1000,
    retryAttempts: 3,
    retryDelay: 1000,
    enablePreview: true,
    previewResolution: 512,
  },
};
