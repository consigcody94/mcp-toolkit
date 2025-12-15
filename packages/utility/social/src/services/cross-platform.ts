import { z } from 'zod';
import { config, isPlatformEnabled } from '../core/config.js';
import { logger } from '../core/logger.js';
import { scheduler } from '../core/scheduler.js';
import { Platform, PostContent, PostResult, ScheduledPost, AnalyticsData } from '../types/index.js';

// Platform clients
import { twitterClient } from '../platforms/twitter/client.js';
import { linkedinClient } from '../platforms/linkedin/client.js';
import { metaClient } from '../platforms/meta/client.js';
import { tiktokClient } from '../platforms/tiktok/client.js';
import { youtubeClient } from '../platforms/youtube/client.js';

const log = logger.child({ tool: 'cross-platform' });

// ========== SCHEMAS ==========

export const CrossPostSchema = z.object({
  text: z.string().describe('The content to post'),
  platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok'])).describe('Platforms to post to'),
  link_url: z.string().url().optional().describe('URL to include (where supported)'),
  image_url: z.string().url().optional().describe('Image URL (where supported)'),
  hashtags: z.array(z.string()).optional().describe('Hashtags to append'),
  schedule_time: z.string().optional().describe('ISO timestamp to schedule the post'),
});

export const GetAllAnalyticsSchema = z.object({
  platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'])).optional().describe('Platforms to get analytics from (defaults to all enabled)'),
});

export const GetScheduledPostsSchema = z.object({
  status: z.enum(['pending', 'published', 'failed', 'cancelled']).optional().describe('Filter by status'),
  platform: z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok']).optional().describe('Filter by platform'),
});

export const CancelScheduledPostSchema = z.object({
  post_id: z.string().describe('ID of the scheduled post to cancel'),
});

export const GetAccountsStatusSchema = z.object({});

// ========== CROSS-PLATFORM POSTING ==========

/**
 * Adapt content for specific platform
 */
function adaptContentForPlatform(
  content: string,
  platform: Platform,
  options?: { linkUrl?: string; hashtags?: string[] }
): string {
  let adapted = content;

  // Add hashtags
  if (options?.hashtags?.length) {
    const hashtagString = options.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
    adapted = `${adapted}\n\n${hashtagString}`;
  }

  // Platform-specific adaptations
  switch (platform) {
    case 'twitter':
      // Truncate to 280 chars, leave room for link
      const maxLength = options?.linkUrl ? 257 : 280; // Twitter shortens URLs to 23 chars
      if (adapted.length > maxLength) {
        adapted = adapted.substring(0, maxLength - 3) + '...';
      }
      break;

    case 'linkedin':
      // LinkedIn allows 3000 chars, but optimal is 1300
      if (adapted.length > 3000) {
        adapted = adapted.substring(0, 2997) + '...';
      }
      break;

    case 'facebook':
    case 'instagram':
      // Instagram: 2200 chars, Facebook: 63,206 chars
      if (platform === 'instagram' && adapted.length > 2200) {
        adapted = adapted.substring(0, 2197) + '...';
      }
      break;

    case 'tiktok':
      // TikTok: 2200 chars
      if (adapted.length > 2200) {
        adapted = adapted.substring(0, 2197) + '...';
      }
      break;
  }

  return adapted;
}

/**
 * Post to a single platform
 */
