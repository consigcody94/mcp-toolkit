import { z } from 'zod';
import { twitterClient } from './client.js';
import { config } from '../../core/config.js';

// ========== SCHEMAS ==========

export const PostTweetSchema = z.object({
  text: z.string().max(280).describe('The text content of the tweet (max 280 characters)'),
  reply_to: z.string().optional().describe('Tweet ID to reply to'),
  quote_tweet: z.string().optional().describe('Tweet ID to quote'),
  poll_options: z.array(z.string()).max(4).optional().describe('Poll options (2-4 choices)'),
  poll_duration_minutes: z.number().min(5).max(10080).optional().describe('Poll duration in minutes (5 min to 7 days)'),
  conversation_control: z.enum(['everyone', 'following', 'mentioned']).optional().describe('Who can reply'),
});

export const PostThreadSchema = z.object({
  tweets: z.array(z.object({
    text: z.string().max(280).describe('Tweet text'),
  })).min(2).max(25).describe('Array of tweets for the thread (2-25 tweets)'),
});

export const DeleteTweetSchema = z.object({
  tweet_id: z.string().describe('ID of the tweet to delete'),
});

export const GetTweetSchema = z.object({
  tweet_id: z.string().describe('ID of the tweet to fetch'),
});

export const GetTweetMetricsSchema = z.object({
  tweet_id: z.string().describe('ID of the tweet to get metrics for'),
});

export const SearchTweetsSchema = z.object({
  query: z.string().describe('Search query (supports Twitter search operators)'),
  max_results: z.number().min(10).max(100).default(10).describe('Maximum number of results'),
});

export const GetUserSchema = z.object({
  username: z.string().describe('Twitter username (without @)'),
});

export const GetUserTweetsSchema = z.object({
  user_id: z.string().optional().describe('User ID (uses authenticated user if not provided)'),
  max_results: z.number().min(5).max(100).default(10).describe('Maximum number of tweets'),
});

export const LikeTweetSchema = z.object({
  tweet_id: z.string().describe('ID of the tweet to like'),
});

export const RetweetSchema = z.object({
  tweet_id: z.string().describe('ID of the tweet to retweet'),
});

export const FollowUserSchema = z.object({
  target_user_id: z.string().describe('ID of the user to follow'),
});

export const GetFollowersSchema = z.object({
  user_id: z.string().optional().describe('User ID (uses authenticated user if not provided)'),
  max_results: z.number().min(1).max(1000).default(100).describe('Maximum number of followers'),
});

export const CreateListSchema = z.object({
  name: z.string().max(25).describe('Name of the list'),
  description: z.string().max(100).optional().describe('Description of the list'),
  private: z.boolean().default(false).describe('Whether the list is private'),
});

export const AddListMemberSchema = z.object({
  list_id: z.string().describe('ID of the list'),
  user_id: z.string().describe('ID of the user to add'),
});

export const GetTrendsSchema = z.object({
  woeid: z.number().default(1).describe('Where On Earth ID (1 for worldwide, 23424977 for USA)'),
});

export const BookmarkTweetSchema = z.object({
  tweet_id: z.string().describe('ID of the tweet to bookmark'),
});

export const GetBookmarksSchema = z.object({
  max_results: z.number().min(1).max(800).default(100).describe('Maximum number of bookmarks'),
});

// ========== TOOL HANDLERS ==========

export async function postTweet(args: z.infer<typeof PostTweetSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured. Please set TWITTER_ACCESS_TOKEN.' }],
    };
  }

  const response = await twitterClient.postTweet(args.text, {
    replyTo: args.reply_to,
    quoteTweet: args.quote_tweet,
    poll: args.poll_options ? {
      options: args.poll_options,
      durationMinutes: args.poll_duration_minutes || 1440,
    } : undefined,
    conversationControl: args.conversation_control,
  });

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to post tweet: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Successfully posted tweet!\nID: ${response.data?.id}\nURL: https://twitter.com/i/web/status/${response.data?.id}`,
    }],
  };
}

