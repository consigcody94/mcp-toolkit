import { HttpClient } from '../../core/http-client.js';
import { config } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import { ApiResponse, MediaAttachment, Twitter } from '../../types/index.js';
import crypto from 'crypto';

const TWITTER_API_URL = 'https://api.twitter.com/2';
const TWITTER_UPLOAD_URL = 'https://upload.twitter.com/1.1';

export class TwitterClient {
  private client: HttpClient;
  private log = logger.child({ platform: 'twitter' });

  constructor() {
    this.client = new HttpClient({
      platform: 'twitter',
      baseURL: TWITTER_API_URL,
      defaultHeaders: {
        Authorization: `Bearer ${config.twitter.bearerToken || config.twitter.accessToken}`,
      },
    });
  }

  /**
   * Generate OAuth 1.0a signature for requests requiring user context
   */
  private generateOAuth1Header(
    method: string,
    url: string,
    params: Record<string, string> = {}
  ): string {
    const oauth = {
      oauth_consumer_key: config.twitter.apiKey!,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: config.twitter.accessToken!,
      oauth_version: '1.0',
    };

    const allParams: Record<string, string> = { ...oauth, ...params };
    const sortedParams = Object.keys(allParams)
      .sort()
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    const signatureBase = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(sortedParams),
    ].join('&');

    const signingKey = `${encodeURIComponent(config.twitter.apiSecret!)}&${encodeURIComponent(config.twitter.accessTokenSecret!)}`;

    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');

    const oauthWithSig = { ...oauth, oauth_signature: signature };

