/**
 * Git operations wrapper using simple-git
 */

import simpleGit, { SimpleGit, StatusResult, LogResult } from 'simple-git';
import type {
  GitConfig,
  GitStatus,
  GitCommit,
  GitDiff,
  GitBranch,
  GitRemote,
  GitTag,
  OperationResult,
} from '../types.js';

export class GitClient {
  private git: SimpleGit;

  constructor(config: GitConfig = {}) {
    this.git = simpleGit({
      baseDir: config.repoPath || process.cwd(),
      binary: 'git',
      maxConcurrentProcesses: 6,
    });
  }

  /**
   * Get current repository status
   */
  async getStatus(): Promise<GitStatus> {
    const status: StatusResult = await this.git.status();

    return {
      current: status.current || '',
      tracking: status.tracking || null,
      ahead: status.ahead,
      behind: status.behind,
      created: status.created,
      deleted: status.deleted,
      modified: status.modified,
      renamed: status.renamed.map(r => ({ from: r.from, to: r.to })),
      staged: status.staged,
      conflicted: status.conflicted,
      isClean: status.isClean(),
    };
  }

  /**
   * Get commit history
   */
  async getLog(count = 10, fromRevision?: string): Promise<GitCommit[]> {
    const log: LogResult = await this.git.log({
      maxCount: count,
      from: fromRevision,
    });

    return log.all.map(commit => ({
      hash: commit.hash,
      author: {
        name: commit.author_name,
        email: commit.author_email,
      },
      date: new Date(commit.date),
      message: commit.message,
      body: commit.body,
      refs: commit.refs,
    }));
  }

  /**
   * Get diff for staged files
   */
  async getStagedDiff(): Promise<GitDiff[]> {
    const diff = await this.git.diff(['--cached', '--numstat']);
    return this.parseDiff(diff);
  }

  /**
   * Get diff for unstaged files
   */
  async getUnstagedDiff(): Promise<GitDiff[]> {
    const diff = await this.git.diff(['--numstat']);
    return this.parseDiff(diff);
  }

  /**
   * Get diff between commits
   */
  async getDiffBetween(from: string, to: string): Promise<GitDiff[]> {
    const diff = await this.git.diff([`${from}...${to}`, '--numstat']);
    return this.parseDiff(diff);
  }

  /**
   * Parse diff output
   */
  private parseDiff(diffOutput: string): GitDiff[] {
    const lines = diffOutput.trim().split('\n').filter(Boolean);
    const diffs: GitDiff[] = [];

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 3) continue;

      const insertions = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
      const deletions = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
      const file = parts[2];