export async function postThread(args: z.infer<typeof PostThreadSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured. Please set TWITTER_ACCESS_TOKEN.' }],
    };
  }

  const response = await twitterClient.postThread(args.tweets);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to post thread: ${response.error?.message}` }],
    };
  }

  const tweetUrls = response.data?.tweets.map(
    (t, i) => `${i + 1}. https://twitter.com/i/web/status/${t.id}`
  ).join('\n');

  return {
    content: [{
      type: 'text',
      text: `Successfully posted thread with ${response.data?.tweets.length} tweets!\n\n${tweetUrls}`,
    }],
  };
}

export async function deleteTweet(args: z.infer<typeof DeleteTweetSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.deleteTweet(args.tweet_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to delete tweet: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully deleted tweet ${args.tweet_id}` }],
  };
}

export async function getTweet(args: z.infer<typeof GetTweetSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.getTweet(args.tweet_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get tweet: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

export async function getTweetMetrics(args: z.infer<typeof GetTweetMetricsSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.getTweetMetrics(args.tweet_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get metrics: ${response.error?.message}` }],
    };
  }

  const m = response.data!;
  return {
    content: [{
      type: 'text',
      text: `Tweet Metrics for ${args.tweet_id}:
• Impressions: ${m.impressions.toLocaleString()}
• Likes: ${m.likes.toLocaleString()}
• Retweets: ${m.retweets.toLocaleString()}
• Replies: ${m.replies.toLocaleString()}
• Quotes: ${m.quotes.toLocaleString()}
• Bookmarks: ${m.bookmarks.toLocaleString()}`,
    }],
  };
}

export async function searchTweets(args: z.infer<typeof SearchTweetsSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.searchTweets(args.query, args.max_results);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to search tweets: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

export async function getMe() {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.getMe();

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
      text: `Twitter Account Info:
• Name: ${u.name}
• Username: @${u.username}
• ID: ${u.id}
• Followers: ${u.metrics.followersCount.toLocaleString()}
• Following: ${u.metrics.followingCount.toLocaleString()}
• Tweets: ${u.metrics.tweetCount.toLocaleString()}`,
    }],
  };
}

export async function getUser(args: z.infer<typeof GetUserSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.getUserByUsername(args.username);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get user: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

export async function getUserTweets(args: z.infer<typeof GetUserTweetsSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  let userId = args.user_id;
  if (!userId) {
    const meResponse = await twitterClient.getMe();
    if (!meResponse.success) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get authenticated user: ${meResponse.error?.message}` }],
      };
    }
    userId = meResponse.data!.id;
  }

  const response = await twitterClient.getUserTweets(userId, args.max_results);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get tweets: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

export async function likeTweet(args: z.infer<typeof LikeTweetSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const meResponse = await twitterClient.getMe();
  if (!meResponse.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get user: ${meResponse.error?.message}` }],
    };
  }

  const response = await twitterClient.likeTweet(meResponse.data!.id, args.tweet_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to like tweet: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully liked tweet ${args.tweet_id}` }],
  };
}

export async function retweet(args: z.infer<typeof RetweetSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const meResponse = await twitterClient.getMe();
  if (!meResponse.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get user: ${meResponse.error?.message}` }],
    };
  }

  const response = await twitterClient.retweet(meResponse.data!.id, args.tweet_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to retweet: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully retweeted ${args.tweet_id}` }],
  };
}

export async function followUser(args: z.infer<typeof FollowUserSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const meResponse = await twitterClient.getMe();
  if (!meResponse.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get user: ${meResponse.error?.message}` }],
    };
  }

  const response = await twitterClient.followUser(meResponse.data!.id, args.target_user_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to follow user: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully followed user ${args.target_user_id}` }],
  };
}

export async function getFollowers(args: z.infer<typeof GetFollowersSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  let userId = args.user_id;
  if (!userId) {
    const meResponse = await twitterClient.getMe();
    if (!meResponse.success) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to get user: ${meResponse.error?.message}` }],
      };
    }
    userId = meResponse.data!.id;
  }

  const response = await twitterClient.getFollowers(userId, args.max_results);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get followers: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

export async function createList(args: z.infer<typeof CreateListSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.createList(args.name, args.description, args.private);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to create list: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully created list "${args.name}" (ID: ${response.data?.id})` }],
  };
}

export async function addListMember(args: z.infer<typeof AddListMemberSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.addListMember(args.list_id, args.user_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to add list member: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully added user ${args.user_id} to list ${args.list_id}` }],
  };
}

