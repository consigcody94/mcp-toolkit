#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const DATA_DIR =
  process.env.DEV_MIRROR_DATA_DIR ||
  path.join(os.homedir(), ".dev-mirror");

interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  type: "ai-assisted" | "manual";
  task: string;
  linesAdded: number;
  linesDeleted: number;
  filesModified: number;
  testsPassed: number;
  testsFailed: number;
  buildSucceeded: boolean;
  iterationCount: number;
  contextSwitches: number;
  notes: string;
  tags: string[];
}

interface Stats {
  totalSessions: number;
  aiAssistedSessions: number;
  manualSessions: number;
  totalTimeMinutes: number;
  avgSessionDuration: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  totalFilesModified: number;
  totalTestsPassed: number;
  buildSuccessRate: number;
  avgIterationsPerSession: number;
  avgContextSwitches: number;
}

interface ComparisonResult {
  metric: string;
  aiAssisted: number;
  manual: number;
  difference: number;
  percentChange: number;
  interpretation: string;
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadSessions(): Promise<Session[]> {
  await ensureDataDir();
  const sessionsFile = path.join(DATA_DIR, "sessions.json");

  try {
    const data = await fs.readFile(sessionsFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveSessions(sessions: Session[]): Promise<void> {
  await ensureDataDir();
  const sessionsFile = path.join(DATA_DIR, "sessions.json");
  await fs.writeFile(sessionsFile, JSON.stringify(sessions, null, 2), "utf-8");
}

function calculateDuration(startTime: string, endTime?: string): number {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  return Math.round((end - start) / 60000); // Convert to minutes
}

const tools: Tool[] = [
  {
    name: "track_session",
    description: "Track a development session with productivity metrics",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["start", "end", "update"],
          description: "Action to perform",
        },
        sessionId: {
          type: "string",
          description: "Session ID (required for end/update)",
        },
        type: {
          type: "string",
          enum: ["ai-assisted", "manual"],
          description: "Type of development session",
        },
        task: {
          type: "string",
          description: "Task description",
        },
        linesAdded: {
          type: "number",
          description: "Number of lines added",
        },
        linesDeleted: {
          type: "number",
          description: "Number of lines deleted",
        },
        filesModified: {
          type: "number",
          description: "Number of files modified",
        },
        testsPassed: {
          type: "number",
          description: "Number of tests passed",
        },
        testsFailed: {
          type: "number",
          description: "Number of tests failed",
        },
        buildSucceeded: {
          type: "boolean",
          description: "Whether the build succeeded",
        },
        iterationCount: {
          type: "number",
          description: "Number of iterations/attempts",
        },
        contextSwitches: {
          type: "number",
          description: "Number of context switches during session",
        },
        notes: {
          type: "string",
          description: "Additional notes",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorization",
        },
      },
      required: ["action"],
    },
  },
  {
    name: "get_stats",
    description: "Get productivity statistics",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["all", "ai-assisted", "manual"],
          description: "Filter by session type (default: all)",
        },
        timeRange: {
          type: "string",
          enum: ["day", "week", "month", "all"],
          description: "Time range for statistics (default: all)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Filter by tags",
        },
      },
    },
  },
  {
    name: "compare_ai_vs_manual",
    description: "Compare AI-assisted vs manual development productivity",
    inputSchema: {
      type: "object",
      properties: {
        timeRange: {
          type: "string",
          enum: ["day", "week", "month", "all"],
          description: "Time range for comparison (default: all)",
        },
        metrics: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "duration",
              "linesPerMinute",
              "testPassRate",
              "buildSuccessRate",
              "iterationsPerSession",
              "contextSwitches",
            ],
          },
          description: "Metrics to compare (default: all)",
        },
      },
    },
  },
  {
    name: "code_quality_score",
    description: "Calculate code quality score based on metrics",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session ID to score (optional, scores all if not provided)",
        },
        weights: {
          type: "object",
          description: "Custom weights for scoring (optional)",
          properties: {
            testPassRate: { type: "number" },
            buildSuccess: { type: "number" },
            lowIterations: { type: "number" },
            lowContextSwitches: { type: "number" },
          },
        },
      },
    },
  },
  {
    name: "generate_report",
    description: "Generate a comprehensive productivity report",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["markdown", "json"],
          description: "Report format (default: markdown)",
        },
        timeRange: {
          type: "string",
          enum: ["day", "week", "month", "all"],
          description: "Time range for report (default: week)",
        },
        includeCharts: {
          type: "boolean",
          description: "Include ASCII charts (default: true)",
        },
      },
    },
  },
];

