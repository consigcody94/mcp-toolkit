#!/usr/bin/env node

/**
 * Minecraft Pilot MCP Server
 * Natural language control of Minecraft servers via RCON
 */

import { MinecraftRCONClient } from './rcon/rcon-client.js';
import { CommandParser } from './parsers/command-parser.js';
import type {
  MCPRequest,
  MCPResponse,
  MCPError,
  MCPTool,
  RCONConfig,
} from './types.js';

class MCPServer {
  private rcon: MinecraftRCONClient | null = null;

  constructor() {
    this.setupStdio();
  }

  private setupStdio(): void {
    process.stdin.setEncoding('utf8');

    let buffer = '';

    process.stdin.on('data', chunk => {
      buffer += chunk;

      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.trim()) {
          this.handleRequest(line.trim()).catch(error => {
            console.error('Error handling request:', error);
          });
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });
  }

  private async handleRequest(line: string): Promise<void> {
    try {
      const request: MCPRequest = JSON.parse(line);

      // Handle notifications (messages without id) - no response needed
      if (request.id === undefined) {
        if (request.method === 'notifications/initialized') {
          // Acknowledge initialization notification silently
          return;
        }
        // Ignore other notifications
        return;
      }

      let response: MCPResponse;

      switch (request.method) {
        case 'initialize':
          response = this.initialize(request.id);
          break;

        case 'tools/list':
          response = this.listTools(request.id);
          break;

        case 'tools/call':
          response = await this.callTool(request);
          break;

        default:
          response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }

      this.sendResponse(response);
    } catch (error) {
      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: 0,
        error: {
          code: -32700,
          message: `Parse error: ${(error as Error).message}`,
        },
      };

      this.sendResponse(response);
    }
  }

  private initialize(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'minecraft-pilot',
          version: '1.0.0',
        },
      },
    };
  }

  private listTools(id: string | number): MCPResponse {
    const tools: MCPTool[] = [
      {
        name: 'connect_server',
        description:
          'Connect to a Minecraft server via RCON. Required before executing any commands.',
        inputSchema: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              description: 'Server hostname or IP address',
            },
            port: {
              type: 'number',
              description: 'RCON port (default: 25575)',
            },
            password: {
              type: 'string',
              description: 'RCON password',
            },
            timeout: {
              type: 'number',
              description: 'Connection timeout in milliseconds (default: 5000)',
            },
          },
          required: ['host', 'password'],
        },
      },
      {
        name: 'execute_command',
        description:
          'Execute a raw Minecraft command on the server. Supports all vanilla Minecraft commands.',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Minecraft command to execute (without leading /)',
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'natural_command',
        description:
          'Execute a command using natural language. AI will translate your request into proper Minecraft commands.',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description:
                'Natural language description of what you want to do (e.g., "give diamond sword to Steve", "set time to day", "teleport all players to spawn")',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'list_players',
        description:
          'Get a list of all players currently online on the server.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'give_item',
        description:
          'Give an item to a player. Supports all Minecraft items.',
        inputSchema: {
          type: 'object',
          properties: {
            player: {
              type: 'string',
              description: 'Player name or selector (@p, @a, @r, @s)',
            },
            item: {
              type: 'string',
              description: 'Item ID (e.g., diamond_sword, iron_pickaxe)',
            },
            amount: {
              type: 'number',
              description: 'Number of items to give (default: 1)',
            },
          },
          required: ['player', 'item'],
        },
      },
      {
        name: 'teleport_player',
        description:
          'Teleport a player to coordinates or another player.',
        inputSchema: {
          type: 'object',
          properties: {
            player: {
              type: 'string',
              description: 'Player name or selector to teleport',
            },
            x: {
              type: 'number',
              description: 'X coordinate',
            },
            y: {
              type: 'number',
              description: 'Y coordinate',
            },
            z: {
              type: 'number',
              description: 'Z coordinate',
            },
            target: {
              type: 'string',
              description: 'Target player name (alternative to coordinates)',
            },
          },
          required: ['player'],
        },
      },
      {
        name: 'change_gamemode',
        description:
          'Change a player\'s gamemode (survival, creative, adventure, spectator).',
        inputSchema: {
          type: 'object',
          properties: {
            player: {
              type: 'string',
              description: 'Player name or selector',
            },
            gamemode: {
              type: 'string',
              enum: ['survival', 'creative', 'adventure', 'spectator'],
              description: 'Target gamemode',
            },
          },
          required: ['player', 'gamemode'],
        },
      },
      {
        name: 'set_time',
        description:
          'Set the time of day in the Minecraft world.',
        inputSchema: {
          type: 'object',
          properties: {
            time: {
              type: 'string',
              description:
                'Time value: day, night, noon, midnight, or tick number (0-24000)',
            },
          },
          required: ['time'],
        },
      },
      {
        name: 'set_weather',
        description:
          'Change the weather in the Minecraft world.',
        inputSchema: {
          type: 'object',
          properties: {
            weather: {
              type: 'string',
              enum: ['clear', 'rain', 'thunder'],
              description: 'Weather type',
            },
            duration: {
              type: 'number',
              description: 'Duration in seconds (optional)',
            },
          },
          required: ['weather'],
        },
      },
      {
        name: 'broadcast_message',
        description:
          'Send a message to all players on the server.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to broadcast',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'kick_player',
        description:
          'Kick a player from the server.',
        inputSchema: {
          type: 'object',
          properties: {
            player: {
              type: 'string',
              description: 'Player name to kick',
            },
            reason: {
              type: 'string',
              description: 'Reason for kick (optional)',
            },
          },
          required: ['player'],
        },
      },
      {
        name: 'summon_entity',
        description:
          'Summon a mob or entity at specified coordinates.',
        inputSchema: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              description:
                'Entity type (e.g., zombie, cow, ender_dragon)',
            },
            x: {
              type: 'number',
              description: 'X coordinate (optional, defaults to player position)',
            },
            y: {
              type: 'number',
              description: 'Y coordinate (optional)',
            },
            z: {
              type: 'number',
              description: 'Z coordinate (optional)',
            },
          },
          required: ['entity'],
        },
      },
    ];

    return {
      jsonrpc: '2.0',
      id,
      result: { tools },
    };
  }

  private async callTool(request: MCPRequest): Promise<MCPResponse> {
    try {
      const toolName = request.params?.name;
      const args = request.params?.arguments || {};

      if (!toolName) {
        throw new Error('Tool name is required');
      }

      let result: unknown;

      switch (toolName) {
        case 'connect_server':
          result = await this.connectServer(args as unknown as RCONConfig);
          break;

        case 'execute_command':
          result = await this.executeCommand(args.command as string);
          break;

        case 'natural_command':
          result = await this.naturalCommand(args.prompt as string);
          break;

        case 'list_players':
          result = await this.listPlayers();
          break;

        case 'give_item':
          result = await this.giveItem(
            args.player as string,
            args.item as string,
            args.amount as number | undefined
          );
          break;

        case 'teleport_player':
          result = await this.teleportPlayer(args);
          break;

        case 'change_gamemode':
          result = await this.changeGamemode(
            args.player as string,
            args.gamemode as string
          );
          break;

        case 'set_time':
          result = await this.setTime(args.time as string);
          break;

        case 'set_weather':
          result = await this.setWeather(
            args.weather as string,
            args.duration as number | undefined
          );
          break;

        case 'broadcast_message':
          result = await this.broadcastMessage(args.message as string);
          break;

        case 'kick_player':
          result = await this.kickPlayer(
            args.player as string,
            args.reason as string | undefined
          );
          break;

        case 'summon_entity':
          result = await this.summonEntity(args);
          break;

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { content: [{ type: 'text', text: result as string }] },
      };
    } catch (error) {
      const mcpError: MCPError = {
        code: -32603,
        message: (error as Error).message,
      };

      return {
        jsonrpc: '2.0',
        id: request.id,
        error: mcpError,
      };
    }
  }

  private async connectServer(config: RCONConfig): Promise<string> {
    try {
      const rconConfig: RCONConfig = {
        host: config.host,
        port: config.port || 25575,
        password: config.password,
        timeout: config.timeout || 5000,
      };

      this.rcon = new MinecraftRCONClient(rconConfig);
      await this.rcon.connect();

      // Test connection
      const result = await this.rcon.execute({ command: 'list' });

      return this.formatMarkdown(`
# 🎮 Connected to Minecraft Server

**Host:** ${config.host}
**Port:** ${rconConfig.port}
**Status:** ✅ Connected

## Server Response
\`\`\`
${result.output}
\`\`\`

Ready to execute commands! Use any of the available tools to control the server.
      `);
    } catch (error) {
      throw new Error(`Failed to connect: ${(error as Error).message}`);
    }
  }

  private async executeCommand(command: string): Promise<string> {
    this.ensureConnected();

    // Remove leading slash if present
    const cleanCommand = command.startsWith('/') ? command.slice(1) : command;

    // Validate command
    const validation = CommandParser.validate(cleanCommand);
    if (!validation.isValid) {
      return this.formatMarkdown(`
# ⚠️ Command Validation Failed

**Command:** \`${cleanCommand}\`

**Errors:**
${validation.errors.map(e => `- ${e}`).join('\n')}

Please review and modify your command.
      `);
    }

    const result = await this.rcon!.execute({ command: cleanCommand });

    if (!result.success) {
      return this.formatMarkdown(`
# ❌ Command Failed

**Command:** \`${cleanCommand}\`
**Error:** ${result.error}
**Execution Time:** ${result.executionTimeMs}ms
      `);
    }

    return this.formatMarkdown(`
# ✅ Command Executed

**Command:** \`${cleanCommand}\`
**Execution Time:** ${result.executionTimeMs}ms

## Server Response
\`\`\`
${result.output || 'Command executed successfully'}
\`\`\`
    `);
  }

  private async naturalCommand(prompt: string): Promise<string> {
    this.ensureConnected();

    // Parse natural language
    const parsed = CommandParser.parse({ prompt });

    // Show what we understood
    const understanding = this.formatMarkdown(`
# 🤖 Natural Language Translation

**Your Request:** "${prompt}"
**Detected Action:** ${parsed.action}
**Generated Command:** \`${parsed.minecraftCommand}\`
    `);

    // Execute the command
    const result = await this.rcon!.execute({ command: parsed.minecraftCommand });

    if (!result.success) {
      return understanding + this.formatMarkdown(`

## ❌ Execution Failed
**Error:** ${result.error}
      `);
    }

    return understanding + this.formatMarkdown(`

## ✅ Execution Result
**Time:** ${result.executionTimeMs}ms

\`\`\`
${result.output || 'Command executed successfully'}
\`\`\`
    `);
  }

  private async listPlayers(): Promise<string> {
    this.ensureConnected();

    const result = await this.rcon!.execute({ command: 'list' });

    return this.formatMarkdown(`
# 👥 Online Players

\`\`\`
${result.output}
\`\`\`

**Query Time:** ${result.executionTimeMs}ms
    `);
  }

  private async giveItem(
    player: string,
    item: string,
    amount: number = 1
  ): Promise<string> {
    this.ensureConnected();

    const command = `give ${player} minecraft:${item} ${amount}`;
    const result = await this.rcon!.execute({ command });

    return this.formatMarkdown(`
# 🎁 Item Given

**Player:** ${player}
**Item:** ${item}
**Amount:** ${amount}

## Server Response
\`\`\`
${result.output}
\`\`\`
    `);
  }

  private async teleportPlayer(args: Record<string, unknown>): Promise<string> {
    this.ensureConnected();

    const player = args.player as string;

    let command: string;
    if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
      command = `tp ${player} ${args.x} ${args.y} ${args.z}`;
    } else if (args.target) {
      command = `tp ${player} ${args.target}`;
    } else {
      throw new Error('Either coordinates (x, y, z) or target player is required');
    }

    const result = await this.rcon!.execute({ command });

    return this.formatMarkdown(`
# 🌀 Player Teleported

**Player:** ${player}
**Destination:** ${args.target || `${args.x}, ${args.y}, ${args.z}`}

## Server Response
\`\`\`
${result.output}
\`\`\`
    `);
  }

  private async changeGamemode(player: string, gamemode: string): Promise<string> {
    this.ensureConnected();

    const command = `gamemode ${gamemode} ${player}`;
    const result = await this.rcon!.execute({ command });

    return this.formatMarkdown(`
# 🎮 Gamemode Changed

**Player:** ${player}
**New Gamemode:** ${gamemode}

## Server Response
\`\`\`
${result.output}
\`\`\`
    `);
  }

  private async setTime(time: string): Promise<string> {
    this.ensureConnected();

    const command = `time set ${time}`;
    const result = await this.rcon!.execute({ command });

    return this.formatMarkdown(`
# ⏰ Time Set

**Time:** ${time}

## Server Response
\`\`\`
${result.output}
\`\`\`
    `);
  }

  private async setWeather(weather: string, duration?: number): Promise<string> {
    this.ensureConnected();

    const command = duration
      ? `weather ${weather} ${duration}`
      : `weather ${weather}`;

    const result = await this.rcon!.execute({ command });

    return this.formatMarkdown(`
# 🌤️ Weather Changed

**Weather:** ${weather}
${duration ? `**Duration:** ${duration} seconds` : ''}

## Server Response
\`\`\`
${result.output}
\`\`\`
    `);
  }

  private async broadcastMessage(message: string): Promise<string> {
    this.ensureConnected();

    const command = `say ${message}`;
    const result = await this.rcon!.execute({ command });

    return this.formatMarkdown(`
# 📢 Message Broadcast

**Message:** "${message}"

## Server Response
\`\`\`
${result.output}
\`\`\`
    `);
  }

  private async kickPlayer(player: string, reason?: string): Promise<string> {
    this.ensureConnected();

    const command = reason ? `kick ${player} ${reason}` : `kick ${player}`;
    const result = await this.rcon!.execute({ command });

    return this.formatMarkdown(`
# 👢 Player Kicked

**Player:** ${player}
${reason ? `**Reason:** ${reason}` : ''}

## Server Response
\`\`\`
${result.output}
\`\`\`
    `);
  }

  private async summonEntity(args: Record<string, unknown>): Promise<string> {
    this.ensureConnected();

    const entity = args.entity as string;

    let command: string;
    if (args.x !== undefined && args.y !== undefined && args.z !== undefined) {
      command = `summon minecraft:${entity} ${args.x} ${args.y} ${args.z}`;
    } else {
      command = `summon minecraft:${entity}`;
    }

    const result = await this.rcon!.execute({ command });

    return this.formatMarkdown(`
# 👻 Entity Summoned

**Entity:** ${entity}
${args.x !== undefined ? `**Location:** ${args.x}, ${args.y}, ${args.z}` : '**Location:** At player position'}

## Server Response
\`\`\`
${result.output}
\`\`\`
    `);
  }

  private ensureConnected(): void {
    if (!this.rcon || !this.rcon.isConnected()) {
      throw new Error(
        'Not connected to Minecraft server. Use connect_server tool first.'
      );
    }
  }

  private formatMarkdown(content: string): string {
    return content.trim();
  }

  private sendResponse(response: MCPResponse): void {
    console.log(JSON.stringify(response));
  }
}

// Start the server
new MCPServer();
