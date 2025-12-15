/**
 * Type definitions for Minecraft Pilot MCP Server
 * Comprehensive type system for RCON protocol and Minecraft commands
 */

// ============================================================================
// RCON Connection Types
// ============================================================================

export interface RCONConfig {
  host: string;
  port: number;
  password: string;
  timeout?: number;
}

export interface RCONResponse {
  response: string;
  requestId: number;
}

// ============================================================================
// Minecraft Server Types
// ============================================================================

export interface ServerStatus {
  version: string;
  players: PlayerInfo;
  description: string;
  favicon?: string;
}

export interface PlayerInfo {
  online: number;
  max: number;
  sample?: Array<{
    name: string;
    id: string;
  }>;
}

export interface Player {
  name: string;
  uuid?: string;
  position?: Position;
  health?: number;
  gamemode?: GameMode;
  dimension?: Dimension;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export type GameMode = 'survival' | 'creative' | 'adventure' | 'spectator';
export type Dimension = 'overworld' | 'nether' | 'end';
export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard';
export type Weather = 'clear' | 'rain' | 'thunder';

// ============================================================================
// World Management Types
// ============================================================================

export interface WorldInfo {
  name: string;
  seed: string;
  difficulty: Difficulty;
  gamemode: GameMode;
  time: number;
  weather: Weather;
  spawnPoint: Position;
}

export interface Block {
  type: string;
  position: Position;
  data?: Record<string, unknown>;
}

export interface Entity {
  type: string;
  position: Position;
  name?: string;
  passengers?: Entity[];
}

// ============================================================================
// Command Execution Types
// ============================================================================

export interface CommandRequest {
  command: string;
  timeout?: number;
  validate?: boolean;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
}

export interface ParsedCommand {
  action: string;
  target?: string;
  parameters: Record<string, string | number | boolean>;
  minecraftCommand: string;
}

// ============================================================================
// MCP Protocol Types
// ============================================================================

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: MCPParams;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPParams {
  name?: string;
  arguments?: Record<string, unknown>;
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

// ============================================================================
// Item and Inventory Types
// ============================================================================

export interface Item {
  type: string;
  count: number;
  slot?: number;
  nbt?: Record<string, unknown>;
  enchantments?: Enchantment[];
}

export interface Enchantment {
  id: string;
  level: number;
}

// ============================================================================
// Permission and Operator Types
// ============================================================================

export interface Operator {
  uuid: string;
  name: string;
  level: number;
  bypassesPlayerLimit: boolean;
}

export type PermissionLevel = 0 | 1 | 2 | 3 | 4;

// ============================================================================
// Scoreboard Types
// ============================================================================

export interface Objective {
  name: string;
  criterion: string;
  displayName?: string;
}

export interface Score {
  player: string;
  objective: string;
  value: number;
}

// ============================================================================
// Server Configuration Types
// ============================================================================

export interface ServerProperties {
  'server-port': number;
  'max-players': number;
  'difficulty': Difficulty;
  'gamemode': GameMode;
  'pvp': boolean;
  'online-mode': boolean;
  'white-list': boolean;
  'motd': string;
  'view-distance': number;
  'simulation-distance': number;
  'spawn-protection': number;
}

// ============================================================================
// Effect Types
// ============================================================================

export interface Effect {
  id: string;
  amplifier: number;
  duration: number;
  showParticles: boolean;
}

// ============================================================================
// Natural Language Parsing Types
// ============================================================================

export interface NaturalLanguageRequest {
  prompt: string;
  context?: CommandContext;
}

export interface CommandContext {
  recentCommands?: string[];
  targetPlayers?: string[];
  currentWorld?: string;
}

export interface ParsedIntent {
  intent: CommandIntent;
  entities: Record<string, string | number | boolean>;
  confidence: number;
}

export type CommandIntent =
  | 'give_item'
  | 'teleport'
  | 'change_gamemode'
  | 'set_time'
  | 'set_weather'
  | 'kill_entity'
  | 'summon_entity'
  | 'set_block'
  | 'broadcast_message'
  | 'kick_player'
  | 'ban_player'
  | 'op_player'
  | 'clear_inventory'
  | 'set_difficulty'
  | 'other';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedCommand?: string;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface ServerStatistics {
  uptime: number;
  ticksPerSecond: number;
  memoryUsage: {
    used: number;
    max: number;
    percentage: number;
  };
  players: {
    online: number;
    max: number;
  };
  chunks: {
    loaded: number;
  };
  entities: {
    total: number;
  };
}
