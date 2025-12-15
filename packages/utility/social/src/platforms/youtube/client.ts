import { HttpClient } from '../../core/http-client.js';
import { config } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import { ApiResponse, YouTube } from '../../types/index.js';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3';

export class YouTubeClient {
  private client: HttpClient;
  private uploadClient: HttpClient;
  private log = logger.child({ platform: 'youtube' });

  constructor() {
    const headers = {
      Authorization: `Bearer ${config.youtube.accessToken}`,
    };

    this.client = new HttpClient({
      platform: 'youtube',
      baseURL: YOUTUBE_API_URL,
      defaultHeaders: headers,
    });

    this.uploadClient = new HttpClient({
      platform: 'youtube',
      baseURL: YOUTUBE_UPLOAD_URL,
      defaultHeaders: headers,
      timeout: 600000, // 10 minutes for uploads
    });
  }

  /**
   * Get authenticated channel info
   */
  async getMyChannel(): Promise<ApiResponse<{
    id: string;
    title: string;
    description: string;
    customUrl: string;
    thumbnailUrl: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
    country?: string;
  }>> {
    this.log.info('Getting my channel', { tool: 'get_channel' });

    const response = await this.client.get('/channels', {
      params: {
        part: 'snippet,statistics,brandingSettings',
        mine: true,
      },
    });

    if (!response.success || !response.data?.items?.length) {
      return {
        success: false,
        error: {
          code: 'NO_CHANNEL',
          message: 'No YouTube channel found',
        },
        metadata: response.metadata,
      };
    }

    const channel = response.data.items[0];
    return {
      success: true,
      data: {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        thumbnailUrl: channel.snippet.thumbnails?.default?.url,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0,
        viewCount: parseInt(channel.statistics.viewCount) || 0,
        country: channel.snippet.country,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get channel's videos
   */
  async getMyVideos(
    maxResults: number = 25,
    pageToken?: string
  ): Promise<ApiResponse<{
    videos: Array<{
      id: string;
      title: string;
      description: string;
      thumbnailUrl: string;
      publishedAt: string;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      duration: string;
    }>;
    nextPageToken?: string;
    totalResults: number;
  }>> {
    this.log.info('Getting my videos', { tool: 'get_videos' });

    // First get the uploads playlist
    const channelResponse = await this.client.get('/channels', {
      params: {
        part: 'contentDetails',
        mine: true,
      },
    });

    if (!channelResponse.success || !channelResponse.data?.items?.length) {
      return channelResponse as any;
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

    // Get videos from uploads playlist
    const playlistResponse = await this.client.get('/playlistItems', {
      params: {
        part: 'snippet,contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults,
        pageToken,
      },
    });

    if (!playlistResponse.success || !playlistResponse.data?.items) {
      return playlistResponse as any;
    }

    const videoIds = playlistResponse.data.items.map((item: any) => item.contentDetails.videoId);

    // Get detailed video info
    const videosResponse = await this.client.get('/videos', {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
      },
    });

    if (!videosResponse.success || !videosResponse.data?.items) {
      return videosResponse as any;
    }

    return {
      success: true,
      data: {
        videos: videosResponse.data.items.map((v: any) => ({
          id: v.id,
          title: v.snippet.title,
          description: v.snippet.description,
          thumbnailUrl: v.snippet.thumbnails?.medium?.url,
          publishedAt: v.snippet.publishedAt,
          viewCount: parseInt(v.statistics.viewCount) || 0,
          likeCount: parseInt(v.statistics.likeCount) || 0,
          commentCount: parseInt(v.statistics.commentCount) || 0,
          duration: v.contentDetails.duration,
        })),
        nextPageToken: playlistResponse.data.nextPageToken,
        totalResults: playlistResponse.data.pageInfo.totalResults,
      },
      metadata: videosResponse.metadata,
    };
  }

  /**
   * Get video details
   */
  async getVideo(videoId: string): Promise<ApiResponse<{
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    tags: string[];
    categoryId: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
    privacyStatus: string;
  }>> {
    this.log.info(`Getting video ${videoId}`, { tool: 'get_video' });

    const response = await this.client.get('/videos', {
      params: {
        part: 'snippet,statistics,contentDetails,status',
        id: videoId,
      },
    });

    if (!response.success || !response.data?.items?.length) {
      return {
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
        metadata: response.metadata,
      };
    }

    const v = response.data.items[0];
    return {
      success: true,
      data: {
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        thumbnailUrl: v.snippet.thumbnails?.high?.url,
        publishedAt: v.snippet.publishedAt,
        channelId: v.snippet.channelId,
        channelTitle: v.snippet.channelTitle,
        tags: v.snippet.tags || [],
        categoryId: v.snippet.categoryId,
        viewCount: parseInt(v.statistics.viewCount) || 0,
        likeCount: parseInt(v.statistics.likeCount) || 0,
        commentCount: parseInt(v.statistics.commentCount) || 0,
        duration: v.contentDetails.duration,
        privacyStatus: v.status.privacyStatus,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Upload a video (resumable upload)
   */
  async uploadVideo(
    videoBuffer: Buffer,
    metadata: YouTube.VideoUpload
  ): Promise<ApiResponse<{ id: string; url: string }>> {
    this.log.info('Uploading video', { tool: 'upload_video' });

    // Step 1: Start resumable upload
    const initResponse = await this.uploadClient.post(
      '/videos?uploadType=resumable&part=snippet,status',
      {
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          categoryId: metadata.categoryId || '22', // Default: People & Blogs
        },
        status: {
          privacyStatus: metadata.privacy,
          selfDeclaredMadeForKids: metadata.madeForKids || false,
        },
      },
      {
        headers: {
          'X-Upload-Content-Length': videoBuffer.length.toString(),
          'X-Upload-Content-Type': 'video/*',
        },
      }
    );

    if (!initResponse.success) {
      return initResponse as any;
    }

    // The upload URL is in the Location header
    // For simplicity, we'll do a single-request upload
    const uploadResponse = await this.uploadClient.put(
      '/videos?uploadType=resumable&part=snippet,status',
      videoBuffer,
      {
        headers: {
          'Content-Type': 'video/*',
          'Content-Length': videoBuffer.length.toString(),
        },
      }
    );

    if (!uploadResponse.success || !uploadResponse.data) {
      return uploadResponse as any;
    }

    return {
      success: true,
      data: {
        id: uploadResponse.data.id,
        url: `https://youtube.com/watch?v=${uploadResponse.data.id}`,
      },
      metadata: uploadResponse.metadata,
    };
  }

  /**
   * Update video metadata
   */
  async updateVideo(
    videoId: string,
    updates: {
      title?: string;
      description?: string;
      tags?: string[];
      categoryId?: string;
      privacy?: 'public' | 'unlisted' | 'private';
    }
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Updating video ${videoId}`, { tool: 'update_video' });

    const body: any = {
      id: videoId,
    };

    if (updates.title || updates.description || updates.tags || updates.categoryId) {
      body.snippet = {};
      if (updates.title) body.snippet.title = updates.title;
      if (updates.description) body.snippet.description = updates.description;
      if (updates.tags) body.snippet.tags = updates.tags;
      if (updates.categoryId) body.snippet.categoryId = updates.categoryId;
    }

    if (updates.privacy) {
      body.status = { privacyStatus: updates.privacy };
    }

    const parts = [];
    if (body.snippet) parts.push('snippet');
    if (body.status) parts.push('status');

    const response = await this.client.put(`/videos?part=${parts.join(',')}`, body);

    if (!response.success) {
      return response as any;
    }

    return {
      success: true,
      data: { id: videoId },
      metadata: response.metadata,
    };
  }

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    this.log.info(`Deleting video ${videoId}`, { tool: 'delete_video' });

    const response = await this.client.delete(`/videos?id=${videoId}`);

    return {
      success: response.success,
      data: { deleted: response.success },
      error: response.error,
      metadata: response.metadata,
    };
  }

  /**
   * Get video comments
   */
  async getComments(
    videoId: string,
    maxResults: number = 20,
    pageToken?: string
  ): Promise<ApiResponse<{
    comments: Array<{
      id: string;
      text: string;
      authorName: string;
      authorChannelId: string;
      authorProfileImage: string;
      likeCount: number;
      replyCount: number;
      publishedAt: string;
    }>;
    nextPageToken?: string;
  }>> {
    this.log.info(`Getting comments for video ${videoId}`, { tool: 'get_comments' });

    const params: any = {
      part: 'snippet',
      videoId,
      maxResults,
      order: 'relevance',
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const response = await this.client.get('/commentThreads', { params });

    if (!response.success || !response.data?.items) {
      return response as any;
    }

    return {
      success: true,
      data: {
        comments: response.data.items.map((item: any) => {
          const comment = item.snippet.topLevelComment.snippet;
          return {
            id: item.id,
            text: comment.textDisplay,
            authorName: comment.authorDisplayName,
            authorChannelId: comment.authorChannelId?.value,
            authorProfileImage: comment.authorProfileImageUrl,
            likeCount: comment.likeCount || 0,
            replyCount: item.snippet.totalReplyCount || 0,
            publishedAt: comment.publishedAt,
          };
        }),
        nextPageToken: response.data.nextPageToken,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Reply to a comment
   */
  async replyToComment(
    parentId: string,
    text: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Replying to comment ${parentId}`, { tool: 'reply_comment' });

    const response = await this.client.post('/comments?part=snippet', {
      snippet: {
        parentId,
        textOriginal: text,
      },
    });

    if (!response.success || !response.data) {
      return response as any;
    }

    return {
      success: true,
      data: { id: response.data.id },
      metadata: response.metadata,
    };
  }

  /**
   * Get channel analytics
   */
  async getChannelAnalytics(
    startDate: string,
    endDate: string,
    metrics: string[] = ['views', 'estimatedMinutesWatched', 'averageViewDuration', 'subscribersGained']
  ): Promise<ApiResponse<Record<string, number>>> {
    this.log.info('Getting channel analytics', { tool: 'get_analytics' });

    // YouTube Analytics API endpoint
    const analyticsClient = new HttpClient({
      platform: 'youtube',
      baseURL: 'https://youtubeanalytics.googleapis.com/v2',
      defaultHeaders: {
        Authorization: `Bearer ${config.youtube.accessToken}`,
      },
    });

    const response = await analyticsClient.get('/reports', {
      params: {
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics: metrics.join(','),
      },
    });

    if (!response.success || !response.data?.rows?.length) {
      return response as any;
    }

    const result: Record<string, number> = {};
    const columnHeaders = response.data.columnHeaders;
    const row = response.data.rows[0];

    for (let i = 0; i < columnHeaders.length; i++) {
      result[columnHeaders[i].name] = row[i];
    }

    return {
      success: true,
      data: result,
      metadata: response.metadata,
    };
  }

  /**
   * Get video analytics
   */
  async getVideoAnalytics(
    videoId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{
    views: number;
    estimatedMinutesWatched: number;
    averageViewDuration: number;
    likes: number;
    dislikes: number;
    comments: number;
    shares: number;
    subscribersGained: number;
  }>> {
    this.log.info(`Getting analytics for video ${videoId}`, { tool: 'get_video_analytics' });

    const analyticsClient = new HttpClient({
      platform: 'youtube',
      baseURL: 'https://youtubeanalytics.googleapis.com/v2',
      defaultHeaders: {
        Authorization: `Bearer ${config.youtube.accessToken}`,
      },
    });

    const response = await analyticsClient.get('/reports', {
      params: {
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes,dislikes,comments,shares,subscribersGained',
        filters: `video==${videoId}`,
      },
    });

    if (!response.success || !response.data?.rows?.length) {
      // Fall back to basic video stats
      const videoResponse = await this.getVideo(videoId);
      if (videoResponse.success && videoResponse.data) {
        return {
          success: true,
          data: {
            views: videoResponse.data.viewCount,
            estimatedMinutesWatched: 0,
            averageViewDuration: 0,
            likes: videoResponse.data.likeCount,
            dislikes: 0,
            comments: videoResponse.data.commentCount,
            shares: 0,
            subscribersGained: 0,
          },
          metadata: videoResponse.metadata,
        };
      }
      return response as any;
    }

    const row = response.data.rows[0];
    return {
      success: true,
      data: {
        views: row[0] || 0,
        estimatedMinutesWatched: row[1] || 0,
        averageViewDuration: row[2] || 0,
        likes: row[3] || 0,
        dislikes: row[4] || 0,
        comments: row[5] || 0,
        shares: row[6] || 0,
        subscribersGained: row[7] || 0,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Search YouTube
   */
  async search(
    query: string,
    maxResults: number = 10,
    type: 'video' | 'channel' | 'playlist' = 'video'
  ): Promise<ApiResponse<Array<{
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    channelTitle: string;
    publishedAt: string;
  }>>> {
    this.log.info(`Searching YouTube: "${query}"`, { tool: 'search' });

    const response = await this.client.get('/search', {
      params: {
        part: 'snippet',
        q: query,
        type,
        maxResults,
      },
    });

    if (!response.success || !response.data?.items) {
      return response as any;
    }

    return {
      success: true,
      data: response.data.items.map((item: any) => ({
        id: item.id.videoId || item.id.channelId || item.id.playlistId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      })),
      metadata: response.metadata,
    };
  }

  /**
   * Create a playlist
   */
  async createPlaylist(
    title: string,
    description: string,
    privacy: 'public' | 'unlisted' | 'private' = 'public'
  ): Promise<ApiResponse<{ id: string; url: string }>> {
    this.log.info(`Creating playlist: ${title}`, { tool: 'create_playlist' });

    const response = await this.client.post('/playlists?part=snippet,status', {
      snippet: {
        title,
        description,
      },
      status: {
        privacyStatus: privacy,
      },
    });

    if (!response.success || !response.data) {
      return response as any;
    }

    return {
      success: true,
      data: {
        id: response.data.id,
        url: `https://youtube.com/playlist?list=${response.data.id}`,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Add video to playlist
   */
  async addToPlaylist(
    playlistId: string,
    videoId: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Adding video ${videoId} to playlist ${playlistId}`, { tool: 'add_to_playlist' });

    const response = await this.client.post('/playlistItems?part=snippet', {
      snippet: {
        playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId,
        },
      },
    });

    if (!response.success || !response.data) {
      return response as any;
    }

    return {
      success: true,
      data: { id: response.data.id },
      metadata: response.metadata,
    };
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channelId: string): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Subscribing to channel ${channelId}`, { tool: 'subscribe' });

    const response = await this.client.post('/subscriptions?part=snippet', {
      snippet: {
        resourceId: {
          kind: 'youtube#channel',
          channelId,
        },
      },
    });

    if (!response.success || !response.data) {
      return response as any;
    }

    return {
      success: true,
      data: { id: response.data.id },
      metadata: response.metadata,
    };
  }

  /**
   * Post to community tab
   */
  async postCommunityUpdate(
    text: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info('Posting community update', { tool: 'community_post' });

    // Note: Community posts API is limited
    // This is a placeholder - actual API may require different approach
    return {
      success: false,
      error: {
        code: 'NOT_AVAILABLE',
        message: 'Community posts API is not publicly available. Use YouTube Studio instead.',
      },
      metadata: { platform: 'youtube', timestamp: new Date().toISOString() },
    };
  }
}

export const youtubeClient = new YouTubeClient();
