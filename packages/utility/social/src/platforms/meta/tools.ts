import { z } from 'zod';
import { metaClient } from './client.js';
import { config } from '../../core/config.js';

// ========== SCHEMAS ==========

export const GetPagesSchema = z.object({});

export const PostToPageSchema = z.object({
  page_id: z.string().describe('Facebook Page ID'),
  message: z.string().describe('Post content'),
  link: z.string().url().optional().describe('URL to share'),
  published: z.boolean().default(true).describe('Whether to publish immediately'),
  scheduled_time: z.string().optional().describe('ISO timestamp to schedule post (if published=false)'),
});

export const UploadPhotoSchema = z.object({
  page_id: z.string().describe('Facebook Page ID'),
  image_url: z.string().url().describe('URL of the image to upload'),
  caption: z.string().optional().describe('Photo caption'),
  published: z.boolean().default(true).describe('Whether to publish immediately'),
});

export const UploadVideoSchema = z.object({
  page_id: z.string().describe('Facebook Page ID'),
  video_url: z.string().url().describe('URL of the video to upload'),
  title: z.string().describe('Video title'),
  description: z.string().optional().describe('Video description'),
});

export const GetPageInsightsSchema = z.object({
  page_id: z.string().describe('Facebook Page ID'),
  metrics: z.array(z.string()).default(['page_impressions', 'page_engaged_users', 'page_fans']).describe('Metrics to fetch'),
  period: z.enum(['day', 'week', 'days_28']).default('day').describe('Time period'),
});

export const GetPostInsightsSchema = z.object({
  post_id: z.string().describe('Facebook Post ID'),
});

export const DeletePostSchema = z.object({
  post_id: z.string().describe('Facebook Post ID to delete'),
});

export const GetCommentsSchema = z.object({
  post_id: z.string().describe('Facebook Post ID'),
  limit: z.number().min(1).max(100).default(25).describe('Max comments to fetch'),
});

export const ReplyToCommentSchema = z.object({
  comment_id: z.string().describe('Comment ID to reply to'),
  message: z.string().describe('Reply message'),
});

export const CreateBusinessManagerSchema = z.object({
  name: z.string().describe('Business Manager name'),
  vertical: z.string().describe('Industry vertical (e.g., ADVERTISING, RETAIL)'),
  primary_page_id: z.string().describe('Facebook Page ID to associate'),
  timezone_id: z.number().default(1).describe('Timezone ID'),
});

// Instagram Schemas
export const GetInstagramAccountSchema = z.object({
  page_id: z.string().describe('Facebook Page ID linked to Instagram'),
});

export const PostToInstagramSchema = z.object({
  image_url: z.string().url().optional().describe('URL of image to post'),
  video_url: z.string().url().optional().describe('URL of video to post'),
  caption: z.string().max(2200).optional().describe('Post caption'),
  media_type: z.enum(['IMAGE', 'VIDEO', 'REELS']).default('IMAGE').describe('Type of media'),
});

export const GetInstagramInsightsSchema = z.object({
  media_id: z.string().describe('Instagram media ID'),
});

export const GetInstagramAccountInsightsSchema = z.object({
  period: z.enum(['day', 'week', 'days_28']).default('day').describe('Time period'),
});

export const SearchHashtagSchema = z.object({
  hashtag: z.string().describe('Hashtag to search (without #)'),
});

export const GetHashtagMediaSchema = z.object({
  hashtag_id: z.string().describe('Hashtag ID from search'),
  type: z.enum(['recent', 'top']).default('recent').describe('Type of media to fetch'),
});

// ========== HELPER TO GET PAGE TOKEN ==========

async function getPageToken(pageId: string): Promise<string | null> {
  const pagesResponse = await metaClient.getPages();
  if (!pagesResponse.success || !pagesResponse.data) {
    return null;
  }
  const page = pagesResponse.data.find(p => p.id === pageId);
  return page?.accessToken || null;
}