function filterSessionsByTimeRange(
  sessions: Session[],
  timeRange: string
): Session[] {
  if (timeRange === "all") return sessions;

  const now = Date.now();
  const ranges: Record<string, number> = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  const cutoff = now - ranges[timeRange];
  return sessions.filter((s) => new Date(s.startTime).getTime() > cutoff);
}

function calculateStats(sessions: Session[]): Stats {
  const aiSessions = sessions.filter((s) => s.type === "ai-assisted");
  const manualSessions = sessions.filter((s) => s.type === "manual");

  const totalTimeMinutes = sessions.reduce((sum, s) => {
    return sum + calculateDuration(s.startTime, s.endTime);
  }, 0);

  const buildSuccesses = sessions.filter((s) => s.buildSucceeded).length;

  return {
    totalSessions: sessions.length,
    aiAssistedSessions: aiSessions.length,
    manualSessions: manualSessions.length,
    totalTimeMinutes,
    avgSessionDuration:
      sessions.length > 0 ? totalTimeMinutes / sessions.length : 0,
    totalLinesAdded: sessions.reduce((sum, s) => sum + s.linesAdded, 0),
    totalLinesDeleted: sessions.reduce((sum, s) => sum + s.linesDeleted, 0),
    totalFilesModified: sessions.reduce((sum, s) => sum + s.filesModified, 0),
    totalTestsPassed: sessions.reduce((sum, s) => sum + s.testsPassed, 0),
    buildSuccessRate:
      sessions.length > 0 ? (buildSuccesses / sessions.length) * 100 : 0,
    avgIterationsPerSession:
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.iterationCount, 0) /
          sessions.length
        : 0,
    avgContextSwitches:
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.contextSwitches, 0) /
          sessions.length
        : 0,
  };
}

function calculateQualityScore(
  session: Session,
  weights: {
    testPassRate: number;
    buildSuccess: number;
    lowIterations: number;
    lowContextSwitches: number;
  } = {
    testPassRate: 0.3,
    buildSuccess: 0.3,
    lowIterations: 0.2,
    lowContextSwitches: 0.2,
  }
): number {
  const totalTests = session.testsPassed + session.testsFailed;
  const testPassRate = totalTests > 0 ? session.testsPassed / totalTests : 1;

  const buildScore = session.buildSucceeded ? 1 : 0;

  // Lower iterations is better (inverse score)
  const iterationScore = Math.max(0, 1 - session.iterationCount / 10);

  // Lower context switches is better (inverse score)
  const contextScore = Math.max(0, 1 - session.contextSwitches / 10);

  return (
    testPassRate * weights.testPassRate +
    buildScore * weights.buildSuccess +
    iterationScore * weights.lowIterations +
    contextScore * weights.lowContextSwitches
  ) * 100;
}