export async function getTrends(args: z.infer<typeof GetTrendsSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const response = await twitterClient.getTrends(args.woeid);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get trends: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

export async function bookmarkTweet(args: z.infer<typeof BookmarkTweetSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const meResponse = await twitterClient.getMe();
  if (!meResponse.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get user: ${meResponse.error?.message}` }],
    };
  }

  const response = await twitterClient.bookmarkTweet(meResponse.data!.id, args.tweet_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to bookmark tweet: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully bookmarked tweet ${args.tweet_id}` }],
  };
}

export async function getBookmarks(args: z.infer<typeof GetBookmarksSchema>) {
  if (!config.twitter.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Twitter is not configured.' }],
    };
  }

  const meResponse = await twitterClient.getMe();
  if (!meResponse.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get user: ${meResponse.error?.message}` }],
    };
  }

  const response = await twitterClient.getBookmarks(meResponse.data!.id, args.max_results);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get bookmarks: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

// Export tool definitions for registration
export const twitterTools = [
  {
    name: 'twitter_post_tweet',
    description: 'Post a new tweet to Twitter/X. Supports polls, replies, quote tweets, and reply controls.',
    schema: PostTweetSchema,
    handler: postTweet,
  },
  {
    name: 'twitter_post_thread',
    description: 'Post a thread of multiple connected tweets.',
    schema: PostThreadSchema,
    handler: postThread,
  },
  {
    name: 'twitter_delete_tweet',
    description: 'Delete a tweet by its ID.',
    schema: DeleteTweetSchema,
    handler: deleteTweet,
  },
  {
    name: 'twitter_get_tweet',
    description: 'Get details of a specific tweet.',
    schema: GetTweetSchema,
    handler: getTweet,
  },
  {
    name: 'twitter_get_tweet_metrics',
    description: 'Get engagement metrics for a tweet (impressions, likes, retweets, etc.).',
    schema: GetTweetMetricsSchema,
    handler: getTweetMetrics,
  },
  {
    name: 'twitter_search',
    description: 'Search for tweets matching a query. Supports Twitter search operators.',
    schema: SearchTweetsSchema,
    handler: searchTweets,
  },
  {
    name: 'twitter_get_me',
    description: 'Get the authenticated Twitter account info and metrics.',
    schema: z.object({}),
    handler: getMe,
  },
  {
    name: 'twitter_get_user',
    description: 'Get information about a Twitter user by username.',
    schema: GetUserSchema,
    handler: getUser,
  },
  {
    name: 'twitter_get_user_tweets',
    description: 'Get recent tweets from a user.',
    schema: GetUserTweetsSchema,
    handler: getUserTweets,
  },
  {
    name: 'twitter_like',
    description: 'Like a tweet.',
    schema: LikeTweetSchema,
    handler: likeTweet,
  },
  {
    name: 'twitter_retweet',
    description: 'Retweet a tweet.',
    schema: RetweetSchema,
    handler: retweet,
  },
  {
    name: 'twitter_follow',
    description: 'Follow a Twitter user.',
    schema: FollowUserSchema,
    handler: followUser,
  },
  {
    name: 'twitter_get_followers',
    description: 'Get followers of a user.',
    schema: GetFollowersSchema,
    handler: getFollowers,
  },
  {
    name: 'twitter_create_list',
    description: 'Create a new Twitter list.',
    schema: CreateListSchema,
    handler: createList,
  },
  {
    name: 'twitter_add_list_member',
    description: 'Add a user to a Twitter list.',
    schema: AddListMemberSchema,
    handler: addListMember,
  },
  {
    name: 'twitter_get_trends',
    description: 'Get trending topics for a location.',
    schema: GetTrendsSchema,
    handler: getTrends,
  },
  {
    name: 'twitter_bookmark',
    description: 'Bookmark a tweet.',
    schema: BookmarkTweetSchema,
    handler: bookmarkTweet,
  },
  {
    name: 'twitter_get_bookmarks',
    description: 'Get your bookmarked tweets.',
    schema: GetBookmarksSchema,
    handler: getBookmarks,
  },
];
