/**
 * GitHub operations wrapper using Octokit
 */

import { Octokit } from '@octokit/rest';
import type {
  GitHubConfig,
  PullRequest,
  PRReview,
  PRComment,
  PRFile,
  CheckRun,
  Release,
  OperationResult,
} from '../types.js';

export class GitHubClient {
  private octokit: Octokit;
  private config: GitHubConfig;

  constructor(config: GitHubConfig = {}) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token || process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Set repository context
   */
  setRepo(owner: string, repo: string): void {
    this.config.owner = owner;
    this.config.repo = repo;
  }

  /**
   * Get repository owner and name
   */
  private getRepo(): { owner: string; repo: string } {
    if (!this.config.owner || !this.config.repo) {
      throw new Error('Repository not configured. Call setRepo() first.');
    }
    return { owner: this.config.owner, repo: this.config.repo };
  }

  /**
   * List pull requests
   */
  async listPullRequests(state: 'open' | 'closed' | 'all' = 'open'): Promise<PullRequest[]> {
    const { owner, repo } = this.getRepo();
    const { data } = await this.octokit.pulls.list({
      owner,
      repo,
      state,
      per_page: 100,
    });

    return data.map(pr => this.transformPR(pr as any));
  }

  /**
   * Get pull request by number
   */
  async getPullRequest(prNumber: number): Promise<PullRequest> {
    const { owner, repo } = this.getRepo();
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return this.transformPR(data as any);
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    title: string,
    head: string,
    base: string,
    body?: string,
    draft = false
  ): Promise<OperationResult> {
    try {
      const { owner, repo } = this.getRepo();
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body,
        draft,
      });

