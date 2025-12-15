#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import JiraClient from "jira-client";

interface JiraConfig {
  host: string;
  username: string;
  password: string;
  protocol?: string;
  apiVersion?: string;
  strictSSL?: boolean;
}

interface CreateIssueArgs {
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
  config: JiraConfig;
}

interface UpdateIssueArgs {
  issueKey: string;
  fields: Record<string, unknown>;
  config: JiraConfig;
}

interface SearchIssuesArgs {
  jql: string;
  maxResults?: number;
  config: JiraConfig;
}

interface CreateEpicArgs {
  projectKey: string;
  summary: string;
  description: string;
  epicName: string;
  config: JiraConfig;
}

interface AddCommentArgs {
  issueKey: string;
  comment: string;
  config: JiraConfig;
}

interface TransitionStatusArgs {
  issueKey: string;
  transitionName: string;
  config: JiraConfig;
}

class TicketTamerServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "ticket-tamer",
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

  private getJiraClient(config: JiraConfig): JiraClient {
    return new JiraClient({
      protocol: config.protocol || "https",
      host: config.host,
      username: config.username,
      password: config.password,
      apiVersion: config.apiVersion || "2",
      strictSSL: config.strictSSL !== false,
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "create_issue",
          description: "Create a new Jira issue",
          inputSchema: {
            type: "object",
            properties: {
              projectKey: {
                type: "string",
                description: "Project key (e.g., 'PROJ')",
              },
              summary: {
                type: "string",
                description: "Issue summary/title",
              },
              description: {
                type: "string",
                description: "Issue description",
              },
              issueType: {
                type: "string",
                description: "Issue type (e.g., 'Task', 'Bug', 'Story')",
              },
              config: {
                type: "object",
                description: "Jira connection configuration",
                properties: {
                  host: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                  protocol: { type: "string" },
                  apiVersion: { type: "string" },
                  strictSSL: { type: "boolean" },
                },
                required: ["host", "username", "password"],
              },
            },
            required: ["projectKey", "summary", "description", "issueType", "config"],
          },
        },
        {
          name: "update_issue",
          description: "Update an existing Jira issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., 'PROJ-123')",
              },
              fields: {
                type: "object",
                description: "Fields to update",
              },
              config: {
                type: "object",
                description: "Jira connection configuration",
                properties: {
                  host: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                },
                required: ["host", "username", "password"],
              },
            },
            required: ["issueKey", "fields", "config"],
          },
        },
        {
          name: "search_issues",
          description: "Search for Jira issues using JQL",
          inputSchema: {
            type: "object",
            properties: {
              jql: {
                type: "string",
                description: "JQL query string",
              },
              maxResults: {
                type: "number",
                description: "Maximum results to return (default: 50)",
              },
              config: {
                type: "object",
                description: "Jira connection configuration",
                properties: {
                  host: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                },
                required: ["host", "username", "password"],
              },
            },
            required: ["jql", "config"],
          },
        },
        {
          name: "create_epic",
          description: "Create a new Epic in Jira",
          inputSchema: {
            type: "object",
            properties: {
              projectKey: {
                type: "string",
                description: "Project key (e.g., 'PROJ')",
              },
              summary: {
                type: "string",
                description: "Epic summary/title",
              },
              description: {
                type: "string",
                description: "Epic description",
              },
              epicName: {
                type: "string",
                description: "Epic name",
              },
              config: {
                type: "object",
                description: "Jira connection configuration",
                properties: {
                  host: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                },
                required: ["host", "username", "password"],
              },
            },
            required: ["projectKey", "summary", "description", "epicName", "config"],
          },
        },
        {
          name: "add_comment",
          description: "Add a comment to a Jira issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., 'PROJ-123')",
              },
              comment: {
                type: "string",
                description: "Comment text",
              },
              config: {
                type: "object",
                description: "Jira connection configuration",
                properties: {
                  host: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                },
                required: ["host", "username", "password"],
              },
            },
            required: ["issueKey", "comment", "config"],
          },
        },
        {
          name: "transition_status",
          description: "Transition a Jira issue to a different status",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., 'PROJ-123')",
              },
              transitionName: {
                type: "string",
                description: "Target status/transition name",
              },
              config: {
                type: "object",
                description: "Jira connection configuration",
                properties: {
                  host: { type: "string" },
                  username: { type: "string" },
                  password: { type: "string" },
                },
                required: ["host", "username", "password"],
              },
            },
            required: ["issueKey", "transitionName", "config"],
          },
        },
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments as Record<string, unknown>;
        switch (request.params.name) {
          case "create_issue":
            return await this.handleCreateIssue(args as unknown as CreateIssueArgs);
          case "update_issue":
            return await this.handleUpdateIssue(args as unknown as UpdateIssueArgs);
          case "search_issues":
            return await this.handleSearchIssues(args as unknown as SearchIssuesArgs);
          case "create_epic":
            return await this.handleCreateEpic(args as unknown as CreateEpicArgs);
          case "add_comment":
            return await this.handleAddComment(args as unknown as AddCommentArgs);
          case "transition_status":
            return await this.handleTransitionStatus(args as unknown as TransitionStatusArgs);
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

  private async handleCreateIssue(args: CreateIssueArgs) {
    const jira = this.getJiraClient(args.config);

    const issue = await jira.addNewIssue({
      fields: {
        project: {
          key: args.projectKey,
        },
        summary: args.summary,
        description: args.description,
        issuetype: {
          name: args.issueType,
        },
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            issueKey: issue.key,
            issueId: issue.id,
            summary: args.summary,
            issueType: args.issueType,
            url: `${args.config.protocol || 'https'}://${args.config.host}/browse/${issue.key}`,
          }, null, 2),
        },
      ],
    };
  }

  private async handleUpdateIssue(args: UpdateIssueArgs) {
    const jira = this.getJiraClient(args.config);

    await jira.updateIssue(args.issueKey, {
      fields: args.fields,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            issueKey: args.issueKey,
            updated: true,
            fields: Object.keys(args.fields),
          }, null, 2),
        },
      ],
    };
  }

  private async handleSearchIssues(args: SearchIssuesArgs) {
    const jira = this.getJiraClient(args.config);

    const results = await jira.searchJira(args.jql, {
      maxResults: args.maxResults || 50,
      fields: ["summary", "status", "assignee", "created", "updated", "issuetype", "priority"],
    });

    const issues = results.issues.map((issue: {
      key: string;
      fields: {
        summary: string;
        status: { name: string };
        assignee?: { displayName: string };
        created: string;
        updated: string;
        issuetype: { name: string };
        priority?: { name: string };
      };
    }) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName || "Unassigned",
      created: issue.fields.created,
      updated: issue.fields.updated,
      issueType: issue.fields.issuetype.name,
      priority: issue.fields.priority?.name || "None",
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            total: results.total,
            maxResults: results.maxResults,
            startAt: results.startAt,
            issues: issues,
          }, null, 2),
        },
      ],
    };
  }

  private async handleCreateEpic(args: CreateEpicArgs) {
    const jira = this.getJiraClient(args.config);

    const epic = await jira.addNewIssue({
      fields: {
        project: {
          key: args.projectKey,
        },
        summary: args.summary,
        description: args.description,
        issuetype: {
          name: "Epic",
        },
        customfield_10011: args.epicName, // Epic Name field (may vary by Jira instance)
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            epicKey: epic.key,
            epicId: epic.id,
            epicName: args.epicName,
            summary: args.summary,
            url: `${args.config.protocol || 'https'}://${args.config.host}/browse/${epic.key}`,
          }, null, 2),
        },
      ],
    };
  }

  private async handleAddComment(args: AddCommentArgs) {
    const jira = this.getJiraClient(args.config);

    const comment = await jira.addComment(args.issueKey, args.comment);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            issueKey: args.issueKey,
            commentId: comment.id,
            author: comment.author.displayName,
            created: comment.created,
            body: args.comment,
          }, null, 2),
        },
      ],
    };
  }

  private async handleTransitionStatus(args: TransitionStatusArgs) {
    const jira = this.getJiraClient(args.config);

    // Get available transitions
    const transitions = await jira.listTransitions(args.issueKey);

    const transition = transitions.transitions.find(
      (t: { name: string; id: string }) =>
        t.name.toLowerCase() === args.transitionName.toLowerCase()
    );

    if (!transition) {
      const availableTransitions = transitions.transitions.map((t: { name: string }) => t.name);
      throw new Error(
        `Transition "${args.transitionName}" not found. Available: ${availableTransitions.join(", ")}`
      );
    }

    await jira.transitionIssue(args.issueKey, {
      transition: {
        id: transition.id,
      },
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            issueKey: args.issueKey,
            transitionName: args.transitionName,
            transitionId: transition.id,
            success: true,
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
    console.error("Ticket Tamer MCP Server running on stdio");
  }
}

const server = new TicketTamerServer();
server.run().catch(console.error);
