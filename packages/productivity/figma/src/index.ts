#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

interface GetFileArgs {
  fileKey: string;
  token: string;
}

interface ListComponentsArgs {
  fileKey: string;
  token: string;
}

interface ExportAssetsArgs {
  fileKey: string;
  nodeIds: string[];
  format: string;
  scale?: number;
  token: string;
}

interface UpdateStylesArgs {
  fileKey: string;
  styleKey: string;
  name?: string;
  description?: string;
  token: string;
}

interface GetCommentsArgs {
  fileKey: string;
  token: string;
}

class DesignWandServer {
  private server: Server;
  private readonly baseUrl = "https://api.figma.com/v1";

  constructor() {
    this.server = new Server(
      {
        name: "design-wand",
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

  private async figmaRequest(
    endpoint: string,
    token: string,
    options: {
      method?: string;
      body?: string;
      headers?: Record<string, string>;
    } = {}
  ): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options.method || "GET",
      body: options.body,
      headers: {
        "X-Figma-Token": token,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma API error (${response.status}): ${error}`);
    }

    return await response.json();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "get_file",
          description: "Get Figma file details and document structure",
          inputSchema: {
            type: "object",
            properties: {
              fileKey: {
                type: "string",
                description: "Figma file key (from the file URL)",
              },
              token: {
                type: "string",
                description: "Figma personal access token",
              },
            },
            required: ["fileKey", "token"],
          },
        },
        {
          name: "list_components",
          description: "List all components in a Figma file",
          inputSchema: {
            type: "object",
            properties: {
              fileKey: {
                type: "string",
                description: "Figma file key (from the file URL)",
              },
              token: {
                type: "string",
                description: "Figma personal access token",
              },
            },
            required: ["fileKey", "token"],
          },
        },
        {
          name: "export_assets",
          description: "Export nodes/assets from Figma as images",
          inputSchema: {
            type: "object",
            properties: {
              fileKey: {
                type: "string",
                description: "Figma file key (from the file URL)",
              },
              nodeIds: {
                type: "array",
                description: "Array of node IDs to export",
                items: { type: "string" },
              },
              format: {
                type: "string",
                description: "Export format (png, jpg, svg, pdf)",
              },
              scale: {
                type: "number",
                description: "Scale factor (1-4, default: 1)",
              },
              token: {
                type: "string",
                description: "Figma personal access token",
              },
            },
            required: ["fileKey", "nodeIds", "format", "token"],
          },
        },
        {
          name: "update_styles",
          description: "Update styles in a Figma file",
          inputSchema: {
            type: "object",
            properties: {
              fileKey: {
                type: "string",
                description: "Figma file key (from the file URL)",
              },
              styleKey: {
                type: "string",
                description: "Style key to update",
              },
              name: {
                type: "string",
                description: "New style name",
              },
              description: {
                type: "string",
                description: "New style description",
              },
              token: {
                type: "string",
                description: "Figma personal access token",
              },
            },
            required: ["fileKey", "styleKey", "token"],
          },
        },
        {
          name: "get_comments",
          description: "Get all comments from a Figma file",
          inputSchema: {
            type: "object",
            properties: {
              fileKey: {
                type: "string",
                description: "Figma file key (from the file URL)",
              },
              token: {
                type: "string",
                description: "Figma personal access token",
              },
            },
            required: ["fileKey", "token"],
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments as Record<string, unknown>;
        switch (request.params.name) {
          case "get_file":
            return await this.handleGetFile(args as unknown as GetFileArgs);
          case "list_components":
            return await this.handleListComponents(args as unknown as ListComponentsArgs);
          case "export_assets":
            return await this.handleExportAssets(args as unknown as ExportAssetsArgs);
          case "update_styles":
            return await this.handleUpdateStyles(args as unknown as UpdateStylesArgs);
          case "get_comments":
            return await this.handleGetComments(args as unknown as GetCommentsArgs);
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

  private async handleGetFile(args: GetFileArgs) {
    const data = await this.figmaRequest(`/files/${args.fileKey}`, args.token) as {
      name?: string;
      lastModified?: string;
      thumbnailUrl?: string;
      version?: string;
      document?: {
        id?: string;
        name?: string;
        type?: string;
        children?: Array<{ id?: string; name?: string; type?: string }>;
      };
      components?: Record<string, unknown>;
      styles?: Record<string, unknown>;
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            name: data.name || "Unknown",
            lastModified: data.lastModified || "",
            thumbnailUrl: data.thumbnailUrl || "",
            version: data.version || "",
            document: {
              id: data.document?.id || "",
              name: data.document?.name || "",
              type: data.document?.type || "",
              childrenCount: data.document?.children?.length || 0,
            },
            componentsCount: Object.keys(data.components || {}).length,
            stylesCount: Object.keys(data.styles || {}).length,
          }, null, 2),
        },
      ],
    };
  }

  private async handleListComponents(args: ListComponentsArgs) {
    const data = await this.figmaRequest(
      `/files/${args.fileKey}/components`,
      args.token
    ) as {
      meta?: {
        components?: Array<{
          key?: string;
          name?: string;
          description?: string;
          node_id?: string;
          created_at?: string;
          updated_at?: string;
        }>;
      };
    };

    const components = (data.meta?.components || []).map((comp) => ({
      key: comp.key || "",
      name: comp.name || "",
      description: comp.description || "",
      nodeId: comp.node_id || "",
      createdAt: comp.created_at || "",
      updatedAt: comp.updated_at || "",
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            count: components.length,
            components: components,
          }, null, 2),
        },
      ],
    };
  }

  private async handleExportAssets(args: ExportAssetsArgs) {
    const nodeIdsParam = args.nodeIds.join(",");
    const scale = args.scale || 1;

    const data = await this.figmaRequest(
      `/images/${args.fileKey}?ids=${nodeIdsParam}&format=${args.format}&scale=${scale}`,
      args.token
    ) as {
      err?: string | null;
      images?: Record<string, string>;
    };

    if (data.err) {
      throw new Error(data.err);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            format: args.format,
            scale: scale,
            nodeCount: args.nodeIds.length,
            images: data.images || {},
          }, null, 2),
        },
      ],
    };
  }

  private async handleUpdateStyles(args: UpdateStylesArgs) {
    const updateData: Record<string, string> = {};
    if (args.name) updateData.name = args.name;
    if (args.description) updateData.description = args.description;

    await this.figmaRequest(
      `/files/${args.fileKey}/styles/${args.styleKey}`,
      args.token,
      {
        method: "PUT",
        body: JSON.stringify(updateData),
      }
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            styleKey: args.styleKey,
            updated: true,
            changes: updateData,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetComments(args: GetCommentsArgs) {
    const data = await this.figmaRequest(
      `/files/${args.fileKey}/comments`,
      args.token
    ) as {
      comments?: Array<{
        id?: string;
        message?: string;
        user?: { handle?: string; img_url?: string };
        created_at?: string;
        resolved_at?: string | null;
        client_meta?: {
          node_id?: string;
          node_offset?: { x?: number; y?: number };
        };
      }>;
    };

    const comments = (data.comments || []).map((comment) => ({
      id: comment.id || "",
      message: comment.message || "",
      user: comment.user?.handle || "Unknown",
      userImage: comment.user?.img_url || "",
      createdAt: comment.created_at || "",
      resolved: !!comment.resolved_at,
      resolvedAt: comment.resolved_at || null,
      nodeId: comment.client_meta?.node_id || null,
      position: comment.client_meta?.node_offset || null,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            total: comments.length,
            resolved: comments.filter(c => c.resolved).length,
            unresolved: comments.filter(c => !c.resolved).length,
            comments: comments,
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
    console.error("Design Wand MCP Server running on stdio");
  }
}

const server = new DesignWandServer();
server.run().catch(console.error);
