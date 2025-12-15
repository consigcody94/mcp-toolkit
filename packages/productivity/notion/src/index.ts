#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@notionhq/client";

// Types
interface CreatePageParams {
  parent_database_id?: string;
  parent_page_id?: string;
  title: string;
  content?: string;
}

interface CreateDatabaseParams {
  parent_page_id: string;
  title: string;
  properties: Record<string, unknown>;
}

interface QueryDatabaseParams {
  database_id: string;
  filter?: Record<string, unknown>;
  sorts?: Array<Record<string, unknown>>;
}

interface UpdatePageParams {
  page_id: string;
  properties?: Record<string, unknown>;
  archived?: boolean;
}

interface GetPageParams {
  page_id: string;
}

interface SearchContentParams {
  query: string;
  filter?: {
    property?: string;
    value?: string;
  };
}

// Initialize Notion client
const NOTION_API_KEY = process.env.NOTION_API_KEY;

if (!NOTION_API_KEY) {
  console.error("Error: NOTION_API_KEY environment variable is required");
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

// Define tools
const tools: Tool[] = [
  {
    name: "create_page",
    description: "Create a new page in Notion workspace. Can be created in a database or as a child of another page.",
    inputSchema: {
      type: "object",
      properties: {
        parent_database_id: {
          type: "string",
          description: "ID of the parent database (use this OR parent_page_id)",
        },
        parent_page_id: {
          type: "string",
          description: "ID of the parent page (use this OR parent_database_id)",
        },
        title: {
          type: "string",
          description: "Title of the new page",
        },
        content: {
          type: "string",
          description: "Text content to add to the page",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "create_database",
    description: "Create a new database in Notion workspace",
    inputSchema: {
      type: "object",
      properties: {
        parent_page_id: {
          type: "string",
          description: "ID of the parent page",
        },
        title: {
          type: "string",
          description: "Title of the new database",
        },
        properties: {
          type: "object",
          description: "Database schema properties (e.g., {Name: {title: {}}, Status: {select: {options: [...]}}})",
        },
      },
      required: ["parent_page_id", "title", "properties"],
    },
  },
  {
    name: "query_database",
    description: "Query a Notion database with optional filters and sorting",
    inputSchema: {
      type: "object",
      properties: {
        database_id: {
          type: "string",
          description: "ID of the database to query",
        },
        filter: {
          type: "object",
          description: "Filter object for the query",
        },
        sorts: {
          type: "array",
          description: "Array of sort objects",
        },
      },
      required: ["database_id"],
    },
  },
  {
    name: "update_page",
    description: "Update properties of an existing Notion page",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "ID of the page to update",
        },
        properties: {
          type: "object",
          description: "Properties to update",
        },
        archived: {
          type: "boolean",
          description: "Whether to archive the page",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "get_page",
    description: "Retrieve a specific page from Notion by ID",
    inputSchema: {
      type: "object",
      properties: {
        page_id: {
          type: "string",
          description: "ID of the page to retrieve",
        },
      },
      required: ["page_id"],
    },
  },
  {
    name: "search_content",
    description: "Search for pages and databases in Notion workspace",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        filter: {
          type: "object",
          description: "Filter options (property and value)",
        },
      },
      required: ["query"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "notion-weaver",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_page": {
        const params = args as unknown as CreatePageParams;

        // Build parent object
        let parent: { database_id: string } | { page_id: string };
        if (params.parent_database_id) {
          parent = { database_id: params.parent_database_id };
        } else if (params.parent_page_id) {
          parent = { page_id: params.parent_page_id };
        } else {
          return {
            content: [
              {
                type: "text",
                text: "Error: Either parent_database_id or parent_page_id is required",
              },
            ],
          };
        }

        // Build properties
        const properties: {
          title?: { title: Array<{ text: { content: string } }> };
          Name?: { title: Array<{ text: { content: string } }> };
        } = {};

        if (params.parent_database_id) {
          properties.Name = {
            title: [{ text: { content: params.title } }],
          };
        } else {
          properties.title = {
            title: [{ text: { content: params.title } }],
          };
        }

        // Build children (content blocks)
        const children = params.content
          ? [
              {
                object: "block" as const,
                type: "paragraph" as const,
                paragraph: {
                  rich_text: [{ type: "text" as const, text: { content: params.content } }],
                },
              },
            ]
          : undefined;

        const response = await notion.pages.create({
          parent,
          properties,
          children,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "create_database": {
        const params = args as unknown as CreateDatabaseParams;

        const response = await notion.databases.create({
          parent: { page_id: params.parent_page_id },
          title: [{ type: "text", text: { content: params.title } }],
          properties: params.properties as any,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "query_database": {
        const params = args as unknown as QueryDatabaseParams;

        const response = await notion.databases.query({
          database_id: params.database_id,
          filter: params.filter as any,
          sorts: params.sorts as any,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "update_page": {
        const params = args as unknown as UpdatePageParams;

        const response = await notion.pages.update({
          page_id: params.page_id,
          properties: (params.properties || {}) as any,
          archived: params.archived,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "get_page": {
        const params = args as unknown as GetPageParams;

        const response = await notion.pages.retrieve({
          page_id: params.page_id,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "search_content": {
        const params = args as unknown as SearchContentParams;

        const searchParams: {
          query: string;
          filter?: { property: "object"; value: "page" | "database" };
        } = {
          query: params.query,
        };

        if (params.filter?.property === "object" && (params.filter?.value === "page" || params.filter?.value === "database")) {
          searchParams.filter = {
            property: "object",
            value: params.filter.value,
          };
        }

        const response = await notion.search(searchParams);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notion Weaver MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
