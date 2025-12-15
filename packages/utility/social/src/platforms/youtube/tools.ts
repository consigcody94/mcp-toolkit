import { z } from 'zod';
import { youtubeClient } from './client.js';
import { config } from '../../core/config.js';

// ========== SCHEMAS ==========

export const GetVideosSchema = z.object({
  max_results: z.number().min(1).max(50).default(10).describe('Maximum videos to fetch'),
  page_token: z.string().optional().describe('Pagination token'),
});

export const GetVideoSchema = z.object({
  video_id: z.string().describe('YouTube video ID'),
});

export const UpdateVideoSchema = z.object({
  video_id: z.string().describe('YouTube video ID'),
  title: z.string().optional().describe('New title'),
  description: z.string().optional().describe('New description'),
  tags: z.array(z.string()).optional().describe('New tags'),
  privacy: z.enum(['public', 'unlisted', 'private']).optional().describe('Privacy setting'),
});

export const DeleteVideoSchema = z.object({
  video_id: z.string().describe('YouTube video ID to delete'),
});

export const GetCommentsSchema = z.object({
  video_id: z.string().describe('YouTube video ID'),
  max_results: z.number().min(1).max(100).default(20).describe('Maximum comments to fetch'),
  page_token: z.string().optional().describe('Pagination token'),
});

export const ReplyToCommentSchema = z.object({
  comment_id: z.string().describe('Comment ID to reply to'),
  text: z.string().describe('Reply text'),
});

export const GetChannelAnalyticsSchema = z.object({
  start_date: z.string().describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().describe('End date (YYYY-MM-DD)'),
});

export const GetVideoAnalyticsSchema = z.object({
  video_id: z.string().describe('YouTube video ID'),
  start_date: z.string().describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().describe('End date (YYYY-MM-DD)'),
});

export const SearchSchema = z.object({
  query: z.string().describe('Search query'),
  max_results: z.number().min(1).max(50).default(10).describe('Maximum results'),
  type: z.enum(['video', 'channel', 'playlist']).default('video').describe('Type of content to search'),
});

export const CreatePlaylistSchema = z.object({
  title: z.string().describe('Playlist title'),
  description: z.string().describe('Playlist description'),
  privacy: z.enum(['public', 'unlisted', 'private']).default('public').describe('Privacy setting'),
});

export const AddToPlaylistSchema = z.object({
  playlist_id: z.string().describe('Playlist ID'),
  video_id: z.string().describe('Video ID to add'),
});

export const SubscribeSchema = z.object({
  channel_id: z.string().describe('Channel ID to subscribe to'),
});

// ========== TOOL HANDLERS ==========

export async function getMyChannel() {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured. Please set YOUTUBE_ACCESS_TOKEN.' }],
    };
  }

  const response = await youtubeClient.getMyChannel();

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get channel: ${response.error?.message}` }],
    };
  }

  const c = response.data!;
  return {
    content: [{
      type: 'text',
      text: `YouTube Channel Info:
• Name: ${c.title}
• ID: ${c.id}
• Custom URL: ${c.customUrl || 'N/A'}
• Country: ${c.country || 'N/A'}
• Subscribers: ${c.subscriberCount.toLocaleString()}
• Videos: ${c.videoCount.toLocaleString()}
• Total Views: ${c.viewCount.toLocaleString()}`,
    }],
  };
}

export async function getMyVideos(args: z.infer<typeof GetVideosSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.getMyVideos(args.max_results, args.page_token);

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
    `${i + 1}. ${v.title}\n   Views: ${v.viewCount.toLocaleString()} | Likes: ${v.likeCount.toLocaleString()} | Comments: ${v.commentCount.toLocaleString()}\n   URL: https://youtube.com/watch?v=${v.id}`
  ).join('\n\n');

  let result = `Your YouTube Videos (${response.data!.totalResults} total):\n\n${videoList}`;

  if (response.data!.nextPageToken) {
    result += `\n\nMore videos available. Use page_token: ${response.data!.nextPageToken}`;
  }

  return {
    content: [{ type: 'text', text: result }],
  };
}

export async function getVideo(args: z.infer<typeof GetVideoSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.getVideo(args.video_id);

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
      text: `YouTube Video:
• Title: ${v.title}
• ID: ${v.id}
• Channel: ${v.channelTitle}
• Published: ${new Date(v.publishedAt).toLocaleDateString()}
• Duration: ${v.duration}
• Privacy: ${v.privacyStatus}
• Views: ${v.viewCount.toLocaleString()}
• Likes: ${v.likeCount.toLocaleString()}
• Comments: ${v.commentCount.toLocaleString()}
• Tags: ${v.tags.slice(0, 10).join(', ') || 'None'}
• URL: https://youtube.com/watch?v=${v.id}`,
    }],
  };
}

export async function updateVideo(args: z.infer<typeof UpdateVideoSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.updateVideo(args.video_id, {
    title: args.title,
    description: args.description,
    tags: args.tags,
    privacy: args.privacy,
  });

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to update video: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully updated video ${args.video_id}` }],
  };
}

export async function deleteVideo(args: z.infer<typeof DeleteVideoSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.deleteVideo(args.video_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to delete video: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully deleted video ${args.video_id}` }],
  };
}

export async function getComments(args: z.infer<typeof GetCommentsSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.getComments(args.video_id, args.max_results, args.page_token);

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
    `${i + 1}. ${c.authorName}: ${c.text.substring(0, 100)}${c.text.length > 100 ? '...' : ''}\n   Likes: ${c.likeCount} | Replies: ${c.replyCount}`
  ).join('\n\n');

  let result = `Comments:\n\n${commentList}`;

  if (response.data!.nextPageToken) {
    result += `\n\nMore comments available. Use page_token: ${response.data!.nextPageToken}`;
  }

  return {
    content: [{ type: 'text', text: result }],
  };
}

