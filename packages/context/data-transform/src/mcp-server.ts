#!/usr/bin/env node
/**
 * Data Transform MCP Server
 * Universal data transformation via Model Context Protocol
 */

import { DataConverter } from './converter.js';
import type { MCPRequest, MCPResponse, MCPTool, DataFormat, FormatOptions } from './types.js';

export class DataTransformMCPServer {
  private converter: DataConverter;

  constructor() {
    this.converter = new DataConverter();
  }

  async start(): Promise<void> {
    process.stdin.setEncoding('utf-8');

    let buffer = '';

    process.stdin.on('data', async (chunk: string) => {
      buffer += chunk;

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

  private listTools(): MCPResponse {
    const tools: MCPTool[] = [
      {
        name: 'detect_format',
        description: 'Automatically detect data format from content',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Data content to analyze' },
          },
          required: ['content'],
        },
      },
      {
        name: 'convert_data',
        description: 'Convert data between formats (CSV, JSON, XML, YAML, TSV, SQL)',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Source data content' },
            sourceFormat: {
              type: 'string',
              description: 'Source format: csv, json, xml, yaml, tsv, xlsx',
            },
            targetFormat: {
              type: 'string',
              description: 'Target format: csv, json, xml, yaml, tsv, sql',
            },
            options: { type: 'object', description: 'Format-specific options (optional)' },
          },
          required: ['content', 'sourceFormat', 'targetFormat'],
        },
      },
      {
        name: 'parse_data',
        description: 'Parse data and return structured format with metadata',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Data content to parse' },
            format: { type: 'string', description: 'Data format: csv, json, xml, yaml, tsv' },
            options: { type: 'object', description: 'Parser options (optional)' },
          },
          required: ['content', 'format'],
        },
      },
      {
        name: 'validate_data',
        description: 'Validate data structure and types',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Data to validate' },
            format: { type: 'string', description: 'Data format' },
            schema: { type: 'object', description: 'Validation schema (optional)' },
          },
          required: ['content', 'format'],
        },
      },
      {
        name: 'analyze_data',
        description: 'Analyze data structure, infer schema, and generate statistics',
        inputSchema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'Data to analyze' },
            format: { type: 'string', description: 'Data format' },
          },
          required: ['content', 'format'],
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

  private async callTool(name: string, args: Record<string, unknown>): Promise<MCPResponse> {
    switch (name) {
      case 'detect_format':
        return await this.detectFormat(args.content as string);

      case 'convert_data':
        return await this.convertData(
          args.content as string,
          args.sourceFormat as DataFormat,
          args.targetFormat as DataFormat,
          args.options as FormatOptions | undefined
        );

      case 'parse_data':
        return await this.parseData(
          args.content as string,
          args.format as DataFormat,
          args.options as FormatOptions | undefined
        );

      case 'validate_data':
        return await this.validateData(
          args.content as string,
          args.format as DataFormat,
          args.schema as Record<string, unknown> | undefined
        );

      case 'analyze_data':
        return await this.analyzeData(args.content as string, args.format as DataFormat);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async detectFormat(content: string): Promise<MCPResponse> {
    const format = this.converter.detectFormat(content);

    let markdown = '# Format Detection\n\n';
    markdown += `**Detected Format:** ${format.toUpperCase()}\n\n`;

    markdown += '### Format Details\n\n';
    if (format === 'csv' || format === 'tsv') {
      const delimiter = format === 'tsv' ? 'tab' : 'comma';
      markdown += `- Delimiter: ${delimiter}\n`;
      markdown += `- Rows detected: ${content.split('\n').length}\n`;
    } else if (format === 'json') {
      markdown += `- Valid JSON structure\n`;
      markdown += `- Parsed successfully\n`;
    } else if (format === 'xml') {
      markdown += `- XML tags detected\n`;
    } else if (format === 'yaml') {
      markdown += `- YAML structure detected\n`;
    }

    return { content: [{ type: 'text', text: markdown }] };
  }

  private async convertData(
    content: string,
    sourceFormat: DataFormat,
    targetFormat: DataFormat,
    options?: FormatOptions
  ): Promise<MCPResponse> {
    try {
      const result = this.converter.transform(content, sourceFormat, targetFormat, options || {});

      let markdown = `# Data Conversion\n\n`;
      markdown += `**Source:** ${sourceFormat.toUpperCase()}\n`;
      markdown += `**Target:** ${targetFormat.toUpperCase()}\n\n`;

      markdown += `### Result\n\n`;
      markdown += '```\n';
      markdown += result.substring(0, 2000); // Limit output
      if (result.length > 2000) {
        markdown += `\n...(${result.length - 2000} more characters)`;
      }
      markdown += '\n```\n\n';

      markdown += `**Size:** ${result.length} characters\n`;

      return { content: [{ type: 'text', text: markdown }] };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Conversion failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async parseData(
    content: string,
    format: DataFormat,
    options?: FormatOptions
  ): Promise<MCPResponse> {
    try {
      const dataset = this.converter.parse(content, format, options || {});

      let markdown = `# Data Parsing\n\n`;
      markdown += `**Format:** ${format.toUpperCase()}\n\n`;

      markdown += `### Structure\n\n`;
      markdown += `- Rows: ${dataset.metadata.rowCount}\n`;
      markdown += `- Columns: ${dataset.metadata.columnCount}\n\n`;

      markdown += `### Headers\n\n`;
      markdown += dataset.headers.map(h => `- ${h}`).join('\n') + '\n\n';

      markdown += `### Preview (first 5 rows)\n\n`;
      markdown += '| ' + dataset.headers.join(' | ') + ' |\n';
      markdown += '|' + dataset.headers.map(() => '---').join('|') + '|\n';

      const preview = dataset.rows.slice(0, 5);
      for (const row of preview) {
        const values = dataset.headers.map(h => String(row[h] ?? ''));
        markdown += '| ' + values.join(' | ') + ' |\n';
      }

      return { content: [{ type: 'text', text: markdown }] };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Parsing failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async validateData(
    content: string,
    format: DataFormat,
    _schema?: Record<string, unknown>
  ): Promise<MCPResponse> {
    try {
      const dataset = this.converter.parse(content, format, {});

      let markdown = `# Data Validation\n\n`;

      // Basic validation
      const issues: string[] = [];

      // Check for empty rows
      const emptyRows = dataset.rows.filter(
        row => Object.values(row).every(v => v === null || v === undefined || v === '')
      );
      if (emptyRows.length > 0) {
        issues.push(`Found ${emptyRows.length} empty row(s)`);
      }

      // Check for inconsistent columns
      const columnCounts = dataset.rows.map(row => Object.keys(row).length);
      const uniqueCounts = new Set(columnCounts);
      if (uniqueCounts.size > 1) {
        issues.push(
          `Inconsistent column counts: ${Array.from(uniqueCounts).join(', ')}`
        );
      }

      if (issues.length === 0) {
        markdown += `✅ **Valid** - No issues found\n\n`;
      } else {
        markdown += `⚠️ **Issues Found**\n\n`;
        issues.forEach(issue => {
          markdown += `- ${issue}\n`;
        });
        markdown += '\n';
      }

      markdown += `### Summary\n\n`;
      markdown += `- Total rows: ${dataset.metadata.rowCount}\n`;
      markdown += `- Columns: ${dataset.metadata.columnCount}\n`;
      markdown += `- Valid rows: ${dataset.metadata.rowCount - emptyRows.length}\n`;

      return { content: [{ type: 'text', text: markdown }] };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async analyzeData(content: string, format: DataFormat): Promise<MCPResponse> {
    try {
      const dataset = this.converter.parse(content, format, {});

      let markdown = `# Data Analysis\n\n`;

      markdown += `### Overview\n\n`;
      markdown += `- **Rows:** ${dataset.metadata.rowCount}\n`;
      markdown += `- **Columns:** ${dataset.metadata.columnCount}\n\n`;

      markdown += `### Column Analysis\n\n`;

      for (const header of dataset.headers) {
        const values = dataset.rows.map(row => row[header]);
        const nonNull = values.filter(v => v !== null && v !== undefined);

        markdown += `**${header}**\n`;
        markdown += `- Total: ${values.length}\n`;
        markdown += `- Non-null: ${nonNull.length}\n`;
        markdown += `- Null: ${values.length - nonNull.length}\n`;

        // Detect type
        const types = new Set(nonNull.map(v => typeof v));
        markdown += `- Types: ${Array.from(types).join(', ')}\n`;

        // Unique values
        const unique = new Set(nonNull);
        markdown += `- Unique: ${unique.size}\n`;

        if (types.has('number')) {
          const numbers = nonNull.filter(v => typeof v === 'number') as number[];
          if (numbers.length > 0) {
            markdown += `- Min: ${Math.min(...numbers)}\n`;
            markdown += `- Max: ${Math.max(...numbers)}\n`;
            markdown += `- Avg: ${(numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(2)}\n`;
          }
        }

        markdown += '\n';
      }

      return { content: [{ type: 'text', text: markdown }] };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

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
  const server = new DataTransformMCPServer();
  server.start().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
