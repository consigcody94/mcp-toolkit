#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { google, sheets_v4 } from "googleapis";
import { OAuth2Client } from "google-auth-library";

interface CreateSheetArgs {
  title: string;
  credentials: string;
}

interface GetDataArgs {
  spreadsheetId: string;
  range: string;
  credentials: string;
}

interface UpdateCellsArgs {
  spreadsheetId: string;
  range: string;
  values: string[][];
  credentials: string;
}

interface AddFormulaArgs {
  spreadsheetId: string;
  range: string;
  formula: string;
  credentials: string;
}

interface CreateChartArgs {
  spreadsheetId: string;
  sheetId: number;
  chartType: string;
  sourceRange: string;
  credentials: string;
}

interface ExportCsvArgs {
  spreadsheetId: string;
  sheetId: number;
  credentials: string;
}

class SheetsWizardServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "sheets-wizard",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private getAuthClient(credentials: string): OAuth2Client {
    const creds = JSON.parse(credentials);
    const auth = new google.auth.OAuth2(
      creds.client_id,
      creds.client_secret,
      creds.redirect_uri
    );

    if (creds.access_token) {
      auth.setCredentials({
        access_token: creds.access_token,
        refresh_token: creds.refresh_token,
      });
    }

    return auth;
  }

  private getSheetsClient(credentials: string): sheets_v4.Sheets {
    const auth = this.getAuthClient(credentials);
    return google.sheets({ version: "v4", auth });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "create_sheet",
          description: "Create a new Google Spreadsheet",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Title of the new spreadsheet",
              },
              credentials: {
                type: "string",
                description: "JSON string containing OAuth2 credentials",
              },
            },
            required: ["title", "credentials"],
          },
        },
        {
          name: "get_data",
          description: "Get data from a spreadsheet range",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: {
                type: "string",
                description: "ID of the spreadsheet",
              },
              range: {
                type: "string",
                description: "A1 notation range (e.g., 'Sheet1!A1:D10')",
              },
              credentials: {
                type: "string",
                description: "JSON string containing OAuth2 credentials",
              },
            },
            required: ["spreadsheetId", "range", "credentials"],
          },
        },
        {
          name: "update_cells",
          description: "Update cells in a spreadsheet range",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: {
                type: "string",
                description: "ID of the spreadsheet",
              },
              range: {
                type: "string",
                description: "A1 notation range (e.g., 'Sheet1!A1:D10')",
              },
              values: {
                type: "array",
                description: "2D array of values to update",
                items: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              credentials: {
                type: "string",
                description: "JSON string containing OAuth2 credentials",
              },
            },
            required: ["spreadsheetId", "range", "values", "credentials"],
          },
        },
        {
          name: "add_formula",
          description: "Add a formula to a specific cell or range",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: {
                type: "string",
                description: "ID of the spreadsheet",
              },
              range: {
                type: "string",
                description: "A1 notation range (e.g., 'Sheet1!A1')",
              },
              formula: {
                type: "string",
                description: "Formula to add (e.g., '=SUM(A1:A10)')",
              },
              credentials: {
                type: "string",
                description: "JSON string containing OAuth2 credentials",
              },
            },
            required: ["spreadsheetId", "range", "formula", "credentials"],
          },
        },
        {
          name: "create_chart",
          description: "Create a chart in the spreadsheet",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: {
                type: "string",
                description: "ID of the spreadsheet",
              },
              sheetId: {
                type: "number",
                description: "ID of the sheet to add the chart to",
              },
              chartType: {
                type: "string",
                description: "Type of chart (COLUMN, LINE, PIE, BAR, etc.)",
              },
              sourceRange: {
                type: "string",
                description: "A1 notation range for chart data",
              },
              credentials: {
                type: "string",
                description: "JSON string containing OAuth2 credentials",
              },
            },
            required: ["spreadsheetId", "sheetId", "chartType", "sourceRange", "credentials"],
          },
        },
        {
          name: "export_csv",
          description: "Export a sheet as CSV format",
          inputSchema: {
            type: "object",
            properties: {
              spreadsheetId: {
                type: "string",
                description: "ID of the spreadsheet",
              },
              sheetId: {
                type: "number",
                description: "ID of the sheet to export",
              },
              credentials: {
                type: "string",
                description: "JSON string containing OAuth2 credentials",
              },
            },
            required: ["spreadsheetId", "sheetId", "credentials"],
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments as Record<string, unknown>;
        switch (request.params.name) {
          case "create_sheet":
            return await this.handleCreateSheet(args as unknown as CreateSheetArgs);
          case "get_data":
            return await this.handleGetData(args as unknown as GetDataArgs);
          case "update_cells":
            return await this.handleUpdateCells(args as unknown as UpdateCellsArgs);
          case "add_formula":
            return await this.handleAddFormula(args as unknown as AddFormulaArgs);
          case "create_chart":
            return await this.handleCreateChart(args as unknown as CreateChartArgs);
          case "export_csv":
            return await this.handleExportCsv(args as unknown as ExportCsvArgs);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  private async handleCreateSheet(args: CreateSheetArgs) {
    const sheets = this.getSheetsClient(args.credentials);

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: args.title,
        },
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            spreadsheetId: response.data.spreadsheetId,
            spreadsheetUrl: response.data.spreadsheetUrl,
            title: args.title,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetData(args: GetDataArgs) {
    const sheets = this.getSheetsClient(args.credentials);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            range: response.data.range,
            values: response.data.values || [],
            rowCount: response.data.values?.length || 0,
          }, null, 2),
        },
      ],
    };
  }

  private async handleUpdateCells(args: UpdateCellsArgs) {
    const sheets = this.getSheetsClient(args.credentials);

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: args.values,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            updatedRange: response.data.updatedRange,
            updatedRows: response.data.updatedRows,
            updatedColumns: response.data.updatedColumns,
            updatedCells: response.data.updatedCells,
          }, null, 2),
        },
      ],
    };
  }

  private async handleAddFormula(args: AddFormulaArgs) {
    const sheets = this.getSheetsClient(args.credentials);

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[args.formula]],
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            formula: args.formula,
            range: response.data.updatedRange,
            success: true,
          }, null, 2),
        },
      ],
    };
  }

  private async handleCreateChart(args: CreateChartArgs) {
    const sheets = this.getSheetsClient(args.credentials);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: args.spreadsheetId,
      requestBody: {
        requests: [
          {
            addChart: {
              chart: {
                spec: {
                  title: "Chart",
                  basicChart: {
                    chartType: args.chartType,
                    legendPosition: "BOTTOM_LEGEND",
                    axis: [
                      {
                        position: "BOTTOM_AXIS",
                      },
                      {
                        position: "LEFT_AXIS",
                      },
                    ],
                    domains: [
                      {
                        domain: {
                          sourceRange: {
                            sources: [
                              {
                                sheetId: args.sheetId,
                                startRowIndex: 0,
                                endRowIndex: 10,
                                startColumnIndex: 0,
                                endColumnIndex: 1,
                              },
                            ],
                          },
                        },
                      },
                    ],
                    series: [
                      {
                        series: {
                          sourceRange: {
                            sources: [
                              {
                                sheetId: args.sheetId,
                                startRowIndex: 0,
                                endRowIndex: 10,
                                startColumnIndex: 1,
                                endColumnIndex: 2,
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
                position: {
                  overlayPosition: {
                    anchorCell: {
                      sheetId: args.sheetId,
                      rowIndex: 0,
                      columnIndex: 3,
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            chartType: args.chartType,
            success: true,
            spreadsheetId: args.spreadsheetId,
          }, null, 2),
        },
      ],
    };
  }

  private async handleExportCsv(args: ExportCsvArgs) {
    const sheets = this.getSheetsClient(args.credentials);

    const response = await sheets.spreadsheets.get({
      spreadsheetId: args.spreadsheetId,
    });

    const sheet = response.data.sheets?.find(s => s.properties?.sheetId === args.sheetId);
    const sheetTitle = sheet?.properties?.title || "Sheet1";

    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: args.spreadsheetId,
      range: `${sheetTitle}`,
    });

    const values = dataResponse.data.values || [];
    const csv = values.map(row => row.join(",")).join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            csv: csv,
            rowCount: values.length,
            sheetTitle: sheetTitle,
          }, null, 2),
        },
      ],
    };
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Sheets Wizard MCP Server running on stdio");
  }
}

const server = new SheetsWizardServer();
server.run().catch(console.error);
