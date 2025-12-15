import { z } from 'zod';
import { tiktokClient } from './client.js';
import { config } from '../../core/config.js';

// ========== SCHEMAS ==========

export const GetVideosSchema = z.object({
  max_count: z.number().min(1).max(20).default(10).describe('Maximum videos to fetch'),
  cursor: z.string().optional().describe('Pagination cursor'),
});

export const GetVideoSchema = z.object({
  video_id: z.string().describe('TikTok video ID'),
});

export const PostVideoFromUrlSchema = z.object({
  video_url: z.string().url().describe('URL of the video to post'),
  caption: z.string().max(2200).describe('Video caption'),
  privacy: z.enum(['public', 'friends', 'private']).default('public').describe('Video privacy setting'),
  allow_comments: z.boolean().default(true).describe('Allow comments on video'),
  allow_duet: z.boolean().default(true).describe('Allow duets'),
  allow_stitch: z.boolean().default(true).describe('Allow stitches'),
  commercial_content: z.boolean().default(false).describe('Mark as branded/commercial content'),
});

export const GetPublishStatusSchema = z.object({
  publish_id: z.string().describe('Publish ID from video upload'),
});

export const GetCommentsSchema = z.object({
  video_id: z.string().describe('TikTok video ID'),
  max_count: z.number().min(1).max(50).default(20).describe('Maximum comments to fetch'),
  cursor: z.string().optional().describe('Pagination cursor'),
});

export const ReplyToCommentSchema = z.object({
  video_id: z.string().describe('TikTok video ID'),
  comment_id: z.string().describe('Comment ID to reply to'),
  text: z.string().max(150).describe('Reply text'),
});

export const GetVideoInsightsSchema = z.object({
  video_id: z.string().describe('TikTok video ID'),
});

// ========== TOOL HANDLERS ==========

export async function getMe() {
  if (!config.tiktok.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'TikTok is not configured. Please set TIKTOK_ACCESS_TOKEN.' }],
    };
  }

  const response = await tiktokClient.getMe();

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get user: ${response.error?.message}` }],
    };
  }

  const u = response.data!;
  return {
    content: [{
      type: 'text',
      text: `TikTok Account Info:
• Display Name: ${u.displayName}
• Open ID: ${u.openId}
• Verified: ${u.isVerified ? 'Yes' : 'No'}
• Followers: ${u.followerCount.toLocaleString()}
• Following: ${u.followingCount.toLocaleString()}
• Likes: ${u.likesCount.toLocaleString()}
• Videos: ${u.videoCount.toLocaleString()}`,
    }],
  };
}

export async function getVideos(args: z.infer<typeof GetVideosSchema>) {
  if (!config.tiktok.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'TikTok is not configured.' }],
    };
  }

  const response = await tiktokClient.getVideos(args.max_count, args.cursor);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get videos: ${response.error?.message}` }],
    };
  }

  const videos = response.data!.videos;
  if (videos.length === 0) {
    return {
      content: [{ type: 'text', text: 'No videos found.' }],
    };
  }

  const videoList = videos.map((v, i) =>
    `${i + 1}. ${v.title || '(No title)'}\n   Views: ${v.viewCount.toLocaleString()} | Likes: ${v.likeCount.toLocaleString()} | Comments: ${v.commentCount.toLocaleString()}\n   URL: ${v.shareUrl}`
  ).join('\n\n');

  let result = `Your TikTok Videos:\n\n${videoList}`;

  if (response.data!.hasMore) {
    result += `\n\nMore videos available. Use cursor: ${response.data!.cursor}`;
  }

  return {
    content: [{ type: 'text', text: result }],
  };
}

export async function getVideo(args: z.infer<typeof GetVideoSchema>) {
  if (!config.tiktok.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'TikTok is not configured.' }],
    };
  }

  const response = await tiktokClient.getVideo(args.video_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get video: ${response.error?.message}` }],
    };
  }

  const v = response.data!;
  return {
    content: [{
      type: 'text',
      text: `TikTok Video:
• Title: ${v.title || '(No title)'}
• ID: ${v.id}
• Views: ${v.viewCount.toLocaleString()}
• Likes: ${v.likeCount.toLocaleString()}
• Comments: ${v.commentCount.toLocaleString()}
• Shares: ${v.shareCount.toLocaleString()}
• URL: ${v.shareUrl}`,
    }],
  };
}

export async function postVideoFromUrl(args: z.infer<typeof PostVideoFromUrlSchema>) {
  if (!config.tiktok.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'TikTok is not configured.' }],
    };
  }

  // Initialize upload from URL
  const initResponse = await tiktokClient.initVideoUploadFromUrl(args.video_url, {
    caption: args.caption,
    privacy: args.privacy,
    allowComments: args.allow_comments,
    allowDuet: args.allow_duet,
    allowStitch: args.allow_stitch,
    commercialContent: args.commercial_content,
  });

  if (!initResponse.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to initiate upload: ${initResponse.error?.message}` }],
    };
  }

  // Wait for publish to complete
  const publishResult = await tiktokClient.waitForPublish(initResponse.data!.publishId);

  if (!publishResult.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Video publishing failed: ${publishResult.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Successfully posted video to TikTok!\nVideo ID: ${publishResult.data!.videoId}\nURL: https://www.tiktok.com/@username/video/${publishResult.data!.videoId}`,
    }],
  };
}