async function postToPlatform(
  platform: Platform,
  content: string,
  options?: {
    linkUrl?: string;
    imageUrl?: string;
  }
): Promise<PostResult> {
  log.info(`Posting to ${platform}`, { platform });

  try {
    switch (platform) {
      case 'twitter': {
        const response = await twitterClient.postTweet(content);
        return {
          platform,
          success: response.success,
          postId: response.data?.id,
          postUrl: response.data?.id ? `https://twitter.com/i/web/status/${response.data.id}` : undefined,
          error: response.error?.message,
          publishedAt: response.success ? new Date() : undefined,
        };
      }

      case 'linkedin': {
        const response = await linkedinClient.postUpdate(content, 'PUBLIC', {
          linkUrl: options?.linkUrl,
        });
        return {
          platform,
          success: response.success,
          postId: response.data?.id,
          postUrl: response.data?.url,
          error: response.error?.message,
          publishedAt: response.success ? new Date() : undefined,
        };
      }

      case 'facebook': {
        // Get first page
        const pagesResponse = await metaClient.getPages();
        if (!pagesResponse.success || !pagesResponse.data?.length) {
          return {
            platform,
            success: false,
            error: 'No Facebook pages found',
          };
        }
        const page = pagesResponse.data[0];
        const response = await metaClient.postToPage(page.id, page.accessToken, content, {
          link: options?.linkUrl,
        });
        return {
          platform,
          success: response.success,
          postId: response.data?.id,
          postUrl: response.data?.postUrl,
          error: response.error?.message,
          publishedAt: response.success ? new Date() : undefined,
        };
      }

      case 'instagram': {
        if (!options?.imageUrl) {
          return {
            platform,
            success: false,
            error: 'Instagram requires an image URL',
          };
        }
        // Get Instagram account
        const pagesResponse = await metaClient.getPages();
        if (!pagesResponse.success || !pagesResponse.data?.length) {
          return {
            platform,
            success: false,
            error: 'No Facebook pages found',
          };
        }
        const page = pagesResponse.data[0];
        const igResponse = await metaClient.getInstagramAccount(page.id, page.accessToken);
        if (!igResponse.success || !igResponse.data) {
          return {
            platform,
            success: false,
            error: 'No Instagram account linked',
          };
        }
        const postResponse = await metaClient.postToInstagram(igResponse.data.id, page.accessToken, {
          imageUrl: options.imageUrl,
          caption: content,
        });
        return {
          platform,
          success: postResponse.success,
          postId: postResponse.data?.id,
          postUrl: postResponse.data?.url,
          error: postResponse.error?.message,
          publishedAt: postResponse.success ? new Date() : undefined,
        };
      }

      case 'tiktok': {
        // TikTok requires video, can't post text-only
        return {
          platform,
          success: false,
          error: 'TikTok requires video content. Use tiktok_post_video instead.',
        };
      }

      default:
        return {
          platform,
          success: false,
          error: `Platform ${platform} not supported for cross-posting`,
        };
    }
  } catch (error: any) {
    log.error(`Failed to post to ${platform}`, { platform }, error);
    return {
      platform,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Post to multiple platforms
 */
export async function crossPost(args: z.infer<typeof CrossPostSchema>): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const { text, platforms, link_url, image_url, hashtags, schedule_time } = args;

  // Check which platforms are enabled
  const enabledPlatforms = platforms.filter(p => {
    const enabled = isPlatformEnabled(p);
    if (!enabled) {
      log.warn(`Platform ${p} is not configured, skipping`);
    }
    return enabled;
  });

  if (enabledPlatforms.length === 0) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: 'None of the requested platforms are configured. Please check your .env file.',
      }],
    };
  }

  // Schedule for later if schedule_time provided
  if (schedule_time) {
    const scheduledFor = new Date(schedule_time);
    if (scheduledFor <= new Date()) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Schedule time must be in the future.' }],
      };
    }

    const post = scheduler.schedulePost(
      { text, hashtags, link: link_url ? { url: link_url } : undefined },
      enabledPlatforms as Platform[],
      scheduledFor
    );

    return {
      content: [{
        type: 'text',
        text: `Post scheduled for ${scheduledFor.toISOString()}\nPost ID: ${post.id}\nPlatforms: ${enabledPlatforms.join(', ')}`,
      }],
    };
  }

  // Post immediately to all platforms
  const results: PostResult[] = [];

  for (const platform of enabledPlatforms) {
    const adaptedContent = adaptContentForPlatform(text, platform as Platform, { linkUrl: link_url, hashtags });
    const result = await postToPlatform(platform as Platform, adaptedContent, { linkUrl: link_url, imageUrl: image_url });
    results.push(result);
  }

  // Format results
  const successResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  let resultText = '';

  if (successResults.length > 0) {
    resultText += 'Successfully posted to:\n';
    resultText += successResults.map(r =>
      `✓ ${r.platform}: ${r.postUrl || r.postId}`
    ).join('\n');
  }

  if (failedResults.length > 0) {
    if (resultText) resultText += '\n\n';
    resultText += 'Failed to post to:\n';
    resultText += failedResults.map(r =>
      `✗ ${r.platform}: ${r.error}`
    ).join('\n');
  }

  return {
    isError: failedResults.length === results.length,
    content: [{ type: 'text', text: resultText }],
  };
}

