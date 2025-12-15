#!/usr/bin/env node

/**
 * Context Pilot MCP Server
 * Provides living project context to AI assistants
 */

import { createInterface } from 'readline';
import { CodebaseAnalyzer } from './analyzer.js';
import { MCPRequest, MCPResponse, MCPToolCall, MCPToolResult, CodebaseContext } from './types.js';

class ContextPilotMCP {
  private context: CodebaseContext | null = null;

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.initialize(request);

        case 'tools/list':
          return this.listTools(request);

        case 'tools/call':
          return await this.callTool(request);

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
    }
  }

  private initialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'context-pilot',
          version: '1.0.0',
        },
      },
    };
  }

  private listTools(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: [
          {
            name: 'analyze_project',
            description:
              'Analyze entire codebase to build comprehensive context (architecture, patterns, conventions, dependencies)',
            inputSchema: {
              type: 'object',
              properties: {
                project_path: {
                  type: 'string',
                  description: 'Path to project root directory',
                },
              },
              required: ['project_path'],
            },
          },
          {
            name: 'get_context_summary',
            description:
              'Get high-level project summary (languages, frameworks, file counts)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_architecture',
            description:
              'Get architectural details (type, structure, frameworks, databases)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_dependencies',
            description:
              'Get dependency graph (internal module dependencies and external packages)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_conventions',
            description:
              'Get coding conventions (naming, file organization, code style)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_patterns',
            description:
              'Get detected code patterns (architectural patterns, design patterns, testing patterns)',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'search_context',
            description:
              'Search across project context for specific information',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (framework name, pattern, file type, etc.)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_relevant_context',
            description:
              'Get context most relevant for a specific task (refactoring, bug fix, new feature, testing)',
            inputSchema: {
              type: 'object',
              properties: {
                task_type: {
                  type: 'string',
                  enum: ['refactoring', 'bug_fix', 'new_feature', 'testing', 'general'],
                  description: 'Type of development task',
                },
                focus_area: {
                  type: 'string',
                  description: 'Specific area/module to focus on (optional)',
                },
              },
              required: ['task_type'],
            },
          },
        ],
      },
    };
  }

  private async callTool(request: MCPRequest): Promise<MCPResponse> {
    const { name, arguments: args } = request.params as MCPToolCall;

    let result: MCPToolResult;

    switch (name) {
      case 'analyze_project':
        result = await this.analyzeProject(args.project_path);
        break;

      case 'get_context_summary':
        result = this.getContextSummary();
        break;

      case 'get_architecture':
        result = this.getArchitecture();
        break;

      case 'get_dependencies':
        result = this.getDependencies();
        break;

      case 'get_conventions':
        result = this.getConventions();
        break;

      case 'get_patterns':
        result = this.getPatterns();
        break;

      case 'search_context':
        result = this.searchContext(args.query);
        break;

      case 'get_relevant_context':
        result = this.getRelevantContext(args.task_type, args.focus_area);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result,
    };
  }

  private async analyzeProject(projectPath: string): Promise<MCPToolResult> {
    const analyzer = new CodebaseAnalyzer(projectPath);
    this.context = await analyzer.analyze();

    const summary = `# 📊 Project Analysis Complete

**Project:** ${this.context.projectName}
**Analyzed:** ${this.context.timestamp}

## Summary
- **Files:** ${this.context.summary.totalFiles.toLocaleString()}
- **Lines of Code:** ${this.context.summary.totalLines.toLocaleString()}
- **Languages:** ${Object.keys(this.context.summary.languages).join(', ')}
- **Frameworks:** ${this.context.summary.frameworks.join(', ') || 'None detected'}

## Architecture
- **Type:** ${this.context.architecture.type}
- **Structure:** ${this.context.architecture.structure}
- **Frontend:** ${this.context.architecture.frontendFramework || 'N/A'}
- **Backend:** ${this.context.architecture.backendFramework || 'N/A'}
- **Databases:** ${this.context.architecture.database?.join(', ') || 'None detected'}

## Dependencies
- **External Packages:** ${Object.keys(this.context.dependencies.external).length}
- **Internal Modules:** ${this.context.dependencies.internal.length} relationships

## Conventions
- **Code Style:** ${this.context.conventions.codeStyle.indentation} (${this.context.conventions.codeStyle.quotes} quotes, ${this.context.conventions.codeStyle.semicolons ? 'semicolons' : 'no semicolons'})
- **File Organization:** ${this.context.conventions.fileOrganization}
- **Naming Conventions:** ${this.context.conventions.namingConventions.length} patterns detected

✅ Context built successfully. Use other tools to explore specific areas.`;

    return {
      content: [{ type: 'text', text: summary }],
    };
  }

  private getContextSummary(): MCPToolResult {
    if (!this.context) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No project analyzed yet. Use `analyze_project` first.',
          },
        ],
      };
    }

    const langs = Object.entries(this.context.summary.languages)
      .sort(([, a], [, b]) => b - a)
      .map(([lang, lines]) => `- **${lang}**: ${lines.toLocaleString()} lines`)
      .join('\n');

    const text = `# 📊 Project Summary

**${this.context.projectName}**

## Files & Code
- **Total Files:** ${this.context.summary.totalFiles.toLocaleString()}
- **Total Lines:** ${this.context.summary.totalLines.toLocaleString()}

## Languages
${langs}

## Tech Stack
**Frameworks:** ${this.context.summary.frameworks.join(', ') || 'None'}
**Package Managers:** ${this.context.summary.packageManagers.join(', ') || 'None'}
**Test Frameworks:** ${this.context.summary.testFrameworks.join(', ') || 'None'}`;

    return {
      content: [{ type: 'text', text }],
    };
  }

  private getArchitecture(): MCPToolResult {
    if (!this.context) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No project analyzed yet. Use `analyze_project` first.',
          },
        ],
      };
    }

    const arch = this.context.architecture;
    const text = `# 🏗️ Project Architecture

## Type & Structure
- **Architecture Type:** ${arch.type}
- **Code Structure:** ${arch.structure}

## Technology Stack
- **Frontend Framework:** ${arch.frontendFramework || 'Not detected'}
- **Backend Framework:** ${arch.backendFramework || 'Not detected'}
- **Databases:** ${arch.database?.join(', ') || 'None detected'}
- **Deployment:** ${arch.deployment || 'Not specified'}

## Architectural Insights
${this.getArchitectureInsights(arch)}`;

    return {
      content: [{ type: 'text', text }],
    };
  }

  private getArchitectureInsights(arch: CodebaseContext['architecture']): string {
    const insights: string[] = [];

    if (arch.type === 'monorepo') {
      insights.push('- This is a **monorepo** - multiple packages in one repository');
      insights.push('- Consider consistent versioning and interdependency management');
    }

    if (arch.structure === 'feature-based') {
      insights.push('- **Feature-based** structure - code organized by feature/domain');
      insights.push('- New features should follow the existing feature module pattern');
    }

    if (arch.frontendFramework === 'Next.js') {
      insights.push('- Using **Next.js** - leverage Server Components by default');
      insights.push('- API routes in /app/api or /pages/api depending on router');
    }

    return insights.length > 0 ? insights.join('\n') : '- No specific insights';
  }

  private getDependencies(): MCPToolResult {
    if (!this.context) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No project analyzed yet. Use `analyze_project` first.',
          },
        ],
      };
    }

    const deps = this.context.dependencies;
    const external = Object.entries(deps.external)
      .slice(0, 20)
      .map(([pkg, ver]) => `- ${pkg}@${ver}`)
      .join('\n');

    const internal = deps.internal
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(d => `- ${d.from} → ${d.to} (${d.count}x)`)
      .join('\n');

    const text = `# 📦 Dependencies

## External Packages (${Object.keys(deps.external).length} total)
${external || 'None'}
${Object.keys(deps.external).length > 20 ? `\n...and ${Object.keys(deps.external).length - 20} more` : ''}

## Internal Dependencies (Top 10 by frequency)
${internal || 'None'}

${deps.unusedDeps.length > 0 ? `## ⚠️ Potentially Unused\n${deps.unusedDeps.map(d => `- ${d}`).join('\n')}` : ''}`;

    return {
      content: [{ type: 'text', text }],
    };
  }

  private getConventions(): MCPToolResult {
    if (!this.context) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No project analyzed yet. Use `analyze_project` first.',
          },
        ],
      };
    }

    const conv = this.context.conventions;
    const naming = conv.namingConventions
      .map(n => `- **${n.type}**: ${n.pattern} (e.g., ${n.examples.slice(0, 2).join(', ')})`)
      .join('\n');

    const text = `# 📐 Code Conventions

## Naming Conventions
${naming || 'Not enough data'}

## File Organization
${conv.fileOrganization}

## Code Style
- **Indentation:** ${conv.codeStyle.indentation} (${conv.codeStyle.indentSize} spaces)
- **Quotes:** ${conv.codeStyle.quotes}
- **Semicolons:** ${conv.codeStyle.semicolons ? 'Yes' : 'No'}
- **Trailing Commas:** ${conv.codeStyle.trailingComma ? 'Yes' : 'No'}

💡 **Follow these conventions** when adding new code to maintain consistency.`;

    return {
      content: [{ type: 'text', text }],
    };
  }

  private getPatterns(): MCPToolResult {
    if (!this.context) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No project analyzed yet. Use `analyze_project` first.',
          },
        ],
      };
    }

    if (this.context.patterns.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '# 🎯 Code Patterns\n\nNo specific patterns detected yet. This feature learns from your codebase over time.',
          },
        ],
      };
    }

    const patterns = this.context.patterns
      .map(
        p => `## ${p.name} (${p.category})
**Description:** ${p.description}
**Frequency:** ${p.frequency} occurrences
**Examples:** ${p.examples.join(', ')}`
      )
      .join('\n\n');

    const text = `# 🎯 Detected Code Patterns\n\n${patterns}`;

    return {
      content: [{ type: 'text', text }],
    };
  }

  private searchContext(query: string): MCPToolResult {
    if (!this.context) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No project analyzed yet. Use `analyze_project` first.',
          },
        ],
      };
    }

    const results: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Search frameworks
    if (this.context.summary.frameworks.some(f => f.toLowerCase().includes(lowerQuery))) {
      results.push(
        `**Framework:** ${this.context.summary.frameworks.filter(f => f.toLowerCase().includes(lowerQuery)).join(', ')}`
      );
    }

    // Search languages
    const matchingLangs = Object.keys(this.context.summary.languages).filter(l =>
      l.toLowerCase().includes(lowerQuery)
    );
    if (matchingLangs.length > 0) {
      results.push(`**Languages:** ${matchingLangs.join(', ')}`);
    }

    // Search dependencies
    const matchingDeps = Object.keys(this.context.dependencies.external).filter(d =>
      d.toLowerCase().includes(lowerQuery)
    );
    if (matchingDeps.length > 0) {
      results.push(`**Dependencies:** ${matchingDeps.slice(0, 10).join(', ')}`);
    }

    const text =
      results.length > 0
        ? `# 🔍 Search Results for "${query}"\n\n${results.join('\n\n')}`
        : `# 🔍 Search Results for "${query}"\n\nNo matches found.`;

    return {
      content: [{ type: 'text', text }],
    };
  }

  private getRelevantContext(taskType: string, _focusArea?: string): MCPToolResult {
    if (!this.context) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ No project analyzed yet. Use `analyze_project` first.',
          },
        ],
      };
    }

    const sections: string[] = [];

    sections.push(`# 🎯 Relevant Context for ${taskType.replace('_', ' ').toUpperCase()}\n`);

    // Always include architecture and conventions
    sections.push(`## Architecture
- **Type:** ${this.context.architecture.type}
- **Structure:** ${this.context.architecture.structure}
- **Frameworks:** ${[this.context.architecture.frontendFramework, this.context.architecture.backendFramework].filter(Boolean).join(', ')}`);

    sections.push(`\n## Code Conventions
- **Style:** ${this.context.conventions.codeStyle.indentation}, ${this.context.conventions.codeStyle.quotes} quotes
- **Organization:** ${this.context.conventions.fileOrganization}`);

    // Task-specific context
    if (taskType === 'testing') {
      sections.push(`\n## Test Infrastructure
- **Frameworks:** ${this.context.summary.testFrameworks.join(', ') || 'None detected - may need to set up testing'}
- **Pattern:** Follow existing test patterns in the codebase`);
    }

    if (taskType === 'new_feature') {
      sections.push(`\n## Development Guidelines
- Follow ${this.context.architecture.structure} architecture
- Place feature code according to ${this.context.conventions.fileOrganization}
- Match naming conventions: ${this.context.conventions.namingConventions.map(n => n.pattern).join(', ')}`);
    }

    return {
      content: [{ type: 'text', text: sections.join('\n') }],
    };
  }
}

// Start MCP server
const server = new ContextPilotMCP();
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', async (line) => {
  try {
    const request: MCPRequest = JSON.parse(line);

    // Handle notifications (no response needed)
    if (request.id === undefined) {
      return;
    }

    const response = await server.handleRequest(request);
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error('Error processing request:', error);
  }
});
