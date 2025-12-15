/**
 * Type system for OBS Studio, Twitch, and MCP protocol
 */

// ============================================================================
// OBS Studio Types
// ============================================================================

export interface OBSConfig {
  host?: string;
  port?: number;
  password?: string;
}

export interface OBSScene {
  sceneName: string;
  sceneIndex: number;
}

export interface OBSSource {
  sourceName: string;
  sourceType: string;
  sourceKind: string;
}

export interface OBSStreamStatus {
  outputActive: boolean;
  outputReconnecting: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputBytes: number;
}

export interface OBSRecordStatus {
  outputActive: boolean;
  outputPaused: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputBytes: number;
}

export interface OBSStats {
  cpuUsage: number;
  memoryUsage: number;
  availableDiskSpace: number;
  activeFps: number;
  renderTotalFrames: number;
  renderSkippedFrames: number;
  outputTotalFrames: number;
  outputSkippedFrames: number;
}

// ============================================================================
// Twitch Types
// ============================================================================

export interface TwitchConfig {
  clientId: string;
  clientSecret?: string;
  accessToken?: string;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  created_at: string;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: 'live' | '';
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

export interface TwitchChannel {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
  broadcaster_language: string;
  game_id: string;
  game_name: string;
  title: string;
  delay: number;
}

export interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
}

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPRequest {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

export interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
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
// Operation Results
// ============================================================================

export interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}
