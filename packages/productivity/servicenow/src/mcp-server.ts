#!/usr/bin/env node

/**
 * ServiceNow Dashboard Generator MCP Server
 * Enables natural language dashboard creation through Claude Desktop
 */

import type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  DashboardConfig,
  WidgetConfig,
} from './types.js';
import { QuestionEngine } from './questions/question-engine.js';
import { WidgetGenerator } from './generators/widget-generator.js';
import { TableGenerator } from './generators/table-generator.js';

/**
 * MCP Server for ServiceNow Dashboard Generation
 */
class ServiceNowMCPServer {
  private questionEngine: QuestionEngine;
  private widgetGenerator: WidgetGenerator;
  private tableGenerator: TableGenerator;

  constructor() {
    this.questionEngine = new QuestionEngine();
    this.widgetGenerator = new WidgetGenerator();
    this.tableGenerator = new TableGenerator();
  }

  /**
   * Handle MCP requests
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'tools/list':
          return this.listTools();
        case 'tools/call':
          return await this.callTool(request);
        default:
          return this.errorResponse(`Unknown method: ${request.method}`);
      }
    } catch (error) {
      return this.errorResponse(`Error: ${(error as Error).message}`);
    }
  }

  /**
   * List available MCP tools
   */
  private listTools(): MCPResponse {
    const tools: MCPTool[] = [
      {
        name: 'create_dashboard',
        description: 'Create a complete ServiceNow dashboard with guided questions and code generation',
        inputSchema: {
          type: 'object',
          properties: {
            answers: {
              type: 'object',
              description: 'Pre-filled answers to dashboard questions (optional)',
            },
          },
          required: [],
        },
      },
      {
        name: 'generate_widget',
        description: 'Generate a single ServiceNow widget with specific configuration',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Widget type: list, table, chart, gauge, stat, timeline',
            },
            title: {
              type: 'string',
              description: 'Widget title',
            },
            table: {
              type: 'string',
              description: 'ServiceNow table name (e.g., incident, problem)',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to display',
            },
            filter: {
              type: 'string',
              description: 'Encoded query filter (optional)',
            },
          },
          required: ['type', 'title', 'table', 'fields'],
        },
      },
      {
        name: 'generate_table',
        description: 'Generate an amazing table widget with advanced features',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Table title',
            },
            table: {
              type: 'string',
              description: 'ServiceNow table name',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to display in table',
            },
            filter: {
              type: 'string',
              description: 'Encoded query filter (optional)',
            },
            sortable: {
              type: 'boolean',
              description: 'Enable column sorting',
            },
            filterable: {
              type: 'boolean',
              description: 'Enable column filtering',
            },
            style: {
              type: 'string',
              description: 'Table style: list, grid, card, compact',
            },
          },
          required: ['title', 'table', 'fields'],
        },
      },
      {
        name: 'get_questions',
        description: 'Get all dashboard configuration questions organized by category',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Filter by category: basic, layout, widget, theme, advanced (optional)',
            },
          },
          required: [],
        },
      },
      {
        name: 'answer_questions',
        description: 'Provide answers to dashboard configuration questions',
        inputSchema: {
          type: 'object',
          properties: {
            answers: {
              type: 'object',
              description: 'Question ID to answer value mapping',
            },
          },
          required: ['answers'],
        },
      },
      {
        name: 'build_config',
        description: 'Build dashboard configuration from collected answers',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'generate_code',
        description: 'Generate complete ServiceNow code (XML, JavaScript, CSS) from configuration',
        inputSchema: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
              description: 'Dashboard configuration object',
            },
          },
          required: ['config'],
        },
      },
      {
        name: 'quick_dashboard',
        description: 'Quickly create a dashboard with natural language description',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Natural language description of the dashboard',
            },
            table: {
              type: 'string',
              description: 'Primary ServiceNow table (e.g., incident)',
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to display',
            },
          },
          required: ['description', 'table'],
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
   * Call a specific tool
   */
  private async callTool(request: MCPRequest): Promise<MCPResponse> {
    const toolName = request.params?.name;
    const args = request.params?.arguments || {};

    switch (toolName) {
      case 'create_dashboard':
        return this.createDashboard(args);
      case 'generate_widget':
        return this.generateWidget(args);
      case 'generate_table':
        return this.generateTable(args);
      case 'get_questions':
        return this.getQuestions(args);
      case 'answer_questions':
        return this.answerQuestions(args);
      case 'build_config':
        return this.buildConfig();
      case 'generate_code':
        return this.generateCode(args);
      case 'quick_dashboard':
        return this.quickDashboard(args);
      default:
        return this.errorResponse(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Create complete dashboard with guided flow
   */
  private createDashboard(args: Record<string, unknown>): MCPResponse {
    const prefilledAnswers = (args.answers as Record<string, unknown>) || {};

    // Apply prefilled answers
    Object.entries(prefilledAnswers).forEach(([key, value]) => {
      this.questionEngine.recordAnswer(key, value);
    });

    const flows = this.questionEngine.getAllFlows();
    const questionCount = flows.reduce((sum, flow) => sum + flow.questions.length, 0);

    const markdown = `# 🎨 ServiceNow Dashboard Generator

## Overview

I'll guide you through creating an amazing ServiceNow dashboard! We'll cover:

${flows.map((flow, index) => `${index + 1}. **${flow.category}** (${flow.questions.length} questions)`).join('\n')}

**Total Questions:** ${questionCount}

## Question Flows

${flows.map((flow) => this.formatQuestionFlow(flow)).join('\n\n')}

## Next Steps

1. Use \`answer_questions\` to provide your answers
2. Use \`build_config\` to see your dashboard configuration
3. Use \`generate_code\` to get the ServiceNow code

Or use \`quick_dashboard\` for a fast setup with natural language!
`;

    return {
      content: [{ type: 'text', text: markdown }],
    };
  }

  /**
   * Format question flow for display
   */
  private formatQuestionFlow(flow: { category: string; questions: any[] }): string {
    return `### ${flow.category}

${flow.questions.map((q, index) => {
      const optional = !q.validation?.required ? ' _(optional)_' : '';
      const defaultVal = q.defaultValue !== undefined ? ` [default: \`${q.defaultValue}\`]` : '';

      return `${index + 1}. **${q.id}**${optional}
   - Question: ${q.text}
   - Type: ${q.type}${defaultVal}
   ${q.options ? `   - Options: ${q.options.map((opt: any) => `\n     - \`${opt.value}\`: ${opt.label}${opt.description ? ` - ${opt.description}` : ''}`).join('')}` : ''}`;
    }).join('\n\n')}`;
  }

  /**
   * Generate single widget
   */
  private generateWidget(args: Record<string, unknown>): MCPResponse {
    const { type, title, table, fields, filter } = args;

    const widgetConfig: Partial<WidgetConfig> = {
      id: `widget_${Date.now()}`,
      type: type as any,
      title: title as string,
      position: { row: 0, column: 0 },
      size: { width: 12, height: 400 },
      dataSource: {
        table: table as string,
        fields: fields as string[],
        filter: filter as string | undefined,
        limit: 10,
      },
      config: {
        style: 'list',
        columns: (fields as string[]).map((field) => ({
          field,
          label: field.replace(/_/g, ' ').toUpperCase(),
          sortable: true,
          filterable: true,
          type: 'text',
        })),
        rowsPerPage: 10,
        sortable: true,
        filterable: true,
        showPagination: true,
      } as any,
    };

    const dashboardConfig: DashboardConfig = {
      name: `${table}_widget`,
      title: title as string,
      type: 'custom',
      layout: { columns: 12, rows: 1, responsive: true },
      widgets: [widgetConfig as WidgetConfig],
    };

    const code = this.widgetGenerator.generateWidget(dashboardConfig);

    const markdown = `# ✨ Widget Generated Successfully!

## Widget Details

- **Type:** ${type}
- **Title:** ${title}
- **Table:** ${table}
- **Fields:** ${(fields as string[]).join(', ')}

## Generated Code

### ServiceNow Widget XML

\`\`\`xml
${code.xml}
\`\`\`

### Client Script (JavaScript)

\`\`\`javascript
${code.clientScript}
\`\`\`

### Server Script (GlideAjax)

\`\`\`javascript
${code.serverScript}
\`\`\`

### CSS Styling

\`\`\`css
${code.css}
\`\`\`

## Installation

1. Navigate to **Service Portal > Widgets**
2. Click **New**
3. Copy the XML content above
4. Paste into the widget definition
5. Save and add to your portal page!
`;

    return {
      content: [{ type: 'text', text: markdown }],
    };
  }

  /**
   * Generate amazing table widget
   */
  private generateTable(args: Record<string, unknown>): MCPResponse {
    const {
      title,
      table,
      fields,
      filter,
      sortable = true,
      filterable = true,
      style = 'list',
    } = args;

    // Create enhanced table configuration
    const columns = (fields as string[]).map((field) => ({
      field,
      label: field.replace(/_/g, ' ').toUpperCase(),
      sortable: sortable as boolean,
      filterable: filterable as boolean,
      type: 'text' as const,
    }));

    const widgetConfig: Partial<WidgetConfig> = {
      id: `table_${Date.now()}`,
      type: 'table',
      title: title as string,
      position: { row: 0, column: 0 },
      size: { width: 12, height: 400 },
      dataSource: {
        table: table as string,
        fields: fields as string[],
        filter: filter as string | undefined,
        limit: 25,
      },
      config: this.tableGenerator.generateTableConfig({
        config: {
          columns,
          style: style as any,
          striped: true,
          bordered: true,
          hover: true,
          compact: false,
          sortable: sortable as boolean,
          filterable: filterable as boolean,
          paginated: true,
          rowsPerPage: 25,
          selectable: false,
        },
      } as any),
    };

    const dashboardConfig: DashboardConfig = {
      name: `${table}_table`,
      title: title as string,
      type: 'custom',
      layout: { columns: 12, rows: 1, responsive: true },
      widgets: [widgetConfig as WidgetConfig],
    };

    const code = this.widgetGenerator.generateWidget(dashboardConfig);
    const tableCSS = this.tableGenerator.generateTableCSS(
      style as any,
      widgetConfig.config as any
    );
    const paginationHTML = this.tableGenerator.generatePaginationHTML(
      widgetConfig.config as any
    );
    const paginationCSS = this.tableGenerator.generatePaginationCSS();

    const markdown = `# 🎯 Amazing Table Generated!

## Table Features

✅ **${sortable ? 'Sortable' : 'Static'}** columns
✅ **${filterable ? 'Filterable' : 'No filtering'}** data
✅ **${style}** style
✅ Advanced pagination
✅ Responsive design
✅ Beautiful hover effects
✅ Export to CSV

## Configuration

- **Title:** ${title}
- **Table:** ${table}
- **Fields:** ${(fields as string[]).join(', ')}
- **Style:** ${style}

## Generated Code

### ServiceNow Widget XML

\`\`\`xml
${code.xml}
\`\`\`

### Client Script with Advanced Features

\`\`\`javascript
${code.clientScript}
\`\`\`

### Server Script with Optimized Queries

\`\`\`javascript
${code.serverScript}
\`\`\`

### Amazing Table CSS

\`\`\`css
${code.css}

${tableCSS}

${paginationCSS}
\`\`\`

### Advanced Pagination HTML

\`\`\`html
${paginationHTML}
\`\`\`

## Why This Table is Amazing

1. **Smart Column Detection** - Automatically detects field types and applies appropriate formatting
2. **Color-Coded Values** - Priority, state, and status fields get beautiful badges
3. **Smooth Animations** - Hover effects with subtle elevation
4. **Sticky Headers** - Headers stay visible while scrolling
5. **Advanced Pagination** - Jump to page, adjustable page size, full navigation
6. **Export Ready** - Built-in CSV export functionality
7. **Responsive** - Looks great on all devices
8. **Accessible** - Keyboard navigation and screen reader friendly

## Installation

1. Go to **Service Portal > Widgets**
2. Create a new widget
3. Copy the XML above
4. Paste and save
5. Add to your portal page and enjoy! 🎉
`;

    return {
      content: [{ type: 'text', text: markdown }],
    };
  }

  /**
   * Get questions for dashboard configuration
   */
  private getQuestions(args: Record<string, unknown>): MCPResponse {
    const category = args.category as string | undefined;
    let flows = this.questionEngine.getAllFlows();

    if (category) {
      flows = flows.filter((flow) =>
        flow.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    const markdown = `# 📋 Dashboard Configuration Questions

${flows.map((flow) => this.formatQuestionFlow(flow)).join('\n\n')}

## How to Answer

Use the \`answer_questions\` tool with a JSON object:

\`\`\`json
{
  "answers": {
    "dashboard_name": "my_dashboard",
    "dashboard_title": "My Dashboard",
    "widget_count": 3
  }
}
\`\`\`
`;

    return {
      content: [{ type: 'text', text: markdown }],
    };
  }

  /**
   * Record answers to questions
   */
  private answerQuestions(args: Record<string, unknown>): MCPResponse {
    const answers = args.answers as Record<string, unknown>;

    Object.entries(answers).forEach(([questionId, value]) => {
      this.questionEngine.recordAnswer(questionId, value);
    });

    const allAnswers = Array.from(this.questionEngine.getAnswers().entries());

    const markdown = `# ✅ Answers Recorded

## Your Answers

${allAnswers.map(([key, value]) => `- **${key}:** \`${JSON.stringify(value)}\``).join('\n')}

**Total answers:** ${allAnswers.length}

## Next Steps

1. Add more answers with \`answer_questions\` if needed
2. Use \`build_config\` to generate your dashboard configuration
3. Use \`generate_code\` to get the ServiceNow code
`;

    return {
      content: [{ type: 'text', text: markdown }],
    };
  }

  /**
   * Build dashboard configuration from answers
   */
  private buildConfig(): MCPResponse {
    const config = this.questionEngine.buildDashboardConfig();

    const markdown = `# 🏗️ Dashboard Configuration Built

## Configuration Summary

- **Name:** ${config.name}
- **Title:** ${config.title}
- **Type:** ${config.type}
- **Widgets:** ${config.widgets.length}
- **Layout:** ${config.layout.columns} columns × ${config.layout.rows} rows
- **Responsive:** ${config.layout.responsive ? 'Yes' : 'No'}

## Full Configuration

\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`

## Next Step

Use \`generate_code\` with this configuration to get your ServiceNow code!
`;

    return {
      content: [{ type: 'text', text: markdown }],
    };
  }

  /**
   * Generate code from configuration
   */
  private generateCode(args: Record<string, unknown>): MCPResponse {
    const config = args.config as DashboardConfig;

    if (!config) {
      return this.errorResponse('Configuration is required');
    }

    const code = this.widgetGenerator.generateWidget(config);

    const markdown = `# 🚀 ServiceNow Code Generated!

## Dashboard: ${config.title}

Your dashboard with **${config.widgets.length} widgets** is ready!

## Generated Files

### 1. Widget XML (\`${config.name}_widget.xml\`)

\`\`\`xml
${code.xml}
\`\`\`

### 2. Client Script (\`${config.name}_client.js\`)

\`\`\`javascript
${code.clientScript}
\`\`\`

### 3. Server Script (\`${config.name}_server.js\`)

\`\`\`javascript
${code.serverScript}
\`\`\`

### 4. CSS Stylesheet (\`${config.name}.css\`)

\`\`\`css
${code.css}
\`\`\`

### 5. HTML Template (\`${config.name}.html\`)

\`\`\`html
${code.html || '<!-- HTML template embedded in widget XML -->'}
\`\`\`

## Installation Instructions

### Step 1: Create the Widget

1. Navigate to **Service Portal > Widgets** in ServiceNow
2. Click **New**
3. Copy the Widget XML above
4. Paste into the widget definition
5. Save the widget

### Step 2: Add to Portal Page

1. Go to **Service Portal > Pages**
2. Select your target page (or create new)
3. Add a new container/row
4. Add your widget: **${config.name}_widget**
5. Save and publish

### Step 3: Configure (Optional)

If you need to customize:
- Edit the widget options in the page designer
- Modify the CSS for your brand colors
- Adjust the server script filters

## Features Included

${config.widgets.map((widget, index) => `
### Widget ${index + 1}: ${widget.title}

- **Type:** ${widget.type}
- **Data Source:** ${widget.dataSource.table}
- **Fields:** ${widget.dataSource.fields.join(', ')}
- **Size:** ${widget.size.width} columns
${widget.dataSource.filter ? `- **Filter:** ${widget.dataSource.filter}` : ''}
`).join('\n')}

${config.theme ? `## Theme Applied

- **Primary Color:** ${config.theme.primaryColor}
- **Background:** ${config.theme.backgroundColor}
- **Card Shadow:** ${config.theme.cardShadow ? 'Enabled' : 'Disabled'}
` : ''}

${config.refreshInterval ? `## Auto-Refresh: Every ${config.refreshInterval} seconds` : ''}

---

**🎉 Your dashboard is ready to deploy!**
`;

    return {
      content: [{ type: 'text', text: markdown }],
    };
  }

  /**
   * Quick dashboard creation with natural language
   */
  private quickDashboard(args: Record<string, unknown>): MCPResponse {
    const { description, table, fields } = args;

    // Parse description for insights
    const name = this.generateDashboardName(description as string);
    const title = this.generateDashboardTitle(description as string);

    // Auto-answer questions
    this.questionEngine.recordAnswer('dashboard_name', name);
    this.questionEngine.recordAnswer('dashboard_title', title);
    this.questionEngine.recordAnswer('dashboard_type', 'custom');
    this.questionEngine.recordAnswer('layout_columns', 12);
    this.questionEngine.recordAnswer('layout_responsive', true);
    this.questionEngine.recordAnswer('widget_count', 1);
    this.questionEngine.recordAnswer('widget_0_type', 'table');
    this.questionEngine.recordAnswer('widget_0_title', title);
    this.questionEngine.recordAnswer('widget_0_table', table);
    this.questionEngine.recordAnswer('widget_0_fields', (fields as string[] || []).join(','));
    this.questionEngine.recordAnswer('widget_0_limit', 25);
    this.questionEngine.recordAnswer('widget_0_width', 12);
    this.questionEngine.recordAnswer('widget_0_sortable', true);
    this.questionEngine.recordAnswer('widget_0_filterable', true);

    // Build and generate
    const config = this.questionEngine.buildDashboardConfig();
    const code = this.widgetGenerator.generateWidget(config);

    const markdown = `# ⚡ Quick Dashboard Created!

## From Your Description

> "${description}"

## What I Built

- **Name:** ${name}
- **Title:** ${title}
- **Table:** ${table}
- **Fields:** ${(fields as string[] || []).join(', ')}

## Your Code

### Widget XML

\`\`\`xml
${code.xml}
\`\`\`

### Client Script

\`\`\`javascript
${code.clientScript}
\`\`\`

### Server Script

\`\`\`javascript
${code.serverScript}
\`\`\`

### CSS

\`\`\`css
${code.css}
\`\`\`

---

**⚡ That was fast! Your dashboard is ready in seconds.**
`;

    return {
      content: [{ type: 'text', text: markdown }],
    };
  }

  /**
   * Generate dashboard name from description
   */
  private generateDashboardName(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join('_');
  }

  /**
   * Generate dashboard title from description
   */
  private generateDashboardTitle(description: string): string {
    const words = description.split(/\s+/).slice(0, 5);
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  /**
   * Create error response
   */
  private errorResponse(message: string): MCPResponse {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${message}`,
        },
      ],
      isError: true,
    };
  }

  /**
   * Start the MCP server
   */
  start(): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (chunk) => {
      try {
        const request: MCPRequest = JSON.parse(chunk.toString());
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        const errorResponse = this.errorResponse(`Parse error: ${(error as Error).message}`);
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    });
  }
}

// Start the server
const server = new ServiceNowMCPServer();
server.start();