export async function getPublishStatus(args: z.infer<typeof GetPublishStatusSchema>) {
  if (!config.tiktok.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'TikTok is not configured.' }],
    };
  }

  const response = await tiktokClient.getPublishStatus(args.publish_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get status: ${response.error?.message}` }],
    };
  }

  const s = response.data!;
  let statusText = `Publish Status: ${s.status}`;

  if (s.videoId) {
    statusText += `\nVideo ID: ${s.videoId}`;
  }

  if (s.failReason) {
    statusText += `\nFail Reason: ${s.failReason}`;
  }

  return {
    content: [{ type: 'text', text: statusText }],
  };
}

export async function getComments(args: z.infer<typeof GetCommentsSchema>) {
  if (!config.tiktok.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'TikTok is not configured.' }],
    };
  }

  const response = await tiktokClient.getComments(args.video_id, args.max_count, args.cursor);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get comments: ${response.error?.message}` }],
    };
  }

  const comments = response.data!.comments;
  if (comments.length === 0) {
    return {
      content: [{ type: 'text', text: 'No comments found.' }],
    };
  }

  const commentList = comments.map((c, i) =>
    `${i + 1}. @${c.user.displayName}: ${c.text}\n   Likes: ${c.likeCount} | Replies: ${c.replyCount}`
  ).join('\n\n');

  let result = `Comments:\n\n${commentList}`;

  if (response.data!.hasMore) {
    result += `\n\nMore comments available. Use cursor: ${response.data!.cursor}`;
  }

  return {
    content: [{ type: 'text', text: result }],
  };
}

export async function replyToComment(args: z.infer<typeof ReplyToCommentSchema>) {
  if (!config.tiktok.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'TikTok is not configured.' }],
    };
  }

  const response = await tiktokClient.replyToComment(args.video_id, args.comment_id, args.text);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to reply: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully replied to comment. Reply ID: ${response.data!.commentId}` }],
  };
}

export async function getVideoInsights(args: z.infer<typeof GetVideoInsightsSchema>) {
  if (!config.tiktok.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'TikTok is not configured.' }],
    };
  }

  const response = await tiktokClient.getVideoInsights(args.video_id);

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
      text: `TikTok Video Insights:
• Views: ${m.viewCount.toLocaleString()}
• Likes: ${m.likeCount.toLocaleString()}
• Comments: ${m.commentCount.toLocaleString()}
• Shares: ${m.shareCount.toLocaleString()}
• Reach: ${m.reachCount.toLocaleString()}`,
    }],
  };
}

// Export tool definitions
export const tiktokTools = [
  {
    name: 'tiktok_get_me',
    description: 'Get the authenticated TikTok account info and stats.',
    schema: z.object({}),
    handler: getMe,
  },
  {
    name: 'tiktok_get_videos',
    description: 'Get your TikTok videos with engagement stats.',
    schema: GetVideosSchema,
    handler: getVideos,
  },
  {
    name: 'tiktok_get_video',
    description: 'Get details and stats for a specific TikTok video.',
    schema: GetVideoSchema,
    handler: getVideo,
  },
  {
    name: 'tiktok_post_video',
    description: 'Post a video to TikTok from a URL.',
    schema: PostVideoFromUrlSchema,
    handler: postVideoFromUrl,
  },
  {
    name: 'tiktok_get_publish_status',
    description: 'Check the publish status of a video upload.',
    schema: GetPublishStatusSchema,
    handler: getPublishStatus,
  },
  {
    name: 'tiktok_get_comments',
    description: 'Get comments on a TikTok video.',
    schema: GetCommentsSchema,
    handler: getComments,
  },
  {
    name: 'tiktok_reply_comment',
    description: 'Reply to a comment on a TikTok video.',
    schema: ReplyToCommentSchema,
    handler: replyToComment,
  },
  {
    name: 'tiktok_get_video_insights',
    description: 'Get analytics/insights for a TikTok video.',
    schema: GetVideoInsightsSchema,
    handler: getVideoInsights,
  },
];
