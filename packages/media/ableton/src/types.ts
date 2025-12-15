/**
 * TypeScript type definitions for studio-pilot
 */

// MCP Protocol types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
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

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

// Ableton Live session types
export interface AbletonSessionInfo {
  tempo: number;
  timeSignatureNumerator: number;
  timeSignatureDenominator: number;
  isPlaying: boolean;
  currentBeat: number;
  tracks: AbletonTrack[];
}

export interface AbletonTrack {
  id: number;
  name: string;
  type: 'audio' | 'midi' | 'return' | 'master';
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  arm: boolean;
  clips: AbletonClip[];
}

export interface AbletonClip {
  id: number;
  name: string;
  trackId: number;
  sceneIndex: number;
  length: number;
  isPlaying: boolean;
  isMidi: boolean;
}

export interface AbletonDevice {
  id: number;
  name: string;
  trackId: number;
  type: 'instrument' | 'audio_effect' | 'midi_effect';
  parameters: AbletonParameter[];
}

export interface AbletonParameter {
  id: number;
  name: string;
  value: number;
  min: number;
  max: number;
}

// Tool arguments types
export interface CreateTrackArgs {
  name: string;
  type: 'audio' | 'midi';
  position?: number;
}

export interface CreateClipArgs {
  trackId: number;
  sceneIndex: number;
  name?: string;
  length?: number;
}

export interface SetTempoArgs {
  tempo: number;
}

export interface TransportControlArgs {
  action: 'play' | 'pause' | 'stop' | 'continue';
}

export interface CreateAutomationArgs {
  trackId: number;
  parameterId: string;
  startValue: number;
  endValue: number;
  duration: number;
}

export interface AddEffectArgs {
  trackId: number;
  effectName: string;
  position?: number;
}

export interface ExportAudioArgs {
  tracks: number[];
  format: 'wav' | 'mp3' | 'flac';
  outputPath: string;
  stems?: boolean;
}

export interface SetMixerArgs {
  trackId: number;
  volume?: number;
  pan?: number;
  mute?: boolean;
  solo?: boolean;
}

export interface GetTrackLevelsArgs {
  trackIds: number[];
  duration?: number;
}

// OSC Message types
export interface OSCMessage {
  address: string;
  args: OSCArgument[];
}

export type OSCArgument = string | number | boolean | Buffer;

export interface OSCClientOptions {
  host: string;
  sendPort: number;
  receivePort: number;
  timeout?: number;
}
