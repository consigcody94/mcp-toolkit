import { z } from 'zod';
import { linkedinClient } from './client.js';
import { config } from '../../core/config.js';

// ========== SCHEMAS ==========

export const PostUpdateSchema = z.object({
  content: z.string().max(3000).describe('The text content of the post (max 3000 characters)'),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS']).default('PUBLIC').describe('Post visibility'),
  link_url: z.string().url().optional().describe('URL to include with link preview'),
  link_title: z.string().optional().describe('Custom title for link preview'),
  link_description: z.string().optional().describe('Custom description for link preview'),
});

export const PostCompanyUpdateSchema = z.object({
  organization_id: z.string().describe('LinkedIn Organization/Company ID'),
  content: z.string().max(3000).describe('The text content of the post'),
  visibility: z.enum(['PUBLIC', 'LOGGED_IN']).default('PUBLIC').describe('Post visibility'),
});

export const DeletePostSchema = z.object({
  post_urn: z.string().describe('The URN of the post to delete (e.g., urn:li:share:123456)'),
});

export const GetPostAnalyticsSchema = z.object({
  post_urn: z.string().describe('The URN of the post to get analytics for'),
});

export const GetCompanyAnalyticsSchema = z.object({
  organization_id: z.string().describe('LinkedIn Organization/Company ID'),
  start_date: z.string().describe('Start date (ISO format: YYYY-MM-DD)'),
  end_date: z.string().describe('End date (ISO format: YYYY-MM-DD)'),
});

export const GetCompanyFollowersSchema = z.object({
  organization_id: z.string().describe('LinkedIn Organization/Company ID'),
});

export const PublishArticleSchema = z.object({
  title: z.string().max(200).describe('Article title'),
  body: z.string().describe('Article body content (supports basic HTML)'),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS']).default('PUBLIC').describe('Article visibility'),
  canonical_url: z.string().url().optional().describe('Original URL if republishing'),
});

export const CommentOnPostSchema = z.object({
  post_urn: z.string().describe('The URN of the post to comment on'),
  comment: z.string().max(1250).describe('Comment text'),
});

export const LikePostSchema = z.object({
  post_urn: z.string().describe('The URN of the post to like'),
});

export const GetOrganizationSchema = z.object({
  organization_id: z.string().describe('LinkedIn Organization/Company ID'),
});

export const SearchCompaniesSchema = z.object({
  query: z.string().describe('Search query'),
  count: z.number().min(1).max(50).default(10).describe('Number of results'),
});

// ========== TOOL HANDLERS ==========

export async function postUpdate(args: z.infer<typeof PostUpdateSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured. Please set LINKEDIN_ACCESS_TOKEN.' }],
    };
  }

  const response = await linkedinClient.postUpdate(args.content, args.visibility, {
    linkUrl: args.link_url,
    linkTitle: args.link_title,
    linkDescription: args.link_description,
  });

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to post update: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Successfully posted to LinkedIn!\nPost ID: ${response.data?.id}\nURL: ${response.data?.url}`,
    }],
  };
}

export async function postCompanyUpdate(args: z.infer<typeof PostCompanyUpdateSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.postCompanyUpdate(
    args.organization_id,
    args.content,
    args.visibility
  );

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to post company update: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Successfully posted to company page!\nPost ID: ${response.data?.id}\nURL: ${response.data?.url}`,
    }],
  };
}

export async function deletePost(args: z.infer<typeof DeletePostSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.deletePost(args.post_urn);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to delete post: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully deleted post ${args.post_urn}` }],
  };
}

export async function getPostAnalytics(args: z.infer<typeof GetPostAnalyticsSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.getPostAnalytics(args.post_urn);

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
      text: `LinkedIn Post Analytics:
• Impressions: ${m.impressions.toLocaleString()}
• Clicks: ${m.clicks.toLocaleString()}
• Likes: ${m.likes.toLocaleString()}
• Comments: ${m.comments.toLocaleString()}
• Shares: ${m.shares.toLocaleString()}
• Engagement Rate: ${m.engagement.toFixed(2)}%`,
    }],
  };
}

export async function getCompanyAnalytics(args: z.infer<typeof GetCompanyAnalyticsSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.getCompanyAnalytics(
    args.organization_id,
    new Date(args.start_date),
    new Date(args.end_date)
  );

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get company analytics: ${response.error?.message}` }],
    };
  }

  const m = response.data!;
  return {
    content: [{
      type: 'text',
      text: `LinkedIn Company Analytics (${args.start_date} to ${args.end_date}):
• Page Views: ${m.pageViews.toLocaleString()}
• Unique Visitors: ${m.uniqueVisitors.toLocaleString()}
• Clicks: ${m.clicks.toLocaleString()}`,
    }],
  };
}