      return {
        success: true,
        message: `Created PR #${data.number}`,
        data: {
          number: data.number,
          url: data.html_url,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create pull request',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update pull request
   */
  async updatePullRequest(
    prNumber: number,
    updates: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      base?: string;
    }
  ): Promise<OperationResult> {
    try {
      const { owner, repo } = this.getRepo();
      await this.octokit.pulls.update({
        owner,
        repo,
        pull_number: prNumber,
        ...updates,
      });

      return {
        success: true,
        message: `Updated PR #${prNumber}`,
        data: { number: prNumber },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update pull request',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get pull request files
   */
  async getPullRequestFiles(prNumber: number): Promise<PRFile[]> {
    const { owner, repo } = this.getRepo();
    const { data } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    return data.map(file => ({
      filename: file.filename,
      status: file.status as PRFile['status'],
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
      previous_filename: file.previous_filename,
    }));
  }

  /**
   * List pull request reviews
   */
  async listReviews(prNumber: number): Promise<PRReview[]> {
    const { owner, repo } = this.getRepo();
    const { data } = await this.octokit.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });

    return data.map(review => ({
      id: review.id,
      user: {
        login: review.user?.login || '',
      },
      body: review.body,
      state: review.state as PRReview['state'],
      submitted_at: review.submitted_at || null,
    }));
  }

  /**
   * Create pull request review
   */
  async createReview(
    prNumber: number,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    body?: string,
    comments?: Array<{
      path: string;
      position?: number;
      body: string;
      line?: number;
      side?: 'LEFT' | 'RIGHT';
    }>
  ): Promise<OperationResult> {
    try {
      const { owner, repo } = this.getRepo();
      const { data } = await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        event,
        body,
        comments,
      });

      return {
        success: true,
        message: `Created review for PR #${prNumber}`,
        data: {
          id: data.id,
          state: data.state,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create review',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List pull request comments
   */
  async listComments(prNumber: number): Promise<PRComment[]> {
    const { owner, repo } = this.getRepo();
    const { data } = await this.octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: prNumber,
    });

    return data.map(comment => ({
      id: comment.id,
      path: comment.path,
      position: comment.position ?? null,
      line: comment.line || null,
      body: comment.body,
      user: {
        login: comment.user?.login || '',
      },
      created_at: comment.created_at,
      in_reply_to_id: comment.in_reply_to_id,
    }));
  }

  /**
   * Create pull request comment
   */
  async createComment(
    prNumber: number,
    body: string,
    path?: string,
    line?: number
  ): Promise<OperationResult> {
    try {
      const { owner, repo } = this.getRepo();

      if (path && line) {
        // Review comment on specific line
        const { data: pr } = await this.octokit.pulls.get({
          owner,
          repo,
          pull_number: prNumber,
        });

        await this.octokit.pulls.createReviewComment({
          owner,
          repo,
          pull_number: prNumber,
          commit_id: pr.head.sha,
          path,
          line,
          body,
        });
      } else {
        // Regular issue comment
        await this.octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body,
        });
      }

      return {
        success: true,
        message: `Created comment on PR #${prNumber}`,
        data: { prNumber },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create comment',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Merge pull request
   */
  async mergePullRequest(
    prNumber: number,
    mergeMethod: 'merge' | 'squash' | 'rebase' = 'merge',
    commitTitle?: string,
    commitMessage?: string
  ): Promise<OperationResult> {
    try {
      const { owner, repo } = this.getRepo();
      const { data } = await this.octokit.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        merge_method: mergeMethod,
        commit_title: commitTitle,
        commit_message: commitMessage,
      });

      return {
        success: true,
        message: `Merged PR #${prNumber}`,
        data: {
          sha: data.sha,
          merged: data.merged,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to merge pull request',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get check runs for a commit
   */
  async getCheckRuns(ref: string): Promise<CheckRun[]> {
    const { owner, repo } = this.getRepo();
    const { data } = await this.octokit.checks.listForRef({
      owner,
      repo,
      ref,
    });

    return data.check_runs.map(check => ({
      id: check.id,
      name: check.name,
      status: check.status as CheckRun['status'],
      conclusion: check.conclusion as CheckRun['conclusion'],
      started_at: check.started_at,
      completed_at: check.completed_at,
      html_url: check.html_url || '',
    }));
  }

  /**
   * List releases
   */
  async listReleases(): Promise<Release[]> {
    const { owner, repo } = this.getRepo();
    const { data } = await this.octokit.repos.listReleases({
      owner,
      repo,
      per_page: 50,
    });

    return data.map(release => ({
      id: release.id,
      tag_name: release.tag_name,
      name: release.name || release.tag_name,
      body: release.body ?? null,
      draft: release.draft,
      prerelease: release.prerelease,
      created_at: release.created_at,
      published_at: release.published_at,
      author: {
        login: release.author?.login || '',
      },
      assets: release.assets.map(asset => ({
        name: asset.name,
        download_count: asset.download_count,
      })),
    }));
  }

  /**
   * Get latest release
   */
  async getLatestRelease(): Promise<Release | null> {
    try {
      const { owner, repo } = this.getRepo();
      const { data } = await this.octokit.repos.getLatestRelease({
        owner,
        repo,
      });

      return {
        id: data.id,
        tag_name: data.tag_name,
        name: data.name || data.tag_name,
        body: data.body ?? null,
        draft: data.draft,
        prerelease: data.prerelease,
        created_at: data.created_at,
        published_at: data.published_at,
        author: {
          login: data.author?.login || '',
        },
        assets: data.assets.map(asset => ({
          name: asset.name,
          download_count: asset.download_count,
        })),
      };
    } catch {
      return null;
    }
  }

  /**
   * Create release
   */
  async createRelease(
    tagName: string,
    name: string,
    body: string,
    draft = false,
    prerelease = false
  ): Promise<OperationResult> {
    try {
      const { owner, repo } = this.getRepo();
      const { data } = await this.octokit.repos.createRelease({
        owner,
        repo,
        tag_name: tagName,
        name,
        body,
        draft,
        prerelease,
      });

      return {
        success: true,
        message: `Created release ${tagName}`,
        data: {
          id: data.id,
          url: data.html_url,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create release',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update release
   */
  async updateRelease(
    releaseId: number,
    updates: {
      tag_name?: string;
      name?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
    }
  ): Promise<OperationResult> {
    try {
      const { owner, repo } = this.getRepo();
      await this.octokit.repos.updateRelease({
        owner,
        repo,
        release_id: releaseId,
        ...updates,
      });

      return {
        success: true,
        message: `Updated release ${releaseId}`,
        data: { id: releaseId },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update release',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete release
   */
  async deleteRelease(releaseId: number): Promise<OperationResult> {
    try {
      const { owner, repo } = this.getRepo();
      await this.octokit.repos.deleteRelease({
        owner,
        repo,
        release_id: releaseId,
      });

      return {
        success: true,
        message: `Deleted release ${releaseId}`,
        data: { id: releaseId },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete release',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get repository information
   */
  async getRepoInfo(): Promise<{ owner: string; repo: string; defaultBranch: string }> {
    const { owner, repo } = this.getRepo();
    const { data } = await this.octokit.repos.get({
      owner,
      repo,
    });

    return {
      owner: data.owner.login,
      repo: data.name,
      defaultBranch: data.default_branch,
    };
  }

  /**
   * Parse repository URL
   */
  static parseRepoUrl(url: string): { owner: string; repo: string } | null {
    // Match GitHub URLs: https://github.com/owner/repo or git@github.com:owner/repo.git
    const httpsMatch = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }

    const sshMatch = url.match(/github\.com:([^\/]+)\/([^\/\.]+)/);
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2].replace('.git', '') };
    }

    return null;
  }

  /**
   * Transform GitHub PR to our format
   */
  private transformPR(pr: any): PullRequest {
    return {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      draft: pr.draft,
      merged: pr.merged,
      mergeable: pr.mergeable,
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
      },
      user: {
        login: pr.user.login,
        avatar_url: pr.user.avatar_url,
      },
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
      closed_at: pr.closed_at,
      labels: pr.labels?.map((l: any) => ({ name: l.name, color: l.color })) || [],
      assignees: pr.assignees?.map((a: any) => ({ login: a.login })) || [],
      requested_reviewers: pr.requested_reviewers?.map((r: any) => ({ login: r.login })) || [],
      comments: pr.comments || 0,
      review_comments: pr.review_comments || 0,
      commits: pr.commits || 0,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
      changed_files: pr.changed_files || 0,
    };
  }
}