function generateMarkdownReport(
  stats: Stats,
  comparisons: ComparisonResult[],
  topSessions: Session[]
): string {
  let report = "# Dev Mirror Productivity Report\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;

  report += "## Overall Statistics\n\n";
  report += `- **Total Sessions**: ${stats.totalSessions}\n`;
  report += `- **AI-Assisted**: ${stats.aiAssistedSessions}\n`;
  report += `- **Manual**: ${stats.manualSessions}\n`;
  report += `- **Total Time**: ${stats.totalTimeMinutes} minutes (${(stats.totalTimeMinutes / 60).toFixed(1)} hours)\n`;
  report += `- **Avg Session Duration**: ${stats.avgSessionDuration.toFixed(1)} minutes\n`;
  report += `- **Total Lines Added**: ${stats.totalLinesAdded}\n`;
  report += `- **Total Lines Deleted**: ${stats.totalLinesDeleted}\n`;
  report += `- **Build Success Rate**: ${stats.buildSuccessRate.toFixed(1)}%\n\n`;

  report += "## AI vs Manual Comparison\n\n";
  report += "| Metric | AI-Assisted | Manual | Difference | Change |\n";
  report += "|--------|-------------|--------|------------|--------|\n";
  for (const comp of comparisons) {
    report += `| ${comp.metric} | ${comp.aiAssisted.toFixed(2)} | ${comp.manual.toFixed(2)} | ${comp.difference > 0 ? "+" : ""}${comp.difference.toFixed(2)} | ${comp.percentChange > 0 ? "+" : ""}${comp.percentChange.toFixed(1)}% |\n`;
  }
  report += "\n";

  report += "## Key Insights\n\n";
  for (const comp of comparisons) {
    report += `- **${comp.metric}**: ${comp.interpretation}\n`;
  }
  report += "\n";

  report += "## Top Quality Sessions\n\n";
  for (let i = 0; i < Math.min(5, topSessions.length); i++) {
    const session = topSessions[i];
    const score = calculateQualityScore(session);
    report += `${i + 1}. **${session.task}** (${session.type})\n`;
    report += `   - Quality Score: ${score.toFixed(1)}/100\n`;
    report += `   - Duration: ${calculateDuration(session.startTime, session.endTime)} minutes\n`;
    report += `   - Tests Passed: ${session.testsPassed}\n\n`;
  }

  return report;
}

