#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) Server for studio-pilot
 *
 * Exposes Ableton Live functionality as MCP tools that can be used by LLMs.
 *
 * Usage:
 * Add to your MCP settings (e.g., Claude Desktop config):
 * {
 *   "mcpServers": {
 *     "studio-pilot": {
 *       "command": "studio-pilot",
 *       "args": [],
 *       "env": {
 *         "ABLETON_HOST": "localhost",
 *         "ABLETON_SEND_PORT": "11000",
 *         "ABLETON_RECEIVE_PORT": "11001"
 *       }
 *     }
 *   }
 * }
 */

import { AbletonOSCClient } from './osc-client.js';
import type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPToolResult,
  CreateTrackArgs,
  CreateClipArgs,
  SetTempoArgs,
  TransportControlArgs,
  SetMixerArgs,
  GetTrackLevelsArgs,
} from './types.js';

const TOOLS: MCPTool[] = [
  {
    name: 'get_session_info',
    description:
      'Get current Ableton Live session information including tempo, time signature, playing status, and current beat. Use this to understand the current state of the DAW before making changes.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_tempo',
    description:
      'Set the tempo (BPM) of the Ableton Live session. Tempo must be between 20 and 999 BPM. Common values: 60-80 (slow), 90-110 (moderate), 120-140 (dance), 150+ (fast).',
    inputSchema: {
      type: 'object',
      properties: {
        tempo: {
          type: 'number',
          description: 'Tempo in BPM (beats per minute), between 20 and 999',
        },
      },
      required: ['tempo'],
    },
  },
  {
    name: 'transport_control',
    description:
      'Control the Ableton Live transport (playback). Actions: "play" starts from current position, "pause" stops playback, "stop" stops and returns to beginning, "continue" resumes from pause.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Transport action: play, pause, stop, or continue',
          enum: ['play', 'pause', 'stop', 'continue'],
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'create_track',
    description:
      'Create a new audio or MIDI track in Ableton Live. Audio tracks are for recording or playing audio files. MIDI tracks are for virtual instruments and MIDI sequences. Optionally specify position in the track list.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the new track (e.g., "Drums", "Bass", "Vocals")',
        },
        type: {
          type: 'string',
          description: 'Track type: audio or midi',
          enum: ['audio', 'midi'],
        },
        position: {
          type: 'number',
          description: 'Optional track position/index (0-based). If not provided, adds to end.',
        },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'create_clip',
    description:
      'Create a new MIDI clip in a specific track and scene. Clips are the basic building blocks of Ableton arrangements. Scene index is 0-based (scene 0 is top). Length is in bars.',
    inputSchema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'number',
          description: 'ID of the track to create the clip in (0-based index)',
        },
        sceneIndex: {
          type: 'number',
          description: 'Scene index where to create the clip (0-based, 0 is top scene)',
        },
        name: {
          type: 'string',
          description: 'Optional name for the clip',
        },
        length: {
          type: 'number',
          description: 'Optional length in bars (default: 4)',
        },
      },
      required: ['trackId', 'sceneIndex'],
    },
  },
  {
    name: 'set_mixer',
    description:
      'Set mixer parameters for a track: volume (0-1, default 0.85), pan (-1 to 1, 0 is center), mute (true/false), solo (true/false). You can set one or multiple parameters at once.',
    inputSchema: {
      type: 'object',
      properties: {
        trackId: {
          type: 'number',
          description: 'ID of the track to modify (0-based index)',
        },
        volume: {
          type: 'number',
          description: 'Volume level from 0 (silent) to 1 (full), default is 0.85',
        },
        pan: {
          type: 'number',
          description: 'Pan position from -1 (full left) to 1 (full right), 0 is center',
        },
        mute: {
          type: 'boolean',
          description: 'Mute the track (true) or unmute (false)',
        },
        solo: {
          type: 'boolean',
          description: 'Solo the track (true) or unsolo (false)',
        },
      },
      required: ['trackId'],
    },
  },
  {
    name: 'get_track_levels',
    description:
      'Get real-time output meter levels (volume) for one or more tracks. Returns left and right channel levels (0-1). Useful for monitoring audio levels during playback or recording.',
    inputSchema: {
      type: 'object',
      properties: {
        trackIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of track IDs to get levels for (0-based indices)',
        },
      },
      required: ['trackIds'],
    },
  },
];