export async function getCompanyFollowers(args: z.infer<typeof GetCompanyFollowersSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.getCompanyFollowers(args.organization_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get followers: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Company has ${response.data?.count.toLocaleString()} followers`,
    }],
  };
}

export async function getMe() {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.getMe();

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
      text: `LinkedIn Account Info:
• Name: ${u.firstName} ${u.lastName}
• ID: ${u.id}
• Headline: ${u.headline || 'N/A'}
• Vanity Name: ${u.vanityName || 'N/A'}`,
    }],
  };
}

export async function publishArticle(args: z.infer<typeof PublishArticleSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.publishArticle(args.title, args.body, {
    visibility: args.visibility,
    canonicalUrl: args.canonical_url,
  });

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to publish article: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `Successfully published article!\nID: ${response.data?.id}\nURL: ${response.data?.url}`,
    }],
  };
}

export async function getConnectionsCount() {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.getConnectionsCount();

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get connections: ${response.error?.message}` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `You have ${response.data?.count.toLocaleString()} connections`,
    }],
  };
}

export async function commentOnPost(args: z.infer<typeof CommentOnPostSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.commentOnPost(args.post_urn, args.comment);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to comment: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully commented on post. Comment ID: ${response.data?.id}` }],
  };
}

export async function likePost(args: z.infer<typeof LikePostSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.likePost(args.post_urn);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to like post: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: `Successfully liked post ${args.post_urn}` }],
  };
}

export async function getOrganization(args: z.infer<typeof GetOrganizationSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.getOrganization(args.organization_id);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to get organization: ${response.error?.message}` }],
    };
  }

  const o = response.data!;
  return {
    content: [{
      type: 'text',
      text: `LinkedIn Company Info:
• Name: ${o.name}
• ID: ${o.id}
• Industry: ${o.industry || 'N/A'}
• Website: ${o.website || 'N/A'}
• Description: ${o.description?.substring(0, 200) || 'N/A'}${o.description && o.description.length > 200 ? '...' : ''}`,
    }],
  };
}

export async function searchCompanies(args: z.infer<typeof SearchCompaniesSchema>) {
  if (!config.linkedin.enabled) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'LinkedIn is not configured.' }],
    };
  }

  const response = await linkedinClient.searchCompanies(args.query, args.count);

  if (!response.success) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to search: ${response.error?.message}` }],
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
  };
}

// Export tool definitions
export const linkedinTools = [
  {
    name: 'linkedin_post_update',
    description: 'Post a text update to LinkedIn. Supports adding links with previews.',
    schema: PostUpdateSchema,
    handler: postUpdate,
  },
  {
    name: 'linkedin_post_company_update',
    description: 'Post an update to a LinkedIn Company Page you manage.',
    schema: PostCompanyUpdateSchema,
    handler: postCompanyUpdate,
  },
  {
    name: 'linkedin_delete_post',
    description: 'Delete a LinkedIn post.',
    schema: DeletePostSchema,
    handler: deletePost,
  },
  {
    name: 'linkedin_get_post_analytics',
    description: 'Get engagement analytics for a LinkedIn post.',
    schema: GetPostAnalyticsSchema,
    handler: getPostAnalytics,
  },
  {
    name: 'linkedin_get_company_analytics',
    description: 'Get analytics for a LinkedIn Company Page.',
    schema: GetCompanyAnalyticsSchema,
    handler: getCompanyAnalytics,
  },
  {
    name: 'linkedin_get_company_followers',
    description: 'Get follower count for a LinkedIn Company Page.',
    schema: GetCompanyFollowersSchema,
    handler: getCompanyFollowers,
  },
  {
    name: 'linkedin_get_me',
    description: 'Get the authenticated LinkedIn user profile.',
    schema: z.object({}),
    handler: getMe,
  },
  {
    name: 'linkedin_publish_article',
    description: 'Publish a long-form article on LinkedIn.',
    schema: PublishArticleSchema,
    handler: publishArticle,
  },
  {
    name: 'linkedin_get_connections',
    description: 'Get the number of LinkedIn connections.',
    schema: z.object({}),
    handler: getConnectionsCount,
  },
  {
    name: 'linkedin_comment',
    description: 'Comment on a LinkedIn post.',
    schema: CommentOnPostSchema,
    handler: commentOnPost,
  },
  {
    name: 'linkedin_like',
    description: 'Like a LinkedIn post.',
    schema: LikePostSchema,
    handler: likePost,
  },
  {
    name: 'linkedin_get_organization',
    description: 'Get information about a LinkedIn Company.',
    schema: GetOrganizationSchema,
    handler: getOrganization,
  },
  {
    name: 'linkedin_search_companies',
    description: 'Search for companies on LinkedIn.',
    schema: SearchCompaniesSchema,
    handler: searchCompanies,
  },
];
