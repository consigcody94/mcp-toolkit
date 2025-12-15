/**
 * OSC Client for communicating with Ableton Live
 *
 * Ableton Live uses OSC (Open Sound Control) protocol on ports 11000 (send) and 11001 (receive)
 * Reference: https://docs.cycling74.com/max8/refpages/osc-route
 */

import osc from 'node-osc';
import type { OSCClientOptions, OSCArgument } from './types.js';

export class AbletonOSCClient {
  private client: osc.Client;
  private server: osc.Server | null = null;
  private options: OSCClientOptions;
  private responseHandlers: Map<string, (args: OSCArgument[]) => void> = new Map();

  constructor(options?: Partial<OSCClientOptions>) {
    this.options = {
      host: options?.host || 'localhost',
      sendPort: options?.sendPort || 11000,
      receivePort: options?.receivePort || 11001,
      timeout: options?.timeout || 5000,
    };

    this.client = new osc.Client(this.options.host, this.options.sendPort);
  }

  /**
   * Initialize the OSC server to receive messages from Ableton
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = new osc.Server(this.options.receivePort, '0.0.0.0');

        this.server.on('message', (msg: [string, ...unknown[]]) => {
          if (msg.length < 1) return;

          const address = msg[0];
          const args = msg.slice(1) as OSCArgument[];

          // Call registered handler if exists
          const handler = this.responseHandlers.get(address);
          if (handler) {
            handler(args);
          }
        });

        this.server.on('listening', () => {
          resolve();
        });

        this.server.on('error', (err: Error) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send an OSC message to Ableton Live
   */
  async send(address: string, ...args: OSCArgument[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = new osc.Message(address, ...(args as any[]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.client.send(msg as any, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Send an OSC message and wait for a response
   */
  async sendAndReceive(
    address: string,
    responseAddress: string,
    ...args: OSCArgument[]
  ): Promise<OSCArgument[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(responseAddress);
        reject(new Error(`OSC response timeout for ${responseAddress}`));
      }, this.options.timeout);

      // Register response handler
      this.responseHandlers.set(responseAddress, (responseArgs: OSCArgument[]) => {
        clearTimeout(timeout);
        this.responseHandlers.delete(responseAddress);
        resolve(responseArgs);
      });

      // Send the message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = new osc.Message(address, ...(args as any[]));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.client.send(msg as any, (err: Error | null) => {
        if (err) {
          clearTimeout(timeout);
          this.responseHandlers.delete(responseAddress);
          reject(err);
        }
      });
    });
  }

  /**
   * Get session information from Ableton Live
   */
  async getSessionInfo(): Promise<{
    tempo: number;
    timeSignature: { numerator: number; denominator: number };
    isPlaying: boolean;
  }> {
    try {
      // Request tempo
      const tempoResponse = await this.sendAndReceive(
        '/live/song/get/tempo',
        '/live/song/tempo'
      );
      const tempo = Number(tempoResponse[0]) || 120;

      // Request time signature
      const timeSigResponse = await this.sendAndReceive(
        '/live/song/get/time_signature',
        '/live/song/time_signature'
      );
      const numerator = Number(timeSigResponse[0]) || 4;
      const denominator = Number(timeSigResponse[1]) || 4;

      // Request playing status
      const playingResponse = await this.sendAndReceive(
        '/live/song/get/is_playing',
        '/live/song/is_playing'
      );
      const isPlaying = Boolean(playingResponse[0]);

      return {
        tempo,
        timeSignature: { numerator, denominator },
        isPlaying,
      };
    } catch (error) {
      throw new Error(`Failed to get session info: ${(error as Error).message}`);
    }
  }

  /**
   * Set the tempo in Ableton Live
   */
  async setTempo(tempo: number): Promise<void> {
    if (tempo < 20 || tempo > 999) {
      throw new Error('Tempo must be between 20 and 999 BPM');
    }
    await this.send('/live/song/set/tempo', tempo);
  }

  /**
   * Control transport (play, pause, stop)
   */
  async controlTransport(action: 'play' | 'pause' | 'stop' | 'continue'): Promise<void> {
    switch (action) {
      case 'play':
        await this.send('/live/song/start_playing');
        break;
      case 'pause':
        await this.send('/live/song/stop_playing');
        break;
      case 'stop':
        await this.send('/live/song/stop_playing');
        await this.send('/live/song/set/current_song_time', 0);
        break;
      case 'continue':
        await this.send('/live/song/continue_playing');
        break;
      default:
        throw new Error(`Unknown transport action: ${action}`);
    }
  }

  /**
   * Create a new track
   */
  async createTrack(name: string, type: 'audio' | 'midi', position?: number): Promise<number> {
    try {
      // Get current track count
      const trackCountResponse = await this.sendAndReceive(
        '/live/song/get/num_tracks',
        '/live/song/num_tracks'
      );
      const trackCount = Number(trackCountResponse[0]) || 0;

      // Create track based on type
      if (type === 'audio') {
        await this.send('/live/song/create_audio_track', position ?? trackCount);
      } else {
        await this.send('/live/song/create_midi_track', position ?? trackCount);
      }

      // Set track name
      const trackId = position ?? trackCount;
      await this.send(`/live/track/${trackId}/set/name`, name);

      return trackId;
    } catch (error) {
      throw new Error(`Failed to create track: ${(error as Error).message}`);
    }
  }

  /**
   * Create a MIDI clip
   */
  async createClip(
    trackId: number,
    sceneIndex: number,
    name?: string,
    length?: number
  ): Promise<void> {
    try {
      await this.send(`/live/track/${trackId}/create_clip`, sceneIndex, length || 4);
      if (name) {
        await this.send(`/live/clip/${trackId}/${sceneIndex}/set/name`, name);
      }
    } catch (error) {
      throw new Error(`Failed to create clip: ${(error as Error).message}`);
    }
  }

  /**
   * Set mixer parameters for a track
   */
  async setMixerParams(
    trackId: number,
    params: { volume?: number; pan?: number; mute?: boolean; solo?: boolean }
  ): Promise<void> {
    try {
      if (params.volume !== undefined) {
        await this.send(`/live/track/${trackId}/set/volume`, params.volume);
      }
      if (params.pan !== undefined) {
        await this.send(`/live/track/${trackId}/set/panning`, params.pan);
      }
      if (params.mute !== undefined) {
        await this.send(`/live/track/${trackId}/set/mute`, params.mute ? 1 : 0);
      }
      if (params.solo !== undefined) {
        await this.send(`/live/track/${trackId}/set/solo`, params.solo ? 1 : 0);
      }
    } catch (error) {
      throw new Error(`Failed to set mixer params: ${(error as Error).message}`);
    }
  }

  /**
   * Get track levels (volume meters)
   */
  async getTrackLevels(trackIds: number[]): Promise<Map<number, { left: number; right: number }>> {
    const levels = new Map<number, { left: number; right: number }>();

    try {
      for (const trackId of trackIds) {
        const response = await this.sendAndReceive(
          `/live/track/${trackId}/get/output_meter_level`,
          `/live/track/${trackId}/output_meter_level`
        );
        const left = Number(response[0]) || 0;
        const right = Number(response[1]) || 0;
        levels.set(trackId, { left, right });
      }

      return levels;
    } catch (error) {
      throw new Error(`Failed to get track levels: ${(error as Error).message}`);
    }
  }

  /**
   * Close the OSC client and server
   */
  close(): void {
    this.client.close();
    if (this.server) {
      this.server.close();
    }
    this.responseHandlers.clear();
  }
}
