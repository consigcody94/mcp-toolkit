/**
 * Master Claude MCP - CLI Model Detector
 * Detects available AI CLI tools and their authentication status
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { AIModel } from './types.js';

const execAsync = promisify(exec);

/**
 * CLI configurations for known AI providers
 */
const CLI_CONFIGS = [
  {
    name: 'Gemini Pro',
    provider: 'gemini',
    cliCommand: 'gemini',
    testCommand: 'gemini --version',
    authCheckCommand: 'gemini config list',
    capabilities: ['chat', 'code', 'vision', 'long-context'] as const,
    costPerMillionTokens: 0.5,
    speedRating: 8,
    qualityRating: 8,
  },
  {
    name: 'GPT-4',
    provider: 'openai',
    cliCommand: 'openai',
    testCommand: 'openai --version',
    authCheckCommand: 'openai api key.get',
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'function-calling'] as const,
    costPerMillionTokens: 30,
    speedRating: 6,
    qualityRating: 9,
  },
  {
    name: 'DeepSeek Coder',
    provider: 'deepseek',
    cliCommand: 'deepseek',
    testCommand: 'deepseek --version',
    authCheckCommand: 'deepseek auth status',
    capabilities: ['chat', 'code', 'reasoning'] as const,
    costPerMillionTokens: 0.14,
    speedRating: 9,
    qualityRating: 8,
  },
  {
    name: 'Claude Sonnet',
    provider: 'claude',
    cliCommand: 'claude',
    testCommand: 'claude --version',
    authCheckCommand: 'claude auth whoami',
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'long-context', 'function-calling'] as const,
    costPerMillionTokens: 3,
    speedRating: 7,
    qualityRating: 10,
  },
  {
    name: 'Anthropic CLI',
    provider: 'anthropic',
    cliCommand: 'anthropic',
    testCommand: 'anthropic --version',
    authCheckCommand: 'anthropic auth check',
    capabilities: ['chat', 'code', 'reasoning', 'vision', 'long-context'] as const,
    costPerMillionTokens: 3,
    speedRating: 7,
    qualityRating: 10,
  },
  {
    name: 'Codex',
    provider: 'codex',
    cliCommand: 'codex',
    testCommand: 'codex --version',
    authCheckCommand: 'codex auth status',
    capabilities: ['code', 'chat'] as const,
    costPerMillionTokens: 2,
    speedRating: 8,
    qualityRating: 7,
  },
];

/**
 * Check if a CLI command is available
 */
async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a CLI is authenticated
 */
async function isAuthenticated(authCheckCommand: string): Promise<boolean> {
  try {
    const { stdout, stderr } = await execAsync(authCheckCommand, { timeout: 5000 });
    const output = stdout + stderr;

    // Common patterns indicating authentication
    const authenticatedPatterns = [
      /authenticated/i,
      /logged in/i,
      /api[- ]key.*set/i,
      /token.*valid/i,
      /user.*@/i, // email pattern
    ];

    // Common patterns indicating NOT authenticated
    const unauthenticatedPatterns = [
      /not authenticated/i,
      /not logged in/i,
      /no api[- ]key/i,
      /missing.*key/i,
      /please login/i,
      /authentication required/i,
    ];

    // Check if unauthenticated
    if (unauthenticatedPatterns.some(pattern => pattern.test(output))) {
      return false;
    }

    // Check if authenticated
    if (authenticatedPatterns.some(pattern => pattern.test(output))) {
      return true;
    }

    // If command succeeded without error, assume authenticated
    return !stderr || stderr.length === 0;
  } catch {
    return false;
  }
}

/**
 * Detect all available AI CLI models
 */
export async function detectModels(): Promise<AIModel[]> {
  const models: AIModel[] = [];

  for (const config of CLI_CONFIGS) {
    const available = await isCommandAvailable(config.cliCommand);
    const authenticated = available ? await isAuthenticated(config.authCheckCommand) : false;

    models.push({
      name: config.name,
      provider: config.provider,
      cliCommand: config.cliCommand,
      available,
      authenticated,
      capabilities: [...config.capabilities],
      costPerMillionTokens: config.costPerMillionTokens,
      speedRating: config.speedRating,
      qualityRating: config.qualityRating,
    });
  }

  return models;
}

/**
 * Get only authenticated models
 */
export async function getAuthenticatedModels(): Promise<AIModel[]> {
  const models = await detectModels();
  return models.filter(m => m.available && m.authenticated);
}
