/**
 * Model Forge 3D - Type Definitions
 * Comprehensive TypeScript interfaces for MCP protocol, AI models, and 3D generation
 */

// ============================================================================
// MCP Protocol Types
// ============================================================================

export interface MCPRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface MCPCapabilities {
  tools?: Record<string, unknown>;
}

export interface MCPServerInfo {
  name: string;
  version: string;
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: MCPCapabilities;
  serverInfo: MCPServerInfo;
}

// ============================================================================
// AI Model Types
// ============================================================================

export type AIModelType = 'hunyuan3d-2' | 'triposr' | 'stable-dreamfusion' | 'instantmesh';

export interface AIModelConfig {
  type: AIModelType;
  modelPath?: string;
  device?: 'cuda' | 'cpu';
  batchSize?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

export interface GenerationOptions {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
  qualityMode?: 'fast' | 'balanced' | 'quality';
  autoSelectModel?: boolean;
  targetPolyCount?: number;
  textureResolution?: 1024 | 2048 | 4096;
  generateLODs?: boolean;
  autoRig?: boolean;
  outputFormats?: ExportFormat[];
}

// ============================================================================
// 3D Mesh Types
// ============================================================================

export interface Mesh3D {
  vertices: number[][];
  faces: number[][];
  normals?: number[][];
  uvCoords?: number[][];
  materialIds?: number[];
  bounds?: BoundingBox;
}

export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
  size: [number, number, number];
}

export interface MeshStatistics {
  vertexCount: number;
  faceCount: number;
  triangleCount: number;
  materialCount: number;
  hasUVs: boolean;
  hasNormals: boolean;
  isManifold: boolean;
  bounds: BoundingBox;
  surfaceArea: number;
  volume: number;
}

// ============================================================================
// Texture Types
// ============================================================================

export type TextureMapType = 'albedo' | 'normal' | 'roughness' | 'metallic' | 'ao' | 'orm';

export interface TextureMap {
  type: TextureMapType;
  path: string;
  resolution: number;
  format: 'png' | 'jpg' | 'exr';
}

export interface PBRMaterialSet {
  albedo: TextureMap;
  normal: TextureMap;
  roughness: TextureMap;
  metallic: TextureMap;
  ao: TextureMap;
  orm?: TextureMap; // Occlusion-Roughness-Metallic packed
}

// ============================================================================
// Rigging Types
// ============================================================================

export type RigType = 'humanoid' | 'quadruped' | 'creature' | 'prop' | 'vehicle';

export interface Bone {
  name: string;
  parent?: string;
  position: [number, number, number];
  rotation: [number, number, number, number]; // quaternion
  children: string[];
}

export interface Skeleton {
  bones: Bone[];
  rootBone: string;
  rigType: RigType;
}

export interface WeightPaint {
  vertexIndex: number;
  boneIndex: number;
  weight: number;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'fbx' | 'obj' | 'gltf' | 'glb' | 'dae' | 'xmf';
export type ExportPlatform = 'vrchat' | 'imvu' | 'secondlife' | 'universal';

export interface ExportOptions {
  format: ExportFormat;
  platform?: ExportPlatform;
  includeTextures: boolean;
  includeMaterials: boolean;
  includeRig: boolean;
  includeLODs: boolean;
  optimizeForTarget: boolean;
}

export interface VRChatExportOptions extends ExportOptions {
  targetDevice: 'pc' | 'quest';
  maxTriangles: number;
  maxMaterials: number;
  atlasTextures: boolean;
}

export interface IMVUExportOptions extends ExportOptions {
  exportSkeleton: boolean;
  exportMesh: boolean;
  exportMaterials: boolean;
}

export interface SecondLifeExportOptions extends ExportOptions {
  lodLevels: number[];
  physicsShape: 'convex' | 'mesh' | 'none';
  optimizeLandImpact: boolean;
}

// ============================================================================
// Generation Result Types
// ============================================================================

export interface GenerationResult {
  success: boolean;
  modelId: string;
  outputPath: string;
  mesh: MeshStatistics;
  textures?: PBRMaterialSet;
  skeleton?: Skeleton;
  exports: ExportedFile[];
  metadata: GenerationMetadata;
  error?: string;
}

export interface ExportedFile {
  format: ExportFormat;
  path: string;
  size: number;
  platform?: ExportPlatform;
}

export interface GenerationMetadata {
  prompt: string;
  negativePrompt?: string;
  model: AIModelType;
  seed: number;
  generationTime: number;
  timestamp: string;
  version: string;
}

// ============================================================================
// Process Status Types
// ============================================================================

export type ProcessStatus = 'queued' | 'initializing' | 'generating' | 'processing' | 'optimizing' | 'texturing' | 'rigging' | 'exporting' | 'completed' | 'failed';

export interface ProcessProgress {
  status: ProcessStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number;
  message?: string;
}

// ============================================================================
// Blender Integration Types
// ============================================================================

export interface BlenderCommand {
  operation: 'import' | 'export' | 'cleanup' | 'optimize' | 'uvUnwrap' | 'bakeTextures' | 'autoRig' | 'generateLODs';
  params: Record<string, unknown>;
}

export interface BlenderResult {
  success: boolean;
  outputPath?: string;
  statistics?: MeshStatistics;
  logs: string[];
  error?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ModelForge3DConfig {
  blenderPath?: string;
  modelsDir?: string;
  outputDir?: string;
  tempDir?: string;
  aiModels: {
    hunyuan3d2?: AIModelConfig;
    triposr?: AIModelConfig;
    stableDreamfusion?: AIModelConfig;
    instantmesh?: AIModelConfig;
  };
  defaults: {
    qualityMode: 'fast' | 'balanced' | 'quality';
    textureResolution: 1024 | 2048 | 4096;
    targetPolyCount: number;
    generateLODs: boolean;
    autoRig: boolean;
  };
}
