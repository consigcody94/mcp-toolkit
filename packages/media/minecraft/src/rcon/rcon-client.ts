/**
 * RCON Client for Minecraft Server Communication
 * Wraps rcon-client library with enhanced error handling and retry logic
 */

import { Rcon } from 'rcon-client';
import type {
  RCONConfig,
  CommandRequest,
  CommandResult,
} from '../types.js';

export class MinecraftRCONClient {
  private config: RCONConfig;
  private client: Rcon | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(config: RCONConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 5000,
    };
  }

  /**
   * Connect to Minecraft server via RCON
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      this.client = await Rcon.connect({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        timeout: this.config.timeout,
      });

      this.connected = true;
      this.reconnectAttempts = 0;

      // Set up error handlers
      this.client.on('error', (err) => {
        console.error('RCON error:', err);
        this.connected = false;
      });

      this.client.on('end', () => {
        console.log('RCON connection ended');
        this.connected = false;
      });
    } catch (error) {
      throw new Error(`Failed to connect to RCON: ${(error as Error).message}`);
    }
  }

  /**
   * Disconnect from Minecraft server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
    this.connected = false;
  }

  /**
   * Execute a command on the Minecraft server
   */
  async execute(request: CommandRequest): Promise<CommandResult> {
    await this.ensureConnected();

    const startTime = Date.now();

    try {
      const response = await this.client!.send(request.command);
      const executionTimeMs = Date.now() - startTime;

      return {
        success: true,
        output: response,
        executionTimeMs,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      return {
        success: false,
        output: '',
        error: (error as Error).message,
        executionTimeMs,
      };
    }
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeBatch(commands: string[]): Promise<CommandResult[]> {
    const results: CommandResult[] = [];

    for (const command of commands) {
      const result = await this.execute({ command });
      results.push(result);

      // Stop on first error
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Check if connected to server
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Ensure connection is active, reconnect if needed
   */
  private async ensureConnected(): Promise<void> {
    if (this.connected) {
      return;
    }

    // Try to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting to RCON (attempt ${this.reconnectAttempts})...`);

      try {
        await this.connect();
        return;
      } catch (error) {
        // Continue to throw error below
      }
    }

    throw new Error(
      'Not connected to RCON server. Call connect() first or check server status.'
    );
  }

  /**
   * Get server configuration
   */
  getConfig(): RCONConfig {
    return { ...this.config };
  }
}
