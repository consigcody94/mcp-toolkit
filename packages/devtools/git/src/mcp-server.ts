#!/usr/bin/env node
/**
 * Commit Craft MCP Server
 * Complete git workflow automation via Model Context Protocol
 */

import { GitClient } from './git/git-client.js';
import { GitHubClient } from './github/github-client.js';
import { CommitAnalyzer } from './parsers/commit-analyzer.js';
import { PRAnalyzer } from './parsers/pr-analyzer.js';
import type { MCPRequest, MCPResponse, MCPTool } from './types.js';
import * as semver from 'semver';

export class CommitCraftMCPServer {
  private git: GitClient;
  private github: GitHubClient;
  private commitAnalyzer: CommitAnalyzer;
  private prAnalyzer: PRAnalyzer;

  constructor() {
    this.git = new GitClient();
    this.github = new GitHubClient();
    this.commitAnalyzer = new CommitAnalyzer();
    this.prAnalyzer = new PRAnalyzer();
  }

  /**
   * Initialize server and start listening
   */
  async start(): Promise<void> {
    // Set up stdin/stdout for JSON-RPC communication
    process.stdin.setEncoding('utf-8');

    let buffer = '';

    process.stdin.on('data', async (chunk: string) => {
      buffer += chunk;

      // Process complete messages (separated by newlines)
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request: MCPRequest = JSON.parse(line);
            const response = await this.handleRequest(request);
            this.sendResponse(response);
          } catch (error) {
            this.sendError(error instanceof Error ? error.message : String(error));
          }
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });
  }

  /**
   * Handle MCP request
   */
  private async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'tools/list':
          return this.listTools();

        case 'tools/call':
          if (!request.params?.name) {
            throw new Error('Missing tool name');
          }
          return await this.callTool(request.params.name, request.params.arguments || {});

        default:
          throw new Error(`Unknown method: ${request.method}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * List available tools
   */
  private listTools(): MCPResponse {
    const tools: MCPTool[] = [
      // Git status and information
      {
        name: 'git_status',
        description: 'Get current repository status with staged/unstaged changes',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'git_log',
        description: 'Get commit history',
        inputSchema: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Number of commits to retrieve (default: 10)' },
          },
        },
      },
      {
        name: 'git_diff',
        description: 'Get diff for staged or unstaged changes',
        inputSchema: {
          type: 'object',
          properties: {
            staged: {
              type: 'boolean',
              description: 'Show staged changes (default: true)',
            },
          },
        },
      },

      // Commit crafting
      {
        name: 'analyze_changes',
        description: 'Analyze staged changes and suggest commit messages',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'craft_commit',
        description: 'Create a well-formatted conventional commit',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Commit type (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert)',
            },
            scope: { type: 'string', description: 'Optional scope' },
            subject: { type: 'string', description: 'Commit subject (required)' },
            body: { type: 'string', description: 'Optional commit body' },
            breaking: { type: 'boolean', description: 'Is this a breaking change?' },
            footer: { type: 'string', description: 'Optional footer (issues, co-authors)' },
          },
          required: ['type', 'subject'],
        },
      },
      {
        name: 'validate_commit',
        description: 'Validate a commit message against conventional commits',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Commit message to validate' },
          },
          required: ['message'],
        },
      },
      {
        name: 'create_commit',
        description: 'Create and commit changes with a message',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Commit message' },
            amend: { type: 'boolean', description: 'Amend last commit instead of creating new one' },
          },
          required: ['message'],
        },
      },

      // Branch management
      {
        name: 'list_branches',
        description: 'List all branches in the repository',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_branch',
        description: 'Create a new branch',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Branch name' },
            checkout: { type: 'boolean', description: 'Checkout branch after creation (default: true)' },
          },
          required: ['name'],
        },
      },
      {
        name: 'checkout_branch',
        description: 'Switch to a different branch',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Branch name' },
          },
          required: ['name'],
        },
      },

      // GitHub integration
      {
        name: 'setup_github',
        description: 'Set up GitHub integration with repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner/organization' },
            repo: { type: 'string', description: 'Repository name' },
            token: { type: 'string', description: 'Optional GitHub token (uses GITHUB_TOKEN env if not provided)' },
          },
          required: ['owner', 'repo'],
        },
      },
      {
        name: 'list_prs',
        description: 'List pull requests',
        inputSchema: {
          type: 'object',
          properties: {
            state: { type: 'string', description: 'PR state: open, closed, all (default: open)' },
          },
        },
      },
      {
        name: 'get_pr',
        description: 'Get detailed information about a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            number: { type: 'number', description: 'PR number' },
          },
          required: ['number'],
        },
      },
      {
        name: 'create_pr',
        description: 'Create a new pull request',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'PR title' },
            head: { type: 'string', description: 'Head branch (source)' },
            base: { type: 'string', description: 'Base branch (target, default: main)' },
            body: { type: 'string', description: 'PR description' },
            draft: { type: 'boolean', description: 'Create as draft PR (default: false)' },
          },
          required: ['title', 'head'],
        },
      },
      {
        name: 'review_pr',
        description: 'Analyze and review a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            number: { type: 'number', description: 'PR number' },
          },
          required: ['number'],
        },
      },
      {
        name: 'submit_review',
        description: 'Submit a review on a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            number: { type: 'number', description: 'PR number' },
            event: { type: 'string', description: 'Review event: APPROVE, REQUEST_CHANGES, COMMENT' },
            body: { type: 'string', description: 'Review comment' },
          },
          required: ['number', 'event'],
        },
      },
      {
        name: 'merge_pr',
        description: 'Merge a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            number: { type: 'number', description: 'PR number' },
            method: { type: 'string', description: 'Merge method: merge, squash, rebase (default: merge)' },
          },
          required: ['number'],
        },
      },
      {
        name: 'check_ci_status',
        description: 'Check CI/CD status for a pull request or commit',
        inputSchema: {
          type: 'object',
          properties: {
            ref: { type: 'string', description: 'Git ref (commit SHA, branch, or PR number)' },
          },
          required: ['ref'],
        },
      },

      // Release management
      {
        name: 'list_releases',
        description: 'List GitHub releases',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_release',
        description: 'Create a new GitHub release',
        inputSchema: {
          type: 'object',
          properties: {
            version: { type: 'string', description: 'Version tag (e.g., v1.0.0)' },
            name: { type: 'string', description: 'Release name' },
            body: { type: 'string', description: 'Release notes' },
            draft: { type: 'boolean', description: 'Create as draft (default: false)' },
            prerelease: { type: 'boolean', description: 'Mark as prerelease (default: false)' },
          },
          required: ['version', 'name', 'body'],
        },
      },
      {
        name: 'bump_version',
        description: 'Calculate next semantic version based on commits',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Version bump type: major, minor, patch, auto (default: auto)',
            },
          },
        },
      },
      {
        name: 'generate_changelog',
        description: 'Generate changelog from commits',
        inputSchema: {
          type: 'object',
          properties: {
            from: { type: 'string', description: 'Start tag/commit (optional)' },
            to: { type: 'string', description: 'End tag/commit (default: HEAD)' },
          },
        },
      },
    ];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ tools }, null, 2),
        },
      ],
    };
  }

  /**
   * Call a tool with arguments
   */
  private async callTool(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
    switch (name) {
      case 'git_status':
        return await this.gitStatus();

      case 'git_log':
        return await this.gitLog(args.count as number | undefined);

      case 'git_diff':
        return await this.gitDiff(args.staged as boolean | undefined);

      case 'analyze_changes':
        return await this.analyzeChanges();

      case 'craft_commit':
        return await this.craftCommit(args);

      case 'validate_commit':
        return await this.validateCommit(args.message as string);

      case 'create_commit':
        return await this.createCommit(args.message as string, args.amend as boolean | undefined);

      case 'list_branches':
        return await this.listBranches();

      case 'create_branch':
        return await this.createBranch(args.name as string, args.checkout as boolean | undefined);

      case 'checkout_branch':
        return await this.checkoutBranch(args.name as string);

      case 'setup_github':
        return await this.setupGitHub(args.owner as string, args.repo as string, args.token as string | undefined);

      case 'list_prs':
        return await this.listPRs(args.state as 'open' | 'closed' | 'all' | undefined);

      case 'get_pr':
        return await this.getPR(args.number as number);

      case 'create_pr':
        return await this.createPR(args);

      case 'review_pr':
        return await this.reviewPR(args.number as number);

      case 'submit_review':
        return await this.submitReview(args.number as number, args.event as string, args.body as string | undefined);

      case 'merge_pr':
        return await this.mergePR(args.number as number, args.method as string | undefined);

      case 'check_ci_status':
        return await this.checkCIStatus(args.ref as string);

      case 'list_releases':
        return await this.listReleases();

      case 'create_release':
        return await this.createRelease(args);

      case 'bump_version':
        return await this.bumpVersion(args.type as string | undefined);

      case 'generate_changelog':
        return await this.generateChangelog(args.from as string | undefined, args.to as string | undefined);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // ============================================================================
  // Git Operations
  // ============================================================================

  private async gitStatus(): Promise<MCPResponse> {
    const status = await this.git.getStatus();

    let markdown = '# Git Status\n\n';

    markdown += `**Branch:** ${status.current}\n`;
    if (status.tracking) {
      markdown += `**Tracking:** ${status.tracking}`;
      if (status.ahead > 0 || status.behind > 0) {
        markdown += ` (↑${status.ahead} ↓${status.behind})`;
      }
      markdown += '\n';
    }

    markdown += `\n**Status:** ${status.isClean ? '✅ Clean' : '⚠️ Changes detected'}\n\n`;

    if (!status.isClean) {
      if (status.staged.length > 0) {
        markdown += '### Staged Changes\n\n';
        for (const file of status.staged) {
          markdown += `- ✅ ${file}\n`;
        }
        markdown += '\n';
      }

      if (status.modified.length > 0) {
        markdown += '### Modified Files\n\n';
        for (const file of status.modified) {
          markdown += `- 📝 ${file}\n`;
        }
        markdown += '\n';
      }

      if (status.created.length > 0) {
        markdown += '### New Files\n\n';
        for (const file of status.created) {
          markdown += `- ➕ ${file}\n`;
        }
        markdown += '\n';
      }

      if (status.deleted.length > 0) {
        markdown += '### Deleted Files\n\n';
        for (const file of status.deleted) {
          markdown += `- ➖ ${file}\n`;
        }
        markdown += '\n';
      }

      if (status.renamed.length > 0) {
        markdown += '### Renamed Files\n\n';
        for (const file of status.renamed) {
          markdown += `- 🔄 ${file.from} → ${file.to}\n`;
        }
        markdown += '\n';
      }

      if (status.conflicted.length > 0) {
        markdown += '### Conflicts\n\n';
        for (const file of status.conflicted) {
          markdown += `- ⚠️ ${file}\n`;
        }
        markdown += '\n';
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async gitLog(count = 10): Promise<MCPResponse> {
    const commits = await this.git.getLog(count);

    let markdown = `# Commit History (${count} commits)\n\n`;

    for (const commit of commits) {
      markdown += `### ${commit.hash.substring(0, 7)} - ${commit.message}\n\n`;
      markdown += `**Author:** ${commit.author.name} <${commit.author.email}>\n`;
      markdown += `**Date:** ${commit.date.toISOString()}\n`;
      if (commit.refs) {
        markdown += `**Refs:** ${commit.refs}\n`;
      }
      if (commit.body) {
        markdown += `\n${commit.body}\n`;
      }
      markdown += '\n---\n\n';
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async gitDiff(staged = true): Promise<MCPResponse> {
    const diffs = staged ? await this.git.getStagedDiff() : await this.git.getUnstagedDiff();

    let markdown = `# ${staged ? 'Staged' : 'Unstaged'} Changes\n\n`;

    if (diffs.length === 0) {
      markdown += 'No changes detected.\n';
      return { content: [{ type: 'text', text: markdown }] };
    }

    markdown += '| File | Changes | Additions | Deletions |\n';
    markdown += '|------|---------|-----------|----------|\n';

    let totalChanges = 0;
    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const diff of diffs) {
      markdown += `| ${diff.file} | ${diff.changes} | +${diff.insertions} | -${diff.deletions} |\n`;
      totalChanges += diff.changes;
      totalAdditions += diff.insertions;
      totalDeletions += diff.deletions;
    }

    markdown += `\n**Total:** ${diffs.length} file(s), ${totalChanges} change(s) (+${totalAdditions} -${totalDeletions})\n`;

    return { content: [{ type: 'text', text: markdown }] };
  }

  // ============================================================================
  // Commit Crafting
  // ============================================================================

  private async analyzeChanges(): Promise<MCPResponse> {
    const status = await this.git.getStatus();
    const diffs = await this.git.getStagedDiff();

    if (status.staged.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No staged changes to analyze. Use `git add` to stage files first.',
          },
        ],
      };
    }

    const analysis = this.commitAnalyzer.analyzeChanges(diffs, status.staged);

    let markdown = '# Change Analysis\n\n';

    markdown += '## Files Changed\n\n';
    markdown += `- **Added:** ${analysis.files.added.length}\n`;
    markdown += `- **Modified:** ${analysis.files.modified.length}\n`;
    markdown += `- **Deleted:** ${analysis.files.deleted.length}\n\n`;

    markdown += '## Detected Patterns\n\n';
    markdown += `- Tests: ${analysis.patterns.hasTests ? '✅' : '❌'}\n`;
    markdown += `- Documentation: ${analysis.patterns.hasDocs ? '✅' : '❌'}\n`;
    markdown += `- Configuration: ${analysis.patterns.hasConfig ? '✅' : '❌'}\n`;
    markdown += `- UI Changes: ${analysis.patterns.hasUI ? '✅' : '❌'}\n`;
    markdown += `- API Changes: ${analysis.patterns.hasAPI ? '✅' : '❌'}\n`;
    markdown += `- Database: ${analysis.patterns.hasDatabase ? '✅' : '❌'}\n\n`;

    if (analysis.scope.length > 0) {
      markdown += '## Suggested Scopes\n\n';
      for (const scope of analysis.scope) {
        markdown += `- \`${scope}\`\n`;
      }
      markdown += '\n';
    }

    markdown += `## Impact Level: ${analysis.impact}\n\n`;

    if (analysis.suggestions.length > 0) {
      markdown += '## Commit Suggestions\n\n';
      for (const suggestion of analysis.suggestions) {
        markdown += `### ${suggestion.type}${suggestion.scope ? `(${suggestion.scope})` : ''}: ${suggestion.subject}\n\n`;
        markdown += `**Confidence:** ${(suggestion.confidence * 100).toFixed(0)}%\n`;
        markdown += `**Reasoning:** ${suggestion.reasoning}\n\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async craftCommit(args: Record<string, unknown>): Promise<MCPResponse> {
    const message = this.commitAnalyzer.formatCommit(
      args.type as any,
      args.subject as string,
      args.scope as string | undefined,
      args.body as string | undefined,
      args.breaking as boolean | undefined,
      args.footer as string | undefined
    );

    const validation = this.commitAnalyzer.validateCommit(message);

    let markdown = '# Crafted Commit Message\n\n';
    markdown += '```\n' + message + '\n```\n\n';

    if (validation.valid) {
      markdown += '✅ **Valid** - Follows conventional commits specification\n\n';
      markdown += 'Use `create_commit` tool to apply this message.\n';
    } else {
      markdown += '❌ **Invalid**\n\n';
      for (const error of validation.errors) {
        markdown += `- ${error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async validateCommit(message: string): Promise<MCPResponse> {
    const validation = this.commitAnalyzer.validateCommit(message);

    let markdown = '# Commit Message Validation\n\n';
    markdown += '```\n' + message + '\n```\n\n';

    if (validation.valid) {
      markdown += '✅ **Valid** - Follows conventional commits specification\n';
    } else {
      markdown += '❌ **Invalid**\n\n';
      for (const error of validation.errors) {
        markdown += `- ${error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async createCommit(message: string, amend = false): Promise<MCPResponse> {
    const result = amend ? await this.git.amendCommit(message) : await this.git.commit(message);

    let markdown = '# Commit Result\n\n';

    if (result.success) {
      markdown += `✅ ${result.message}\n\n`;
      if (result.data) {
        markdown += `**Commit:** ${(result.data as any).commit}\n`;
        if ((result.data as any).summary) {
          markdown += `**Summary:** ${(result.data as any).summary}\n`;
        }
      }
    } else {
      markdown += `❌ ${result.message}\n\n`;
      if (result.error) {
        markdown += `**Error:** ${result.error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  // ============================================================================
  // Branch Management
  // ============================================================================

  private async listBranches(): Promise<MCPResponse> {
    const branches = await this.git.getBranches();

    let markdown = '# Branches\n\n';

    for (const branch of branches) {
      const current = branch.current ? '→ ' : '  ';
      markdown += `${current}**${branch.name}** (${branch.commit.substring(0, 7)})\n`;
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async createBranch(name: string, checkout = true): Promise<MCPResponse> {
    const result = await this.git.createBranch(name, checkout);

    let markdown = '# Create Branch\n\n';

    if (result.success) {
      markdown += `✅ ${result.message}\n`;
    } else {
      markdown += `❌ ${result.message}\n`;
      if (result.error) {
        markdown += `\n**Error:** ${result.error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async checkoutBranch(name: string): Promise<MCPResponse> {
    const result = await this.git.checkoutBranch(name);

    let markdown = '# Checkout Branch\n\n';

    if (result.success) {
      markdown += `✅ ${result.message}\n`;
    } else {
      markdown += `❌ ${result.message}\n`;
      if (result.error) {
        markdown += `\n**Error:** ${result.error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  // ============================================================================
  // GitHub Operations
  // ============================================================================

  private async setupGitHub(owner: string, repo: string, token?: string): Promise<MCPResponse> {
    if (token) {
      this.github = new GitHubClient({ token });
    }

    this.github.setRepo(owner, repo);

    let markdown = '# GitHub Setup\n\n';
    markdown += `✅ Connected to **${owner}/${repo}**\n`;

    try {
      const info = await this.github.getRepoInfo();
      markdown += `\n**Default Branch:** ${info.defaultBranch}\n`;
    } catch (error) {
      markdown += `\n⚠️ Warning: ${error instanceof Error ? error.message : String(error)}\n`;
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async listPRs(state: 'open' | 'closed' | 'all' = 'open'): Promise<MCPResponse> {
    const prs = await this.github.listPullRequests(state);

    let markdown = `# Pull Requests (${state})\n\n`;

    if (prs.length === 0) {
      markdown += 'No pull requests found.\n';
      return { content: [{ type: 'text', text: markdown }] };
    }

    for (const pr of prs) {
      const status = pr.draft ? '📝' : pr.merged ? '✅' : pr.state === 'open' ? '🟢' : '🔴';
      markdown += `### ${status} #${pr.number} - ${pr.title}\n\n`;
      markdown += `**Author:** ${pr.user.login}\n`;
      markdown += `**Branch:** ${pr.head.ref} → ${pr.base.ref}\n`;
      markdown += `**Status:** ${pr.state}${pr.draft ? ' (draft)' : ''}${pr.merged ? ' (merged)' : ''}\n`;
      markdown += `**Changes:** ${pr.commits} commit(s), +${pr.additions} -${pr.deletions}\n\n`;
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async getPR(number: number): Promise<MCPResponse> {
    const pr = await this.github.getPullRequest(number);

    let markdown = `# PR #${pr.number} - ${pr.title}\n\n`;

    markdown += `**Author:** ${pr.user.login}\n`;
    markdown += `**Branch:** ${pr.head.ref} → ${pr.base.ref}\n`;
    markdown += `**State:** ${pr.state}${pr.draft ? ' (draft)' : ''}${pr.merged ? ' (merged)' : ''}\n`;
    markdown += `**Mergeable:** ${pr.mergeable ? '✅' : '❌'}\n\n`;

    markdown += `**Stats:**\n`;
    markdown += `- ${pr.commits} commit(s)\n`;
    markdown += `- ${pr.changed_files} file(s)\n`;
    markdown += `- +${pr.additions} -${pr.deletions}\n`;
    markdown += `- ${pr.comments} comment(s)\n`;
    markdown += `- ${pr.review_comments} review comment(s)\n\n`;

    if (pr.labels.length > 0) {
      markdown += `**Labels:** ${pr.labels.map(l => l.name).join(', ')}\n\n`;
    }

    if (pr.body) {
      markdown += `## Description\n\n${pr.body}\n\n`;
    }

    markdown += `**Created:** ${pr.created_at}\n`;
    markdown += `**Updated:** ${pr.updated_at}\n`;

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async createPR(args: Record<string, unknown>): Promise<MCPResponse> {
    const result = await this.github.createPullRequest(
      args.title as string,
      args.head as string,
      (args.base as string) || 'main',
      args.body as string | undefined,
      args.draft as boolean | undefined
    );

    let markdown = '# Create Pull Request\n\n';

    if (result.success) {
      markdown += `✅ ${result.message}\n\n`;
      if (result.data) {
        markdown += `**URL:** ${(result.data as any).url}\n`;
      }
    } else {
      markdown += `❌ ${result.message}\n`;
      if (result.error) {
        markdown += `\n**Error:** ${result.error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async reviewPR(number: number): Promise<MCPResponse> {
    const pr = await this.github.getPullRequest(number);
    const files = await this.github.getPullRequestFiles(number);

    const analysis = this.prAnalyzer.analyzePR(files, pr.title, pr.body);
    const review = this.prAnalyzer.generateReviewComment(analysis);

    return { content: [{ type: 'text', text: review }] };
  }

  private async submitReview(
    number: number,
    event: string,
    body?: string
  ): Promise<MCPResponse> {
    const result = await this.github.createReview(number, event as any, body);

    let markdown = '# Submit Review\n\n';

    if (result.success) {
      markdown += `✅ ${result.message}\n`;
    } else {
      markdown += `❌ ${result.message}\n`;
      if (result.error) {
        markdown += `\n**Error:** ${result.error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async mergePR(number: number, method = 'merge'): Promise<MCPResponse> {
    const result = await this.github.mergePullRequest(number, method as any);

    let markdown = '# Merge Pull Request\n\n';

    if (result.success) {
      markdown += `✅ ${result.message}\n`;
      if (result.data) {
        markdown += `\n**SHA:** ${(result.data as any).sha}\n`;
      }
    } else {
      markdown += `❌ ${result.message}\n`;
      if (result.error) {
        markdown += `\n**Error:** ${result.error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async checkCIStatus(ref: string): Promise<MCPResponse> {
    const checks = await this.github.getCheckRuns(ref);

    let markdown = `# CI/CD Status - ${ref}\n\n`;

    if (checks.length === 0) {
      markdown += 'No checks found.\n';
      return { content: [{ type: 'text', text: markdown }] };
    }

    for (const check of checks) {
      const status =
        check.conclusion === 'success' ? '✅' :
        check.conclusion === 'failure' ? '❌' :
        check.status === 'in_progress' ? '🔄' :
        '⏳';

      markdown += `${status} **${check.name}**\n`;
      markdown += `- Status: ${check.status}\n`;
      if (check.conclusion) {
        markdown += `- Conclusion: ${check.conclusion}\n`;
      }
      if (check.html_url) {
        markdown += `- [View Details](${check.html_url})\n`;
      }
      markdown += '\n';
    }

    const allPassed = checks.every(c => c.conclusion === 'success');
    const anyFailed = checks.some(c => c.conclusion === 'failure');

    markdown += `\n**Overall:** ${allPassed ? '✅ All checks passed' : anyFailed ? '❌ Some checks failed' : '⏳ Checks pending'}\n`;

    return { content: [{ type: 'text', text: markdown }] };
  }

  // ============================================================================
  // Release Management
  // ============================================================================

  private async listReleases(): Promise<MCPResponse> {
    const releases = await this.github.listReleases();

    let markdown = '# Releases\n\n';

    if (releases.length === 0) {
      markdown += 'No releases found.\n';
      return { content: [{ type: 'text', text: markdown }] };
    }

    for (const release of releases) {
      const status = release.draft ? '📝' : release.prerelease ? '🧪' : '✅';
      markdown += `### ${status} ${release.tag_name} - ${release.name}\n\n`;
      markdown += `**Author:** ${release.author.login}\n`;
      markdown += `**Published:** ${release.published_at || 'Not published'}\n`;
      if (release.assets.length > 0) {
        markdown += `**Assets:** ${release.assets.length}\n`;
      }
      markdown += '\n';
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async createRelease(args: Record<string, unknown>): Promise<MCPResponse> {
    const result = await this.github.createRelease(
      args.version as string,
      args.name as string,
      args.body as string,
      args.draft as boolean | undefined,
      args.prerelease as boolean | undefined
    );

    let markdown = '# Create Release\n\n';

    if (result.success) {
      markdown += `✅ ${result.message}\n`;
      if (result.data) {
        markdown += `\n**URL:** ${(result.data as any).url}\n`;
      }
    } else {
      markdown += `❌ ${result.message}\n`;
      if (result.error) {
        markdown += `\n**Error:** ${result.error}\n`;
      }
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async bumpVersion(type = 'auto'): Promise<MCPResponse> {
    const latestRelease = await this.github.getLatestRelease();
    const currentVersion = latestRelease ? latestRelease.tag_name.replace(/^v/, '') : '0.0.0';

    let bumpType: semver.ReleaseType = 'patch';

    if (type === 'auto') {
      // Analyze commits since last release to determine version bump
      const commits = await this.git.getLog(50);
      let hasBreaking = false;
      let hasFeature = false;

      for (const commit of commits) {
        const parsed = this.commitAnalyzer.parseCommit(commit.message);
        if (parsed.notes.some(n => n.title === 'BREAKING CHANGE')) {
          hasBreaking = true;
          break;
        }
        if (parsed.type === 'feat') {
          hasFeature = true;
        }
      }

      bumpType = hasBreaking ? 'major' : hasFeature ? 'minor' : 'patch';
    } else {
      bumpType = type as semver.ReleaseType;
    }

    const nextVersion = semver.inc(currentVersion, bumpType);

    let markdown = '# Version Bump\n\n';
    markdown += `**Current:** ${currentVersion}\n`;
    markdown += `**Next:** ${nextVersion}\n`;
    markdown += `**Type:** ${bumpType}\n\n`;

    if (type === 'auto') {
      markdown += '💡 Automatically determined from conventional commits\n';
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async generateChangelog(from?: string, _to = 'HEAD'): Promise<MCPResponse> {
    const commits = from ? await this.git.getLog(100, from) : await this.git.getLog(100);

    const sections = {
      breaking: [] as string[],
      features: [] as string[],
      fixes: [] as string[],
      performance: [] as string[],
      documentation: [] as string[],
      other: [] as string[],
    };

    for (const commit of commits) {
      const parsed = this.commitAnalyzer.parseCommit(commit.message);
      const entry = this.commitAnalyzer.generateChangelogEntry(parsed);

      if (parsed.notes.some(n => n.title === 'BREAKING CHANGE')) {
        sections.breaking.push(entry);
      } else if (parsed.type === 'feat') {
        sections.features.push(entry);
      } else if (parsed.type === 'fix') {
        sections.fixes.push(entry);
      } else if (parsed.type === 'perf') {
        sections.performance.push(entry);
      } else if (parsed.type === 'docs') {
        sections.documentation.push(entry);
      } else {
        sections.other.push(entry);
      }
    }

    let markdown = '# Changelog\n\n';

    if (sections.breaking.length > 0) {
      markdown += '## ⚠️ BREAKING CHANGES\n\n';
      sections.breaking.forEach(e => (markdown += `${e}\n`));
      markdown += '\n';
    }

    if (sections.features.length > 0) {
      markdown += '## ✨ Features\n\n';
      sections.features.forEach(e => (markdown += `${e}\n`));
      markdown += '\n';
    }

    if (sections.fixes.length > 0) {
      markdown += '## 🐛 Bug Fixes\n\n';
      sections.fixes.forEach(e => (markdown += `${e}\n`));
      markdown += '\n';
    }

    if (sections.performance.length > 0) {
      markdown += '## ⚡ Performance\n\n';
      sections.performance.forEach(e => (markdown += `${e}\n`));
      markdown += '\n';
    }

    if (sections.documentation.length > 0) {
      markdown += '## 📚 Documentation\n\n';
      sections.documentation.forEach(e => (markdown += `${e}\n`));
      markdown += '\n';
    }

    if (sections.other.length > 0) {
      markdown += '## 🔧 Other Changes\n\n';
      sections.other.forEach(e => (markdown += `${e}\n`));
      markdown += '\n';
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private sendResponse(response: MCPResponse): void {
    console.log(JSON.stringify(response));
  }

  private sendError(message: string): void {
    console.log(
      JSON.stringify({
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      })
    );
  }
}

// Start server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new CommitCraftMCPServer();
  server.start().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
