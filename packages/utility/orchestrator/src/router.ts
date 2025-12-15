/**
 * Master Claude MCP - Intelligent Router
 * Routes queries to the best AI model based on routing rules and optimizations
 */

import type { AIModel, RoutingRule, QueryRequest, MasterClaudeConfig } from './types.js';

/**
 * Score a model based on query requirements and config
 */
function scoreModel(
  model: AIModel,
  query: QueryRequest,
  config: MasterClaudeConfig
): number {
  let score = 0;

  // Base availability check
  if (!model.available || !model.authenticated) {
    return -1;
  }

  // Capability matching (required)
  if (query.requireCapabilities) {
    const hasAllCapabilities = query.requireCapabilities.every(cap =>
      model.capabilities.includes(cap)
    );
    if (!hasAllCapabilities) {
      return -1;
    }
    score += 20; // Bonus for meeting requirements
  }

  // Provider preference
  if (query.preferProvider && model.provider === query.preferProvider) {
    score += 30;
  }

  // Cost optimization
  if (config.costOptimization && model.costPerMillionTokens) {
    const costScore = Math.max(0, 100 - model.costPerMillionTokens);
    score += costScore * 0.3;
  }

  // Speed optimization
  if (config.speedOptimization && model.speedRating) {
    score += model.speedRating * 3;
  }

  // Quality optimization
  if (config.qualityOptimization && model.qualityRating) {
    score += model.qualityRating * 4;
  }

  // Cost constraint
  if (query.maxCost && model.costPerMillionTokens && model.costPerMillionTokens > query.maxCost) {
    return -1;
  }

  return score;
}

/**
 * Match routing rules against query
 */
function matchRoutingRules(query: string, rules: RoutingRule[]): RoutingRule | null {
  for (const rule of rules) {
    // Pattern matching
    if (rule.pattern) {
      const regex = new RegExp(rule.pattern, 'i');
      if (regex.test(query)) {
        return rule;
      }
    }

    // Keyword matching
    if (rule.keywords && rule.keywords.length > 0) {
      const queryLower = query.toLowerCase();
      const matchesKeyword = rule.keywords.some(keyword =>
        queryLower.includes(keyword.toLowerCase())
      );
      if (matchesKeyword) {
        return rule;
      }
    }
  }

  return null;
}

/**
 * Select the best model for a query
 */
export function selectBestModel(
  models: AIModel[],
  query: QueryRequest,
  config: MasterClaudeConfig
): AIModel | null {
  // Apply routing rules first
  const matchedRule = matchRoutingRules(query.query, config.routingRules);

  if (matchedRule) {
    // If rule specifies a preferred model, try to use it
    if (matchedRule.preferredModel) {
      const preferredModel = models.find(m =>
        m.name === matchedRule.preferredModel && m.available && m.authenticated
      );
      if (preferredModel) {
        return preferredModel;
      }
    }

    // If rule specifies a preferred provider, filter to that
    if (matchedRule.preferredProvider) {
      query = { ...query, preferProvider: matchedRule.preferredProvider };
    }

    // Apply rule constraints
    if (matchedRule.requireCapabilities) {
      query = {
        ...query,
        requireCapabilities: matchedRule.requireCapabilities,
      };
    }

    if (matchedRule.maxCost) {
      query = { ...query, maxCost: matchedRule.maxCost };
    }
  }

  // Score all models
  const scoredModels = models
    .map(model => ({
      model,
      score: scoreModel(model, query, config),
    }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score);

  // Return the highest scoring model
  return scoredModels.length > 0 ? scoredModels[0].model : null;
}

/**
 * Select multiple models for consensus
 */
export function selectConsensusModels(
  models: AIModel[],
  query: QueryRequest,
  config: MasterClaudeConfig
): AIModel[] {
  const minModels = config.consensusMinModels || 3;
  const maxModels = config.consensusMaxModels || 5;

  // Score all models
  const scoredModels = models
    .map(model => ({
      model,
      score: scoreModel(model, query, config),
    }))
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score);

  // Return top N models
  const count = Math.min(Math.max(minModels, scoredModels.length), maxModels);
  return scoredModels.slice(0, count).map(({ model }) => model);
}