    return (
      'OAuth ' +
      Object.keys(oauthWithSig)
        .sort()
        .map((key) => `${encodeURIComponent(key)}="${encodeURIComponent(oauthWithSig[key as keyof typeof oauthWithSig])}"`)
        .join(', ')
    );
  }

  /**
   * Post a new tweet
   */
  async postTweet(
    text: string,
    options?: Twitter.TweetOptions & { mediaIds?: string[] }
  ): Promise<ApiResponse<{ id: string; text: string }>> {
    this.log.info('Posting tweet', { tool: 'post_tweet' });

    const body: any = { text };

    if (options?.mediaIds?.length) {
      body.media = { media_ids: options.mediaIds };
    }

    if (options?.replyTo) {
      body.reply = { in_reply_to_tweet_id: options.replyTo };
    }

    if (options?.quoteTweet) {
      body.quote_tweet_id = options.quoteTweet;
    }

    if (options?.poll) {
      body.poll = {
        options: options.poll.options,
        duration_minutes: options.poll.durationMinutes,
      };
    }

    if (options?.conversationControl) {
      const replySettings = {
        everyone: 'everyone',
        following: 'following',
        mentioned: 'mentionedUsers',
      };
      body.reply_settings = replySettings[options.conversationControl];
    }

    return this.client.post('/tweets', body);
  }

  /**
   * Post a thread of tweets
   */
  async postThread(
    tweets: Array<{ text: string; mediaIds?: string[] }>
  ): Promise<ApiResponse<{ tweets: Array<{ id: string; text: string }> }>> {
    this.log.info(`Posting thread with ${tweets.length} tweets`, { tool: 'post_thread' });

    const results: Array<{ id: string; text: string }> = [];
    let previousTweetId: string | undefined;

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      const response = await this.postTweet(tweet.text, {
        replyTo: previousTweetId,
        mediaIds: tweet.mediaIds,
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: {
            code: 'THREAD_FAILED',
            message: `Failed to post tweet ${i + 1} in thread: ${response.error?.message}`,
          },
          metadata: response.metadata,
        };
      }

      results.push(response.data);
      previousTweetId = response.data.id;

      // Small delay between tweets
      if (i < tweets.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return {
      success: true,
      data: { tweets: results },
      metadata: {
        platform: 'twitter',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(tweetId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    this.log.info(`Deleting tweet ${tweetId}`, { tool: 'delete_tweet' });
    return this.client.delete(`/tweets/${tweetId}`);
  }

  /**
   * Get a tweet by ID
   */
  async getTweet(
    tweetId: string,
    expansions?: string[]
  ): Promise<ApiResponse<any>> {
    this.log.info(`Getting tweet ${tweetId}`, { tool: 'get_tweet' });

    const params = new URLSearchParams();
    params.append('tweet.fields', 'created_at,public_metrics,author_id,conversation_id');

    if (expansions?.length) {
      params.append('expansions', expansions.join(','));
    }

    return this.client.get(`/tweets/${tweetId}?${params.toString()}`);
  }

  /**
   * Get tweet metrics/analytics
   */
  async getTweetMetrics(
    tweetId: string
  ): Promise<ApiResponse<{
    impressions: number;
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    bookmarks: number;
  }>> {
    this.log.info(`Getting metrics for tweet ${tweetId}`, { tool: 'get_tweet_metrics' });

    const response = await this.client.get(
      `/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`
    );

    if (!response.success || !response.data) {
      return response;
    }

    const metrics = response.data.data?.public_metrics || {};
    const nonPublic = response.data.data?.non_public_metrics || {};
    const organic = response.data.data?.organic_metrics || {};

    return {
      success: true,
      data: {
        impressions: nonPublic.impression_count || organic.impression_count || 0,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        quotes: metrics.quote_count || 0,
        bookmarks: metrics.bookmark_count || 0,
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get authenticated user info
   */
  async getMe(): Promise<ApiResponse<{
    id: string;
    username: string;
    name: string;
    metrics: Twitter.UserMetrics;
  }>> {
    this.log.info('Getting authenticated user', { tool: 'get_me' });

    const response = await this.client.get(
      '/users/me?user.fields=created_at,description,public_metrics,profile_image_url,verified'
    );

    if (!response.success || !response.data) {
      return response;
    }

    const user = response.data.data;

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        metrics: {
          followersCount: user.public_metrics?.followers_count || 0,
          followingCount: user.public_metrics?.following_count || 0,
          tweetCount: user.public_metrics?.tweet_count || 0,
          listedCount: user.public_metrics?.listed_count || 0,
        },
      },
      metadata: response.metadata,
    };
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<ApiResponse<any>> {
    this.log.info(`Getting user @${username}`, { tool: 'get_user' });

    return this.client.get(
      `/users/by/username/${username}?user.fields=created_at,description,public_metrics,profile_image_url,verified`
    );
  }

  /**
   * Get user's recent tweets
   */
  async getUserTweets(
    userId: string,
    maxResults: number = 10
  ): Promise<ApiResponse<any>> {
    this.log.info(`Getting tweets for user ${userId}`, { tool: 'get_user_tweets' });

    return this.client.get(
      `/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics`
    );
  }

  /**
   * Search recent tweets
   */
  async searchTweets(
    query: string,
    maxResults: number = 10
  ): Promise<ApiResponse<any>> {
    this.log.info(`Searching tweets: "${query}"`, { tool: 'search_tweets' });

    return this.client.get(
      `/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id`
    );
  }

  /**
   * Like a tweet
   */
  async likeTweet(userId: string, tweetId: string): Promise<ApiResponse<{ liked: boolean }>> {
    this.log.info(`Liking tweet ${tweetId}`, { tool: 'like_tweet' });

    return this.client.post(`/users/${userId}/likes`, { tweet_id: tweetId });
  }

  /**
   * Unlike a tweet
   */
  async unlikeTweet(userId: string, tweetId: string): Promise<ApiResponse<{ liked: boolean }>> {
    this.log.info(`Unliking tweet ${tweetId}`, { tool: 'unlike_tweet' });

    return this.client.delete(`/users/${userId}/likes/${tweetId}`);
  }

  /**
   * Retweet a tweet
   */
  async retweet(userId: string, tweetId: string): Promise<ApiResponse<{ retweeted: boolean }>> {
    this.log.info(`Retweeting tweet ${tweetId}`, { tool: 'retweet' });

    return this.client.post(`/users/${userId}/retweets`, { tweet_id: tweetId });
  }

  /**
   * Undo a retweet
   */
  async undoRetweet(userId: string, tweetId: string): Promise<ApiResponse<{ retweeted: boolean }>> {
    this.log.info(`Undoing retweet ${tweetId}`, { tool: 'undo_retweet' });

    return this.client.delete(`/users/${userId}/retweets/${tweetId}`);
  }

  /**
   * Follow a user
   */
  async followUser(userId: string, targetUserId: string): Promise<ApiResponse<{ following: boolean }>> {
    this.log.info(`Following user ${targetUserId}`, { tool: 'follow_user' });

    return this.client.post(`/users/${userId}/following`, { target_user_id: targetUserId });
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string, targetUserId: string): Promise<ApiResponse<{ following: boolean }>> {
    this.log.info(`Unfollowing user ${targetUserId}`, { tool: 'unfollow_user' });

    return this.client.delete(`/users/${userId}/following/${targetUserId}`);
  }

  /**
   * Get user's followers
   */
  async getFollowers(
    userId: string,
    maxResults: number = 100
  ): Promise<ApiResponse<any>> {
    this.log.info(`Getting followers for user ${userId}`, { tool: 'get_followers' });

    return this.client.get(
      `/users/${userId}/followers?max_results=${maxResults}&user.fields=created_at,description,public_metrics`
    );
  }

  /**
   * Get users the user is following
   */
  async getFollowing(
    userId: string,
    maxResults: number = 100
  ): Promise<ApiResponse<any>> {
    this.log.info(`Getting following for user ${userId}`, { tool: 'get_following' });

    return this.client.get(
      `/users/${userId}/following?max_results=${maxResults}&user.fields=created_at,description,public_metrics`
    );
  }

  /**
   * Create a list
   */
  async createList(
    name: string,
    description?: string,
    isPrivate: boolean = false
  ): Promise<ApiResponse<{ id: string; name: string }>> {
    this.log.info(`Creating list "${name}"`, { tool: 'create_list' });

    return this.client.post('/lists', {
      name,
      description,
      private: isPrivate,
    });
  }

  /**
   * Add member to list
   */
  async addListMember(
    listId: string,
    userId: string
  ): Promise<ApiResponse<{ is_member: boolean }>> {
    this.log.info(`Adding user ${userId} to list ${listId}`, { tool: 'add_list_member' });

    return this.client.post(`/lists/${listId}/members`, { user_id: userId });
  }

  /**
   * Get trending topics for a location
   */
  async getTrends(woeid: number = 1): Promise<ApiResponse<any>> {
    this.log.info(`Getting trends for WOEID ${woeid}`, { tool: 'get_trends' });

    // Note: Trends endpoint is v1.1, not v2
    const trendsClient = new HttpClient({
      platform: 'twitter',
      baseURL: 'https://api.twitter.com/1.1',
      defaultHeaders: {
        Authorization: `Bearer ${config.twitter.bearerToken}`,
      },
    });

    return trendsClient.get(`/trends/place.json?id=${woeid}`);
  }

  /**
   * Upload media (images, videos, GIFs)
   */
  async uploadMedia(
    media: Buffer,
    mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'video/mp4',
    altText?: string
  ): Promise<ApiResponse<{ media_id_string: string }>> {
    this.log.info('Uploading media', { tool: 'upload_media' });

    // Media upload uses v1.1 endpoint with OAuth 1.0a
    const uploadClient = new HttpClient({
      platform: 'twitter',
      baseURL: TWITTER_UPLOAD_URL,
    });

    // For videos and large images, use chunked upload
    const isVideo = mediaType === 'video/mp4';
    const isLargeFile = media.length > 5 * 1024 * 1024;

    if (isVideo || isLargeFile) {
      return this.chunkedUpload(uploadClient, media, mediaType, altText);
    }

    // Simple upload for small images
    const response = await uploadClient.uploadFile(
      '/media/upload.json',
      media,
      'media',
      { media_category: isVideo ? 'tweet_video' : 'tweet_image' }
    );

    if (response.success && response.data && altText) {
      // Add alt text
      await uploadClient.post('/media/metadata/create.json', {
        media_id: response.data.media_id_string,
        alt_text: { text: altText },
      });
    }

    return response;
  }

  /**
   * Chunked upload for large files
   */
  private async chunkedUpload(
    client: HttpClient,
    media: Buffer,
    mediaType: string,
    altText?: string
  ): Promise<ApiResponse<{ media_id_string: string }>> {
    const totalBytes = media.length;
    const mediaCategory = mediaType.startsWith('video') ? 'tweet_video' : 'tweet_image';

    // INIT
    const initResponse = await client.post('/media/upload.json', null, {
      params: {
        command: 'INIT',
        total_bytes: totalBytes,
        media_type: mediaType,
        media_category: mediaCategory,
      },
    });

    if (!initResponse.success || !initResponse.data) {
      return initResponse;
    }

    const mediaId = initResponse.data.media_id_string;

    // APPEND - upload in 5MB chunks
    const chunkSize = 5 * 1024 * 1024;
    let segmentIndex = 0;

    for (let offset = 0; offset < totalBytes; offset += chunkSize) {
      const chunk = media.slice(offset, Math.min(offset + chunkSize, totalBytes));

      const appendResponse = await client.uploadFile(
        '/media/upload.json',
        chunk,
        'media',
        {
          command: 'APPEND',
          media_id: mediaId,
          segment_index: String(segmentIndex),
        }
      );

      if (!appendResponse.success) {
        return appendResponse;
      }

      segmentIndex++;
    }

    // FINALIZE
    const finalizeResponse = await client.post('/media/upload.json', null, {
      params: {
        command: 'FINALIZE',
        media_id: mediaId,
      },
    });

    if (!finalizeResponse.success) {
      return finalizeResponse;
    }

    // Check processing status for videos
    if (mediaType.startsWith('video')) {
      await this.waitForMediaProcessing(client, mediaId);
    }

    // Add alt text if provided
    if (altText) {
      await client.post('/media/metadata/create.json', {
        media_id: mediaId,
        alt_text: { text: altText },
      });
    }

    return {
      success: true,
      data: { media_id_string: mediaId },
      metadata: {
        platform: 'twitter',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Wait for video processing to complete
   */
  private async waitForMediaProcessing(
    client: HttpClient,
    mediaId: string,
    maxWaitMs: number = 60000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const statusResponse = await client.get(
        `/media/upload.json?command=STATUS&media_id=${mediaId}`
      );

      if (!statusResponse.success || !statusResponse.data) {
        throw new Error('Failed to get media processing status');
      }

      const state = statusResponse.data.processing_info?.state;

      if (state === 'succeeded') {
        return;
      }

      if (state === 'failed') {
        throw new Error(`Media processing failed: ${statusResponse.data.processing_info?.error?.message}`);
      }

      // Wait before checking again
      const checkAfterSecs = statusResponse.data.processing_info?.check_after_secs || 5;
      await new Promise((r) => setTimeout(r, checkAfterSecs * 1000));
    }

    throw new Error('Media processing timeout');
  }

  /**
   * Bookmark a tweet
   */
  async bookmarkTweet(userId: string, tweetId: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    this.log.info(`Bookmarking tweet ${tweetId}`, { tool: 'bookmark_tweet' });

    return this.client.post(`/users/${userId}/bookmarks`, { tweet_id: tweetId });
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(userId: string, tweetId: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    this.log.info(`Removing bookmark ${tweetId}`, { tool: 'remove_bookmark' });

    return this.client.delete(`/users/${userId}/bookmarks/${tweetId}`);
  }

  /**
   * Get user's bookmarks
   */
  async getBookmarks(
    userId: string,
    maxResults: number = 100
  ): Promise<ApiResponse<any>> {
    this.log.info(`Getting bookmarks for user ${userId}`, { tool: 'get_bookmarks' });

    return this.client.get(
      `/users/${userId}/bookmarks?max_results=${maxResults}&tweet.fields=created_at,public_metrics`
    );
  }
}

export const twitterClient = new TwitterClient();
