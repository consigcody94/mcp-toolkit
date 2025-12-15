/**
 * Complete type system for git workflow automation
 */

// ============================================================================
// Git Types
// ============================================================================

export interface GitConfig {
  repoPath?: string;
  remoteName?: string;
}

export interface GitStatus {
  current: string;
  tracking: string | null;
  ahead: number;
  behind: number;
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: Array<{ from: string; to: string }>;
  staged: string[];
  conflicted: string[];
  isClean: boolean;
}

export interface GitCommit {
  hash: string;
  author: {
    name: string;
    email: string;
  };
  date: Date;
  message: string;
  body: string;
  refs: string;
}

export interface GitDiff {
  file: string;
  changes: number;
  insertions: number;
  deletions: number;
  binary: boolean;
  oldPath?: string;
  newPath?: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
  label: string;
}

export interface GitRemote {
  name: string;
  refs: {
    fetch: string;
    push: string;
  };
}

export interface GitTag {
  name: string;
  commit: string;
  date: Date;
  message: string;
  annotated: boolean;
}

// ============================================================================
// Commit Types
// ============================================================================

export type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'build'
  | 'ci'
  | 'chore'
  | 'revert';

export interface CommitScope {
  name: string;
  description: string;
}

export interface ConventionalCommit {
  type: CommitType;
  scope?: string;
  breaking: boolean;
  subject: string;
  body?: string;
  footer?: string;
  issues?: string[];
}

export interface ParsedCommit {
  type: string | null;
  scope: string | null;
  subject: string | null;
  merge: string | null;
  header: string | null;
  body: string | null;
  footer: string | null;
  notes: Array<{
    title: string;
    text: string;
  }>;
  references: Array<{
    action: string | null;
    owner: string | null;
    repository: string | null;
    issue: string;
    raw: string;
    prefix: string;
  }>;
  mentions: string[];
  revert: {
    header: string | null;
    hash: string | null;
  } | null;
}

export interface CommitSuggestion {
  type: CommitType;
  scope?: string;
  subject: string;
  body?: string;
  breaking?: boolean;
  confidence: number;
  reasoning: string;
}

export interface ChangeAnalysis {
  files: {
    added: string[];
    modified: string[];
    deleted: string[];
    renamed: Array<{ from: string; to: string }>;
  };
  patterns: {
    hasTests: boolean;
    hasDocs: boolean;
    hasConfig: boolean;
    hasUI: boolean;
    hasAPI: boolean;
    hasDatabase: boolean;
  };
  scope: string[];
  impact: 'major' | 'minor' | 'patch';
  suggestions: CommitSuggestion[];
}

// ============================================================================
// GitHub Types
// ============================================================================

export interface GitHubConfig {
  token?: string;
  owner?: string;
  repo?: string;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  draft: boolean;
  merged: boolean;
  mergeable: boolean | null;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  labels: Array<{
    name: string;
    color: string;
  }>;
  assignees: Array<{
    login: string;
  }>;
  requested_reviewers: Array<{
    login: string;
  }>;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface PRReview {
  id: number;
  user: {
    login: string;
  };
  body: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at: string | null;
}

export interface PRComment {
  id: number;
  path: string | null;
  position: number | null;
  line: number | null;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  in_reply_to_id?: number;
}

export interface PRFile {
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previous_filename?: string;
}

export interface ReviewSuggestion {
  severity: 'critical' | 'warning' | 'info' | 'nitpick';
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
  category:
    | 'security'
    | 'performance'
    | 'style'
    | 'documentation'
    | 'testing'
    | 'architecture'
    | 'best-practice';
}

export interface PRAnalysis {
  summary: string;
  impact: 'major' | 'minor' | 'patch';
  complexity: 'low' | 'medium' | 'high';
  suggestions: ReviewSuggestion[];
  strengths: string[];
  concerns: string[];
  testCoverage: {
    hasTests: boolean;
    testFiles: string[];
  };
  documentation: {
    hasDocs: boolean;
    docFiles: string[];
  };
}

export interface CheckRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | null;
  started_at: string | null;
  completed_at: string | null;
  html_url: string;
}

// ============================================================================
// Release Types
// ============================================================================

export type ReleaseType = 'major' | 'minor' | 'patch' | 'premajor' | 'preminor' | 'prepatch' | 'prerelease';

export interface Release {
  id: number;
  tag_name: string;
  name: string;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  author: {
    login: string;
  };
  assets: Array<{
    name: string;
    download_count: number;
  }>;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: {
    breaking: string[];
    features: string[];
    fixes: string[];
    performance: string[];
    documentation: string[];
    other: string[];
  };
}

export interface ReleaseNotes {
  version: string;
  date: string;
  title: string;
  body: string;
  highlights: string[];
  breaking: string[];
  contributors: string[];
}

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPRequest {
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
}

export interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ============================================================================
// Operation Results
// ============================================================================

export interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}
