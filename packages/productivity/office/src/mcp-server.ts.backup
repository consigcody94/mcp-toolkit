#!/usr/bin/env node
/**
 * Office Whisperer - MCP Server
 * Control Microsoft Office Suite through natural language with Claude Desktop
 */

import { ExcelGenerator } from './generators/excel-generator.js';
import { WordGenerator } from './generators/word-generator.js';
import { PowerPointGenerator } from './generators/powerpoint-generator.js';
import type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  CreateExcelArgs,
  CreateWordArgs,
  CreatePowerPointArgs,
} from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

class OfficeWhispererServer {
  private excelGen = new ExcelGenerator();
  private wordGen = new WordGenerator();
  private pptGen = new PowerPointGenerator();

  private tools: MCPTool[] = [
    {
      name: 'create_excel',
      description: 'Create an Excel workbook with sheets, data, formulas, and charts',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Output filename (e.g., "report.xlsx")' },
          sheets: {
            type: 'array',
            description: 'Array of sheet configurations',
            items: { type: 'object' },
          },
          outputPath: { type: 'string', description: 'Optional output directory path' },
        },
        required: ['filename', 'sheets'],
      },
    },
    {
      name: 'create_word',
      description: 'Create a Word document with paragraphs, tables, images, and formatting',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Output filename (e.g., "document.docx")' },
          title: { type: 'string', description: 'Document title' },
          sections: {
            type: 'array',
            description: 'Document sections with content',
            items: { type: 'object' },
          },
          outputPath: { type: 'string', description: 'Optional output directory path' },
        },
        required: ['filename', 'sections'],
      },
    },
    {
      name: 'create_powerpoint',
      description: 'Create a PowerPoint presentation with slides, text, images, and charts',
      inputSchema: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Output filename (e.g., "presentation.pptx")' },
          title: { type: 'string', description: 'Presentation title' },
          theme: {
            type: 'string',
            enum: ['default', 'light', 'dark', 'colorful'],
            description: 'Presentation theme',
          },
          slides: {
            type: 'array',
            description: 'Array of slide configurations',
            items: { type: 'object' },
          },
          outputPath: { type: 'string', description: 'Optional output directory path' },
        },
        required: ['filename', 'slides'],
      },
    },
    {
      name: 'excel_to_csv',
      description: 'Convert an Excel workbook to CSV format',
      inputSchema: {
        type: 'object',
        properties: {
          excelPath: { type: 'string', description: 'Path to Excel file' },
          sheetName: { type: 'string', description: 'Optional sheet name (default: first sheet)' },
          outputPath: { type: 'string', description: 'Optional output CSV path' },
        },
        required: ['excelPath'],
      },
    },
  ];

  async start(): Promise<void> {
    process.stdin.setEncoding('utf-8');
    let buffer = '';

    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request: MCPRequest = JSON.parse(line);
            const response = await this.handleRequest(request);
            if (response) {
              console.log(JSON.stringify(response));
            }
          } catch (error) {
            console.error('Error processing request:', error);
          }
        }
      }
    });

    process.stdin.on('end', () => {
      process.exit(0);
    });
  }

  private async handleRequest(request: MCPRequest): Promise<MCPResponse | null> {
    const { id, method, params } = request;

    // Handle notifications (no response needed)
    if (id === undefined) {
      if (method === 'notifications/initialized') {
        return null;
      }
      return null;
    }

    try {
      switch (method) {
        case 'initialize':
          return this.initialize(id);

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: { tools: this.tools },
          };

        case 'tools/call':
          return await this.callTool(id, params);

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
    }
  }

  private initialize(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'office-whisperer',
          version: '1.0.0',
        },
      },
    };
  }

  private async callTool(id: string | number, params: any): Promise<MCPResponse> {
    const { name, arguments: args } = params;

    let result: any;

    switch (name) {
      case 'create_excel':
        result = await this.handleCreateExcel(args);
        break;

      case 'create_word':
        result = await this.handleCreateWord(args);
        break;

      case 'create_powerpoint':
        result = await this.handleCreatePowerPoint(args);
        break;

      case 'excel_to_csv':
        result = await this.handleExcelToCSV(args);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      },
    };
  }

  private async handleCreateExcel(args: CreateExcelArgs): Promise<string> {
    const buffer = await this.excelGen.createWorkbook({
      filename: args.filename,
      sheets: args.sheets,
    });

    const outputPath = args.outputPath || process.cwd();
    const fullPath = path.join(outputPath, args.filename);
    await fs.writeFile(fullPath, buffer);

    return `✅ **Excel workbook created successfully!**\n\n📊 **File:** ${fullPath}\n📝 **Sheets:** ${args.sheets.length}\n💾 **Size:** ${(buffer.length / 1024).toFixed(2)} KB\n\nYour Excel file has been created with:\n${args.sheets.map((s, i) => `  ${i + 1}. ${s.name} (${s.data?.length || 0} rows)`).join('\n')}`;
  }

  private async handleCreateWord(args: CreateWordArgs): Promise<string> {
    const buffer = await this.wordGen.createDocument({
      filename: args.filename,
      sections: args.sections,
    });

    const outputPath = args.outputPath || process.cwd();
    const fullPath = path.join(outputPath, args.filename);
    await fs.writeFile(fullPath, buffer);

    return `✅ **Word document created successfully!**\n\n📄 **File:** ${fullPath}\n📑 **Sections:** ${args.sections.length}\n💾 **Size:** ${(buffer.length / 1024).toFixed(2)} KB\n\n${args.title ? `**Title:** ${args.title}\n` : ''}Your professional Word document is ready!`;
  }

  private async handleCreatePowerPoint(args: CreatePowerPointArgs): Promise<string> {
    const buffer = await this.pptGen.createPresentation({
      filename: args.filename,
      title: args.title,
      theme: args.theme,
      slides: args.slides,
    });

    const outputPath = args.outputPath || process.cwd();
    const fullPath = path.join(outputPath, args.filename);
    await fs.writeFile(fullPath, buffer);

    return `✅ **PowerPoint presentation created successfully!**\n\n🎬 **File:** ${fullPath}\n🎨 **Theme:** ${args.theme || 'default'}\n📊 **Slides:** ${args.slides.length}\n💾 **Size:** ${(buffer.length / 1024).toFixed(2)} KB\n\n${args.title ? `**Title:** ${args.title}\n` : ''}Your presentation is ready to wow your audience!`;
  }

  private async handleExcelToCSV(args: any): Promise<string> {
    const csv = await this.excelGen.convertToCSV(args.excelPath, args.sheetName);

    const outputPath = args.outputPath || args.excelPath.replace(/\.xlsx?$/i, '.csv');
    await fs.writeFile(outputPath, csv, 'utf-8');

    return `✅ **Excel converted to CSV successfully!**\n\n📊 **Source:** ${args.excelPath}\n📝 **Output:** ${outputPath}\n💾 **Size:** ${(csv.length / 1024).toFixed(2)} KB`;
  }
}

// Start the server
const server = new OfficeWhispererServer();
server.start().catch(console.error);
