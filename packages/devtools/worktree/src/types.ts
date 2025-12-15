export interface Worktree {
  path: string;
  branch: string;
  commit: string;
  isMain: boolean;
  isBare: boolean;
  isLocked: boolean;
  isPrunable: boolean;
}

export interface WorktreeStatus {
  worktree: Worktree;
  status: GitStatus;
}

export interface GitStatus {
  ahead: number;
  behind: number;
  modified: number;
  added: number;
  deleted: number;
  renamed: number;
  untracked: number;
  conflicted: number;
  staged: number;
}

export interface WorktreeCreateOptions {
  branch: string;
  path?: string;
  checkout?: boolean;
  force?: boolean;
  detach?: boolean;
  track?: string;
}

export interface WorktreeRemoveOptions {
  force?: boolean;
}

export interface WorktreeListOptions {
  verbose?: boolean;
  porcelain?: boolean;
}

export interface ExecuteInWorktreeOptions {
  parallel?: boolean;
  includeMain?: boolean;
  filter?: string;
}
