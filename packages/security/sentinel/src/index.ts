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

// Types
interface SecurityIssue {
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  line: number;
  column?: number;
  code: string;
  message: string;
  recommendation: string;
  owaspCategory?: string;
}

interface ScanResult {
  file: string;
  issues: SecurityIssue[];
  scanned: boolean;
  error?: string;
}

interface SecurityReport {
  summary: {
    totalFiles: number;
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    infoIssues: number;
  };
  scanDate: string;
  results: ScanResult[];
}

// Security patterns
interface SecurityPattern {
  pattern: RegExp;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  recommendation: string;
  owaspCategory?: string;
}

const SECURITY_PATTERNS: SecurityPattern[] = [
  // Secrets and credentials (Critical)
  {
    pattern: /(?:password|passwd|pwd|secret|token|api[_-]?key|private[_-]?key|auth[_-]?token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    type: "hardcoded_secret",
    severity: "critical",
    message: "Potential hardcoded secret or credential detected",
    recommendation: "Use environment variables or secure secret management systems",
    owaspCategory: "A02:2021 - Cryptographic Failures",
  },
  {
    pattern: /(?:BEGIN|END)\s+(?:RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY/gi,
    type: "private_key",
    severity: "critical",
    message: "Private key detected in source code",
    recommendation: "Remove private keys and use secure key management",
    owaspCategory: "A02:2021 - Cryptographic Failures",
  },
  {
    pattern: /(?:aws_access_key_id|aws_secret_access_key|AKIA[0-9A-Z]{16})/gi,
    type: "aws_credentials",
    severity: "critical",
    message: "AWS credentials detected",
    recommendation: "Use IAM roles or AWS Secrets Manager",
    owaspCategory: "A02:2021 - Cryptographic Failures",
  },

  // SQL Injection (High)
  {
    pattern: /(?:execute|query|exec|run)(?:Query|Sql|Statement)?\s*\(\s*['"`]?\s*(?:SELECT|INSERT|UPDATE|DELETE).*?\$\{.*?\}/gi,
    type: "sql_injection",
    severity: "high",
    message: "Potential SQL injection vulnerability - dynamic query with string interpolation",
    recommendation: "Use parameterized queries or prepared statements",
    owaspCategory: "A03:2021 - Injection",
  },
  {
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+.*?\+\s*(?:req\.|params\.|query\.|body\.)/gi,
    type: "sql_injection",
    severity: "high",
    message: "Potential SQL injection vulnerability - string concatenation with user input",
    recommendation: "Use parameterized queries or ORM methods",
    owaspCategory: "A03:2021 - Injection",
  },

  // XSS (High)
  {
    pattern: /innerHTML\s*=\s*(?:req\.|params\.|query\.|body\.|.*?\$\{)/gi,
    type: "xss",
    severity: "high",
    message: "Potential XSS vulnerability - setting innerHTML with user input",
    recommendation: "Use textContent or sanitize input with DOMPurify",
    owaspCategory: "A03:2021 - Injection",
  },
  {
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\{?\s*__html:/gi,
    type: "xss",
    severity: "high",
    message: "Potential XSS vulnerability - using dangerouslySetInnerHTML",
    recommendation: "Sanitize HTML content before rendering",
    owaspCategory: "A03:2021 - Injection",
  },
  {
    pattern: /document\.write\s*\(\s*(?:req\.|params\.|query\.|.*?\$\{)/gi,
    type: "xss",
    severity: "high",
    message: "Potential XSS vulnerability - document.write with user input",
    recommendation: "Use safe DOM methods and sanitize input",
    owaspCategory: "A03:2021 - Injection",
  },

  // Command Injection (Critical)
  {
    pattern: /(?:exec|spawn|execFile|execSync|spawnSync)\s*\(\s*['"`]?.*?\$\{/gi,
    type: "command_injection",
    severity: "critical",
    message: "Potential command injection vulnerability",
    recommendation: "Avoid dynamic command execution, use allowlists, or use libraries instead",
    owaspCategory: "A03:2021 - Injection",
  },
  {
    pattern: /child_process\.exec\s*\(.*?(?:req\.|params\.|query\.|body\.)/gi,
    type: "command_injection",
    severity: "critical",
    message: "Potential command injection - user input in exec",
    recommendation: "Use execFile with argument arrays or avoid shell execution",
    owaspCategory: "A03:2021 - Injection",
  },

  // Path Traversal (High)
  {
    pattern: /(?:readFile|writeFile|unlink|rmdir|mkdir|open|stat)\s*\(\s*(?:req\.|params\.|query\.|body\.|.*?path\.join\(.*?req\.)/gi,
    type: "path_traversal",
    severity: "high",
    message: "Potential path traversal vulnerability - filesystem access with user input",
    recommendation: "Validate and sanitize file paths, use allowlists",
    owaspCategory: "A01:2021 - Broken Access Control",
  },

  // Insecure Crypto (Medium)
  {
    pattern: /crypto\.createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/gi,
    type: "weak_crypto",
    severity: "medium",
    message: "Weak cryptographic hash algorithm detected (MD5/SHA1)",
    recommendation: "Use SHA-256 or stronger hashing algorithms",
    owaspCategory: "A02:2021 - Cryptographic Failures",
  },
  {
    pattern: /Math\.random\(\)/gi,
    type: "weak_random",
    severity: "medium",
    message: "Math.random() is not cryptographically secure",
    recommendation: "Use crypto.randomBytes() for security-sensitive operations",
    owaspCategory: "A02:2021 - Cryptographic Failures",
  },

  // Authentication Issues (High)
  {
    pattern: /(?:bcrypt|crypto\.createHash)\s*\(.*?\)\s*\.(?:compare|update)\s*\([^)]*['"](?:password|passwd|pwd)['"]/gi,
    type: "password_in_plain",
    severity: "high",
    message: "Potential plain text password usage",
    recommendation: "Ensure passwords are hashed before comparison",
    owaspCategory: "A07:2021 - Identification and Authentication Failures",
  },

  // CORS Issues (Medium)
  {
    pattern: /Access-Control-Allow-Origin['"]?\s*:\s*['"]?\*/gi,
    type: "permissive_cors",
    severity: "medium",
    message: "Overly permissive CORS policy detected",
    recommendation: "Specify allowed origins explicitly",
    owaspCategory: "A05:2021 - Security Misconfiguration",
  },

  // Eval and dangerous functions (Critical)
  {
    pattern: /\beval\s*\(/gi,
    type: "dangerous_function",
    severity: "critical",
    message: "Use of eval() is extremely dangerous",
    recommendation: "Never use eval() with user input, find alternative solutions",
    owaspCategory: "A03:2021 - Injection",
  },
  {
    pattern: /new\s+Function\s*\(/gi,
    type: "dangerous_function",
    severity: "high",
    message: "Dynamic function creation can be dangerous",
    recommendation: "Avoid Function constructor, use static functions",
    owaspCategory: "A03:2021 - Injection",
  },

  // SSRF (High)
  {
    pattern: /(?:fetch|axios|request|http\.get|https\.get)\s*\(\s*(?:req\.|params\.|query\.|body\.|.*?\$\{)/gi,
    type: "ssrf",
    severity: "high",
    message: "Potential SSRF vulnerability - HTTP request with user-controlled URL",
    recommendation: "Validate and allowlist URLs, avoid user-controlled destinations",
    owaspCategory: "A10:2021 - Server-Side Request Forgery",
  },

  // Insecure deserialization (High)
  {
    pattern: /JSON\.parse\s*\(\s*(?:req\.|params\.|query\.)/gi,
    type: "insecure_deserialization",
    severity: "medium",
    message: "Parsing user input without validation",
    recommendation: "Validate JSON structure and content before parsing",
    owaspCategory: "A08:2021 - Software and Data Integrity Failures",
  },

  // Debug/Development code (Low)
  {
    pattern: /console\.(?:log|debug|info|warn|error)\s*\(/gi,
    type: "debug_code",
    severity: "low",
    message: "Console logging detected - may leak sensitive information",
    recommendation: "Remove debug logging or use proper logging framework in production",
    owaspCategory: "A09:2021 - Security Logging and Monitoring Failures",
  },
  {
    pattern: /(?:TODO|FIXME|HACK|XXX):\s*security/gi,
    type: "security_todo",
    severity: "medium",
    message: "Security-related TODO comment found",
    recommendation: "Address security TODOs before deployment",
    owaspCategory: "A05:2021 - Security Misconfiguration",
  },
];

// File scanning
async function scanFile(filePath: string): Promise<ScanResult> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const issues: SecurityIssue[] = [];

    for (const pattern of SECURITY_PATTERNS) {
      const matches = content.matchAll(pattern.pattern);

      for (const match of matches) {
        if (!match.index) continue;

        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split("\n").length;

        // Get the actual code line
        const codeLine = lines[lineNumber - 1] || "";

        issues.push({
          type: pattern.type,
          severity: pattern.severity,
          line: lineNumber,
          code: codeLine.trim(),
          message: pattern.message,
          recommendation: pattern.recommendation,
          owaspCategory: pattern.owaspCategory,
        });
      }
    }

    return {
      file: filePath,
      issues,
      scanned: true,
    };
  } catch (error) {
    return {
      file: filePath,
      issues: [],
      scanned: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function scanDirectory(dirPath: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const extensions = [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".php", ".rb", ".go"];
  const excludeDirs = ["node_modules", ".git", "dist", "build", "coverage", "vendor"];

  async function walkDir(currentPath: string): Promise<void> {
    const items = await fs.readdir(currentPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        if (!excludeDirs.includes(item.name)) {
          await walkDir(fullPath);
        }
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (extensions.includes(ext)) {
          const result = await scanFile(fullPath);
          results.push(result);
        }
      }
    }
  }

  await walkDir(dirPath);
  return results;
}

function generateReport(results: ScanResult[]): SecurityReport {
  const summary = {
    totalFiles: results.length,
    totalIssues: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
    infoIssues: 0,
  };

  for (const result of results) {
    summary.totalIssues += result.issues.length;
    for (const issue of result.issues) {
      switch (issue.severity) {
        case "critical":
          summary.criticalIssues++;
          break;
        case "high":
          summary.highIssues++;
          break;
        case "medium":
          summary.mediumIssues++;
          break;
        case "low":
          summary.lowIssues++;
          break;
        case "info":
          summary.infoIssues++;
          break;
      }
    }
  }

  return {
    summary,
    scanDate: new Date().toISOString(),
    results: results.filter(r => r.issues.length > 0),
  };
}

// Define tools
const tools: Tool[] = [
  {
    name: "scan_file",
    description: "Scan a single file for security vulnerabilities including secrets, SQL injection, XSS, and more",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file to scan",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "scan_directory",
    description: "Recursively scan a directory for security vulnerabilities. Checks all code files.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the directory to scan",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "check_secrets",
    description: "Specifically check for hardcoded secrets, API keys, passwords, and credentials",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to file or directory to check",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "validate_owasp",
    description: "Validate code against OWASP Top 10 security risks with categorized results",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to file or directory to validate",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "security_report",
    description: "Generate a comprehensive security report with statistics and prioritized findings",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to file or directory to analyze",
        },
        format: {
          type: "string",
          enum: ["detailed", "summary"],
          description: "Report format (default: detailed)",
        },
      },
      required: ["path"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "sentinel-ai",
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
      case "scan_file": {
        const params = args as unknown as { path: string };
        const targetPath = path.resolve(params.path);

        const result = await scanFile(targetPath);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "scan_directory": {
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

        const results = await scanDirectory(targetPath);
        const report = generateReport(results);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(report, null, 2),
            },
          ],
        };
      }

      case "check_secrets": {
        const params = args as unknown as { path: string };
        const targetPath = path.resolve(params.path);

        const stat = await fs.stat(targetPath);
        let results: ScanResult[];

        if (stat.isDirectory()) {
          results = await scanDirectory(targetPath);
        } else {
          results = [await scanFile(targetPath)];
        }

        // Filter only secret-related issues
        const secretTypes = ["hardcoded_secret", "private_key", "aws_credentials"];
        const secretIssues = results.map(r => ({
          ...r,
          issues: r.issues.filter(i => secretTypes.includes(i.type)),
        })).filter(r => r.issues.length > 0);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                totalSecrets: secretIssues.reduce((sum, r) => sum + r.issues.length, 0),
                results: secretIssues,
              }, null, 2),
            },
          ],
        };
      }

      case "validate_owasp": {
        const params = args as unknown as { path: string };
        const targetPath = path.resolve(params.path);

        const stat = await fs.stat(targetPath);
        let results: ScanResult[];

        if (stat.isDirectory()) {
          results = await scanDirectory(targetPath);
        } else {
          results = [await scanFile(targetPath)];
        }

        // Group by OWASP category
        const owaspCategories: Record<string, SecurityIssue[]> = {};

        for (const result of results) {
          for (const issue of result.issues) {
            if (issue.owaspCategory) {
              if (!owaspCategories[issue.owaspCategory]) {
                owaspCategories[issue.owaspCategory] = [];
              }
              owaspCategories[issue.owaspCategory].push(issue);
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                owaspValidation: owaspCategories,
                totalCategories: Object.keys(owaspCategories).length,
                totalIssues: Object.values(owaspCategories).reduce((sum, issues) => sum + issues.length, 0),
              }, null, 2),
            },
          ],
        };
      }

      case "security_report": {
        const params = args as unknown as { path: string; format?: string };
        const targetPath = path.resolve(params.path);
        const format = params.format || "detailed";

        const stat = await fs.stat(targetPath);
        let results: ScanResult[];

        if (stat.isDirectory()) {
          results = await scanDirectory(targetPath);
        } else {
          results = [await scanFile(targetPath)];
        }

        const report = generateReport(results);

        if (format === "summary") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  summary: report.summary,
                  scanDate: report.scanDate,
                  filesWithIssues: report.results.length,
                }, null, 2),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(report, null, 2),
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
  console.error("Sentinel AI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
