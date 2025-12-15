import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';
import { logger } from './logger.js';
import { ScheduledPost, PostContent, Platform, PostResult } from '../types/index.js';

const SCHEDULE_FILE = join(config.server.dataDir, 'scheduled-posts.json');

class Scheduler {
  private posts: Map<string, ScheduledPost> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private publishCallback: ((post: ScheduledPost) => Promise<Record<Platform, PostResult>>) | null = null;

  constructor() {
    this.loadPosts();
  }

  private ensureDataDir(): void {
    if (!existsSync(config.server.dataDir)) {
      mkdirSync(config.server.dataDir, { recursive: true });
    }
  }

  private loadPosts(): void {
    try {
      this.ensureDataDir();
      if (existsSync(SCHEDULE_FILE)) {
        const data = readFileSync(SCHEDULE_FILE, 'utf-8');
        const posts: ScheduledPost[] = JSON.parse(data);
        posts.forEach((post) => {
          post.scheduledFor = new Date(post.scheduledFor);
          post.createdAt = new Date(post.createdAt);
          if (post.publishedAt) post.publishedAt = new Date(post.publishedAt);
          this.posts.set(post.id, post);
        });
        logger.info(`Loaded ${this.posts.size} scheduled posts`);
      }
    } catch (error) {
      logger.error('Failed to load scheduled posts', {}, error as Error);
    }
  }

  private savePosts(): void {
    try {
      this.ensureDataDir();
      const posts = Array.from(this.posts.values());
      writeFileSync(SCHEDULE_FILE, JSON.stringify(posts, null, 2));
    } catch (error) {
      logger.error('Failed to save scheduled posts', {}, error as Error);
    }
  }

  /**
   * Schedule a new post
   */
  schedulePost(
    content: PostContent,
    platforms: Platform[],
    scheduledFor: Date
  ): ScheduledPost {
    const post: ScheduledPost = {
      id: uuidv4(),
      content,
      platforms,
      scheduledFor,
      status: 'pending',
      createdAt: new Date(),
    };

    this.posts.set(post.id, post);
    this.savePosts();

    logger.info(`Scheduled post ${post.id} for ${scheduledFor.toISOString()}`, {
      tool: 'scheduler',
    });

    return post;
  }

  /**
   * Get a scheduled post by ID
   */
  getPost(id: string): ScheduledPost | undefined {
    return this.posts.get(id);
  }

  /**
   * Get all scheduled posts, optionally filtered
   */
  getPosts(filter?: {
    status?: ScheduledPost['status'];
    platform?: Platform;
    fromDate?: Date;
    toDate?: Date;
  }): ScheduledPost[] {
    let posts = Array.from(this.posts.values());

    if (filter) {
      if (filter.status) {
        posts = posts.filter((p) => p.status === filter.status);
      }
      if (filter.platform) {
        posts = posts.filter((p) => p.platforms.includes(filter.platform!));
      }
      if (filter.fromDate) {
        posts = posts.filter((p) => p.scheduledFor >= filter.fromDate!);
      }
      if (filter.toDate) {
        posts = posts.filter((p) => p.scheduledFor <= filter.toDate!);
      }
    }

    return posts.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  /**
   * Update a scheduled post
   */
  updatePost(
    id: string,
    updates: Partial<Pick<ScheduledPost, 'content' | 'platforms' | 'scheduledFor'>>
  ): ScheduledPost | null {
    const post = this.posts.get(id);
    if (!post || post.status !== 'pending') {
      return null;
    }

    if (updates.content) post.content = updates.content;
    if (updates.platforms) post.platforms = updates.platforms;
    if (updates.scheduledFor) post.scheduledFor = updates.scheduledFor;

    this.savePosts();
    logger.info(`Updated scheduled post ${id}`);

    return post;
  }

  /**
   * Cancel a scheduled post
   */
  cancelPost(id: string): boolean {
    const post = this.posts.get(id);
    if (!post || post.status !== 'pending') {
      return false;
    }

    post.status = 'cancelled';
    this.savePosts();
    logger.info(`Cancelled scheduled post ${id}`);

    return true;
  }

  /**
   * Delete a scheduled post
   */
  deletePost(id: string): boolean {
    const deleted = this.posts.delete(id);
    if (deleted) {
      this.savePosts();
      logger.info(`Deleted scheduled post ${id}`);
    }
    return deleted;
  }

  /**
   * Set the callback function to publish posts
   */
  setPublishCallback(
    callback: (post: ScheduledPost) => Promise<Record<Platform, PostResult>>
  ): void {
    this.publishCallback = callback;
  }

  /**
   * Start the scheduler loop
   */
  start(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      return;
    }

    logger.info('Starting scheduler', { tool: 'scheduler' });

    // Check immediately
    this.checkDuePosts();

    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkDuePosts();
    }, intervalMs);
  }

  /**
   * Stop the scheduler loop
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Stopped scheduler', { tool: 'scheduler' });
    }
  }

  /**
   * Check for and publish due posts
   */
  private async checkDuePosts(): Promise<void> {
    const now = new Date();
    const duePosts = this.getPosts({ status: 'pending' }).filter(
      (p) => p.scheduledFor <= now
    );

    for (const post of duePosts) {
      await this.publishPost(post);
    }
  }

  /**
   * Publish a single post
   */
  private async publishPost(post: ScheduledPost): Promise<void> {
    if (!this.publishCallback) {
      logger.warn(`No publish callback set, skipping post ${post.id}`);
      return;
    }

    logger.info(`Publishing scheduled post ${post.id}`, { tool: 'scheduler' });

    try {
      const results = await this.publishCallback(post);
      post.results = results;
      post.publishedAt = new Date();

      // Check if all platforms succeeded
      const allSucceeded = Object.values(results).every((r) => r.success);
      post.status = allSucceeded ? 'published' : 'failed';

      this.savePosts();
      logger.info(`Post ${post.id} ${post.status}`, { tool: 'scheduler' });
    } catch (error) {
      post.status = 'failed';
      this.savePosts();
      logger.error(`Failed to publish post ${post.id}`, { tool: 'scheduler' }, error as Error);
    }
  }

  /**
   * Manually trigger publishing a pending post
   */
  async publishNow(id: string): Promise<ScheduledPost | null> {
    const post = this.posts.get(id);
    if (!post || post.status !== 'pending') {
      return null;
    }

    await this.publishPost(post);
    return post;
  }

  /**
   * Get statistics about scheduled posts
   */
  getStats(): {
    total: number;
    pending: number;
    published: number;
    failed: number;
    cancelled: number;
    nextDue: Date | null;
  } {
    const posts = Array.from(this.posts.values());
    const pending = posts.filter((p) => p.status === 'pending');

    return {
      total: posts.length,
      pending: pending.length,
      published: posts.filter((p) => p.status === 'published').length,
      failed: posts.filter((p) => p.status === 'failed').length,
      cancelled: posts.filter((p) => p.status === 'cancelled').length,
      nextDue: pending.length > 0
        ? pending.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0].scheduledFor
        : null,
    };
  }
}

export const scheduler = new Scheduler();
