#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { LinearClient, Issue, Team, Cycle, Project } from "@linear/sdk";

const LINEAR_API_KEY = process.env.LINEAR_API_KEY;

if (!LINEAR_API_KEY) {
  console.error("LINEAR_API_KEY environment variable is required");
  process.exit(1);
}

const linearClient = new LinearClient({
  apiKey: LINEAR_API_KEY,
});

const tools: Tool[] = [
  {
    name: "create_issue",
    description: "Create a new issue in Linear",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Issue title",
        },
        description: {
          type: "string",
          description: "Issue description (supports markdown)",
        },
        teamId: {
          type: "string",
          description: "Team ID to create the issue in",
        },
        priority: {
          type: "number",
          description: "Priority (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low)",
          minimum: 0,
          maximum: 4,
        },
        assigneeId: {
          type: "string",
          description: "User ID to assign the issue to (optional)",
        },
        labelIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of label IDs to apply (optional)",
        },
      },
      required: ["title", "teamId"],
    },
  },
  {
    name: "update_issue",
    description: "Update an existing issue in Linear",
    inputSchema: {
      type: "object",
      properties: {
        issueId: {
          type: "string",
          description: "Issue ID to update",
        },
        title: {
          type: "string",
          description: "New title (optional)",
        },
        description: {
          type: "string",
          description: "New description (optional)",
        },
        priority: {
          type: "number",
          description: "New priority (optional)",
          minimum: 0,
          maximum: 4,
        },
        stateId: {
          type: "string",
          description: "New state ID (optional)",
        },
        assigneeId: {
          type: "string",
          description: "New assignee ID (optional)",
        },
      },
      required: ["issueId"],
    },
  },
  {
    name: "get_team",
    description: "Get team information and workflow states",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID or team key (e.g., 'ENG')",
        },
      },
      required: ["teamId"],
    },
  },
  {
    name: "get_cycle",
    description: "Get active or specific cycle information",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID to get cycle for",
        },
        cycleId: {
          type: "string",
          description: "Specific cycle ID (optional, defaults to active cycle)",
        },
      },
      required: ["teamId"],
    },
  },
  {
    name: "create_project",
    description: "Create a new project in Linear",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Project name",
        },
        description: {
          type: "string",
          description: "Project description",
        },
        teamIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of team IDs associated with this project",
        },
        targetDate: {
          type: "string",
          description: "Target completion date (ISO 8601 format, optional)",
        },
        state: {
          type: "string",
          enum: ["planned", "started", "paused", "completed", "canceled"],
          description: "Project state (optional, defaults to 'planned')",
        },
      },
      required: ["name", "teamIds"],
    },
  },
  {
    name: "add_label",
    description: "Create a new label in a team",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Label name",
        },
        teamId: {
          type: "string",
          description: "Team ID to create the label in",
        },
        color: {
          type: "string",
          description: "Hex color code (e.g., '#FF6B6B', optional)",
        },
        description: {
          type: "string",
          description: "Label description (optional)",
        },
      },
      required: ["name", "teamId"],
    },
  },
];

const server = new Server(
  {
    name: "linear-flow",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error("Missing arguments");
  }

  try {
    switch (name) {
      case "create_issue": {
        const issuePayload: any = {
          title: args.title as string,
          teamId: args.teamId as string,
        };

        if (args.description) issuePayload.description = args.description as string;
        if (args.priority !== undefined) issuePayload.priority = args.priority as number;
        if (args.assigneeId) issuePayload.assigneeId = args.assigneeId as string;
        if (args.labelIds) issuePayload.labelIds = args.labelIds as string[];

        const issueResponse = await linearClient.createIssue(issuePayload);
        const issue = await issueResponse.issue;

        if (!issue) {
          throw new Error("Failed to create issue");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: issue.id,
                  identifier: issue.identifier,
                  title: issue.title,
                  url: issue.url,
                  state: (await issue.state)?.name,
                  priority: issue.priority,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "update_issue": {
        const updatePayload: any = {};

        if (args.title) updatePayload.title = args.title as string;
        if (args.description) updatePayload.description = args.description as string;
        if (args.priority !== undefined) updatePayload.priority = args.priority as number;
        if (args.stateId) updatePayload.stateId = args.stateId as string;
        if (args.assigneeId) updatePayload.assigneeId = args.assigneeId as string;

        const updateResponse = await linearClient.updateIssue(
          args.issueId as string,
          updatePayload
        );
        const issue = await updateResponse.issue;

        if (!issue) {
          throw new Error("Failed to update issue");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: issue.id,
                  identifier: issue.identifier,
                  title: issue.title,
                  url: issue.url,
                  state: (await issue.state)?.name,
                  priority: issue.priority,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_team": {
        const team = await linearClient.team(args.teamId as string);

        if (!team) {
          throw new Error("Team not found");
        }

        const states = await team.states();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: team.id,
                  key: team.key,
                  name: team.name,
                  description: team.description,
                  states: states.nodes.map((state) => ({
                    id: state.id,
                    name: state.name,
                    type: state.type,
                    color: state.color,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_cycle": {
        let cycle: Cycle | undefined;

        if (args.cycleId) {
          cycle = await linearClient.cycle(args.cycleId as string);
        } else {
          const team = await linearClient.team(args.teamId as string);
          const activeCycle = await team.activeCycle;
          cycle = activeCycle ?? undefined;
        }

        if (!cycle) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ message: "No active cycle found" }, null, 2),
              },
            ],
          };
        }

        const issues = await cycle.issues();
        const completedCount = cycle.completedScopeHistory?.length ?? 0;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: cycle.id,
                  number: cycle.number,
                  name: cycle.name,
                  startsAt: cycle.startsAt,
                  endsAt: cycle.endsAt,
                  issueCount: issues.nodes.length,
                  completedIssueCount: completedCount,
                  progress: cycle.progress,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "create_project": {
        const projectPayload: any = {
          name: args.name as string,
          teamIds: args.teamIds as string[],
        };

        if (args.description) projectPayload.description = args.description as string;
        if (args.targetDate) projectPayload.targetDate = new Date(args.targetDate as string);
        if (args.state) projectPayload.state = args.state as string;

        const projectResponse = await linearClient.createProject(projectPayload);
        const project = await projectResponse.project;

        if (!project) {
          throw new Error("Failed to create project");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  url: project.url,
                  state: project.state,
                  targetDate: project.targetDate,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "add_label": {
        const labelPayload: any = {
          name: args.name as string,
          teamId: args.teamId as string,
        };

        if (args.color) labelPayload.color = args.color as string;
        if (args.description) labelPayload.description = args.description as string;

        const labelResponse = await linearClient.createIssueLabel(labelPayload);
        const label = await labelResponse.issueLabel;

        if (!label) {
          throw new Error("Failed to create label");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: label.id,
                  name: label.name,
                  color: label.color,
                  description: label.description,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Linear Flow MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