async function getInstagramAccountId(): Promise<{ igId: string; pageToken: string } | null> {
  if (config.meta.instagramAccountId && config.meta.pageId) {
    const pageToken = await getPageToken(config.meta.pageId);
    if (pageToken) {
      return { igId: config.meta.instagramAccountId, pageToken };
    }
  }

  // Try to find from pages
  const pagesResponse = await metaClient.getPages();
  if (!pagesResponse.success || !pagesResponse.data?.length) {
    return null;
  }

  for (const page of pagesResponse.data) {
    const igResponse = await metaClient.getInstagramAccount(page.id, page.accessToken);
    if (igResponse.success && igResponse.data) {
      return { igId: igResponse.data.id, pageToken: page.accessToken };
    }
  }

  return null;
}

// ========== TOOL HANDLERS ==========

export async function getMe() {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured. Please set META_ACCESS_TOKEN.' }],
    };
  }

  const response = await metaClient.getMe();

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get user: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Facebook Account:\n• Name: ${response.data?.name}\n• ID: ${response.data?.id}`,
    }],
  };
}

export async function getPages() {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const response = await metaClient.getPages();

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get pages: ${response.error?.message}` }],
    };
  }

  const pages = response.data || [];
  if (pages.length === 0) {
    return {
      content: [{ type: 'text', text: 'No Facebook Pages found.' }],
    };
  }

  const pageList = pages.map(p =>
    `• ${p.name} (ID: ${p.id})\n  Category: ${p.category}\n  Followers: ${p.followers.toLocaleString()}`
  ).join('\n\n');

  return {
    content: [{ type: 'text', text: `Your Facebook Pages:\n\n${pageList}` }],
  };
}

export async function postToPage(args: z.infer<typeof PostToPageSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const pageToken = await getPageToken(args.page_id);
  if (!pageToken) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Page not found or no access.' }],
    };
  }

  const response = await metaClient.postToPage(args.page_id, pageToken, args.message, {
    link: args.link,
    published: args.published,
    scheduledPublishTime: args.scheduled_time ? Math.floor(new Date(args.scheduled_time).getTime() / 1000) : undefined,
  });

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to post: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Successfully posted to Facebook!\nPost ID: ${response.data?.id}\nURL: ${response.data?.postUrl}`,
    }],
  };
}

export async function uploadPhoto(args: z.infer<typeof UploadPhotoSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const pageToken = await getPageToken(args.page_id);
  if (!pageToken) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Page not found or no access.' }],
    };
  }

  const response = await metaClient.uploadPhoto(
    args.page_id,
    pageToken,
    args.image_url,
    args.caption,
    args.published
  );

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to upload photo: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully uploaded photo! ID: ${response.data?.id}` }],
  };
}

export async function uploadVideo(args: z.infer<typeof UploadVideoSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const pageToken = await getPageToken(args.page_id);
  if (!pageToken) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Page not found or no access.' }],
    };
  }

  const response = await metaClient.uploadVideo(
    args.page_id,
    pageToken,
    args.video_url,
    args.title,
    args.description
  );

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to upload video: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully uploaded video! ID: ${response.data?.id}` }],
  };
}

export async function getPageInsights(args: z.infer<typeof GetPageInsightsSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const pageToken = await getPageToken(args.page_id);
  if (!pageToken) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Page not found or no access.' }],
    };
  }

  const response = await metaClient.getPageInsights(args.page_id, pageToken, args.metrics, args.period);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get insights: ${response.error?.message}` }],
    };
  }

  const insights = Object.entries(response.data || {})
    .map(([k, v]) => `• ${k}: ${(v as number).toLocaleString()}`)
    .join('\n');

  return {
    content: [{ type: 'text', text: `Page Insights (${args.period}):\n${insights}` }],
  };
}

export async function getPostInsights(args: z.infer<typeof GetPostInsightsSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  // Need to get page token for the post
  const pagesResponse = await metaClient.getPages();
  if (!pagesResponse.success || !pagesResponse.data?.length) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No pages found.' }],
    };
  }

  // Try first page (in production, would need to determine which page owns the post)
  const pageToken = pagesResponse.data[0].accessToken;

  const response = await metaClient.getPostInsights(args.post_id, pageToken);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get post insights: ${response.error?.message}` }],
    };
  }

  const m = response.data!;
  return {
    content: [{
      type: 'text',
      text: `Facebook Post Insights:
• Impressions: ${m.impressions.toLocaleString()}
• Reach: ${m.reach.toLocaleString()}
• Engagement: ${m.engagement.toLocaleString()}
• Reactions: ${m.reactions.toLocaleString()}
• Comments: ${m.comments.toLocaleString()}
• Shares: ${m.shares.toLocaleString()}`,
    }],
  };
}

export async function deletePost(args: z.infer<typeof DeletePostSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const pagesResponse = await metaClient.getPages();
  if (!pagesResponse.success || !pagesResponse.data?.length) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No pages found.' }],
    };
  }

  const pageToken = pagesResponse.data[0].accessToken;
  const response = await metaClient.deletePost(args.post_id, pageToken);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to delete post: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully deleted post ${args.post_id}` }],
  };
}

export async function getComments(args: z.infer<typeof GetCommentsSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const pagesResponse = await metaClient.getPages();
  if (!pagesResponse.success || !pagesResponse.data?.length) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No pages found.' }],
    };
  }

  const pageToken = pagesResponse.data[0].accessToken;
  const response = await metaClient.getComments(args.post_id, pageToken, args.limit);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get comments: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

export async function replyToComment(args: z.infer<typeof ReplyToCommentSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const pagesResponse = await metaClient.getPages();
  if (!pagesResponse.success || !pagesResponse.data?.length) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No pages found.' }],
    };
  }

  const pageToken = pagesResponse.data[0].accessToken;
  const response = await metaClient.replyToComment(args.comment_id, pageToken, args.message);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to reply: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully replied to comment. Reply ID: ${response.data?.id}` }],
  };
}

export async function createBusinessManager(args: z.infer<typeof CreateBusinessManagerSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const response = await metaClient.createBusinessManager(
    args.name,
    args.vertical,
    args.primary_page_id,
    args.timezone_id
  );

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to create Business Manager: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully created Business Manager! ID: ${response.data?.id}` }],
  };
}

// Instagram handlers
export async function getInstagramAccount(args: z.infer<typeof GetInstagramAccountSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const pageToken = await getPageToken(args.page_id);
  if (!pageToken) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Page not found.' }],
    };
  }

  const response = await metaClient.getInstagramAccount(args.page_id, pageToken);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get Instagram account: ${response.error?.message}` }],
    };
  }

  const ig = response.data!;
  return {
    content: [{
      type: 'text',
      text: `Instagram Account:
• Username: @${ig.username}
• Name: ${ig.name}
• ID: ${ig.id}
• Followers: ${ig.followers.toLocaleString()}
• Following: ${ig.following.toLocaleString()}
• Posts: ${ig.mediaCount.toLocaleString()}`,
    }],
  };
}

export async function postToInstagram(args: z.infer<typeof PostToInstagramSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const ig = await getInstagramAccountId();
  if (!ig) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No Instagram Business Account found.' }],
    };
  }

  const response = await metaClient.postToInstagram(ig.igId, ig.pageToken, {
    imageUrl: args.image_url,
    videoUrl: args.video_url,
    caption: args.caption,
    mediaType: args.media_type,
  });

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to post to Instagram: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Successfully posted to Instagram!\nMedia ID: ${response.data?.id}\nURL: ${response.data?.url}`,
    }],
  };
}

export async function getInstagramMediaInsights(args: z.infer<typeof GetInstagramInsightsSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const ig = await getInstagramAccountId();
  if (!ig) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No Instagram Business Account found.' }],
    };
  }

  const response = await metaClient.getInstagramMediaInsights(args.media_id, ig.pageToken);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get insights: ${response.error?.message}` }],
    };
  }

  const m = response.data!;
  return {
    content: [{
      type: 'text',
      text: `Instagram Post Insights:
• Impressions: ${m.impressions.toLocaleString()}
• Reach: ${m.reach.toLocaleString()}
• Engagement: ${m.engagement.toLocaleString()}
• Likes: ${m.likes.toLocaleString()}
• Comments: ${m.comments.toLocaleString()}
• Shares: ${m.shares.toLocaleString()}
• Saves: ${m.saved.toLocaleString()}`,
    }],
  };
}

export async function getInstagramAccountInsights(args: z.infer<typeof GetInstagramAccountInsightsSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const ig = await getInstagramAccountId();
  if (!ig) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No Instagram Business Account found.' }],
    };
  }

  const response = await metaClient.getInstagramAccountInsights(ig.igId, ig.pageToken, args.period);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get insights: ${response.error?.message}` }],
    };
  }

  const m = response.data!;
  return {
    content: [{
      type: 'text',
      text: `Instagram Account Insights (${args.period}):
• Impressions: ${m.impressions.toLocaleString()}
• Reach: ${m.reach.toLocaleString()}
• Profile Views: ${m.profileViews.toLocaleString()}
• Follower Count: ${m.followerCount.toLocaleString()}`,
    }],
  };
}

export async function searchHashtag(args: z.infer<typeof SearchHashtagSchema>) {
  if (!config.meta.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Meta is not configured.' }],
    };
  }

  const ig = await getInstagramAccountId();
  if (!ig) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'No Instagram Business Account found.' }],
    };
  }

  const response = await metaClient.searchInstagramHashtag(ig.igId, ig.pageToken, args.hashtag);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to search hashtag: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Hashtag #${args.hashtag} ID: ${response.data?.id}` }],
  };
}

// Export tool definitions
export const metaTools = [
  // Facebook tools
  {
    name: 'facebook_get_me',
    description: 'Get the authenticated Facebook user info.',
    schema: z.object({}),
    handler: getMe,
  },
  {
    name: 'facebook_get_pages',
    description: 'Get all Facebook Pages you manage.',
    schema: GetPagesSchema,
    handler: getPages,
  },
  {
    name: 'facebook_post_to_page',
    description: 'Post content to a Facebook Page. Supports scheduling.',
    schema: PostToPageSchema,
    handler: postToPage,
  },
  {
    name: 'facebook_upload_photo',
    description: 'Upload a photo to a Facebook Page.',
    schema: UploadPhotoSchema,
    handler: uploadPhoto,
  },
  {
    name: 'facebook_upload_video',
    description: 'Upload a video to a Facebook Page.',
    schema: UploadVideoSchema,
    handler: uploadVideo,
  },
  {
    name: 'facebook_get_page_insights',
    description: 'Get analytics/insights for a Facebook Page.',
    schema: GetPageInsightsSchema,
    handler: getPageInsights,
  },
  {
    name: 'facebook_get_post_insights',
    description: 'Get analytics for a specific Facebook post.',
    schema: GetPostInsightsSchema,
    handler: getPostInsights,
  },
  {
    name: 'facebook_delete_post',
    description: 'Delete a Facebook post.',
    schema: DeletePostSchema,
    handler: deletePost,
  },
  {
    name: 'facebook_get_comments',
    description: 'Get comments on a Facebook post.',
    schema: GetCommentsSchema,
    handler: getComments,
  },
  {
    name: 'facebook_reply_comment',
    description: 'Reply to a Facebook comment.',
    schema: ReplyToCommentSchema,
    handler: replyToComment,
  },
  {
    name: 'facebook_create_business_manager',
    description: 'Create a new Facebook Business Manager.',
    schema: CreateBusinessManagerSchema,
    handler: createBusinessManager,
  },
  // Instagram tools
  {
    name: 'instagram_get_account',
    description: 'Get Instagram Business Account linked to a Facebook Page.',
    schema: GetInstagramAccountSchema,
    handler: getInstagramAccount,
  },
  {
    name: 'instagram_post',
    description: 'Post an image, video, or Reel to Instagram.',
    schema: PostToInstagramSchema,
    handler: postToInstagram,
  },
  {
    name: 'instagram_get_media_insights',
    description: 'Get insights for an Instagram post.',
    schema: GetInstagramInsightsSchema,
    handler: getInstagramMediaInsights,
  },
  {
    name: 'instagram_get_account_insights',
    description: 'Get overall Instagram account insights.',
    schema: GetInstagramAccountInsightsSchema,
    handler: getInstagramAccountInsights,
  },
  {
    name: 'instagram_search_hashtag',
    description: 'Search for a hashtag on Instagram.',
    schema: SearchHashtagSchema,
    handler: searchHashtag,
  },
];