class MCPServer {
  private oscClient: AbletonOSCClient | null = null;

  constructor() {
    this.setupStdinHandler();
  }

  private setupStdinHandler(): void {
    let buffer = '';

    process.stdin.on('data', (chunk) => {
      buffer += chunk.toString();

      // Process complete JSON-RPC messages (separated by newlines)
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line) as MCPRequest;
            this.handleRequest(request).catch((error) => {
              this.sendError(request.id, -32603, `Internal error: ${(error as Error).message}`);
            });
          } catch (error) {
            this.sendError(null, -32700, 'Parse error');
          }
        }
      }
    });

    process.stdin.on('end', () => {
      this.cleanup();
      process.exit(0);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.cleanup();
      process.exit(0);
    });
  }

  private async ensureOSCClient(): Promise<AbletonOSCClient> {
    if (!this.oscClient) {
      const host = process.env.ABLETON_HOST || 'localhost';
      const sendPort = parseInt(process.env.ABLETON_SEND_PORT || '11000', 10);
      const receivePort = parseInt(process.env.ABLETON_RECEIVE_PORT || '11001', 10);

      this.oscClient = new AbletonOSCClient({
        host,
        sendPort,
        receivePort,
      });

      await this.oscClient.initialize();
    }
    return this.oscClient;
  }

  private async handleRequest(request: MCPRequest): Promise<void> {
    try {
      switch (request.method) {
        case 'initialize':
          this.sendResponse(request.id, {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'studio-pilot',
              version: '1.0.0',
            },
          });
          break;

        case 'tools/list':
          this.sendResponse(request.id, { tools: TOOLS });
          break;

        case 'tools/call':
          const result = await this.handleToolCall(request.params as { name: string; arguments: unknown });
          this.sendResponse(request.id, result);
          break;

        default:
          this.sendError(request.id, -32601, `Method not found: ${request.method}`);
      }
    } catch (error) {
      this.sendError(request.id, -32603, (error as Error).message);
    }
  }

  private async handleToolCall(params: { name: string; arguments: unknown }): Promise<MCPToolResult> {
    const { name, arguments: args } = params;

    try {
      switch (name) {
        case 'get_session_info':
          return await this.getSessionInfo();

        case 'set_tempo':
          return await this.setTempo(args as SetTempoArgs);

        case 'transport_control':
          return await this.transportControl(args as TransportControlArgs);

        case 'create_track':
          return await this.createTrack(args as CreateTrackArgs);

        case 'create_clip':
          return await this.createClip(args as CreateClipArgs);

        case 'set_mixer':
          return await this.setMixer(args as SetMixerArgs);

        case 'get_track_levels':
          return await this.getTrackLevels(args as GetTrackLevelsArgs);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${(error as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getSessionInfo(): Promise<MCPToolResult> {
    const client = await this.ensureOSCClient();
    const info = await client.getSessionInfo();

    const lines: string[] = [];
    lines.push('# Ableton Live Session Info\n');
    lines.push(`**Tempo:** ${info.tempo} BPM`);
    lines.push(
      `**Time Signature:** ${info.timeSignature.numerator}/${info.timeSignature.denominator}`
    );
    lines.push(`**Status:** ${info.isPlaying ? '▶️ Playing' : '⏸️ Stopped'}`);

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }

  private async setTempo(args: SetTempoArgs): Promise<MCPToolResult> {
    const client = await this.ensureOSCClient();
    await client.setTempo(args.tempo);

    return {
      content: [
        {
          type: 'text',
          text: `✓ Tempo set to ${args.tempo} BPM`,
        },
      ],
    };
  }

  private async transportControl(args: TransportControlArgs): Promise<MCPToolResult> {
    const client = await this.ensureOSCClient();
    await client.controlTransport(args.action);

    const actionEmoji = {
      play: '▶️',
      pause: '⏸️',
      stop: '⏹️',
      continue: '▶️',
    };

    const actionText = {
      play: 'started playing',
      pause: 'paused',
      stop: 'stopped and reset to beginning',
      continue: 'continued playing',
    };

    return {
      content: [
        {
          type: 'text',
          text: `${actionEmoji[args.action]} Playback ${actionText[args.action]}`,
        },
      ],
    };
  }

  private async createTrack(args: CreateTrackArgs): Promise<MCPToolResult> {
    const client = await this.ensureOSCClient();
    const trackId = await client.createTrack(args.name, args.type, args.position);

    const typeIcon = args.type === 'audio' ? '🎵' : '🎹';

    return {
      content: [
        {
          type: 'text',
          text: `${typeIcon} Created ${args.type} track "${args.name}" at position ${trackId}`,
        },
      ],
    };
  }

  private async createClip(args: CreateClipArgs): Promise<MCPToolResult> {
    const client = await this.ensureOSCClient();
    await client.createClip(args.trackId, args.sceneIndex, args.name, args.length);

    const clipName = args.name || 'Unnamed Clip';
    const length = args.length || 4;

    return {
      content: [
        {
          type: 'text',
          text: `🎼 Created clip "${clipName}" in track ${args.trackId}, scene ${args.sceneIndex} (${length} bars)`,
        },
      ],
    };
  }

  private async setMixer(args: SetMixerArgs): Promise<MCPToolResult> {
    const client = await this.ensureOSCClient();
    await client.setMixerParams(args.trackId, {
      volume: args.volume,
      pan: args.pan,
      mute: args.mute,
      solo: args.solo,
    });

    const changes: string[] = [];
    if (args.volume !== undefined) changes.push(`volume: ${(args.volume * 100).toFixed(0)}%`);
    if (args.pan !== undefined) {
      const panText =
        args.pan === 0 ? 'center' : args.pan < 0 ? `${Math.abs(args.pan * 100).toFixed(0)}% left` : `${(args.pan * 100).toFixed(0)}% right`;
      changes.push(`pan: ${panText}`);
    }
    if (args.mute !== undefined) changes.push(`mute: ${args.mute ? 'on' : 'off'}`);
    if (args.solo !== undefined) changes.push(`solo: ${args.solo ? 'on' : 'off'}`);

    return {
      content: [
        {
          type: 'text',
          text: `🎚️ Track ${args.trackId} mixer updated:\n${changes.map((c) => `  • ${c}`).join('\n')}`,
        },
      ],
    };
  }

  private async getTrackLevels(args: GetTrackLevelsArgs): Promise<MCPToolResult> {
    const client = await this.ensureOSCClient();
    const levels = await client.getTrackLevels(args.trackIds);

    const lines: string[] = [];
    lines.push('# Track Levels\n');

    for (const [trackId, level] of levels.entries()) {
      const leftBar = '█'.repeat(Math.round(level.left * 20));
      const rightBar = '█'.repeat(Math.round(level.right * 20));
      lines.push(`**Track ${trackId}:**`);
      lines.push(`  L: ${leftBar.padEnd(20, '░')} ${(level.left * 100).toFixed(1)}%`);
      lines.push(`  R: ${rightBar.padEnd(20, '░')} ${(level.right * 100).toFixed(1)}%`);
      lines.push('');
    }

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }

  private sendResponse(id: number | string, result: unknown): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id,
      result,
    };
    console.log(JSON.stringify(response));
  }

  private sendError(id: number | string | null, code: number, message: string): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: id ?? 'error',
      error: {
        code,
        message,
      },
    };
    console.log(JSON.stringify(response));
  }

  private cleanup(): void {
    if (this.oscClient) {
      this.oscClient.close();
    }
  }
}

// Start the MCP server
new MCPServer();
