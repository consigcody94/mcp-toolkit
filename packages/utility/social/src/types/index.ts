// Core types for the Social Media MCP Server

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    platform: Platform;
    requestId?: string;
    timestamp: string;
    rateLimitRemaining?: number;
    rateLimitReset?: Date;
  };
}

export type Platform =
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'threads';

export interface MediaAttachment {
  type: 'image' | 'video' | 'gif' | 'document';
  url?: string;
  path?: string;
  base64?: string;
  mimeType?: string;
  altText?: string;
  thumbnail?: string;
}

export interface PostContent {
  text: string;
  media?: MediaAttachment[];
  link?: {
    url: string;
    title?: string;
    description?: string;
  };
  hashtags?: string[];
  mentions?: string[];
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface ScheduledPost {
  id: string;
  content: PostContent;
  platforms: Platform[];
  scheduledFor: Date;
  status: 'pending' | 'published' | 'failed' | 'cancelled';
  createdAt: Date;
  publishedAt?: Date;
  results?: Record<Platform, PostResult>;
}

export interface PostResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  publishedAt?: Date;
}

export interface AnalyticsData {
  platform: Platform;
  postId?: string;
  metrics: {
    impressions?: number;
    reach?: number;
    engagements?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    clicks?: number;
    videoViews?: number;
    watchTime?: number;
    followers?: number;
    followersGained?: number;
  };
  period?: {
    start: Date;
    end: Date;
  };
  fetchedAt: Date;
}

export interface AccountInfo {
  platform: Platform;
  id: string;
  username: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  followers?: number;
  following?: number;
  posts?: number;
  verified?: boolean;
  accountType?: 'personal' | 'business' | 'creator';
  connected: boolean;
  tokenExpiry?: Date;
  scopes?: string[];
}

export interface RateLimitInfo {
  platform: Platform;
  endpoint: string;
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface ThreadPost {
  text: string;
  media?: MediaAttachment[];
  replyToId?: string;
}

export interface Campaign {
  id: string;
  name: string;
  platforms: Platform[];
  posts: ScheduledPost[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  budget?: number;
  targeting?: CampaignTargeting;
}

export interface CampaignTargeting {
  locations?: string[];
  ageRange?: { min: number; max: number };
  interests?: string[];
  languages?: string[];
}

// Platform-specific types
export namespace Twitter {
  export interface TweetOptions {
    replyTo?: string;
    quoteTweet?: string;
    poll?: {
      options: string[];
      durationMinutes: number;
    };
    conversationControl?: 'everyone' | 'following' | 'mentioned';
  }

  export interface UserMetrics {
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    listedCount: number;
  }
}

export namespace LinkedIn {
  export interface ArticleContent {
    title: string;
    body: string;
    coverImage?: MediaAttachment;
    canonicalUrl?: string;
  }

  export interface CompanyUpdate {
    organizationId: string;
    content: PostContent;
    targeting?: {
      industries?: string[];
      seniorities?: string[];
      locations?: string[];
    };
  }
}

export namespace Facebook {
  export interface PagePost {
    pageId: string;
    content: PostContent;
    targeting?: {
      ageMin?: number;
      ageMax?: number;
      genders?: ('male' | 'female')[];
      countries?: string[];
    };
    published?: boolean;
    scheduledPublishTime?: Date;
  }

  export interface AdCampaign {
    name: string;
    objective: 'AWARENESS' | 'TRAFFIC' | 'ENGAGEMENT' | 'LEADS' | 'SALES';
    budget: {
      type: 'daily' | 'lifetime';
      amount: number;
      currency: string;
    };
    schedule: {
      start: Date;
      end?: Date;
    };
  }
}

export namespace Instagram {
  export interface StoryContent {
    media: MediaAttachment;
    stickers?: Sticker[];
    mentions?: string[];
    hashtags?: string[];
    link?: string;
  }

  export interface Sticker {
    type: 'poll' | 'question' | 'countdown' | 'quiz' | 'link' | 'location' | 'mention';
    data: any;
    position: { x: number; y: number };
  }

  export interface ReelContent {
    video: MediaAttachment;
    caption: string;
    coverImage?: MediaAttachment;
    shareToFeed?: boolean;
    audioName?: string;
  }
}

export namespace TikTok {
  export interface VideoPost {
    video: MediaAttachment;
    caption: string;
    privacy: 'public' | 'friends' | 'private';
    allowComments?: boolean;
    allowDuet?: boolean;
    allowStitch?: boolean;
    commercialContent?: boolean;
  }
}

export namespace YouTube {
  export interface VideoUpload {
    video: MediaAttachment;
    title: string;
    description: string;
    tags?: string[];
    categoryId?: string;
    privacy: 'public' | 'unlisted' | 'private';
    madeForKids?: boolean;
    thumbnail?: MediaAttachment;
    playlist?: string;
  }

  export interface CommunityPost {
    text: string;
    media?: MediaAttachment[];
    poll?: {
      options: string[];
      durationDays: number;
    };
  }
}