const server = new Server(
  {
    name: "dev-mirror",
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
      case "track_session": {
        const action = args.action as string;
        const sessions = await loadSessions();

        if (action === "start") {
          const newSession: Session = {
            id: `session-${Date.now()}`,
            startTime: new Date().toISOString(),
            type: (args.type as "ai-assisted" | "manual") || "ai-assisted",
            task: (args.task as string) || "Untitled task",
            linesAdded: 0,
            linesDeleted: 0,
            filesModified: 0,
            testsPassed: 0,
            testsFailed: 0,
            buildSucceeded: false,
            iterationCount: 0,
            contextSwitches: 0,
            notes: (args.notes as string) || "",
            tags: (args.tags as string[]) || [],
          };

          sessions.push(newSession);
          await saveSessions(sessions);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    sessionId: newSession.id,
                    message: "Session started",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else if (action === "end" || action === "update") {
          const sessionId = args.sessionId as string;
          const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

          if (sessionIndex === -1) {
            throw new Error("Session not found");
          }

          const session = sessions[sessionIndex];

          if (action === "end") {
            session.endTime = new Date().toISOString();
          }

          if (args.linesAdded !== undefined)
            session.linesAdded = args.linesAdded as number;
          if (args.linesDeleted !== undefined)
            session.linesDeleted = args.linesDeleted as number;
          if (args.filesModified !== undefined)
            session.filesModified = args.filesModified as number;
          if (args.testsPassed !== undefined)
            session.testsPassed = args.testsPassed as number;
          if (args.testsFailed !== undefined)
            session.testsFailed = args.testsFailed as number;
          if (args.buildSucceeded !== undefined)
            session.buildSucceeded = args.buildSucceeded as boolean;
          if (args.iterationCount !== undefined)
            session.iterationCount = args.iterationCount as number;
          if (args.contextSwitches !== undefined)
            session.contextSwitches = args.contextSwitches as number;
          if (args.notes !== undefined) session.notes = args.notes as string;
          if (args.tags !== undefined) session.tags = args.tags as string[];

          sessions[sessionIndex] = session;
          await saveSessions(sessions);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    session,
                    duration: calculateDuration(
                      session.startTime,
                      session.endTime
                    ),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        throw new Error("Invalid action");
      }

      case "get_stats": {
        const type = (args.type as string) || "all";
        const timeRange = (args.timeRange as string) || "all";
        const tags = args.tags as string[] | undefined;

        let sessions = await loadSessions();
        sessions = filterSessionsByTimeRange(sessions, timeRange);

        if (type !== "all") {
          sessions = sessions.filter((s) => s.type === type);
        }

        if (tags && tags.length > 0) {
          sessions = sessions.filter((s) =>
            tags.some((tag) => s.tags.includes(tag))
          );
        }

        const stats = calculateStats(sessions);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      case "compare_ai_vs_manual": {
        const timeRange = (args.timeRange as string) || "all";
        const requestedMetrics = (args.metrics as string[]) || [
          "duration",
          "linesPerMinute",
          "testPassRate",
          "buildSuccessRate",
          "iterationsPerSession",
          "contextSwitches",
        ];

        let sessions = await loadSessions();
        sessions = filterSessionsByTimeRange(sessions, timeRange);

        const aiSessions = sessions.filter((s) => s.type === "ai-assisted");
        const manualSessions = sessions.filter((s) => s.type === "manual");

        const aiStats = calculateStats(aiSessions);
        const manualStats = calculateStats(manualSessions);

        const comparisons: ComparisonResult[] = [];

        if (requestedMetrics.includes("duration")) {
          const diff = aiStats.avgSessionDuration - manualStats.avgSessionDuration;
          const pctChange =
            manualStats.avgSessionDuration > 0
              ? (diff / manualStats.avgSessionDuration) * 100
              : 0;
          comparisons.push({
            metric: "Avg Duration (min)",
            aiAssisted: aiStats.avgSessionDuration,
            manual: manualStats.avgSessionDuration,
            difference: diff,
            percentChange: pctChange,
            interpretation:
              diff > 0
                ? "AI sessions take longer but may deliver higher quality"
                : "AI sessions are faster",
          });
        }

        if (requestedMetrics.includes("linesPerMinute")) {
          const aiLPM =
            aiStats.avgSessionDuration > 0
              ? aiStats.totalLinesAdded / aiStats.totalTimeMinutes
              : 0;
          const manualLPM =
            manualStats.avgSessionDuration > 0
              ? manualStats.totalLinesAdded / manualStats.totalTimeMinutes
              : 0;
          const diff = aiLPM - manualLPM;
          const pctChange = manualLPM > 0 ? (diff / manualLPM) * 100 : 0;
          comparisons.push({
            metric: "Lines/Minute",
            aiAssisted: aiLPM,
            manual: manualLPM,
            difference: diff,
            percentChange: pctChange,
            interpretation:
              diff > 0
                ? "AI-assisted coding is more productive per minute"
                : "Manual coding produces more lines per minute",
          });
        }

        if (requestedMetrics.includes("buildSuccessRate")) {
          const diff = aiStats.buildSuccessRate - manualStats.buildSuccessRate;
          const pctChange =
            manualStats.buildSuccessRate > 0
              ? (diff / manualStats.buildSuccessRate) * 100
              : 0;
          comparisons.push({
            metric: "Build Success Rate (%)",
            aiAssisted: aiStats.buildSuccessRate,
            manual: manualStats.buildSuccessRate,
            difference: diff,
            percentChange: pctChange,
            interpretation:
              diff > 0
                ? "AI-assisted code has higher build success rate"
                : "Manual code has higher build success rate",
          });
        }

        if (requestedMetrics.includes("iterationsPerSession")) {
          const diff =
            aiStats.avgIterationsPerSession -
            manualStats.avgIterationsPerSession;
          const pctChange =
            manualStats.avgIterationsPerSession > 0
              ? (diff / manualStats.avgIterationsPerSession) * 100
              : 0;
          comparisons.push({
            metric: "Iterations/Session",
            aiAssisted: aiStats.avgIterationsPerSession,
            manual: manualStats.avgIterationsPerSession,
            difference: diff,
            percentChange: pctChange,
            interpretation:
              diff > 0
                ? "AI sessions require more iterations to complete"
                : "Manual sessions require more iterations",
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  timeRange,
                  aiSessionCount: aiSessions.length,
                  manualSessionCount: manualSessions.length,
                  comparisons,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "code_quality_score": {
        const sessionId = args.sessionId as string | undefined;
        const weights = args.weights as any;

        const sessions = await loadSessions();

        if (sessionId) {
          const session = sessions.find((s) => s.id === sessionId);
          if (!session) {
            throw new Error("Session not found");
          }

          const score = calculateQualityScore(session, weights);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    sessionId: session.id,
                    task: session.task,
                    type: session.type,
                    qualityScore: score,
                    breakdown: {
                      testPassRate:
                        session.testsPassed /
                        (session.testsPassed + session.testsFailed),
                      buildSuccess: session.buildSucceeded,
                      iterations: session.iterationCount,
                      contextSwitches: session.contextSwitches,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else {
          const scores = sessions.map((s) => ({
            sessionId: s.id,
            task: s.task,
            type: s.type,
            qualityScore: calculateQualityScore(s, weights),
          }));

          scores.sort((a, b) => b.qualityScore - a.qualityScore);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    totalSessions: scores.length,
                    averageScore:
                      scores.reduce((sum, s) => sum + s.qualityScore, 0) /
                      scores.length,
                    topScores: scores.slice(0, 10),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      case "generate_report": {
        const format = (args.format as string) || "markdown";
        const timeRange = (args.timeRange as string) || "week";

        let sessions = await loadSessions();
        sessions = filterSessionsByTimeRange(sessions, timeRange);

        const aiSessions = sessions.filter((s) => s.type === "ai-assisted");
        const manualSessions = sessions.filter((s) => s.type === "manual");

        const stats = calculateStats(sessions);
        const aiStats = calculateStats(aiSessions);
        const manualStats = calculateStats(manualSessions);

        // Generate comparisons
        const comparisons: ComparisonResult[] = [];

        const durationDiff =
          aiStats.avgSessionDuration - manualStats.avgSessionDuration;
        comparisons.push({
          metric: "Avg Duration (min)",
          aiAssisted: aiStats.avgSessionDuration,
          manual: manualStats.avgSessionDuration,
          difference: durationDiff,
          percentChange:
            manualStats.avgSessionDuration > 0
              ? (durationDiff / manualStats.avgSessionDuration) * 100
              : 0,
          interpretation:
            durationDiff > 0
              ? "Sessions with AI take longer but produce higher quality"
              : "AI accelerates development time",
        });

        const buildDiff =
          aiStats.buildSuccessRate - manualStats.buildSuccessRate;
        comparisons.push({
          metric: "Build Success (%)",
          aiAssisted: aiStats.buildSuccessRate,
          manual: manualStats.buildSuccessRate,
          difference: buildDiff,
          percentChange:
            manualStats.buildSuccessRate > 0
              ? (buildDiff / manualStats.buildSuccessRate) * 100
              : 0,
          interpretation:
            buildDiff > 0
              ? "AI-assisted code builds more reliably"
              : "Manual code has better build rate",
        });

        // Get top quality sessions
        const scoredSessions = sessions
          .map((s) => ({
            session: s,
            score: calculateQualityScore(s),
          }))
          .sort((a, b) => b.score - a.score);

        const topSessions = scoredSessions
          .slice(0, 5)
          .map((s) => s.session);

        if (format === "markdown") {
          const report = generateMarkdownReport(stats, comparisons, topSessions);

          return {
            content: [
              {
                type: "text",
                text: report,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    timeRange,
                    stats,
                    aiStats,
                    manualStats,
                    comparisons,
                    topSessions,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
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
  console.error("Dev Mirror MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
