import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Configuration schema with validation
const ConfigSchema = z.object({
  // Twitter/X
  twitter: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    accessToken: z.string().optional(),
    accessTokenSecret: z.string().optional(),
    bearerToken: z.string().optional(),
    enabled: z.boolean().default(false),
  }),

  // LinkedIn
  linkedin: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    authorUrn: z.string().optional(),
    organizationId: z.string().optional(),
    enabled: z.boolean().default(false),
  }),

  // Meta (Facebook & Instagram)
  meta: z.object({
    appId: z.string().optional(),
    appSecret: z.string().optional(),
    accessToken: z.string().optional(),
    userId: z.string().optional(),
    pageId: z.string().optional(),
    instagramAccountId: z.string().optional(),
    enabled: z.boolean().default(false),
  }),

  // TikTok
  tiktok: z.object({
    clientKey: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    enabled: z.boolean().default(false),
  }),

  // YouTube
  youtube: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    channelId: z.string().optional(),
    enabled: z.boolean().default(false),
  }),

  // Server settings
  server: z.object({
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    dataDir: z.string().default('./data'),
    maxRetries: z.number().default(3),
    retryDelay: z.number().default(1000),
    timeout: z.number().default(30000),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const config = {
    twitter: {
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN,
      enabled: !!(process.env.TWITTER_ACCESS_TOKEN || process.env.TWITTER_BEARER_TOKEN),
    },

    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
      authorUrn: process.env.LINKEDIN_AUTHOR_URN,
      organizationId: process.env.LINKEDIN_ORGANIZATION_ID,
      enabled: !!process.env.LINKEDIN_ACCESS_TOKEN,
    },

    meta: {
      appId: process.env.META_APP_ID,
      appSecret: process.env.META_APP_SECRET,
      accessToken: process.env.META_ACCESS_TOKEN,
      userId: process.env.META_USER_ID,
      pageId: process.env.META_PAGE_ID,
      instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID,
      enabled: !!process.env.META_ACCESS_TOKEN,
    },

    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET,
      accessToken: process.env.TIKTOK_ACCESS_TOKEN,
      enabled: !!process.env.TIKTOK_ACCESS_TOKEN,
    },

    youtube: {
      clientId: process.env.YOUTUBE_CLIENT_ID,
      clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
      accessToken: process.env.YOUTUBE_ACCESS_TOKEN,
      refreshToken: process.env.YOUTUBE_REFRESH_TOKEN,
      channelId: process.env.YOUTUBE_CHANNEL_ID,
      enabled: !!process.env.YOUTUBE_ACCESS_TOKEN,
    },

    server: {
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      dataDir: process.env.DATA_DIR || './data',
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
      timeout: parseInt(process.env.TIMEOUT || '30000', 10),
    },
  };

  return ConfigSchema.parse(config);
}

export const config = loadConfig();

export function getEnabledPlatforms(): string[] {
  const platforms: string[] = [];
  if (config.twitter.enabled) platforms.push('twitter');
  if (config.linkedin.enabled) platforms.push('linkedin');
  if (config.meta.enabled) platforms.push('facebook', 'instagram');
  if (config.tiktok.enabled) platforms.push('tiktok');
  if (config.youtube.enabled) platforms.push('youtube');
  return platforms;
}

export function isPlatformEnabled(platform: string): boolean {
  switch (platform) {
    case 'twitter':
      return config.twitter.enabled;
    case 'linkedin':
      return config.linkedin.enabled;
    case 'facebook':
    case 'instagram':
      return config.meta.enabled;
    case 'tiktok':
      return config.tiktok.enabled;
    case 'youtube':
      return config.youtube.enabled;
    default:
      return false;
  }
}