      diffs.push({
        file,
        changes: insertions + deletions,
        insertions,
        deletions,
        binary: parts[0] === '-' && parts[1] === '-',
      });
    }

    return diffs;
  }

  /**
   * Get file contents at specific revision
   */
  async getFileContent(file: string, revision = 'HEAD'): Promise<string> {
    return await this.git.show([`${revision}:${file}`]);
  }

  /**
   * Stage files
   */
  async stageFiles(files: string[]): Promise<OperationResult> {
    try {
      await this.git.add(files);
      return {
        success: true,
        message: `Staged ${files.length} file(s)`,
        data: { files },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to stage files',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Unstage files
   */
  async unstageFiles(files: string[]): Promise<OperationResult> {
    try {
      await this.git.reset(['HEAD', ...files]);
      return {
        success: true,
        message: `Unstaged ${files.length} file(s)`,
        data: { files },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to unstage files',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create commit
   */
  async commit(message: string): Promise<OperationResult> {
    try {
      const result = await this.git.commit(message);
      return {
        success: true,
        message: `Created commit ${result.commit}`,
        data: {
          commit: result.commit,
          summary: result.summary,
          branch: result.branch,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create commit',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Amend last commit
   */
  async amendCommit(message?: string): Promise<OperationResult> {
    try {
      const args = ['--amend'];
      if (message) {
        args.push('-m', message);
      } else {
        args.push('--no-edit');
      }
      const result = await this.git.commit(args as any);
      return {
        success: true,
        message: 'Amended last commit',
        data: { commit: result.commit },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to amend commit',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get branches
   */
  async getBranches(): Promise<GitBranch[]> {
    const branches = await this.git.branch();

    return branches.all.map(name => ({
      name,
      current: name === branches.current,
      commit: branches.branches[name].commit,
      label: branches.branches[name].label,
    }));
  }

  /**
   * Create new branch
   */
  async createBranch(name: string, checkout = true): Promise<OperationResult> {
    try {
      if (checkout) {
        await this.git.checkoutBranch(name, 'HEAD');
      } else {
        await this.git.branch([name]);
      }
      return {
        success: true,
        message: `Created branch ${name}`,
        data: { branch: name, checkout },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create branch',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Checkout branch
   */
  async checkoutBranch(name: string): Promise<OperationResult> {
    try {
      await this.git.checkout(name);
      return {
        success: true,
        message: `Checked out branch ${name}`,
        data: { branch: name },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to checkout branch',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete branch
   */
  async deleteBranch(name: string, force = false): Promise<OperationResult> {
    try {
      await this.git.branch([force ? '-D' : '-d', name]);
      return {
        success: true,
        message: `Deleted branch ${name}`,
        data: { branch: name, forced: force },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete branch',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get remotes
   */
  async getRemotes(): Promise<GitRemote[]> {
    const remotes = await this.git.getRemotes(true);

    return remotes.map(remote => ({
      name: remote.name,
      refs: {
        fetch: remote.refs.fetch || '',
        push: remote.refs.push || '',
      },
    }));
  }

  /**
   * Push to remote
   */
  async push(remote = 'origin', branch?: string, force = false): Promise<OperationResult> {
    try {
      const args: string[] = [remote];
      if (branch) args.push(branch);
      if (force) args.push('--force');

      await this.git.push(args);
      return {
        success: true,
        message: `Pushed to ${remote}${branch ? `/${branch}` : ''}`,
        data: { remote, branch, force },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to push',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Pull from remote
   */
  async pull(remote = 'origin', branch?: string): Promise<OperationResult> {
    try {
      await this.git.pull(remote, branch);
      return {
        success: true,
        message: `Pulled from ${remote}${branch ? `/${branch}` : ''}`,
        data: { remote, branch },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to pull',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Fetch from remote
   */
  async fetch(remote = 'origin'): Promise<OperationResult> {
    try {
      await this.git.fetch(remote);
      return {
        success: true,
        message: `Fetched from ${remote}`,
        data: { remote },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get tags
   */
  async getTags(): Promise<GitTag[]> {
    const tags = await this.git.tags();
    const tagList: GitTag[] = [];

    for (const tagName of tags.all) {
      try {
        const show = await this.git.show(['-s', '--format=%H%n%aI%n%B', tagName]);
        const lines = show.split('\n');
        tagList.push({
          name: tagName,
          commit: lines[0],
          date: new Date(lines[1]),
          message: lines.slice(2).join('\n').trim(),
          annotated: show.includes('tag '),
        });
      } catch {
        // Lightweight tag
        const log = await this.git.log([tagName, '-1']);
        if (log.latest) {
          tagList.push({
            name: tagName,
            commit: log.latest.hash,
            date: new Date(log.latest.date),
            message: log.latest.message,
            annotated: false,
          });
        }
      }
    }

    return tagList;
  }

  /**
   * Create tag
   */
  async createTag(name: string, message?: string): Promise<OperationResult> {
    try {
      if (message) {
        await this.git.tag(['-a', name, '-m', message]);
      } else {
        await this.git.tag([name]);
      }
      return {
        success: true,
        message: `Created tag ${name}`,
        data: { tag: name, annotated: !!message },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create tag',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete tag
   */
  async deleteTag(name: string): Promise<OperationResult> {
    try {
      await this.git.tag(['-d', name]);
      return {
        success: true,
        message: `Deleted tag ${name}`,
        data: { tag: name },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete tag',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Push tags
   */
  async pushTags(remote = 'origin'): Promise<OperationResult> {
    try {
      await this.git.push([remote, '--tags']);
      return {
        success: true,
        message: `Pushed tags to ${remote}`,
        data: { remote },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to push tags',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if repository is clean
   */
  async isClean(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isClean;
  }

  /**
   * Get current branch
   */
  async getCurrentBranch(): Promise<string> {
    const status = await this.git.status();
    return status.current || '';
  }

  /**
   * Get repository root path
   */
  async getRepoRoot(): Promise<string> {
    return await this.git.revparse(['--show-toplevel']);
  }
}