// ========== ANALYTICS AGGREGATION ==========

export async function getAllAnalytics(args: z.infer<typeof GetAllAnalyticsSchema>): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const requestedPlatforms = args.platforms || ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'];
  const enabledPlatforms = requestedPlatforms.filter(p => isPlatformEnabled(p));

  if (enabledPlatforms.length === 0) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No platforms are configured.' }],
    };
  }

  const analytics: Record<string, any> = {};

  for (const platform of enabledPlatforms) {
    try {
      switch (platform) {
        case 'twitter': {
          const me = await twitterClient.getMe();
          if (me.success && me.data) {
            analytics.twitter = {
              followers: me.data.metrics.followersCount,
              following: me.data.metrics.followingCount,
              tweets: me.data.metrics.tweetCount,
            };
          }
          break;
        }

        case 'linkedin': {
          const me = await linkedinClient.getMe();
          const connections = await linkedinClient.getConnectionsCount();
          if (me.success) {
            analytics.linkedin = {
              name: `${me.data?.firstName} ${me.data?.lastName}`,
              connections: connections.data?.count || 0,
            };
          }
          break;
        }

        case 'facebook': {
          const pages = await metaClient.getPages();
          if (pages.success && pages.data?.length) {
            analytics.facebook = {
              pages: pages.data.map(p => ({
                name: p.name,
                followers: p.followers,
              })),
              totalFollowers: pages.data.reduce((sum, p) => sum + p.followers, 0),
            };
          }
          break;
        }

        case 'instagram': {
          const pages = await metaClient.getPages();
          if (pages.success && pages.data?.length) {
            const page = pages.data[0];
            const ig = await metaClient.getInstagramAccount(page.id, page.accessToken);
            if (ig.success && ig.data) {
              analytics.instagram = {
                username: ig.data.username,
                followers: ig.data.followers,
                following: ig.data.following,
                posts: ig.data.mediaCount,
              };
            }
          }
          break;
        }

        case 'tiktok': {
          const me = await tiktokClient.getMe();
          if (me.success && me.data) {
            analytics.tiktok = {
              displayName: me.data.displayName,
              followers: me.data.followerCount,
              following: me.data.followingCount,
              likes: me.data.likesCount,
              videos: me.data.videoCount,
            };
          }
          break;
        }

        case 'youtube': {
          const channel = await youtubeClient.getMyChannel();
          if (channel.success && channel.data) {
            analytics.youtube = {
              title: channel.data.title,
              subscribers: channel.data.subscriberCount,
              videos: channel.data.videoCount,
              totalViews: channel.data.viewCount,
            };
          }
          break;
        }
      }
    } catch (error: any) {
      log.warn(`Failed to get analytics for ${platform}: ${error.message}`);
      analytics[platform] = { error: error.message };
    }
  }

  // Calculate totals
  let totalFollowers = 0;
  if (analytics.twitter?.followers) totalFollowers += analytics.twitter.followers;
  if (analytics.linkedin?.connections) totalFollowers += analytics.linkedin.connections;
  if (analytics.facebook?.totalFollowers) totalFollowers += analytics.facebook.totalFollowers;
  if (analytics.instagram?.followers) totalFollowers += analytics.instagram.followers;
  if (analytics.tiktok?.followers) totalFollowers += analytics.tiktok.followers;
  if (analytics.youtube?.subscribers) totalFollowers += analytics.youtube.subscribers;

  // Format output
  let output = '📊 Social Media Analytics Summary\n';
  output += '═'.repeat(40) + '\n\n';
  output += `Total Followers/Subscribers: ${totalFollowers.toLocaleString()}\n\n`;

  for (const [platform, data] of Object.entries(analytics)) {
    output += `${platform.toUpperCase()}\n`;
    output += '─'.repeat(20) + '\n';

    if (data.error) {
      output += `  Error: ${data.error}\n`;
    } else {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          output += `  ${key}: ${value.length} items\n`;
        } else if (typeof value === 'number') {
          output += `  ${key}: ${value.toLocaleString()}\n`;
        } else {
          output += `  ${key}: ${value}\n`;
        }
      }
    }
    output += '\n';
  }

  return {
    content: [{ type: 'text', text: output }],
  };
}

