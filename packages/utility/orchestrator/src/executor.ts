/**
 * Master Claude MCP - Query Executor
 * Executes queries against AI CLI tools and collects responses
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { AIModel, ModelResponse, ConsensusResult } from './types.js';

const execAsync = promisify(exec);

/**
 * Execute a query against a specific AI model CLI
 */
export async function executeQuery(
  model: AIModel,
  query: string,
  context?: string
): Promise<ModelResponse> {
  const startTime = Date.now();

  try {
    // Build the CLI command
    const fullQuery = context ? `${context}\n\n${query}` : query;
    const escapedQuery = fullQuery.replace(/"/g, '\\"').replace(/'/g, "'\\''");

    // Different CLI tools have different command formats
    let command: string;
    switch (model.provider) {
      case 'gemini':
        command = `echo '${escapedQuery}' | ${model.cliCommand} chat`;
        break;
      case 'openai':
        command = `${model.cliCommand} chat -m gpt-4 '${escapedQuery}'`;
        break;
      case 'deepseek':
        command = `${model.cliCommand} chat '${escapedQuery}'`;
        break;
      case 'claude':
      case 'anthropic':
        command = `echo '${escapedQuery}' | ${model.cliCommand} chat`;
        break;
      case 'codex':
        command = `${model.cliCommand} complete '${escapedQuery}'`;
        break;
      default:
        command = `echo '${escapedQuery}' | ${model.cliCommand}`;
    }

    // Execute with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    const duration = Date.now() - startTime;
    const response = stdout.trim() || stderr.trim();

    return {
      model: model.name,
      provider: model.provider,
      response,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      model: model.name,
      provider: model.provider,
      response: `Error: ${errorMessage}`,
      duration,
    };
  }
}

/**
 * Execute query across multiple models for consensus
 */
export async function executeConsensus(
  models: AIModel[],
  query: string,
  context?: string
): Promise<ConsensusResult> {
  // Execute queries in parallel
  const responsePromises = models.map(model => executeQuery(model, query, context));
  const responses = await Promise.all(responsePromises);

  // Analyze consensus
  const consensus = findConsensus(responses);
  const confidence = calculateConfidence(responses);
  const differences = findDifferences(responses);

  return {
    responses,
    consensus,
    confidence,
    differences,
  };
}

/**
 * Find consensus among multiple responses
 */
function findConsensus(responses: ModelResponse[]): string | undefined {
  if (responses.length === 0) return undefined;

  // Simple approach: if majority of responses are similar, return the most common pattern
  // For now, just return the first valid response
  const validResponses = responses.filter(r => !r.response.startsWith('Error:'));

  if (validResponses.length === 0) return undefined;

  // Return the response from the model with highest quality
  return validResponses[0].response;
}

/**
 * Calculate confidence level in consensus (0-100)
 */
function calculateConfidence(responses: ModelResponse[]): number {
  const validResponses = responses.filter(r => !r.response.startsWith('Error:'));

  if (validResponses.length === 0) return 0;
  if (validResponses.length === 1) return 50;

  // Simple similarity check: count how many responses contain similar keywords
  const responseTexts = validResponses.map(r => r.response.toLowerCase());
  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < responseTexts.length; i++) {
    for (let j = i + 1; j < responseTexts.length; j++) {
      const words1 = new Set(responseTexts[i].split(/\s+/));
      const words2 = new Set(responseTexts[j].split(/\s+/));

      const intersection = new Set([...words1].filter(w => words2.has(w)));
      const union = new Set([...words1, ...words2]);

      const similarity = (intersection.size / union.size) * 100;
      totalSimilarity += similarity;
      comparisons++;
    }
  }

  return comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 50;
}

/**
 * Find key differences between responses
 */
function findDifferences(responses: ModelResponse[]): string[] {
  const differences: string[] = [];

  const validResponses = responses.filter(r => !r.response.startsWith('Error:'));
  const errorResponses = responses.filter(r => r.response.startsWith('Error:'));

  if (errorResponses.length > 0) {
    differences.push(`${errorResponses.length} model(s) failed to respond`);
  }

  if (validResponses.length > 1) {
    const lengths = validResponses.map(r => r.response.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.some(l => Math.abs(l - avgLength) > avgLength * 0.5);

    if (variance) {
      differences.push('Response lengths vary significantly');
    }
  }

  return differences;
}
