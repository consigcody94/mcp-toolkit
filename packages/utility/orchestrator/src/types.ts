/**
 * Master Claude MCP - Type Definitions
 */

export interface AIModel {
  name: string;
  provider: string; // 'gemini', 'openai', 'deepseek', 'claude', 'anthropic', etc.
  cliCommand: string; // e.g., 'gemini', 'openai', 'deepseek'
  available: boolean;
  authenticated: boolean;
  capabilities: ModelCapability[];
  costPerMillionTokens?: number;
  speedRating?: number; // 1-10, higher is faster
  qualityRating?: number; // 1-10, higher is better
}

export type ModelCapability =
  | 'chat'
  | 'code'
  | 'reasoning'
  | 'vision'
  | 'long-context'
  | 'function-calling'
  | 'streaming';

export interface RoutingRule {
  pattern?: string; // Regex pattern to match query
  keywords?: string[]; // Keywords to trigger this rule
  preferredProvider?: string;
  preferredModel?: string;
  requireCapabilities?: ModelCapability[];
  maxCost?: number;
  minSpeed?: number;
  minQuality?: number;
}

export interface MasterClaudeConfig {
  routingRules: RoutingRule[];
  defaultProvider?: string;
  costOptimization: boolean;
  speedOptimization: boolean;
  qualityOptimization: boolean;
  enableConsensus: boolean;
  consensusMinModels: number;
  consensusMaxModels: number;
}

export interface QueryRequest {
  query: string;
  context?: string;
  requireCapabilities?: ModelCapability[];
  preferProvider?: string;
  maxCost?: number;
}

export interface ModelResponse {
  model: string;
  provider: string;
  response: string;
  tokensUsed?: number;
  cost?: number;
  duration?: number;
}

export interface ConsensusResult {
  responses: ModelResponse[];
  consensus?: string;
  confidence: number;
  differences: string[];
}
