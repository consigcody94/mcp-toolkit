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
import matter from "gray-matter";

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH;

if (!VAULT_PATH) {
  console.error("OBSIDIAN_VAULT_PATH environment variable is required");
  process.exit(1);
}

interface NoteMetadata {
  path: string;
  title: string;
  frontmatter: Record<string, any>;
  links: string[];
  tags: string[];
}

const tools: Tool[] = [
  {
    name: "create_note",
    description: "Create a new note in the Obsidian vault",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Note title (will be used as filename)",
        },
        content: {
          type: "string",
          description: "Note content (markdown)",
        },
        folder: {
          type: "string",
          description: "Folder path relative to vault root (optional)",
        },
        frontmatter: {
          type: "object",
          description: "YAML frontmatter metadata (optional)",
        },
      },
      required: ["title", "content"],
    },
  },
  {
    name: "search_notes",
    description: "Search notes by content or frontmatter",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (searches in content and title)",
        },
        tag: {
          type: "string",
          description: "Filter by tag (optional)",
        },
        folder: {
          type: "string",
          description: "Filter by folder (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 10)",
          minimum: 1,
          maximum: 100,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_backlinks",
    description: "Get all notes that link to a specific note",
    inputSchema: {
      type: "object",
      properties: {
        notePath: {
          type: "string",
          description: "Path to the note (relative to vault root)",
        },
      },
      required: ["notePath"],
    },
  },
  {
    name: "create_graph",
    description: "Generate a graph of note connections",
    inputSchema: {
      type: "object",
      properties: {
        rootNote: {
          type: "string",
          description: "Start from this note (optional, defaults to all notes)",
        },
        depth: {
          type: "number",
          description: "Maximum depth to traverse (default: 2)",
          minimum: 1,
          maximum: 5,
        },
      },
    },
  },
  {
    name: "update_frontmatter",
    description: "Update or add frontmatter to a note",
    inputSchema: {
      type: "object",
      properties: {
        notePath: {
          type: "string",
          description: "Path to the note (relative to vault root)",
        },
        frontmatter: {
          type: "object",
          description: "Frontmatter fields to update/add",
        },
        merge: {
          type: "boolean",
          description: "Merge with existing frontmatter (default: true)",
        },
      },
      required: ["notePath", "frontmatter"],
    },
  },
];

async function getAllNotes(): Promise<NoteMetadata[]> {
  const notes: NoteMetadata[] = [];

  async function scanDir(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".")) {
          await scanDir(fullPath);
        }
      } else if (entry.name.endsWith(".md")) {
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          const parsed = matter(content);
          const relativePath = path.relative(VAULT_PATH!, fullPath);

          const links: string[] = [];
          const linkRegex = /\[\[([^\]]+)\]\]/g;
          let match;
          while ((match = linkRegex.exec(content)) !== null) {
            links.push(match[1].split("|")[0].trim());
          }

          const tags: string[] = [];
          const tagRegex = /#([\w/-]+)/g;
          while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
          }

          notes.push({
            path: relativePath,
            title: parsed.data.title || entry.name.replace(".md", ""),
            frontmatter: parsed.data,
            links,
            tags,
          });
        } catch (error) {
          console.error(`Error reading note ${fullPath}:`, error);
        }
      }
    }
  }

  await scanDir(VAULT_PATH!);
  return notes;
}

async function getNoteContent(notePath: string): Promise<string> {
  const fullPath = path.join(VAULT_PATH!, notePath);
  return await fs.readFile(fullPath, "utf-8");
}

async function writeNote(
  notePath: string,
  content: string,
  frontmatter?: Record<string, any>
): Promise<void> {
  const fullPath = path.join(VAULT_PATH!, notePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  let finalContent = content;
  if (frontmatter && Object.keys(frontmatter).length > 0) {
    finalContent = matter.stringify(content, frontmatter);
  }

  await fs.writeFile(fullPath, finalContent, "utf-8");
}

const server = new Server(
  {
    name: "vault-weaver",
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
      case "create_note": {
        const title = args.title as string;
        const content = args.content as string;
        const folder = (args.folder as string) || "";
        const frontmatter = (args.frontmatter as Record<string, any>) || {};

        const filename = `${title.replace(/[^a-zA-Z0-9-_ ]/g, "")}.md`;
        const notePath = path.join(folder, filename);

        await writeNote(notePath, content, frontmatter);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  path: notePath,
                  title,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "search_notes": {
        const query = (args.query as string).toLowerCase();
        const tag = args.tag as string | undefined;
        const folder = args.folder as string | undefined;
        const limit = (args.limit as number) || 10;

        const allNotes = await getAllNotes();
        let results = allNotes.filter((note) => {
          const matchesQuery =
            note.title.toLowerCase().includes(query) ||
            note.path.toLowerCase().includes(query);

          const matchesTag = tag ? note.tags.includes(tag) : true;
          const matchesFolder = folder ? note.path.startsWith(folder) : true;

          return matchesQuery && matchesTag && matchesFolder;
        });

        results = results.slice(0, limit);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: results.length,
                  results: results.map((note) => ({
                    path: note.path,
                    title: note.title,
                    tags: note.tags,
                    linkCount: note.links.length,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_backlinks": {
        const notePath = args.notePath as string;
        const noteTitle = path.basename(notePath, ".md");
        const allNotes = await getAllNotes();

        const backlinks = allNotes.filter((note) =>
          note.links.some(
            (link) =>
              link === noteTitle ||
              link === notePath ||
              link === notePath.replace(".md", "")
          )
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  note: notePath,
                  backlinkCount: backlinks.length,
                  backlinks: backlinks.map((note) => ({
                    path: note.path,
                    title: note.title,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "create_graph": {
        const rootNote = args.rootNote as string | undefined;
        const depth = (args.depth as number) || 2;
        const allNotes = await getAllNotes();

        interface GraphNode {
          id: string;
          title: string;
          links: string[];
        }

        const graph: GraphNode[] = [];
        const visited = new Set<string>();

        function addNode(notePath: string, currentDepth: number): void {
          if (currentDepth > depth || visited.has(notePath)) {
            return;
          }

          visited.add(notePath);
          const note = allNotes.find((n) => n.path === notePath);

          if (!note) {
            return;
          }

          graph.push({
            id: note.path,
            title: note.title,
            links: note.links,
          });

          for (const link of note.links) {
            const linkedNote = allNotes.find(
              (n) =>
                n.title === link ||
                n.path === link ||
                n.path === `${link}.md`
            );

            if (linkedNote) {
              addNode(linkedNote.path, currentDepth + 1);
            }
          }
        }

        if (rootNote) {
          addNode(rootNote, 1);
        } else {
          // Include all notes if no root specified
          for (const note of allNotes.slice(0, 50)) {
            // Limit to 50 for performance
            if (!visited.has(note.path)) {
              addNode(note.path, 1);
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  nodeCount: graph.length,
                  nodes: graph,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "update_frontmatter": {
        const notePath = args.notePath as string;
        const newFrontmatter = args.frontmatter as Record<string, any>;
        const merge = args.merge !== false;

        const content = await getNoteContent(notePath);
        const parsed = matter(content);

        const updatedFrontmatter = merge
          ? { ...parsed.data, ...newFrontmatter }
          : newFrontmatter;

        await writeNote(notePath, parsed.content, updatedFrontmatter);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  path: notePath,
                  frontmatter: updatedFrontmatter,
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
  console.error("Vault Weaver MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
