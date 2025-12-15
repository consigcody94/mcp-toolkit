import { HttpClient } from '../../core/http-client.js';
import { config } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import { ApiResponse, MediaAttachment, LinkedIn } from '../../types/index.js';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';
const LINKEDIN_REST_URL = 'https://api.linkedin.com/rest';

export class LinkedInClient {
  private client: HttpClient;
  private restClient: HttpClient;
  private log = logger.child({ platform: 'linkedin' });

  constructor() {
    const headers = {
      Authorization: `Bearer ${config.linkedin.accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401',
    };

    this.client = new HttpClient({
      platform: 'linkedin',
      baseURL: LINKEDIN_API_URL,
      defaultHeaders: headers,
    });

    this.restClient = new HttpClient({
      platform: 'linkedin',
      baseURL: LINKEDIN_REST_URL,
      defaultHeaders: headers,
    });
  }

  /**
   * Get authenticated user profile
   */
  async getMe(): Promise<ApiResponse<{
    id: string;
    firstName: string;
    lastName: string;
    headline?: string;
    profilePicture?: string;
    vanityName?: string;
  }>> {
    this.log.info('Getting authenticated user', { tool: 'get_me' });

    const response = await this.client.get('/userinfo');

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: {
        id: response.data.sub,
        firstName: response.data.given_name,
        lastName: response.data.family_name,
        headline: response.data.headline,
        profilePicture: response.data.picture,
        vanityName: response.data.vanityName,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get the author URN for posts
   */
  private async getAuthorUrn(): Promise<string> {
    if (config.linkedin.authorUrn) {
      return config.linkedin.authorUrn;
    }

    const me = await this.getMe();
    if (me.success && me.data) {
      return `urn:li:person:${me.data.id}`;
    }

    throw new Error('Could not determine LinkedIn author URN');
  }

  /**
   * Post a text update to LinkedIn
   */
  async postUpdate(
    content: string,
    visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC',
    options?: {
      mediaIds?: string[];
      linkUrl?: string;
      linkTitle?: string;
      linkDescription?: string;
    }
  ): Promise<ApiResponse<{ id: string; url: string }>> {
    this.log.info('Posting update', { tool: 'post_update' });

    const authorUrn = await this.getAuthorUrn();

    const body: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility,
      },
    };

    // Add media if provided
    if (options?.mediaIds?.length) {
      body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
      body.specificContent['com.linkedin.ugc.ShareContent'].media = options.mediaIds.map((id) => ({
        status: 'READY',
        media: id,
      }));
    }

    // Add link preview if provided
    if (options?.linkUrl) {
      body.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE';
      body.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: options.linkUrl,
        title: { text: options.linkTitle || '' },
        description: { text: options.linkDescription || '' },
      }];
    }

    const response = await this.client.post('/ugcPosts', body);

    if (!response.success || !response.data) {
      return response;
    }

    const postId = response.data.id;
    const postUrn = postId.replace('urn:li:share:', '');

    return {
      success: true,
      data: {
        id: postId,
        url: `https://www.linkedin.com/feed/update/${postUrn}`,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Post to a company page
   */
  async postCompanyUpdate(
    organizationId: string,
    content: string,
    visibility: 'PUBLIC' | 'LOGGED_IN' = 'PUBLIC'
  ): Promise<ApiResponse<{ id: string; url: string }>> {
    this.log.info(`Posting to company ${organizationId}`, { tool: 'post_company_update' });

    const body = {
      author: `urn:li:organization:${organizationId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility,
      },
    };

    const response = await this.client.post('/ugcPosts', body);

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: {
        id: response.data.id,
        url: `https://www.linkedin.com/feed/update/${response.data.id.replace('urn:li:share:', '')}`,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Delete a post
   */
  async deletePost(postUrn: string): Promise<ApiResponse<{ deleted: boolean }>> {
    this.log.info(`Deleting post ${postUrn}`, { tool: 'delete_post' });

    const response = await this.client.delete(`/ugcPosts/${encodeURIComponent(postUrn)}`);

    return {
      success: response.success,
      data: { deleted: response.success },
      error: response.error,
      metadata: response.metadata,
    };
  }

  /**
   * Get post analytics
   */
  async getPostAnalytics(
    postUrn: string
  ): Promise<ApiResponse<{
    impressions: number;
    clicks: number;
    likes: number;
    comments: number;
    shares: number;
    engagement: number;
  }>> {
    this.log.info(`Getting analytics for ${postUrn}`, { tool: 'get_post_analytics' });

    const response = await this.client.get(
      `/socialActions/${encodeURIComponent(postUrn)}`
    );

    if (!response.success || !response.data) {
      // Try to get basic metrics from the post itself
      const statsResponse = await this.restClient.get(
        `/shares/${encodeURIComponent(postUrn)}?fields=totalShareStatistics`
      );

      if (statsResponse.success && statsResponse.data) {
        const stats = statsResponse.data.totalShareStatistics || {};
        return {
          success: true,
          data: {
            impressions: stats.impressionCount || 0,
            clicks: stats.clickCount || 0,
            likes: stats.likeCount || 0,
            comments: stats.commentCount || 0,
            shares: stats.shareCount || 0,
            engagement: stats.engagement || 0,
          },
          metadata: statsResponse.metadata,
        };
      }

      return response;
    }

    return {
      success: true,
      data: {
        impressions: 0,
        clicks: 0,
        likes: response.data.likesSummary?.totalLikes || 0,
        comments: response.data.commentsSummary?.totalFirstLevelComments || 0,
        shares: 0,
        engagement: 0,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get company page analytics
   */
  async getCompanyAnalytics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ApiResponse<{
    followers: number;
    pageViews: number;
    uniqueVisitors: number;
    clicks: number;
  }>> {
    this.log.info(`Getting analytics for organization ${organizationId}`, { tool: 'get_company_analytics' });

    const timeRange = `(start:${startDate.getTime()},end:${endDate.getTime()})`;

    const response = await this.client.get(
      `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${organizationId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange=${timeRange}`
    );

    if (!response.success || !response.data) {
      return response;
    }

    const elements = response.data.elements || [];
    const totals = elements.reduce(
      (acc: any, el: any) => {
        const stats = el.totalShareStatistics || {};
        return {
          followers: acc.followers,
          pageViews: acc.pageViews + (stats.impressionCount || 0),
          uniqueVisitors: acc.uniqueVisitors + (stats.uniqueImpressionsCount || 0),
          clicks: acc.clicks + (stats.clickCount || 0),
        };
      },
      { followers: 0, pageViews: 0, uniqueVisitors: 0, clicks: 0 }
    );

    return {
      success: true,
      data: totals,
      metadata: response.metadata,
    };
  }

  /**
   * Get company followers count
   */
  async getCompanyFollowers(organizationId: string): Promise<ApiResponse<{ count: number }>> {
    this.log.info(`Getting followers for organization ${organizationId}`, { tool: 'get_company_followers' });

    const response = await this.client.get(
      `/networkSizes/urn:li:organization:${organizationId}?edgeType=CompanyFollowedByMember`
    );

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: { count: response.data.firstDegreeSize || 0 },
      metadata: response.metadata,
    };
  }

  /**
   * Upload an image for posts
   */
  async uploadImage(
    imageData: Buffer,
    filename: string
  ): Promise<ApiResponse<{ mediaUrn: string }>> {
    this.log.info('Uploading image', { tool: 'upload_image' });

    const authorUrn = await this.getAuthorUrn();

    // Register the upload
    const registerResponse = await this.client.post('/assets?action=registerUpload', {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: authorUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    });

    if (!registerResponse.success || !registerResponse.data) {
      return registerResponse;
    }

    const uploadUrl = registerResponse.data.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
    const asset = registerResponse.data.value?.asset;

    if (!uploadUrl || !asset) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_INIT_FAILED',
          message: 'Failed to initialize upload',
        },
        metadata: registerResponse.metadata,
      };
    }

    // Upload the image
    const uploadResponse = await this.client.put(uploadUrl, imageData, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!uploadResponse.success) {
      return uploadResponse;
    }

    return {
      success: true,
      data: { mediaUrn: asset },
      metadata: uploadResponse.metadata,
    };
  }

  /**
   * Publish an article (long-form content)
   */
  async publishArticle(
    title: string,
    body: string,
    options?: {
      coverImageUrn?: string;
      canonicalUrl?: string;
      visibility?: 'PUBLIC' | 'CONNECTIONS';
    }
  ): Promise<ApiResponse<{ id: string; url: string }>> {
    this.log.info('Publishing article', { tool: 'publish_article' });

    const authorUrn = await this.getAuthorUrn();

    const articleBody: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ArticleContent': {
          article: {
            title: title,
            description: body.substring(0, 256),
            source: options?.canonicalUrl,
          },
          content: body,
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': options?.visibility || 'PUBLIC',
      },
    };

    if (options?.coverImageUrn) {
      articleBody.specificContent['com.linkedin.ugc.ArticleContent'].article.thumbnail = options.coverImageUrn;
    }

    const response = await this.client.post('/ugcPosts', articleBody);

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: {
        id: response.data.id,
        url: `https://www.linkedin.com/pulse/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}`,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get user's connections count
   */
  async getConnectionsCount(): Promise<ApiResponse<{ count: number }>> {
    this.log.info('Getting connections count', { tool: 'get_connections' });

    const me = await this.getMe();
    if (!me.success || !me.data) {
      return me as any;
    }

    const response = await this.client.get(
      `/networkSizes/urn:li:person:${me.data.id}?edgeType=CONNECTON`
    );

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: { count: response.data.firstDegreeSize || 0 },
      metadata: response.metadata,
    };
  }

  /**
   * Comment on a post
   */
  async commentOnPost(
    postUrn: string,
    comment: string
  ): Promise<ApiResponse<{ id: string }>> {
    this.log.info(`Commenting on post ${postUrn}`, { tool: 'comment' });

    const authorUrn = await this.getAuthorUrn();

    const response = await this.client.post(
      `/socialActions/${encodeURIComponent(postUrn)}/comments`,
      {
        actor: authorUrn,
        message: { text: comment },
      }
    );

    if (!response.success || !response.data) {
      return response;
    }

    return {
      success: true,
      data: { id: response.data.$URN || response.data.id },
      metadata: response.metadata,
    };
  }

  /**
   * Like a post
   */
  async likePost(postUrn: string): Promise<ApiResponse<{ liked: boolean }>> {
    this.log.info(`Liking post ${postUrn}`, { tool: 'like' });

    const authorUrn = await this.getAuthorUrn();

    const response = await this.client.post(
      `/socialActions/${encodeURIComponent(postUrn)}/likes`,
      { actor: authorUrn }
    );

    return {
      success: response.success,
      data: { liked: response.success },
      error: response.error,
      metadata: response.metadata,
    };
  }

  /**
   * Unlike a post
   */
  async unlikePost(postUrn: string): Promise<ApiResponse<{ unliked: boolean }>> {
    this.log.info(`Unliking post ${postUrn}`, { tool: 'unlike' });

    const authorUrn = await this.getAuthorUrn();
    const actorUrn = encodeURIComponent(authorUrn);

    const response = await this.client.delete(
      `/socialActions/${encodeURIComponent(postUrn)}/likes/${actorUrn}`
    );

    return {
      success: response.success,
      data: { unliked: response.success },
      error: response.error,
      metadata: response.metadata,
    };
  }

  /**
   * Get organization/company info
   */
  async getOrganization(organizationId: string): Promise<ApiResponse<{
    id: string;
    name: string;
    description?: string;
    website?: string;
    industry?: string;
    logoUrl?: string;
  }>> {
    this.log.info(`Getting organization ${organizationId}`, { tool: 'get_organization' });

    const response = await this.client.get(
      `/organizations/${organizationId}?projection=(id,name,description,websiteUrl,logoV2,industries)`
    );

    if (!response.success || !response.data) {
      return response;
    }

    const org = response.data;

    return {
      success: true,
      data: {
        id: org.id,
        name: org.name?.localized?.en_US || org.name,
        description: org.description?.localized?.en_US,
        website: org.websiteUrl,
        industry: org.industries?.[0],
        logoUrl: org.logoV2?.['original~']?.elements?.[0]?.identifiers?.[0]?.identifier,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Search for companies
   */
  async searchCompanies(
    query: string,
    count: number = 10
  ): Promise<ApiResponse<any>> {
    this.log.info(`Searching companies: "${query}"`, { tool: 'search_companies' });

    const response = await this.client.get(
      `/search?q=companiesV2&keywords=${encodeURIComponent(query)}&count=${count}`
    );

    return response;
  }
}

export const linkedinClient = new LinkedInClient();