export async function replyToComment(args: z.infer<typeof ReplyToCommentSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.replyToComment(args.comment_id, args.text);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to reply: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully replied to comment. Reply ID: ${response.data!.id}` }],
  };
}

export async function getChannelAnalytics(args: z.infer<typeof GetChannelAnalyticsSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.getChannelAnalytics(args.start_date, args.end_date);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get analytics: ${response.error?.message}` }],
    };
  }

  const m = response.data!;
  return {
    content: [{
      type: 'text',
      text: `YouTube Channel Analytics (${args.start_date} to ${args.end_date}):
• Views: ${(m.views || 0).toLocaleString()}
• Watch Time: ${Math.round((m.estimatedMinutesWatched || 0) / 60).toLocaleString()} hours
• Avg View Duration: ${Math.round(m.averageViewDuration || 0)}s
• Subscribers Gained: ${(m.subscribersGained || 0).toLocaleString()}`,
    }],
  };
}

export async function getVideoAnalytics(args: z.infer<typeof GetVideoAnalyticsSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.getVideoAnalytics(args.video_id, args.start_date, args.end_date);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get analytics: ${response.error?.message}` }],
    };
  }

  const m = response.data!;
  return {
    content: [{
      type: 'text',
      text: `YouTube Video Analytics (${args.start_date} to ${args.end_date}):
• Views: ${m.views.toLocaleString()}
• Watch Time: ${Math.round(m.estimatedMinutesWatched / 60).toLocaleString()} hours
• Avg View Duration: ${Math.round(m.averageViewDuration)}s
• Likes: ${m.likes.toLocaleString()}
• Comments: ${m.comments.toLocaleString()}
• Shares: ${m.shares.toLocaleString()}
• Subscribers Gained: ${m.subscribersGained.toLocaleString()}`,
    }],
  };
}

export async function search(args: z.infer<typeof SearchSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.search(args.query, args.max_results, args.type);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to search: ${response.error?.message}` }],
    };
  }

  const results = response.data!;
  if (results.length === 0) {
    return {
      content: [{ type: 'text', text: 'No results found.' }],
    };
  }

  const resultList = results.map((r, i) =>
    `${i + 1}. ${r.title}\n   Channel: ${r.channelTitle}\n   ID: ${r.id}`
  ).join('\n\n');

  return {
    content: [{ type: 'text', text: `Search Results for "${args.query}":\n\n${resultList}` }],
  };
}

export async function createPlaylist(args: z.infer<typeof CreatePlaylistSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.createPlaylist(args.title, args.description, args.privacy);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to create playlist: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Successfully created playlist!\nID: ${response.data!.id}\nURL: ${response.data!.url}`,
    }],
  };
}

export async function addToPlaylist(args: z.infer<typeof AddToPlaylistSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.addToPlaylist(args.playlist_id, args.video_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to add to playlist: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully added video to playlist.` }],
  };
}

export async function subscribe(args: z.infer<typeof SubscribeSchema>) {
  if (!config.youtube.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'YouTube is not configured.' }],
    };
  }

  const response = await youtubeClient.subscribe(args.channel_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to subscribe: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully subscribed to channel.` }],
  };
}

// Export tool definitions
export const youtubeTools = [
  {
    name: 'youtube_get_channel',
    description: 'Get your YouTube channel info and stats.',
    schema: z.object({}),
    handler: getMyChannel,
  },
  {
    name: 'youtube_get_videos',
    description: 'Get your uploaded YouTube videos.',
    schema: GetVideosSchema,
    handler: getMyVideos,
  },
  {
    name: 'youtube_get_video',
    description: 'Get details and stats for a specific YouTube video.',
    schema: GetVideoSchema,
    handler: getVideo,
  },
  {
    name: 'youtube_update_video',
    description: 'Update a YouTube video\'s title, description, tags, or privacy.',
    schema: UpdateVideoSchema,
    handler: updateVideo,
  },
  {
    name: 'youtube_delete_video',
    description: 'Delete a YouTube video.',
    schema: DeleteVideoSchema,
    handler: deleteVideo,
  },
  {
    name: 'youtube_get_comments',
    description: 'Get comments on a YouTube video.',
    schema: GetCommentsSchema,
    handler: getComments,
  },
  {
    name: 'youtube_reply_comment',
    description: 'Reply to a YouTube comment.',
    schema: ReplyToCommentSchema,
    handler: replyToComment,
  },
  {
    name: 'youtube_get_channel_analytics',
    description: 'Get YouTube channel analytics for a date range.',
    schema: GetChannelAnalyticsSchema,
    handler: getChannelAnalytics,
  },
  {
    name: 'youtube_get_video_analytics',
    description: 'Get analytics for a specific YouTube video.',
    schema: GetVideoAnalyticsSchema,
    handler: getVideoAnalytics,
  },
  {
    name: 'youtube_search',
    description: 'Search YouTube for videos, channels, or playlists.',
    schema: SearchSchema,
    handler: search,
  },
  {
    name: 'youtube_create_playlist',
    description: 'Create a new YouTube playlist.',
    schema: CreatePlaylistSchema,
    handler: createPlaylist,
  },
  {
    name: 'youtube_add_to_playlist',
    description: 'Add a video to a YouTube playlist.',
    schema: AddToPlaylistSchema,
    handler: addToPlaylist,
  },
  {
    name: 'youtube_subscribe',
    description: 'Subscribe to a YouTube channel.',
    schema: SubscribeSchema,
    handler: subscribe,
  },
];
