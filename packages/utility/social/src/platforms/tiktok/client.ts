import { HttpClient } from '../../core/http-client.js';
import { config } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import { ApiResponse, TikTok } from '../../types/index.js';

const TIKTOK_API_URL = 'https://open.tiktokapis.com/v2';

export class TikTokClient {
  private client: HttpClient;
  private log = logger.child({ platform: 'tiktok' });

  constructor() {
    this.client = new HttpClient({
      platform: 'tiktok',
      baseURL: TIKTOK_API_URL,
      defaultHeaders: {
        Authorization: `Bearer ${config.tiktok.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get authenticated user info
   */
  async getMe(): Promise<ApiResponse<{
    openId: string;
    unionId: string;
    displayName: string;
    avatarUrl: string;
    followerCount: number;
    followingCount: number;
    likesCount: number;
    videoCount: number;
    isVerified: boolean;
  }>> {
    this.log.info('Getting authenticated user', { tool: 'get_me' });

    const response = await this.client.post('/user/info/', {
      fields: [
        'open_id',
        'union_id',
        'display_name',
        'avatar_url',
        'follower_count',
        'following_count',
        'likes_count',
        'video_count',
        'is_verified',
      ],
    });

    if (!response.success || !response.data?.data?.user) {
      return response;
    }

    const user = response.data.data.user;
    return {
      success: true,
      data: {
        openId: user.open_id,
        unionId: user.union_id,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        likesCount: user.likes_count || 0,
        videoCount: user.video_count || 0,
        isVerified: user.is_verified || false,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get user's videos
   */
  async getVideos(
    maxCount: number = 20,
    cursor?: string
  ): Promise<ApiResponse<{
    videos: Array<{
      id: string;
      title: string;
      coverUrl: string;
      shareUrl: string;
      createTime: number;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      shareCount: number;
      duration: number;
    }>;
    cursor: string;
    hasMore: boolean;
  }>> {
    this.log.info('Getting user videos', { tool: 'get_videos' });

    const body: any = {
      fields: [
        'id',
        'title',
        'cover_image_url',
        'share_url',
        'create_time',
        'view_count',
        'like_count',
        'comment_count',
        'share_count',
        'duration',
      ],
      max_count: maxCount,
    };

    if (cursor) {
      body.cursor = cursor;
    }

    const response = await this.client.post('/video/list/', body);

    if (!response.success || !response.data?.data) {
      return response;
    }

    const data = response.data.data;
    return {
      success: true,
      data: {
        videos: (data.videos || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          coverUrl: v.cover_image_url,
          shareUrl: v.share_url,
          createTime: v.create_time,
          viewCount: v.view_count || 0,
          likeCount: v.like_count || 0,
          commentCount: v.comment_count || 0,
          shareCount: v.share_count || 0,
          duration: v.duration || 0,
        })),
        cursor: data.cursor || '',
        hasMore: data.has_more || false,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Query a specific video
   */
  async getVideo(videoId: string): Promise<ApiResponse<{
    id: string;
    title: string;
    coverUrl: string;
    shareUrl: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  }>> {
    this.log.info(`Getting video ${videoId}`, { tool: 'get_video' });

    const response = await this.client.post('/video/query/', {
      filters: {
        video_ids: [videoId],
      },
      fields: [
        'id',
        'title',
        'cover_image_url',
        'share_url',
        'view_count',
        'like_count',
        'comment_count',
        'share_count',
      ],
    });

    if (!response.success || !response.data?.data?.videos?.length) {
      return {
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        },
        metadata: response.metadata,
      };
    }

    const v = response.data.data.videos[0];
    return {
      success: true,
      data: {
        id: v.id,
        title: v.title,
        coverUrl: v.cover_image_url,
        shareUrl: v.share_url,
        viewCount: v.view_count || 0,
        likeCount: v.like_count || 0,
        commentCount: v.comment_count || 0,
        shareCount: v.share_count || 0,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Initialize video upload (Direct Post)
   */
  async initVideoUpload(
    options: TikTok.VideoPost
  ): Promise<ApiResponse<{
    publishId: string;
    uploadUrl: string;
  }>> {
    this.log.info('Initializing video upload', { tool: 'init_upload' });

    const body: any = {
      post_info: {
        title: options.caption,
        privacy_level: options.privacy.toUpperCase(),
        disable_comment: !options.allowComments,
        disable_duet: !options.allowDuet,
        disable_stitch: !options.allowStitch,
      },
      source_info: {
        source: 'FILE_UPLOAD',
      },
    };

    if (options.commercialContent) {
      body.post_info.brand_content_toggle = true;
      body.post_info.brand_organic_toggle = true;
    }

    const response = await this.client.post('/post/publish/video/init/', body);

    if (!response.success || !response.data?.data) {
      return response;
    }

    return {
      success: true,
      data: {
        publishId: response.data.data.publish_id,
        uploadUrl: response.data.data.upload_url,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Initialize video upload from URL
   */
  async initVideoUploadFromUrl(
    videoUrl: string,
    options: Omit<TikTok.VideoPost, 'video'>
  ): Promise<ApiResponse<{ publishId: string }>> {
    this.log.info('Initializing video upload from URL', { tool: 'init_upload_url' });

    const body: any = {
      post_info: {
        title: options.caption,
        privacy_level: options.privacy.toUpperCase(),
        disable_comment: !options.allowComments,
        disable_duet: !options.allowDuet,
        disable_stitch: !options.allowStitch,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        video_url: videoUrl,
      },
    };

    const response = await this.client.post('/post/publish/video/init/', body);

    if (!response.success || !response.data?.data) {
      return response;
    }

    return {
      success: true,
      data: {
        publishId: response.data.data.publish_id,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Check video publish status
   */
  async getPublishStatus(
    publishId: string
  ): Promise<ApiResponse<{
    status: 'PROCESSING' | 'PUBLISH_COMPLETE' | 'FAILED';
    videoId?: string;
    failReason?: string;
  }>> {
    this.log.info(`Checking publish status for ${publishId}`, { tool: 'get_publish_status' });

    const response = await this.client.post('/post/publish/status/fetch/', {
      publish_id: publishId,
    });

    if (!response.success || !response.data?.data) {
      return response;
    }

    const data = response.data.data;
    return {
      success: true,
      data: {
        status: data.status,
        videoId: data.publicaly_available_post_id?.[0],
        failReason: data.fail_reason,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Wait for video publish to complete
   */
  async waitForPublish(
    publishId: string,
    maxWaitMs: number = 300000
  ): Promise<ApiResponse<{ videoId: string }>> {
    this.log.info(`Waiting for video publish ${publishId}`, { tool: 'wait_publish' });

    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getPublishStatus(publishId);

      if (!status.success) {
        return status as any;
      }

      if (status.data?.status === 'PUBLISH_COMPLETE' && status.data.videoId) {
        return {
          success: true,
          data: { videoId: status.data.videoId },
          metadata: status.metadata,
        };
      }

      if (status.data?.status === 'FAILED') {
        return {
          success: false,
          error: {
            code: 'PUBLISH_FAILED',
            message: status.data.failReason || 'Video publish failed',
          },
          metadata: status.metadata,
        };
      }

      // Wait 10 seconds before checking again
      await new Promise((r) => setTimeout(r, 10000));
    }

    return {
      success: false,
      error: {
        code: 'PUBLISH_TIMEOUT',
        message: 'Video publish timed out',
      },
      metadata: { platform: 'tiktok', timestamp: new Date().toISOString() },
    };
  }

  /**
   * Upload video chunk (for chunked upload)
   */
  async uploadVideoChunk(
    uploadUrl: string,
    chunk: Buffer,
    start: number,
    end: number,
    total: number
  ): Promise<ApiResponse<{ success: boolean }>> {
    this.log.info(`Uploading video chunk ${start}-${end}/${total}`, { tool: 'upload_chunk' });

    const response = await this.client.put(uploadUrl, chunk, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${total}`,
      },
    });

    return {
      success: response.success,
      data: { success: response.success },
      error: response.error,
      metadata: response.metadata,
    };
  }

