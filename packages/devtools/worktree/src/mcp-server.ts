#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) Server for worktree-wizard
 *
 * Exposes worktree-wizard functionality as MCP tools that can be used by LLMs.
 *
 * Usage:
 * Add to your MCP settings (e.g., Claude Desktop config):
 * {
 *   "mcpServers": {
 *     "worktree-wizard": {
 *       "command": "node",
 *       "args": ["/path/to/worktree-wizard/dist/mcp-server.js"],
 *       "cwd": "/path/to/your/git/repo"
 *     }
 *   }
 * }
 */

import { WorktreeManager } from './managers/worktree-manager';
import { formatPath } from './utils/format';

interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

const TOOLS: MCPTool[] = [
  {
    name: 'list_worktrees',
    description: 'List all git worktrees in the repository with their status, branches, and paths. Shows which worktrees have uncommitted changes, are ahead/behind remote, or have conflicts.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_worktree',
    description: 'Create a new git worktree for a branch. This allows working on multiple branches simultaneously without stashing changes. Automatically generates a sensible path if not provided.',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Branch name to create worktree for (e.g., "feature/new-feature", "bugfix/issue-123")',
        },
        path: {
          type: 'string',
          description: 'Optional custom path for the worktree. If not provided, auto-generates as ../repo-name-branch-name',
        },
        force: {
          type: 'boolean',
          description: 'Force creation even if branch already has a worktree',
          default: false,
        },
      },
      required: ['branch'],
    },
  },
  {
    name: 'remove_worktree',
    description: 'Remove a git worktree by branch name or path. Use this to clean up worktrees when done working on a branch.',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Branch name or path of worktree to remove (e.g., "feature/old-feature" or "/path/to/worktree")',
        },
        force: {
          type: 'boolean',
          description: 'Force removal even if worktree has uncommitted changes',
          default: false,
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'get_stale_worktrees',
    description: 'Find worktrees that have had no commits for a specified number of days. Useful for identifying abandoned worktrees that can be cleaned up.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days threshold for considering a worktree stale',
          default: 90,
        },
      },
    },
  },
  {
    name: 'worktree_info',
    description: 'Get detailed information about a specific worktree including its status, branch, commit, and whether it has uncommitted changes.',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Branch name to get info for',
        },
      },
      required: ['branch'],
    },
  },
];

class MCPServer {
  private manager: WorktreeManager | null = null;

  constructor() {
    this.setupStdinHandler();
  }

