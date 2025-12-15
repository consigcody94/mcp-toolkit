import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import * as path from 'path';
import {
  Worktree,
  WorktreeStatus,
  GitStatus,
  WorktreeCreateOptions,
  WorktreeRemoveOptions,
} from '../types';

export class WorktreeManager {
  private git: SimpleGit;
  private repoRoot: string;

  constructor(repoPath: string = process.cwd()) {
    this.git = simpleGit(repoPath);
    this.repoRoot = repoPath;
  }

  async initialize(): Promise<void> {
    // Verify we're in a git repository
    const isRepo = await this.git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a git repository');
    }

    // Get the repository root
    const root = await this.git.revparse(['--show-toplevel']);
    this.repoRoot = root.trim();
    this.git = simpleGit(this.repoRoot);
  }

  async listWorktrees(): Promise<Worktree[]> {
    try {
      const result = await this.git.raw(['worktree', 'list', '--porcelain']);
      return this.parseWorktreeList(result);
    } catch (error) {
      throw new Error(`Failed to list worktrees: ${error}`);
    }
  }

  async getWorktreeStatus(worktree: Worktree): Promise<WorktreeStatus> {
    const git = simpleGit(worktree.path);
    const status: StatusResult = await git.status();

    const gitStatus: GitStatus = {
      ahead: status.ahead,
      behind: status.behind,
      modified: status.modified.length,
      added: status.created.length,
      deleted: status.deleted.length,
      renamed: status.renamed.length,
      untracked: status.not_added.length,
      conflicted: status.conflicted.length,
      staged: status.staged.length,
    };

    return {
      worktree,
      status: gitStatus,
    };
  }

  async createWorktree(options: WorktreeCreateOptions): Promise<string> {
    const { branch, path: targetPath, checkout = true, force = false, detach = false } = options;

    // Determine the worktree path
    const worktreePath = targetPath || this.generateWorktreePath(branch);

    // Build the git worktree add command
    const args = ['worktree', 'add'];

    if (force) {
      args.push('--force');
    }

    if (detach) {
      args.push('--detach');
    }

    if (!checkout) {
      args.push('--no-checkout');
    }

    args.push(worktreePath);

    // Check if branch exists
    const branches = await this.git.branch();
    const branchExists = branches.all.includes(branch) || branches.all.includes(`remotes/origin/${branch}`);

    if (branchExists) {
      args.push(branch);
    } else {
      // Create new branch
      args.push('-b', branch);
    }

    try {
      await this.git.raw(args);
      return worktreePath;
    } catch (error) {
      throw new Error(`Failed to create worktree: ${error}`);
    }
  }

  async removeWorktree(worktreePath: string, options: WorktreeRemoveOptions = {}): Promise<void> {
    const { force = false } = options;

    const args = ['worktree', 'remove'];

    if (force) {
      args.push('--force');
    }

    args.push(worktreePath);

    try {
      await this.git.raw(args);
    } catch (error) {
      throw new Error(`Failed to remove worktree: ${error}`);
    }
  }

  async pruneWorktrees(): Promise<void> {
    try {
      await this.git.raw(['worktree', 'prune']);
    } catch (error) {
      throw new Error(`Failed to prune worktrees: ${error}`);
    }
  }

  async lockWorktree(worktreePath: string, reason?: string): Promise<void> {
    const args = ['worktree', 'lock'];
    if (reason) {
      args.push('--reason', reason);
    }
    args.push(worktreePath);

    try {
      await this.git.raw(args);
    } catch (error) {
      throw new Error(`Failed to lock worktree: ${error}`);
    }
  }

  async unlockWorktree(worktreePath: string): Promise<void> {
    try {
      await this.git.raw(['worktree', 'unlock', worktreePath]);
    } catch (error) {
      throw new Error(`Failed to unlock worktree: ${error}`);
    }
  }

  async repairWorktrees(): Promise<void> {
    try {
      await this.git.raw(['worktree', 'repair']);
    } catch (error) {
      throw new Error(`Failed to repair worktrees: ${error}`);
    }
  }

  async isBranchInUse(branch: string): Promise<boolean> {
    const worktrees = await this.listWorktrees();
    return worktrees.some(wt => wt.branch === branch);
  }

  async findWorktreeByBranch(branch: string): Promise<Worktree | undefined> {
    const worktrees = await this.listWorktrees();
    return worktrees.find(wt => wt.branch === branch);
  }

  async getStaleWorktrees(daysOld: number = 90): Promise<Worktree[]> {
    const worktrees = await this.listWorktrees();
    const stale: Worktree[] = [];

    for (const worktree of worktrees) {
      if (worktree.isMain) continue;

      try {
        const git = simpleGit(worktree.path);
        const log = await git.log({ maxCount: 1 });

        if (log.latest) {
          const lastCommitDate = new Date(log.latest.date);
          const daysSinceLastCommit = Math.floor(
            (Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastCommit > daysOld) {
            stale.push(worktree);
          }
        }
      } catch (error) {
        // Skip worktrees that can't be accessed
        continue;
      }
    }

    return stale;
  }

  private parseWorktreeList(output: string): Worktree[] {
    const worktrees: Worktree[] = [];
    const lines = output.split('\n').filter(line => line.trim());

    let current: Partial<Worktree> = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        if (current.path) {
          worktrees.push(current as Worktree);
        }
        current = {
          path: line.substring('worktree '.length),
          isMain: false,
          isBare: false,
          isLocked: false,
          isPrunable: false,
        };
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.substring('HEAD '.length);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring('branch '.length).replace('refs/heads/', '');
      } else if (line === 'bare') {
        current.isBare = true;
      } else if (line.startsWith('locked')) {
        current.isLocked = true;
      } else if (line === 'prunable') {
        current.isPrunable = true;
      } else if (line.startsWith('detached')) {
        current.branch = 'HEAD (detached)';
      }
    }

    if (current.path) {
      worktrees.push(current as Worktree);
    }

    // Mark the main worktree
    if (worktrees.length > 0) {
      worktrees[0].isMain = true;
    }

    return worktrees;
  }

  private generateWorktreePath(branch: string): string {
    // Create worktree in parent directory with branch name
    const parentDir = path.dirname(this.repoRoot);
    const repoName = path.basename(this.repoRoot);
    const cleanBranch = branch.replace(/[^a-zA-Z0-9-_]/g, '-');

    return path.join(parentDir, `${repoName}-${cleanBranch}`);
  }

  getRepoRoot(): string {
    return this.repoRoot;
  }
}