  /**
   * Get comments on a video
   */
  async getComments(
    videoId: string,
    maxCount: number = 20,
    cursor?: string
  ): Promise<ApiResponse<{
    comments: Array<{
      id: string;
      text: string;
      createTime: number;
      likeCount: number;
      replyCount: number;
      user: {
        openId: string;
        displayName: string;
        avatarUrl: string;
      };
    }>;
    cursor: string;
    hasMore: boolean;
  }>> {
    this.log.info(`Getting comments for video ${videoId}`, { tool: 'get_comments' });

    const body: any = {
      video_id: videoId,
      max_count: maxCount,
    };

    if (cursor) {
      body.cursor = cursor;
    }

    const response = await this.client.post('/video/comment/list/', body);

    if (!response.success || !response.data?.data) {
      return response;
    }

    const data = response.data.data;
    return {
      success: true,
      data: {
        comments: (data.comments || []).map((c: any) => ({
          id: c.id,
          text: c.text,
          createTime: c.create_time,
          likeCount: c.like_count || 0,
          replyCount: c.reply_count || 0,
          user: {
            openId: c.user?.open_id,
            displayName: c.user?.display_name,
            avatarUrl: c.user?.avatar_url,
          },
        })),
        cursor: data.cursor || '',
        hasMore: data.has_more || false,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Reply to a comment
   */
  async replyToComment(
    videoId: string,
    commentId: string,
    text: string
  ): Promise<ApiResponse<{ commentId: string }>> {
    this.log.info(`Replying to comment ${commentId}`, { tool: 'reply_comment' });

    const response = await this.client.post('/video/comment/reply/', {
      video_id: videoId,
      comment_id: commentId,
      text,
    });

    if (!response.success || !response.data?.data) {
      return response;
    }

    return {
      success: true,
      data: { commentId: response.data.data.comment_id },
      metadata: response.metadata,
    };
  }

  /**
   * Get creator insights (analytics)
   */
  async getCreatorInsights(
    metrics: string[],
    dateRange: { start: string; end: string }
  ): Promise<ApiResponse<Record<string, number>>> {
    this.log.info('Getting creator insights', { tool: 'get_insights' });

    const response = await this.client.post('/research/user/insights/', {
      metrics,
      start_date: dateRange.start,
      end_date: dateRange.end,
    });

    if (!response.success || !response.data?.data) {
      return response;
    }

    return {
      success: true,
      data: response.data.data.metrics || {},
      metadata: response.metadata,
    };
  }

  /**
   * Get video insights
   */
  async getVideoInsights(
    videoId: string
  ): Promise<ApiResponse<{
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    averageWatchTime: number;
    totalWatchTime: number;
    reachCount: number;
  }>> {
    this.log.info(`Getting insights for video ${videoId}`, { tool: 'get_video_insights' });

    // Get video with metrics
    const video = await this.getVideo(videoId);

    if (!video.success || !video.data) {
      return video as any;
    }

    return {
      success: true,
      data: {
        viewCount: video.data.viewCount,
        likeCount: video.data.likeCount,
        commentCount: video.data.commentCount,
        shareCount: video.data.shareCount,
        averageWatchTime: 0, // Not available via basic API
        totalWatchTime: 0,
        reachCount: video.data.viewCount, // Approximate
      },
      metadata: video.metadata,
    };
  }
}

export const tiktokClient = new TikTokClient();