// ========== SCHEDULED POSTS ==========

export async function getScheduledPosts(args: z.infer<typeof GetScheduledPostsSchema>): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const posts = scheduler.getPosts({
    status: args.status,
    platform: args.platform as Platform,
  });

  if (posts.length === 0) {
    return {
      content: [{ type: 'text', text: 'No scheduled posts found.' }],
    };
  }

  const postList = posts.map((p, i) =>
    `${i + 1}. [${p.status.toUpperCase()}] ${p.content.text.substring(0, 50)}...
   Platforms: ${p.platforms.join(', ')}
   Scheduled: ${p.scheduledFor.toISOString()}
   ID: ${p.id}`
  ).join('\n\n');

  return {
    content: [{ type: 'text', text: `Scheduled Posts:\n\n${postList}` }],
  };
}

export async function cancelScheduledPost(args: z.infer<typeof CancelScheduledPostSchema>): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const cancelled = scheduler.cancelPost(args.post_id);

  if (!cancelled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Post not found or already processed.' }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully cancelled post ${args.post_id}` }],
  };
}

// ========== ACCOUNT STATUS ==========

export async function getAccountsStatus(): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'];

  let output = '🔌 Connected Accounts Status\n';
  output += '═'.repeat(40) + '\n\n';

  for (const platform of platforms) {
    const enabled = isPlatformEnabled(platform);
    const status = enabled ? '✓ Connected' : '✗ Not configured';
    output += `${platform.toUpperCase().padEnd(12)} ${status}\n`;
  }

  output += '\n' + '─'.repeat(40) + '\n';
  output += `Total connected: ${platforms.filter(p => isPlatformEnabled(p)).length}/${platforms.length}`;

  return {
    content: [{ type: 'text', text: output }],
  };
}

// ========== EXPORT TOOLS ==========

export const crossPlatformTools = [
  {
    name: 'cross_post',
    description: 'Post content to multiple social media platforms at once. Automatically adapts content length for each platform.',
    schema: CrossPostSchema,
    handler: crossPost,
  },
  {
    name: 'get_all_analytics',
    description: 'Get aggregated analytics from all connected social media accounts.',
    schema: GetAllAnalyticsSchema,
    handler: getAllAnalytics,
  },
  {
    name: 'get_scheduled_posts',
    description: 'View all scheduled posts.',
    schema: GetScheduledPostsSchema,
    handler: getScheduledPosts,
  },
  {
    name: 'cancel_scheduled_post',
    description: 'Cancel a scheduled post.',
    schema: CancelScheduledPostSchema,
    handler: cancelScheduledPost,
  },
  {
    name: 'get_accounts_status',
    description: 'Check which social media accounts are connected.',
    schema: GetAccountsStatusSchema,
    handler: getAccountsStatus,
  },
];

// Initialize scheduler with publish callback
scheduler.setPublishCallback(async (post: ScheduledPost) => {
  const results: Record<Platform, PostResult> = {} as any;

  for (const platform of post.platforms) {
    const adaptedContent = adaptContentForPlatform(
      post.content.text,
      platform,
      { hashtags: post.content.hashtags }
    );
    results[platform] = await postToPlatform(platform, adaptedContent, {
      linkUrl: post.content.link?.url,
    });
  }

  return results;
});
