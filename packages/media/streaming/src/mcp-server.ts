/**
 * MCP Server for OBS Studio and Twitch Integration
 */

import { OBSClient } from './obs-client.js';
import { TwitchClient } from './twitch-client.js';
import type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  OBSConfig,
  TwitchConfig,
} from './types.js';

export class StreamPilotMCPServer {
  private obsClient: OBSClient;
  private twitchClient: TwitchClient | null = null;

  constructor() {
    this.obsClient = new OBSClient();
  }

  /**
   * List all available MCP tools
   */
  listTools(): MCPTool[] {
    return [
      // OBS Tools
      {
        name: 'connect_obs',
        description: 'Connect to OBS Studio via WebSocket',
        inputSchema: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              description: 'OBS WebSocket host (default: localhost)',
            },
            port: {
              type: 'number',
              description: 'OBS WebSocket port (default: 4455)',
            },
            password: {
              type: 'string',
              description: 'OBS WebSocket password',
            },
          },
        },
      },
      {
        name: 'list_scenes',
        description: 'List all available scenes in OBS',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_current_scene',
        description: 'Get the currently active scene',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'switch_scene',
        description: 'Switch to a different scene',
        inputSchema: {
          type: 'object',
          properties: {
            sceneName: {
              type: 'string',
              description: 'Name of the scene to switch to',
            },
          },
          required: ['sceneName'],
        },
      },
      {
        name: 'start_stream',
        description: 'Start streaming in OBS',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'stop_stream',
        description: 'Stop streaming in OBS',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_stream_status',
        description: 'Get current streaming status and stats',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'start_recording',
        description: 'Start recording in OBS',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'stop_recording',
        description: 'Stop recording in OBS',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_record_status',
        description: 'Get current recording status and stats',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_sources',
        description: 'List all available sources in OBS',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'set_source_visibility',
        description: 'Show or hide a source in the current scene',
        inputSchema: {
          type: 'object',
          properties: {
            sourceName: {
              type: 'string',
              description: 'Name of the source',
            },
            visible: {
              type: 'boolean',
              description: 'True to show, false to hide',
            },
          },
          required: ['sourceName', 'visible'],
        },
      },
      {
        name: 'get_obs_stats',
        description: 'Get OBS performance statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },

      // Twitch Tools
      {
        name: 'setup_twitch',
        description: 'Configure Twitch API credentials',
        inputSchema: {
          type: 'object',
          properties: {
            clientId: {
              type: 'string',
              description: 'Twitch application client ID',
            },
            clientSecret: {
              type: 'string',
              description: 'Twitch application client secret',
            },
            accessToken: {
              type: 'string',
              description: 'Twitch OAuth access token',
            },
          },
          required: ['clientId'],
        },
      },
      {
        name: 'get_user',
        description: 'Get Twitch user information',
        inputSchema: {
          type: 'object',
          properties: {
            login: {
              type: 'string',
              description: 'User login name (optional, defaults to authenticated user)',
            },
          },
        },
      },
      {
        name: 'get_stream_info',
        description: 'Get live stream information for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userLogin: {
              type: 'string',
              description: 'User login name to check',
            },
          },
          required: ['userLogin'],
        },
      },
      {
        name: 'update_channel',
        description: 'Update channel information (title, game, language)',
        inputSchema: {
          type: 'object',
          properties: {
            broadcasterId: {
              type: 'string',
              description: 'Broadcaster user ID',
            },
            title: {
              type: 'string',
              description: 'New stream title',
            },
            gameId: {
              type: 'string',
              description: 'New game/category ID',
            },
            language: {
              type: 'string',
              description: 'Broadcaster language',
            },
          },
          required: ['broadcasterId'],
        },
      },
      {
        name: 'create_clip',
        description: 'Create a clip from the live stream',
        inputSchema: {
          type: 'object',
          properties: {
            broadcasterId: {
              type: 'string',
              description: 'Broadcaster user ID',
            },
          },
          required: ['broadcasterId'],
        },
      },
      {
        name: 'get_clips',
        description: 'Get recent clips for a broadcaster',
        inputSchema: {
          type: 'object',
          properties: {
            broadcasterId: {
              type: 'string',
              description: 'Broadcaster user ID',
            },
            first: {
              type: 'number',
              description: 'Number of clips to retrieve (default: 20)',
            },
          },
          required: ['broadcasterId'],
        },
      },
      {
        name: 'search_categories',
        description: 'Search for games/categories on Twitch',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_top_streams',
        description: 'Get top live streams',
        inputSchema: {
          type: 'object',
          properties: {
            gameId: {
              type: 'string',
              description: 'Filter by game ID (optional)',
            },
            first: {
              type: 'number',
              description: 'Number of streams to retrieve (default: 20)',
            },
          },
        },
      },
    ];
  }

  /**
   * Call an MCP tool
   */
  async callTool(request: MCPRequest): Promise<MCPResponse> {
    const toolName = request.params?.name;
    const args = request.params?.arguments || {};

    try {
      switch (toolName) {
        // OBS Tools
        case 'connect_obs':
          return await this.handleConnectOBS(args as OBSConfig);
        case 'list_scenes':
          return await this.handleListScenes();
        case 'get_current_scene':
          return await this.handleGetCurrentScene();
        case 'switch_scene':
          return await this.handleSwitchScene(args as { sceneName: string });
        case 'start_stream':
          return await this.handleStartStream();
        case 'stop_stream':
          return await this.handleStopStream();
        case 'get_stream_status':
          return await this.handleGetStreamStatus();
        case 'start_recording':
          return await this.handleStartRecording();
        case 'stop_recording':
          return await this.handleStopRecording();
        case 'get_record_status':
          return await this.handleGetRecordStatus();
        case 'list_sources':
          return await this.handleListSources();
        case 'set_source_visibility':
          return await this.handleSetSourceVisibility(
            args as { sourceName: string; visible: boolean }
          );
        case 'get_obs_stats':
          return await this.handleGetOBSStats();

        // Twitch Tools
        case 'setup_twitch':
          return await this.handleSetupTwitch(args as unknown as TwitchConfig);
        case 'get_user':
          return await this.handleGetUser(args as { login?: string });
        case 'get_stream_info':
          return await this.handleGetStreamInfo(args as { userLogin: string });
        case 'update_channel':
          return await this.handleUpdateChannel(
            args as {
              broadcasterId: string;
              title?: string;
              gameId?: string;
              language?: string;
            }
          );
        case 'create_clip':
          return await this.handleCreateClip(args as { broadcasterId: string });
        case 'get_clips':
          return await this.handleGetClips(
            args as { broadcasterId: string; first?: number }
          );
        case 'search_categories':
          return await this.handleSearchCategories(args as { query: string });
        case 'get_top_streams':
          return await this.handleGetTopStreams(
            args as { gameId?: string; first?: number }
          );

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${toolName}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  // OBS Handlers

  private async handleConnectOBS(config: OBSConfig): Promise<MCPResponse> {
    const result = await this.obsClient.connect(config);
    const data = result.data as { version?: string; wsVersion?: string } | undefined;
    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}\n\n**OBS Version:** ${data?.version}\n**WebSocket Version:** ${data?.wsVersion}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleListScenes(): Promise<MCPResponse> {
    const scenes = await this.obsClient.listScenes();
    const sceneList = scenes
      .map((s) => `${s.sceneIndex + 1}. **${s.sceneName}**`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 🎬 Available Scenes (${scenes.length})\n\n${sceneList}`,
        },
      ],
    };
  }

  private async handleGetCurrentScene(): Promise<MCPResponse> {
    const sceneName = await this.obsClient.getCurrentScene();
    return {
      content: [
        {
          type: 'text',
          text: `## 🎯 Current Scene\n\n**${sceneName}**`,
        },
      ],
    };
  }

  private async handleSwitchScene(args: { sceneName: string }): Promise<MCPResponse> {
    const result = await this.obsClient.switchScene(args.sceneName);
    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleStartStream(): Promise<MCPResponse> {
    const result = await this.obsClient.startStream();
    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## 🔴 ${result.message}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleStopStream(): Promise<MCPResponse> {
    const result = await this.obsClient.stopStream();
    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ⏹️ ${result.message}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleGetStreamStatus(): Promise<MCPResponse> {
    const status = await this.obsClient.getStreamStatus();
    const duration = Math.floor(status.outputDuration / 1000 / 60);
    const sizeMB = (status.outputBytes / 1024 / 1024).toFixed(2);

    return {
      content: [
        {
          type: 'text',
          text: `## 📊 Stream Status\n\n**Status:** ${status.outputActive ? '🔴 Live' : '⚪ Offline'}\n**Reconnecting:** ${status.outputReconnecting ? 'Yes' : 'No'}\n**Timecode:** ${status.outputTimecode}\n**Duration:** ${duration} minutes\n**Data Sent:** ${sizeMB} MB`,
        },
      ],
    };
  }

  private async handleStartRecording(): Promise<MCPResponse> {
    const result = await this.obsClient.startRecording();
    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ⏺️ ${result.message}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleStopRecording(): Promise<MCPResponse> {
    const result = await this.obsClient.stopRecording();
    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ⏹️ ${result.message}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleGetRecordStatus(): Promise<MCPResponse> {
    const status = await this.obsClient.getRecordStatus();
    const duration = Math.floor(status.outputDuration / 1000 / 60);
    const sizeMB = (status.outputBytes / 1024 / 1024).toFixed(2);

    return {
      content: [
        {
          type: 'text',
          text: `## 📹 Recording Status\n\n**Status:** ${status.outputActive ? '⏺️ Recording' : '⚪ Not Recording'}\n**Paused:** ${status.outputPaused ? 'Yes' : 'No'}\n**Timecode:** ${status.outputTimecode}\n**Duration:** ${duration} minutes\n**File Size:** ${sizeMB} MB`,
        },
      ],
    };
  }

  private async handleListSources(): Promise<MCPResponse> {
    const sources = await this.obsClient.listSources();
    const sourceList = sources
      .map((s) => `- **${s.sourceName}** (${s.sourceType})`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 🎥 Available Sources (${sources.length})\n\n${sourceList}`,
        },
      ],
    };
  }

  private async handleSetSourceVisibility(args: {
    sourceName: string;
    visible: boolean;
  }): Promise<MCPResponse> {
    const result = await this.obsClient.setSourceVisibility(args.sourceName, args.visible);
    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleGetOBSStats(): Promise<MCPResponse> {
    const stats = await this.obsClient.getStats();
    return {
      content: [
        {
          type: 'text',
          text: `## 📈 OBS Performance Stats\n\n**CPU Usage:** ${stats.cpuUsage.toFixed(2)}%\n**Memory Usage:** ${stats.memoryUsage.toFixed(2)} MB\n**Available Disk Space:** ${(stats.availableDiskSpace / 1024).toFixed(2)} GB\n**FPS:** ${stats.activeFps.toFixed(2)}\n**Render Frames:** ${stats.renderTotalFrames} (${stats.renderSkippedFrames} skipped)\n**Output Frames:** ${stats.outputTotalFrames} (${stats.outputSkippedFrames} skipped)`,
        },
      ],
    };
  }

  // Twitch Handlers

  private async handleSetupTwitch(config: TwitchConfig): Promise<MCPResponse> {
    this.twitchClient = new TwitchClient(config);
    return {
      content: [
        {
          type: 'text',
          text: `## ✅ Twitch API Configured\n\n**Client ID:** ${config.clientId.substring(0, 8)}...`,
        },
      ],
    };
  }

  private ensureTwitchClient(): TwitchClient {
    if (!this.twitchClient) {
      throw new Error('Twitch client not configured. Use setup_twitch tool first.');
    }
    return this.twitchClient;
  }

  private async handleGetUser(args: { login?: string }): Promise<MCPResponse> {
    const client = this.ensureTwitchClient();
    const user = await client.getUser(args.login);

    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: '## ❌ User Not Found',
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `## 👤 ${user.display_name}\n\n**Login:** ${user.login}\n**ID:** ${user.id}\n**Type:** ${user.broadcaster_type || 'user'}\n**Description:** ${user.description}\n**Views:** ${user.view_count.toLocaleString()}\n**Created:** ${new Date(user.created_at).toLocaleDateString()}`,
        },
      ],
    };
  }

  private async handleGetStreamInfo(args: { userLogin: string }): Promise<MCPResponse> {
    const client = this.ensureTwitchClient();
    const stream = await client.getStream(args.userLogin);

    if (!stream) {
      return {
        content: [
          {
            type: 'text',
            text: `## ⚪ ${args.userLogin} is Offline`,
          },
        ],
      };
    }

    const duration = Math.floor(
      (Date.now() - new Date(stream.started_at).getTime()) / 1000 / 60
    );

    return {
      content: [
        {
          type: 'text',
          text: `## 🔴 ${stream.user_name} is Live!\n\n**Title:** ${stream.title}\n**Game:** ${stream.game_name}\n**Viewers:** ${stream.viewer_count.toLocaleString()}\n**Started:** ${new Date(stream.started_at).toLocaleTimeString()} (${duration} minutes ago)\n**Language:** ${stream.language}\n**Mature:** ${stream.is_mature ? 'Yes' : 'No'}`,
        },
      ],
    };
  }

  private async handleUpdateChannel(args: {
    broadcasterId: string;
    title?: string;
    gameId?: string;
    language?: string;
  }): Promise<MCPResponse> {
    const client = this.ensureTwitchClient();
    const updates: { title?: string; game_id?: string; broadcaster_language?: string } = {};

    if (args.title) updates.title = args.title;
    if (args.gameId) updates.game_id = args.gameId;
    if (args.language) updates.broadcaster_language = args.language;

    const result = await client.updateChannel(args.broadcasterId, updates);

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleCreateClip(args: { broadcasterId: string }): Promise<MCPResponse> {
    const client = this.ensureTwitchClient();
    const result = await client.createClip(args.broadcasterId);
    const data = result.data as { clipId?: string; editUrl?: string } | undefined;

    return {
      content: [
        {
          type: 'text',
          text: result.success
            ? `## ✅ ${result.message}\n\n**Clip ID:** ${data?.clipId}\n**Edit URL:** ${data?.editUrl}`
            : `## ❌ ${result.message}\n\n${result.error}`,
        },
      ],
      isError: !result.success,
    };
  }

  private async handleGetClips(args: {
    broadcasterId: string;
    first?: number;
  }): Promise<MCPResponse> {
    const client = this.ensureTwitchClient();
    const clips = await client.getClips(args.broadcasterId, args.first);

    if (clips.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '## 📹 No Clips Found',
          },
        ],
      };
    }

    const clipList = clips
      .map(
        (c) =>
          `### ${c.title}\n**Creator:** ${c.creator_name}\n**Views:** ${c.view_count.toLocaleString()}\n**Duration:** ${c.duration}s\n**Created:** ${new Date(c.created_at).toLocaleDateString()}\n**URL:** ${c.url}`
      )
      .join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 📹 Recent Clips (${clips.length})\n\n${clipList}`,
        },
      ],
    };
  }

  private async handleSearchCategories(args: { query: string }): Promise<MCPResponse> {
    const client = this.ensureTwitchClient();
    const categories = await client.searchCategories(args.query);

    if (categories.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '## 🎮 No Categories Found',
          },
        ],
      };
    }

    const categoryList = categories.map((c) => `- **${c.name}** (ID: ${c.id})`).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 🎮 Categories for "${args.query}"\n\n${categoryList}`,
        },
      ],
    };
  }

  private async handleGetTopStreams(args: {
    gameId?: string;
    first?: number;
  }): Promise<MCPResponse> {
    const client = this.ensureTwitchClient();
    const streams = await client.getTopStreams(args.gameId, args.first);

    if (streams.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '## 🔴 No Streams Found',
          },
        ],
      };
    }

    const streamList = streams
      .map(
        (s, i) =>
          `${i + 1}. **${s.user_name}** - ${s.title}\n   ${s.game_name} • ${s.viewer_count.toLocaleString()} viewers`
      )
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `## 🔴 Top Streams (${streams.length})\n\n${streamList}`,
        },
      ],
    };
  }

  /**
   * Run the MCP server
   */
  async run(): Promise<void> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    readline.on('line', async (line: string) => {
      try {
        const request: MCPRequest = JSON.parse(line);

        let response;
        if (request.method === 'tools/list') {
          response = { tools: this.listTools() };
        } else if (request.method === 'tools/call') {
          response = await this.callTool(request);
        } else {
          response = {
            error: {
              code: -32601,
              message: 'Method not found',
            },
          };
        }

        console.log(JSON.stringify(response));
      } catch (error) {
        console.error('Server error:', error);
      }
    });
  }
}
