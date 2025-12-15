/**
 * Twitch API client wrapper
 */

import axios, { AxiosInstance } from 'axios';
import type { TwitchConfig, TwitchUser, TwitchStream, TwitchChannel, TwitchClip, OperationResult } from './types.js';

export class TwitchClient {
  private api: AxiosInstance;

  constructor(config: TwitchConfig) {
    this.api = axios.create({
      baseURL: 'https://api.twitch.tv/helix',
      headers: {
        'Client-ID': config.clientId,
        Authorization: `Bearer ${config.accessToken || ''}`,
      },
    });
  }

  /**
   * Get user information
   */
  async getUser(login?: string): Promise<TwitchUser | null> {
    try {
      const params = login ? { login } : {};
      const response = await this.api.get('/users', { params });
      return response.data.data[0] || null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  /**
   * Get stream information
   */
  async getStream(userLogin: string): Promise<TwitchStream | null> {
    try {
      const response = await this.api.get('/streams', {
        params: { user_login: userLogin },
      });
      return response.data.data[0] || null;
    } catch (error) {
      console.error('Failed to get stream:', error);
      return null;
    }
  }

  /**
   * Get channel information
   */
  async getChannel(broadcasterId: string): Promise<TwitchChannel | null> {
    try {
      const response = await this.api.get('/channels', {
        params: { broadcaster_id: broadcasterId },
      });
      return response.data.data[0] || null;
    } catch (error) {
      console.error('Failed to get channel:', error);
      return null;
    }
  }

  /**
   * Update channel information
   */
  async updateChannel(
    broadcasterId: string,
    updates: {
      title?: string;
      game_id?: string;
      broadcaster_language?: string;
    }
  ): Promise<OperationResult> {
    try {
      await this.api.patch('/channels', updates, {
        params: { broadcaster_id: broadcasterId },
      });
      return {
        success: true,
        message: 'Updated channel information',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update channel',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create clip
   */
  async createClip(broadcasterId: string): Promise<OperationResult> {
    try {
      const response = await this.api.post('/clips', null, {
        params: { broadcaster_id: broadcasterId },
      });
      const clipId = response.data.data[0].id;
      const editUrl = response.data.data[0].edit_url;
      return {
        success: true,
        message: 'Created clip',
        data: { clipId, editUrl },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create clip',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get clips
   */
  async getClips(broadcasterId: string, first = 20): Promise<TwitchClip[]> {
    try {
      const response = await this.api.get('/clips', {
        params: { broadcaster_id: broadcasterId, first },
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get clips:', error);
      return [];
    }
  }

  /**
   * Search categories
   */
  async searchCategories(query: string): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.api.get('/search/categories', {
        params: { query },
      });
      return response.data.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
      }));
    } catch (error) {
      console.error('Failed to search categories:', error);
      return [];
    }
  }

  /**
   * Get top streams
   */
  async getTopStreams(gameId?: string, first = 20): Promise<TwitchStream[]> {
    try {
      const params: any = { first };
      if (gameId) params.game_id = gameId;

      const response = await this.api.get('/streams', { params });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get top streams:', error);
      return [];
    }
  }
}
