import { HttpClient } from '../../core/http-client.js';
import { config } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import { ApiResponse, MediaAttachment, Facebook, Instagram } from '../../types/index.js';

const META_GRAPH_URL = 'https://graph.facebook.com/v19.0';

export class MetaClient {
  private client: HttpClient;
  private log = logger.child({ platform: 'meta' });

  constructor() {
    this.client = new HttpClient({
      platform: 'facebook',
      baseURL: META_GRAPH_URL,
      defaultHeaders: {},
    });
  }

  private get accessToken(): string {
    return config.meta.accessToken || '';
  }

  private appendToken(params: Record<string, any> = {}): Record<string, any> {
    return { ...params, access_token: this.accessToken };
  }

  // ==================== FACEBOOK ====================

  /**
   * Get authenticated user info
   */
  async getMe(): Promise<ApiResponse<{
    id: string;
    name: string;
    email?: string;
  }>> {
    this.log.info('Getting authenticated user', { tool: 'get_me' });

    return this.client.get('/me', {
      params: this.appendToken({ fields: 'id,name,email' }),
    });
  }

  /**
   * Get user's Facebook Pages
   */
  async getPages(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    accessToken: string;
    category: string;
    followers: number;
  }>>> {
    this.log.info('Getting user pages', { tool: 'get_pages' });

    const response = await this.client.get('/me/accounts', {
      params: this.appendToken({ fields: 'id,name,access_token,category,followers_count' }),
    });

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: response.data.data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        accessToken: p.access_token,
        category: p.category,
        followers: p.followers_count || 0,
      })) || [],
      metadata: response.metadata,
    };
  }

  /**
   * Post to a Facebook Page
   */
  async postToPage(
    pageId: string,
    pageAccessToken: string,
    message: string,
    options?: {
      link?: string;
      mediaIds?: string[];
      published?: boolean;
      scheduledPublishTime?: number;
    }
  ): Promise<ApiResponse<{ id: string; postUrl: string }>> {
    this.log.info(`Posting to page ${pageId}`, { tool: 'post_to_page' });

    const params: any = {
      access_token: pageAccessToken,
      message,
    };

    if (options?.link) {
      params.link = options.link;
    }

    if (options?.published === false) {
      params.published = false;
      if (options.scheduledPublishTime) {
        params.scheduled_publish_time = options.scheduledPublishTime;
      }
    }

    let endpoint = `/${pageId}/feed`;

    // If media is attached, use photos endpoint
    if (options?.mediaIds?.length) {
      endpoint = `/${pageId}/photos`;
      // For multiple photos, need to use different approach
      if (options.mediaIds.length === 1) {
        params.attached_media = [{ media_fbid: options.mediaIds[0] }];
      }
    }

    const response = await this.client.post(endpoint, null, { params });

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: {
        id: response.data.id,
        postUrl: `https://facebook.com/${response.data.id}`,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Upload a photo to Facebook
   */
  async uploadPhoto(
    pageId: string,
    pageAccessToken: string,
    imageUrl: string,
    caption?: string,
    published: boolean = false
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Uploading photo to page ${pageId}`, { tool: 'upload_photo' });

    const response = await this.client.post(`/${pageId}/photos`, null, {
      params: {
        access_token: pageAccessToken,
        url: imageUrl,
        caption,
        published,
      },
    });

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: { id: response.data.id },
      metadata: response.metadata,
    };
  }

  /**
   * Upload a video to Facebook
   */
  async uploadVideo(
    pageId: string,
    pageAccessToken: string,
    videoUrl: string,
    title: string,
    description?: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Uploading video to page ${pageId}`, { tool: 'upload_video' });

    const response = await this.client.post(`/${pageId}/videos`, null, {
      params: {
        access_token: pageAccessToken,
        file_url: videoUrl,
        title,
        description,
      },
    });

    return response;
  }

  /**
   * Get Page insights/analytics
   */
  async getPageInsights(
    pageId: string,
    pageAccessToken: string,
    metrics: string[],
    period: 'day' | 'week' | 'days_28' = 'day'
  ): Promise<ApiResponse<Record<string, number>>> {
    this.log.info(`Getting insights for page ${pageId}`, { tool: 'get_page_insights' });

    const response = await this.client.get(`/${pageId}/insights`, {
      params: {
        access_token: pageAccessToken,
        metric: metrics.join(','),
        period,
      },
    });

    if (!response.success || !response.data) {
      return response;
    }

    const insights: Record<string, number> = {};
    for (const item of response.data.data || []) {
      const value = item.values?.[0]?.value;
      insights[item.name] = typeof value === 'object' ? Object.values(value).reduce((a: number, b: any) => a + (b || 0), 0) : value || 0;
    }

    return {
      success: true,
      data: insights,
      metadata: response.metadata,
    };
  }

  /**
   * Get post insights
   */
  async getPostInsights(
    postId: string,
    pageAccessToken: string
  ): Promise<ApiResponse<{
    impressions: number;
    reach: number;
    engagement: number;
    reactions: number;
    comments: number;
    shares: number;
  }>> {
    this.log.info(`Getting insights for post ${postId}`, { tool: 'get_post_insights' });

    const response = await this.client.get(`/${postId}/insights`, {
      params: {
        access_token: pageAccessToken,
        metric: 'post_impressions,post_impressions_unique,post_engaged_users,post_reactions_by_type_total,post_comments,post_shares',
      },
    });

    if (!response.success || !response.data) {
      return response;
    }

    const metrics: any = {};
    for (const item of response.data.data || []) {
      metrics[item.name] = item.values?.[0]?.value || 0;
    }

    return {
      success: true,
      data: {
        impressions: metrics.post_impressions || 0,
        reach: metrics.post_impressions_unique || 0,
        engagement: metrics.post_engaged_users || 0,
        reactions: typeof metrics.post_reactions_by_type_total === 'object'
          ? Object.values(metrics.post_reactions_by_type_total).reduce((a: number, b: any) => a + (b || 0), 0)
          : 0,
        comments: metrics.post_comments || 0,
        shares: metrics.post_shares || 0,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Delete a post
   */
  async deletePost(
    postId: string,
    pageAccessToken: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    this.log.info(`Deleting post ${postId}`, { tool: 'delete_post' });

    const response = await this.client.delete(`/${postId}`, {
      params: { access_token: pageAccessToken },
    });

    return {
      success: response.success,
      data: { success: response.success },
      error: response.error,
      metadata: response.metadata,
    };
  }

  /**
   * Get comments on a post
   */
  async getComments(
    postId: string,
    pageAccessToken: string,
    limit: number = 25
  ): Promise<ApiResponse<Array<{
    id: string;
    message: string;
    from: { id: string; name: string };
    createdTime: string;
  }>>> {
    this.log.info(`Getting comments for post ${postId}`, { tool: 'get_comments' });

    const response = await this.client.get(`/${postId}/comments`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,message,from,created_time',
        limit,
      },
    });

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: response.data.data?.map((c: any) => ({
        id: c.id,
        message: c.message,
        from: c.from,
        createdTime: c.created_time,
      })) || [],
      metadata: response.metadata,
    };
  }

  /**
   * Reply to a comment
   */
  async replyToComment(
    commentId: string,
    pageAccessToken: string,
    message: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Replying to comment ${commentId}`, { tool: 'reply_comment' });

    return this.client.post(`/${commentId}/comments`, null, {
      params: {
        access_token: pageAccessToken,
        message,
      },
    });
  }

  /**
   * Create a Facebook Business Manager
   */
  async createBusinessManager(
    name: string,
    vertical: string,
    primaryPageId: string,
    timezoneId: number = 1
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Creating Business Manager: ${name}`, { tool: 'create_business_manager' });

    const userId = config.meta.userId;
    if (!userId) {
      return {
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'META_USER_ID is required for creating Business Manager',
        },
        metadata: { platform: 'facebook', timestamp: new Date().toISOString() },
      };
    }

    return this.client.post(`/${userId}/businesses`, null, {
      params: this.appendToken({
        name,
        vertical,
        primary_page: primaryPageId,
        timezone_id: timezoneId,
      }),
    });
  }

  // ==================== INSTAGRAM ====================

  /**
   * Get Instagram Business Account linked to a Page
   */
  async getInstagramAccount(
    pageId: string,
    pageAccessToken: string
  ): Promise<ApiResponse<{
    id: string;
    username: string;
    name: string;
    followers: number;
    following: number;
    mediaCount: number;
  }>> {
    this.log.info(`Getting Instagram account for page ${pageId}`, { tool: 'get_instagram_account' });

    const response = await this.client.get(`/${pageId}`, {
      params: {
        access_token: pageAccessToken,
        fields: 'instagram_business_account{id,username,name,followers_count,follows_count,media_count}',
      },
    });

    if (!response.success || !response.data?.instagram_business_account) {
      return {
        success: false,
        error: {
          code: 'NO_INSTAGRAM_ACCOUNT',
          message: 'No Instagram Business Account linked to this page',
        },
        metadata: response.metadata,
      };
    }

    const ig = response.data.instagram_business_account;
    return {
      success: true,
      data: {
        id: ig.id,
        username: ig.username,
        name: ig.name,
        followers: ig.followers_count || 0,
        following: ig.follows_count || 0,
        mediaCount: ig.media_count || 0,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Create an Instagram media container (for posting)
   */
  async createInstagramMediaContainer(
    igAccountId: string,
    pageAccessToken: string,
    options: {
      imageUrl?: string;
      videoUrl?: string;
      caption?: string;
      mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS' | 'STORIES';
      children?: string[];
      coverUrl?: string;
      shareToFeed?: boolean;
    }
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Creating Instagram media container`, { tool: 'create_ig_container' });

    const params: any = {
      access_token: pageAccessToken,
      caption: options.caption,
    };

    if (options.mediaType === 'CAROUSEL') {
      params.media_type = 'CAROUSEL';
      params.children = options.children?.join(',');
    } else if (options.mediaType === 'REELS') {
      params.media_type = 'REELS';
      params.video_url = options.videoUrl;
      params.cover_url = options.coverUrl;
      params.share_to_feed = options.shareToFeed ?? true;
    } else if (options.mediaType === 'STORIES') {
      params.media_type = 'STORIES';
      if (options.videoUrl) {
        params.video_url = options.videoUrl;
      } else {
        params.image_url = options.imageUrl;
      }
    } else if (options.videoUrl) {
      params.media_type = 'VIDEO';
      params.video_url = options.videoUrl;
    } else {
      params.image_url = options.imageUrl;
    }

    return this.client.post(`/${igAccountId}/media`, null, { params });
  }

  /**
   * Publish an Instagram media container
   */
  async publishInstagramMedia(
    igAccountId: string,
    pageAccessToken: string,
    creationId: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Publishing Instagram media ${creationId}`, { tool: 'publish_ig_media' });

    return this.client.post(`/${igAccountId}/media_publish`, null, {
      params: {
        access_token: pageAccessToken,
        creation_id: creationId,
      },
    });
  }

  /**
   * Post to Instagram (convenience method)
   */
  async postToInstagram(
    igAccountId: string,
    pageAccessToken: string,
    options: {
      imageUrl?: string;
      videoUrl?: string;
      caption?: string;
      mediaType?: 'IMAGE' | 'VIDEO' | 'REELS';
    }
  ): Promise<ApiResponse<{ id: string; url: string }>> {
    this.log.info(`Posting to Instagram`, { tool: 'post_to_instagram' });

    // Create container
    const containerResponse = await this.createInstagramMediaContainer(
      igAccountId,
      pageAccessToken,
      options
    );

    if (!containerResponse.success || !containerResponse.data) {
      return containerResponse as ApiResponse<{ id: string; url: string }>;
    }

    // Wait for video processing if needed
    if (options.videoUrl || options.mediaType === 'REELS') {
      await this.waitForInstagramMediaReady(
        containerResponse.data.id,
        pageAccessToken
      );
    }

    // Publish
    const publishResponse = await this.publishInstagramMedia(
      igAccountId,
      pageAccessToken,
      containerResponse.data.id
    );

    if (!publishResponse.success || !publishResponse.data) {
      return publishResponse as ApiResponse<{ id: string; url: string }>;
    }

    return {
      success: true,
      data: {
        id: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}`,
      },
      metadata: publishResponse.metadata,
    };
  }

  /**
   * Wait for Instagram media container to be ready
   */
  private async waitForInstagramMediaReady(
    containerId: string,
    accessToken: string,
    maxWaitMs: number = 120000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const response = await this.client.get(`/${containerId}`, {
        params: {
          access_token: accessToken,
          fields: 'status_code',
        },
      });

      if (response.success && response.data) {
        const status = response.data.status_code;

        if (status === 'FINISHED') {
          return;
        }

        if (status === 'ERROR') {
          throw new Error('Instagram media processing failed');
        }
      }

      // Wait 5 seconds before checking again
      await new Promise((r) => setTimeout(r, 5000));
    }

    throw new Error('Instagram media processing timeout');
  }

  /**
   * Get Instagram media insights
   */
  async getInstagramMediaInsights(
    mediaId: string,
    pageAccessToken: string
  ): Promise<ApiResponse<{
    impressions: number;
    reach: number;
    engagement: number;
    saved: number;
    likes: number;
    comments: number;
    shares: number;
  }>> {
    this.log.info(`Getting insights for Instagram media ${mediaId}`, { tool: 'get_ig_insights' });

    const response = await this.client.get(`/${mediaId}/insights`, {
      params: {
        access_token: pageAccessToken,
        metric: 'impressions,reach,engagement,saved,likes,comments,shares',
      },
    });

    if (!response.success || !response.data) {
      return response;
    }

    const metrics: any = {};
    for (const item of response.data.data || []) {
      metrics[item.name] = item.values?.[0]?.value || 0;
    }

    return {
      success: true,
      data: {
        impressions: metrics.impressions || 0,
        reach: metrics.reach || 0,
        engagement: metrics.engagement || 0,
        saved: metrics.saved || 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get Instagram account insights
   */
  async getInstagramAccountInsights(
    igAccountId: string,
    pageAccessToken: string,
    period: 'day' | 'week' | 'days_28' = 'day'
  ): Promise<ApiResponse<{
    impressions: number;
    reach: number;
    profileViews: number;
    followerCount: number;
  }>> {
    this.log.info(`Getting Instagram account insights`, { tool: 'get_ig_account_insights' });

    const response = await this.client.get(`/${igAccountId}/insights`, {
      params: {
        access_token: pageAccessToken,
        metric: 'impressions,reach,profile_views,follower_count',
        period,
      },
    });

    if (!response.success || !response.data) {
      return response;
    }

    const metrics: any = {};
    for (const item of response.data.data || []) {
      metrics[item.name] = item.values?.[0]?.value || 0;
    }

    return {
      success: true,
      data: {
        impressions: metrics.impressions || 0,
        reach: metrics.reach || 0,
        profileViews: metrics.profile_views || 0,
        followerCount: metrics.follower_count || 0,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get Instagram hashtag search
   */
  async searchInstagramHashtag(
    igAccountId: string,
    pageAccessToken: string,
    hashtag: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Searching hashtag #${hashtag}`, { tool: 'search_hashtag' });

    return this.client.get('/ig_hashtag_search', {
      params: {
        access_token: pageAccessToken,
        user_id: igAccountId,
        q: hashtag,
      },
    });
  }

  /**
   * Get recent media for a hashtag
   */
  async getHashtagMedia(
    hashtagId: string,
    igAccountId: string,
    pageAccessToken: string,
    type: 'recent' | 'top' = 'recent'
  ): Promise<ApiResponse<any>> {
    this.log.info(`Getting ${type} media for hashtag ${hashtagId}`, { tool: 'get_hashtag_media' });

    return this.client.get(`/${hashtagId}/${type}_media`, {
      params: {
        access_token: pageAccessToken,
        user_id: igAccountId,
        fields: 'id,caption,media_type,media_url,permalink,timestamp',
      },
    });
  }

  /**
   * Reply to an Instagram comment
   */
  async replyToInstagramComment(
    commentId: string,
    pageAccessToken: string,
    message: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Replying to Instagram comment ${commentId}`, { tool: 'reply_ig_comment' });

    return this.client.post(`/${commentId}/replies`, null, {
      params: {
        access_token: pageAccessToken,
        message,
      },
    });
  }

  /**
   * Get Instagram stories
   */
  async getInstagramStories(
    igAccountId: string,
    pageAccessToken: string
  ): Promise<ApiResponse<any>> {
    this.log.info(`Getting Instagram stories`, { tool: 'get_ig_stories' });

    return this.client.get(`/${igAccountId}/stories`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,media_type,media_url,timestamp',
      },
    });
  }

  /**
   * Post an Instagram Story
   */
  async postInstagramStory(
    igAccountId: string,
    pageAccessToken: string,
    options: {
      imageUrl?: string;
      videoUrl?: string;
    }
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Posting Instagram story`, { tool: 'post_ig_story' });

    return this.postToInstagram(igAccountId, pageAccessToken, {
      ...options,
      mediaType: 'IMAGE',
    });
  }
}

export const metaClient = new MetaClient();
