#!/usr/bin/env node
import { createInterface } from 'readline';
import { MCPRequest, MCPResponse } from './types.js';
import { TypeGenerator } from './type-generator.js';
import { FrameworkPatterns, Framework } from './framework-patterns.js';

class TSPilotMCP {
  private typeGenerator = new TypeGenerator();
  private frameworkPatterns = new FrameworkPatterns();

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.initialize(request);
        case 'notifications/initialized':
          // Silent handler for MCP initialization notification
          return {} as MCPResponse;
        case 'tools/list':
          return this.listTools(request);
        case 'tools/call':
          return this.callTool(request);
        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32601, message: `Method not found: ${request.method}` },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' },
      };
    }
  }

  private initialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'ts-pilot', version: '1.0.0' },
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
            name: 'generate_types',
            description: 'Generate strict TypeScript types from JSON data or API responses',
            inputSchema: {
              type: 'object',
              properties: {
                data: { type: 'string', description: 'JSON data to generate types from' },
                name: { type: 'string', description: 'Interface/type name (default: Generated)' },
                strict: { type: 'boolean', description: 'Use strict mode (default: true)' },
                readonly: { type: 'boolean', description: 'Make properties readonly (default: false)' },
              },
              required: ['data'],
            },
          },
          {
            name: 'fix_type_errors',
            description: 'Diagnose TypeScript type errors and suggest multiple fixes with explanations',
            inputSchema: {
              type: 'object',
              properties: {
                error: { type: 'string', description: 'TypeScript error message' },
              },
              required: ['error'],
            },
          },
          {
            name: 'refactor_safe',
            description: 'Suggest type-preserving refactoring improvements for TypeScript code',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'TypeScript code to analyze for refactoring' },
              },
              required: ['code'],
            },
          },
          {
            name: 'suggest_generics',
            description: 'Analyze code and suggest generic type parameters with constraints',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'TypeScript code to analyze for generic opportunities' },
              },
              required: ['code'],
            },
          },
          {
            name: 'check_strict',
            description: 'Check code for strict mode compliance and suggest improvements',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'TypeScript code to check for strict mode compliance' },
              },
              required: ['code'],
            },
          },
          {
            name: 'framework_patterns',
            description: 'Get framework-specific TypeScript patterns and best practices',
            inputSchema: {
              type: 'object',
              properties: {
                framework: {
                  type: 'string',
                  enum: ['react', 'nextjs', 'express', 'nodejs', 'vue', 'angular'],
                  description: 'Framework to get patterns for'
                },
              },
              required: ['framework'],
            },
          },
        ],
      },
    };
  }

  private callTool(request: MCPRequest): MCPResponse {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case 'generate_types':
          result = this.handleGenerateTypes(args);
          break;
        case 'fix_type_errors':
          result = this.handleFixTypeErrors(args);
          break;
        case 'refactor_safe':
          result = this.handleRefactorSafe(args);
          break;
        case 'suggest_generics':
          result = this.handleSuggestGenerics(args);
          break;
        case 'check_strict':
          result = this.handleCheckStrict(args);
          break;
        case 'framework_patterns':
          result = this.handleFrameworkPatterns(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { content: [{ type: 'text', text: result }] },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Tool execution failed'
        },
      };
    }
  }

  private handleGenerateTypes(args: any): string {
    const { data, name, strict, readonly } = args;
    const generated = this.typeGenerator.generate(data, { name, strict, readonly });

    return `## 🎯 Generated TypeScript Types\n\n\`\`\`typescript\n${generated}\n\`\`\`\n\n✅ Generated with strict type safety (no \`any\` types)`;
  }

  private handleFixTypeErrors(args: any): string {
    const { error } = args;
    const { fixes, explanation } = this.typeGenerator.analyzeTypeError(error);

    let result = `## 🔧 Type Error Analysis\n\n**Error:**\n\`${error}\`\n\n**Explanation:**\n${explanation}\n\n**Suggested Fixes:**\n`;
    fixes.forEach((fix, i) => {
      result += `\n${i + 1}. ${fix}`;
    });

    return result;
  }

  private handleRefactorSafe(args: any): string {
    const { code } = args;
    const suggestions: string[] = [];

    // Check for common refactoring opportunities
    if (code.includes('any')) {
      suggestions.push('⚠️  Replace `any` types with specific types or `unknown`');
    }
    if (code.includes('as any')) {
      suggestions.push('⚠️  Remove unsafe type assertions (`as any`) and use proper type guards');
    }
    if (/function\s+\w+\([^)]*\)\s*{/.test(code) && !code.includes(': ')) {
      suggestions.push('📝 Add return type annotations to functions for better type safety');
    }
    if (code.includes('?.') && !code.includes('??')) {
      suggestions.push('💡 Consider using nullish coalescing (`??`) with optional chaining for defaults');
    }
    if (code.match(/const \w+ = \{/)) {
      suggestions.push('💡 Consider defining explicit interfaces for object literals used multiple times');
    }
    if (code.includes('Promise') && !code.includes('async')) {
      suggestions.push('💡 Use async/await instead of raw Promises for better readability');
    }

    if (suggestions.length === 0) {
      return '✅ Code looks good! No major refactoring suggestions.';
    }

    return `## 🔄 Type-Safe Refactoring Suggestions\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
  }

  private handleSuggestGenerics(args: any): string {
    const { code } = args;
    const suggestions: string[] = [];

    // Detect potential generic opportunities
    if (code.includes('function') && code.includes('unknown')) {
      suggestions.push(`Replace \`unknown\` with generic type parameter:
\`\`\`typescript
function process<T>(data: T): T {
  return data;
}
\`\`\``);
    }

    if (code.includes('any[]') || code.includes('unknown[]')) {
      suggestions.push(`Use generic array types:
\`\`\`typescript
function filter<T>(items: T[], predicate: (item: T) => boolean): T[] {
  return items.filter(predicate);
}
\`\`\``);
    }

    if (code.match(/interface.*extends/)) {
      suggestions.push(`Consider generic constraints for reusable interfaces:
\`\`\`typescript
interface Repository<T extends { id: number }> {
  findById(id: number): Promise<T>;
  save(entity: T): Promise<T>;
}
\`\`\``);
    }

    if (suggestions.length === 0) {
      return '💡 No obvious generic opportunities found. Consider making reusable functions generic when they work with multiple types.';
    }

    return `## 🎯 Generic Type Suggestions\n\n${suggestions.join('\n\n')}`;
  }

  private handleCheckStrict(args: any): string {
    const { code } = args;
    const issues: string[] = [];

    // Check for strict mode violations
    if (code.includes(': any')) {
      issues.push('❌ Explicit `any` type found - violates strict mode');
    }
    if (code.includes('as any')) {
      issues.push('❌ Unsafe type assertion `as any` - defeats type safety');
    }
    if (!/: \w+/.test(code) && code.includes('=')) {
      issues.push('⚠️  Missing type annotations on variables');
    }
    if (code.includes('function') && !code.includes(': ')) {
      issues.push('⚠️  Missing return type annotations on functions');
    }
    if (code.includes('null') && !code.includes('| null')) {
      issues.push('⚠️  Potential null values not reflected in types');
    }
    if (code.includes('undefined') && !code.includes('| undefined') && !code.includes('?:')) {
      issues.push('⚠️  Potential undefined values not reflected in types');
    }

    if (issues.length === 0) {
      return '✅ Code is strict mode compliant! No issues found.';
    }

    return `## ⚙️  Strict Mode Compliance Check\n\n${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}\n\n**Recommendation:**\nEnable strict mode in tsconfig.json:\n\`\`\`json\n{\n  "compilerOptions": {\n    "strict": true,\n    "noImplicitAny": true,\n    "strictNullChecks": true\n  }\n}\n\`\`\``;
  }

  private handleFrameworkPatterns(args: any): string {
    const { framework } = args as { framework: Framework };
    const patterns = this.frameworkPatterns.getPatterns(framework);

    if (patterns.length === 0) {
      return `No patterns found for framework: ${framework}`;
    }

    let result = `## 📚 ${framework.charAt(0).toUpperCase() + framework.slice(1)} TypeScript Patterns\n\n`;

    patterns.forEach((pattern, i) => {
      result += `### ${i + 1}. ${pattern.pattern}\n\n`;
      result += `${pattern.description}\n\n`;
      result += `\`\`\`typescript\n${pattern.code}\n\`\`\`\n\n`;
    });

    return result;
  }
}

const server = new TSPilotMCP();
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', async (line) => {
  try {
    const request: MCPRequest = JSON.parse(line);
    // Handle notifications (no id field) silently
    if (request.id === undefined) {
      const response = await server.handleRequest(request);
      // Don't send response for notifications
      return;
    }
    const response = await server.handleRequest(request);
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error('Error processing request:', error);
  }
});
