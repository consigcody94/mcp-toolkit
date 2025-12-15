#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { WebClient } from "@slack/web-api";

interface SearchMessagesArgs {
  query: string;
  count?: number;
  token: string;
}

interface GetThreadArgs {
  channel: string;
  threadTs: string;
  token: string;
}

interface PostMessageArgs {
  channel: string;
  text: string;
  threadTs?: string;
  token: string;
}

interface GetChannelHistoryArgs {
  channel: string;
  limit?: number;
  oldest?: string;
  token: string;
}

interface CreateReminderArgs {
  text: string;
  time: string;
  token: string;
}

class SlackSageServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "slack-sage",
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

  private getSlackClient(token: string): WebClient {
    return new WebClient(token);
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "search_messages",
          description: "Search for messages across all channels",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (supports Slack search syntax)",
              },
              count: {
                type: "number",
                description: "Number of results to return (default: 20)",
              },
              token: {
                type: "string",
                description: "Slack bot token",
              },
            },
            required: ["query", "token"],
          },
        },
        {
          name: "get_thread",
          description: "Get all messages in a thread",
          inputSchema: {
            type: "object",
            properties: {
              channel: {
                type: "string",
                description: "Channel ID",
              },
              threadTs: {
                type: "string",
                description: "Thread timestamp (parent message timestamp)",
              },
              token: {
                type: "string",
                description: "Slack bot token",
              },
            },
            required: ["channel", "threadTs", "token"],
          },
        },
        {
          name: "post_message",
          description: "Post a message to a channel or thread",
          inputSchema: {
            type: "object",
            properties: {
              channel: {
                type: "string",
                description: "Channel ID or name",
              },
              text: {
                type: "string",
                description: "Message text (supports Slack markdown)",
              },
              threadTs: {
                type: "string",
                description: "Thread timestamp (to reply in thread)",
              },
              token: {
                type: "string",
                description: "Slack bot token",
              },
            },
            required: ["channel", "text", "token"],
          },
        },
        {
          name: "get_channel_history",
          description: "Get recent messages from a channel",
          inputSchema: {
            type: "object",
            properties: {
              channel: {
                type: "string",
                description: "Channel ID",
              },
              limit: {
                type: "number",
                description: "Number of messages to retrieve (default: 100)",
              },
              oldest: {
                type: "string",
                description: "Timestamp to get messages after",
              },
              token: {
                type: "string",
                description: "Slack bot token",
              },
            },
            required: ["channel", "token"],
          },
        },
        {
          name: "create_reminder",
          description: "Create a reminder for yourself or a user",
          inputSchema: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "Reminder text",
              },
              time: {
                type: "string",
                description: "When to send reminder (Unix timestamp or natural language)",
              },
              token: {
                type: "string",
                description: "Slack bot token",
              },
            },
            required: ["text", "time", "token"],
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments as Record<string, unknown>;
        switch (request.params.name) {
          case "search_messages":
            return await this.handleSearchMessages(args as unknown as SearchMessagesArgs);
          case "get_thread":
            return await this.handleGetThread(args as unknown as GetThreadArgs);
          case "post_message":
            return await this.handlePostMessage(args as unknown as PostMessageArgs);
          case "get_channel_history":
            return await this.handleGetChannelHistory(args as unknown as GetChannelHistoryArgs);
          case "create_reminder":
            return await this.handleCreateReminder(args as unknown as CreateReminderArgs);
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

  private async handleSearchMessages(args: SearchMessagesArgs) {
    const slack = this.getSlackClient(args.token);

    const result = await slack.search.messages({
      query: args.query,
      count: args.count || 20,
    });

    if (!result.messages?.matches) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ total: 0, messages: [] }, null, 2),
          },
        ],
      };
    }

    const messages = result.messages.matches.map((match: {
      text?: string;
      username?: string;
      ts?: string;
      channel?: { name?: string };
      permalink?: string;
    }) => ({
      text: match.text || "",
      user: match.username || "Unknown",
      timestamp: match.ts || "",
      channel: match.channel?.name || "Unknown",
      permalink: match.permalink || "",
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            total: result.messages.total || 0,
            messages: messages,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetThread(args: GetThreadArgs) {
    const slack = this.getSlackClient(args.token);

    const result = await slack.conversations.replies({
      channel: args.channel,
      ts: args.threadTs,
    });

    if (!result.messages) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ messages: [] }, null, 2),
          },
        ],
      };
    }

    const messages = result.messages.map((msg: {
      text?: string;
      user?: string;
      ts?: string;
      reply_count?: number;
    }) => ({
      text: msg.text || "",
      user: msg.user || "Unknown",
      timestamp: msg.ts || "",
      replyCount: msg.reply_count || 0,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            threadTs: args.threadTs,
            messageCount: messages.length,
            messages: messages,
          }, null, 2),
        },
      ],
    };
  }

  private async handlePostMessage(args: PostMessageArgs) {
    const slack = this.getSlackClient(args.token);

    const result = await slack.chat.postMessage({
      channel: args.channel,
      text: args.text,
      thread_ts: args.threadTs,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: result.ok,
            channel: result.channel,
            timestamp: result.ts,
            message: args.text,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetChannelHistory(args: GetChannelHistoryArgs) {
    const slack = this.getSlackClient(args.token);

    const result = await slack.conversations.history({
      channel: args.channel,
      limit: args.limit || 100,
      oldest: args.oldest,
    });

    if (!result.messages) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ messages: [] }, null, 2),
          },
        ],
      };
    }

    const messages = result.messages.map((msg: {
      text?: string;
      user?: string;
      ts?: string;
      type?: string;
      subtype?: string;
    }) => ({
      text: msg.text || "",
      user: msg.user || "System",
      timestamp: msg.ts || "",
      type: msg.type || "message",
      subtype: msg.subtype || null,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            channel: args.channel,
            messageCount: messages.length,
            hasMore: result.has_more || false,
            messages: messages,
          }, null, 2),
        },
      ],
    };
  }

  private async handleCreateReminder(args: CreateReminderArgs) {
    const slack = this.getSlackClient(args.token);

    const result = await slack.reminders.add({
      text: args.text,
      time: args.time,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: result.ok,
            reminderId: (result.reminder as { id?: string })?.id || "unknown",
            text: args.text,
            time: args.time,
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
    console.error("Slack Sage MCP Server running on stdio");
  }
}

const server = new SlackSageServer();
server.run().catch(console.error);
