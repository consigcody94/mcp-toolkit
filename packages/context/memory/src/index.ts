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
import { createHash } from "crypto";

// Types
interface CodebaseIndex {
  files: FileEntry[];
  lastIndexed: string;
  rootPath: string;
}

interface FileEntry {
  path: string;
  hash: string;
  size: number;
  lastModified: string;
  summary?: string;
}

interface Decision {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  reasoning: string;
  tags: string[];
  relatedFiles: string[];
}

interface Conversation {
  id: string;
  timestamp: string;
  title: string;
  context: string;
  messages: Array<{ role: string; content: string }>;
  tags: string[];
}

interface SearchResult {
  type: "file" | "decision" | "conversation";
  path?: string;
  id?: string;
  title?: string;
  relevance: number;
  preview: string;
}

// Storage paths
const STORAGE_DIR = process.env.CODE_MEMORY_DIR || path.join(process.cwd(), ".code-memory");
const INDEX_FILE = path.join(STORAGE_DIR, "index.json");
const DECISIONS_FILE = path.join(STORAGE_DIR, "decisions.json");
const CONVERSATIONS_FILE = path.join(STORAGE_DIR, "conversations.json");

// Initialize storage
async function ensureStorage(): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });

  // Initialize files if they don't exist
  try {
    await fs.access(INDEX_FILE);
  } catch {
    await fs.writeFile(INDEX_FILE, JSON.stringify({ files: [], lastIndexed: "", rootPath: "" }));
  }

  try {
    await fs.access(DECISIONS_FILE);
  } catch {
    await fs.writeFile(DECISIONS_FILE, JSON.stringify([]));
  }

  try {
    await fs.access(CONVERSATIONS_FILE);
  } catch {
    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify([]));
  }
}

// File utilities
function calculateHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").substring(0, 16);
}

async function shouldIndexFile(filePath: string): Promise<boolean> {
  const ext = path.extname(filePath).toLowerCase();
  const codeExtensions = [
    ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".hpp",
    ".cs", ".rb", ".go", ".rs", ".php", ".swift", ".kt", ".scala", ".sh",
    ".sql", ".html", ".css", ".scss", ".json", ".yaml", ".yml", ".toml",
    ".md", ".txt", ".xml"
  ];

  const excludePatterns = [
    "node_modules", ".git", "dist", "build", "coverage", ".next",
    "__pycache__", ".pytest_cache", "vendor", "target"
  ];

  if (!codeExtensions.includes(ext)) {
    return false;
  }

  for (const pattern of excludePatterns) {
    if (filePath.includes(pattern)) {
      return false;
    }
  }

  return true;
}

async function indexDirectory(dirPath: string): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];

  async function walkDir(currentPath: string): Promise<void> {
    const items = await fs.readdir(currentPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        await walkDir(fullPath);
      } else if (item.isFile() && await shouldIndexFile(fullPath)) {
        try {
          const stats = await fs.stat(fullPath);
          const content = await fs.readFile(fullPath, "utf-8");
          const hash = calculateHash(content);

          entries.push({
            path: fullPath,
            hash,
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
          });
        } catch (error) {
          // Skip files that can't be read
          console.error(`Error indexing ${fullPath}:`, error);
        }
      }
    }
  }

  await walkDir(dirPath);
  return entries;
}

function searchInText(query: string, text: string): { found: boolean; relevance: number; preview: string } {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  const words = lowerQuery.split(/\s+/);

  let matchCount = 0;
  for (const word of words) {
    if (lowerText.includes(word)) {
      matchCount++;
    }
  }

  if (matchCount === 0) {
    return { found: false, relevance: 0, preview: "" };
  }

  const relevance = matchCount / words.length;
  const index = lowerText.indexOf(lowerQuery);
  let preview = "";

  if (index !== -1) {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    preview = "..." + text.substring(start, end) + "...";
  } else {
    preview = text.substring(0, 100) + "...";
  }

  return { found: true, relevance, preview };
}