  private setupStdinHandler(): void {
    let buffer = '';

    process.stdin.on('data', (chunk) => {
      buffer += chunk.toString();

      // Process complete JSON-RPC messages (separated by newlines)
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line) as MCPRequest;
            this.handleRequest(request).catch((error) => {
              this.sendError(request.id, -32603, `Internal error: ${error.message}`);
            });
          } catch (error: any) {
            this.sendError(null, -32700, 'Parse error');
          }
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });
  }

  private async ensureManager(): Promise<WorktreeManager> {
    if (!this.manager) {
      this.manager = new WorktreeManager(process.cwd());
      await this.manager.initialize();
    }
    return this.manager;
  }

  private async handleRequest(request: MCPRequest): Promise<void> {
    try {
      switch (request.method) {
        case 'initialize':
          this.sendResponse(request.id, {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'worktree-wizard',
              version: '1.1.0',
            },
          });
          break;

        case 'tools/list':
          this.sendResponse(request.id, { tools: TOOLS });
          break;

        case 'tools/call':
          const result = await this.handleToolCall(request.params);
          this.sendResponse(request.id, result);
          break;

        default:
          this.sendError(request.id, -32601, `Method not found: ${request.method}`);
      }
    } catch (error: any) {
      this.sendError(request.id, -32603, error.message);
    }
  }

  private async handleToolCall(params: any): Promise<any> {
    const { name, arguments: args } = params;

    try {
      switch (name) {
        case 'list_worktrees':
          return await this.listWorktrees();

        case 'create_worktree':
          return await this.createWorktree(args);

        case 'remove_worktree':
          return await this.removeWorktree(args);

        case 'get_stale_worktrees':
          return await this.getStaleWorktrees(args);

        case 'worktree_info':
          return await this.getWorktreeInfo(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listWorktrees(): Promise<any> {
    const manager = await this.ensureManager();
    const worktrees = await manager.listWorktrees();

    // Get status for all worktrees
    const statuses = await Promise.all(
      worktrees.map((wt) => manager.getWorktreeStatus(wt))
    );

    const lines: string[] = [];
    lines.push('# Git Worktrees\n');

    for (const { worktree, status } of statuses) {
      const symbol = status.conflicted > 0 ? '✗' :
                     status.modified > 0 || status.added > 0 || status.deleted > 0 ? '●' :
                     status.ahead > 0 || status.behind > 0 ? '◆' : '✓';

      lines.push(`${symbol} **${worktree.branch}**${worktree.isMain ? ' (main)' : ''}${worktree.isLocked ? ' 🔒' : ''}`);
      lines.push(`  Path: \`${formatPath(worktree.path)}\``);
      lines.push(`  Commit: ${worktree.commit.substring(0, 7)}`);

      const statusParts: string[] = [];
      if (status.ahead > 0) statusParts.push(`↑${status.ahead} ahead`);
      if (status.behind > 0) statusParts.push(`↓${status.behind} behind`);
      if (status.modified > 0) statusParts.push(`~${status.modified} modified`);
      if (status.added > 0) statusParts.push(`+${status.added} added`);
      if (status.deleted > 0) statusParts.push(`-${status.deleted} deleted`);
      if (status.untracked > 0) statusParts.push(`?${status.untracked} untracked`);
      if (status.conflicted > 0) statusParts.push(`!${status.conflicted} conflicts`);

      if (statusParts.length > 0) {
        lines.push(`  Status: ${statusParts.join(', ')}`);
      } else {
        lines.push(`  Status: clean`);
      }

      lines.push('');
    }

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }

  private async createWorktree(args: any): Promise<any> {
    const manager = await this.ensureManager();
    const { branch, path, force = false } = args;

    // Check if branch is already in use
    const inUse = await manager.isBranchInUse(branch);
    if (inUse && !force) {
      const existing = await manager.findWorktreeByBranch(branch);
      throw new Error(
        `Branch '${branch}' already has a worktree at: ${existing?.path}\nUse force: true to override`
      );
    }

    const worktreePath = await manager.createWorktree({
      branch,
      path,
      force,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✓ Created worktree for branch '${branch}'\n\nLocation: ${worktreePath}\n\nYou can now work on this branch in a separate directory without affecting other worktrees.`,
        },
      ],
    };
  }

  private async removeWorktree(args: any): Promise<any> {
    const manager = await this.ensureManager();
    const { identifier, force = false } = args;

    const worktrees = await manager.listWorktrees();
    const targetWorktree = worktrees.find(
      (wt) =>
        !wt.isMain &&
        (wt.branch === identifier || wt.path === identifier || wt.path.endsWith(identifier))
    );

    if (!targetWorktree) {
      throw new Error(`Worktree not found: ${identifier}`);
    }

    await manager.removeWorktree(targetWorktree.path, { force });

    return {
      content: [
        {
          type: 'text',
          text: `✓ Removed worktree '${targetWorktree.branch}' from ${targetWorktree.path}`,
        },
      ],
    };
  }

  private async getStaleWorktrees(args: any): Promise<any> {
    const manager = await this.ensureManager();
    const { days = 90 } = args;

    const staleWorktrees = await manager.getStaleWorktrees(days);

    if (staleWorktrees.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No stale worktrees found (older than ${days} days)`,
          },
        ],
      };
    }

    const lines: string[] = [];
    lines.push(`# Stale Worktrees (${days}+ days inactive)\n`);

    for (const wt of staleWorktrees) {
      lines.push(`- **${wt.branch}**`);
      lines.push(`  Path: \`${formatPath(wt.path)}\``);
      lines.push('');
    }

    lines.push(
      `\nFound ${staleWorktrees.length} stale worktree${staleWorktrees.length === 1 ? '' : 's'}. Consider removing them with the remove_worktree tool.`
    );

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }

  private async getWorktreeInfo(args: any): Promise<any> {
    const manager = await this.ensureManager();
    const { branch } = args;

    const worktree = await manager.findWorktreeByBranch(branch);

    if (!worktree) {
      throw new Error(`Worktree not found for branch: ${branch}`);
    }

    const { status } = await manager.getWorktreeStatus(worktree);

    const lines: string[] = [];
    lines.push(`# Worktree: ${branch}\n`);
    lines.push(`**Path:** \`${worktree.path}\``);
    lines.push(`**Commit:** ${worktree.commit}`);
    lines.push(`**Main worktree:** ${worktree.isMain ? 'Yes' : 'No'}`);
    lines.push(`**Locked:** ${worktree.isLocked ? 'Yes 🔒' : 'No'}`);
    lines.push('');
    lines.push('## Status');
    lines.push(`- Ahead: ${status.ahead}`);
    lines.push(`- Behind: ${status.behind}`);
    lines.push(`- Modified: ${status.modified}`);
    lines.push(`- Added: ${status.added}`);
    lines.push(`- Deleted: ${status.deleted}`);
    lines.push(`- Untracked: ${status.untracked}`);
    lines.push(`- Conflicted: ${status.conflicted}`);

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  }

  private sendResponse(id: number | string, result: any): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id,
      result,
    };
    console.log(JSON.stringify(response));
  }

  private sendError(id: number | string | null, code: number, message: string): void {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: id ?? 'error',
      error: {
        code,
        message,
      },
    };
    console.log(JSON.stringify(response));
  }
}

// Start the MCP server
new MCPServer();