// Define tools
const tools: Tool[] = [
  {
    name: "index_codebase",
    description: "Index a codebase directory to build searchable context. Scans all code files and creates a searchable index.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Root directory path to index",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "search_code",
    description: "Search indexed codebase, decisions, and conversations with keyword matching. Returns ranked results.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        type: {
          type: "string",
          enum: ["all", "files", "decisions", "conversations"],
          description: "Type of content to search (default: all)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "remember_decision",
    description: "Save an architectural or technical decision for future reference. Addresses the missing context problem.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Decision title",
        },
        description: {
          type: "string",
          description: "Detailed description of the decision",
        },
        reasoning: {
          type: "string",
          description: "Why this decision was made",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorization",
        },
        relatedFiles: {
          type: "array",
          items: { type: "string" },
          description: "Related file paths",
        },
      },
      required: ["title", "description", "reasoning"],
    },
  },
  {
    name: "get_context",
    description: "Retrieve context about the codebase including index stats, recent decisions, and available knowledge.",
    inputSchema: {
      type: "object",
      properties: {
        includeDecisions: {
          type: "boolean",
          description: "Include recent decisions (default: true)",
        },
        includeStats: {
          type: "boolean",
          description: "Include index statistics (default: true)",
        },
      },
    },
  },
  {
    name: "save_conversation",
    description: "Save a conversation with context for future reference. Helps maintain continuity across sessions.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Conversation title",
        },
        context: {
          type: "string",
          description: "What was being worked on",
        },
        messages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              role: { type: "string" },
              content: { type: "string" },
            },
          },
          description: "Conversation messages",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for categorization",
        },
      },
      required: ["title", "context", "messages"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "code-memory",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize storage on startup
await ensureStorage();

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "index_codebase": {
        const params = args as unknown as { path: string };
        const targetPath = path.resolve(params.path);

        // Verify path exists
        try {
          await fs.access(targetPath);
        } catch {
          return {
            content: [
              {
                type: "text",
                text: `Error: Path does not exist: ${targetPath}`,
              },
            ],
            isError: true,
          };
        }

        const entries = await indexDirectory(targetPath);

        const index: CodebaseIndex = {
          files: entries,
          lastIndexed: new Date().toISOString(),
          rootPath: targetPath,
        };

        await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                filesIndexed: entries.length,
                rootPath: targetPath,
                lastIndexed: index.lastIndexed,
              }, null, 2),
            },
          ],
        };
      }

      case "search_code": {
        const params = args as unknown as { query: string; type?: string };
        const searchType = params.type || "all";
        const results: SearchResult[] = [];

        // Search files
        if (searchType === "all" || searchType === "files") {
          const indexData = await fs.readFile(INDEX_FILE, "utf-8");
          const index: CodebaseIndex = JSON.parse(indexData);

          for (const file of index.files) {
            try {
              const content = await fs.readFile(file.path, "utf-8");
              const match = searchInText(params.query, content);

              if (match.found) {
                results.push({
                  type: "file",
                  path: file.path,
                  relevance: match.relevance,
                  preview: match.preview,
                });
              }
            } catch (error) {
              // File may have been deleted
            }
          }
        }

        // Search decisions
        if (searchType === "all" || searchType === "decisions") {
          const decisionsData = await fs.readFile(DECISIONS_FILE, "utf-8");
          const decisions: Decision[] = JSON.parse(decisionsData);

          for (const decision of decisions) {
            const searchText = `${decision.title} ${decision.description} ${decision.reasoning} ${decision.tags.join(" ")}`;
            const match = searchInText(params.query, searchText);

            if (match.found) {
              results.push({
                type: "decision",
                id: decision.id,
                title: decision.title,
                relevance: match.relevance,
                preview: match.preview,
              });
            }
          }
        }

        // Search conversations
        if (searchType === "all" || searchType === "conversations") {
          const conversationsData = await fs.readFile(CONVERSATIONS_FILE, "utf-8");
          const conversations: Conversation[] = JSON.parse(conversationsData);

          for (const conversation of conversations) {
            const messageText = conversation.messages.map(m => m.content).join(" ");
            const searchText = `${conversation.title} ${conversation.context} ${messageText} ${conversation.tags.join(" ")}`;
            const match = searchInText(params.query, searchText);

            if (match.found) {
              results.push({
                type: "conversation",
                id: conversation.id,
                title: conversation.title,
                relevance: match.relevance,
                preview: match.preview,
              });
            }
          }
        }

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                query: params.query,
                resultCount: results.length,
                results: results.slice(0, 20), // Top 20 results
              }, null, 2),
            },
          ],
        };
      }

      case "remember_decision": {
        const params = args as unknown as {
          title: string;
          description: string;
          reasoning: string;
          tags?: string[];
          relatedFiles?: string[];
        };

        const decisionsData = await fs.readFile(DECISIONS_FILE, "utf-8");
        const decisions: Decision[] = JSON.parse(decisionsData);

        const decision: Decision = {
          id: calculateHash(params.title + Date.now()),
          timestamp: new Date().toISOString(),
          title: params.title,
          description: params.description,
          reasoning: params.reasoning,
          tags: params.tags || [],
          relatedFiles: params.relatedFiles || [],
        };

        decisions.push(decision);
        await fs.writeFile(DECISIONS_FILE, JSON.stringify(decisions, null, 2));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                decision,
              }, null, 2),
            },
          ],
        };
      }

      case "get_context": {
        const params = args as unknown as { includeDecisions?: boolean; includeStats?: boolean };
        const includeDecisions = params.includeDecisions !== false;
        const includeStats = params.includeStats !== false;

        const context: {
          stats?: {
            filesIndexed: number;
            lastIndexed: string;
            rootPath: string;
          };
          recentDecisions?: Decision[];
          totalDecisions?: number;
          totalConversations?: number;
        } = {};

        if (includeStats) {
          const indexData = await fs.readFile(INDEX_FILE, "utf-8");
          const index: CodebaseIndex = JSON.parse(indexData);

          context.stats = {
            filesIndexed: index.files.length,
            lastIndexed: index.lastIndexed,
            rootPath: index.rootPath,
          };
        }

        if (includeDecisions) {
          const decisionsData = await fs.readFile(DECISIONS_FILE, "utf-8");
          const decisions: Decision[] = JSON.parse(decisionsData);

          context.totalDecisions = decisions.length;
          context.recentDecisions = decisions.slice(-5).reverse(); // Last 5 decisions
        }

        const conversationsData = await fs.readFile(CONVERSATIONS_FILE, "utf-8");
        const conversations: Conversation[] = JSON.parse(conversationsData);
        context.totalConversations = conversations.length;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(context, null, 2),
            },
          ],
        };
      }

      case "save_conversation": {
        const params = args as unknown as {
          title: string;
          context: string;
          messages: Array<{ role: string; content: string }>;
          tags?: string[];
        };

        const conversationsData = await fs.readFile(CONVERSATIONS_FILE, "utf-8");
        const conversations: Conversation[] = JSON.parse(conversationsData);

        const conversation: Conversation = {
          id: calculateHash(params.title + Date.now()),
          timestamp: new Date().toISOString(),
          title: params.title,
          context: params.context,
          messages: params.messages,
          tags: params.tags || [],
        };

        conversations.push(conversation);
        await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                conversation: {
                  id: conversation.id,
                  title: conversation.title,
                  timestamp: conversation.timestamp,
                },
              }, null, 2),
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
  console.error("Code Memory MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
