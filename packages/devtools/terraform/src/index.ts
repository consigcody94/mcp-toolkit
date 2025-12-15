#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

const TERRAFORM_DIR = process.env.TERRAFORM_DIR || process.cwd();

interface ExecResult {
  stdout: string;
  stderr: string;
}

async function runTerraform(
  args: string[],
  cwd?: string
): Promise<ExecResult> {
  const command = `terraform ${args.join(" ")}`;
  const result = await execAsync(command, {
    cwd: cwd || TERRAFORM_DIR,
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
  });
  return result;
}

const tools: Tool[] = [
  {
    name: "generate_module",
    description: "Generate a Terraform module template",
    inputSchema: {
      type: "object",
      properties: {
        moduleName: {
          type: "string",
          description: "Name of the module (e.g., 'vpc', 'eks-cluster')",
        },
        provider: {
          type: "string",
          enum: ["aws", "azure", "gcp", "kubernetes"],
          description: "Cloud provider",
        },
        variables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              description: { type: "string" },
              default: { type: "string" },
            },
            required: ["name", "type"],
          },
          description: "Module variables",
        },
        outputs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              value: { type: "string" },
            },
            required: ["name", "value"],
          },
          description: "Module outputs",
        },
      },
      required: ["moduleName", "provider"],
    },
  },
  {
    name: "validate_config",
    description: "Validate Terraform configuration files",
    inputSchema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "Directory containing Terraform files (optional)",
        },
      },
    },
  },
  {
    name: "plan_changes",
    description: "Run terraform plan to preview infrastructure changes",
    inputSchema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "Directory containing Terraform files (optional)",
        },
        varFile: {
          type: "string",
          description: "Path to variables file (optional)",
        },
        target: {
          type: "string",
          description: "Target specific resource (optional)",
        },
      },
    },
  },
  {
    name: "list_resources",
    description: "List all resources in Terraform state",
    inputSchema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "Directory containing Terraform files (optional)",
        },
        filter: {
          type: "string",
          description: "Filter resources by type or name (optional)",
        },
      },
    },
  },
  {
    name: "check_drift",
    description: "Check for configuration drift between state and actual infrastructure",
    inputSchema: {
      type: "object",
      properties: {
        directory: {
          type: "string",
          description: "Directory containing Terraform files (optional)",
        },
        detailed: {
          type: "boolean",
          description: "Show detailed drift information (default: false)",
        },
      },
    },
  },
];

function generateProviderConfig(provider: string): string {
  switch (provider) {
    case "aws":
      return `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}`;
    case "azure":
      return `terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}`;
    case "gcp":
      return `terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}`;
    case "kubernetes":
      return `terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

provider "kubernetes" {
  config_path = var.kubeconfig_path
}`;
    default:
      return "";
  }
}

function generateVariablesFile(
  variables: Array<{
    name: string;
    type: string;
    description?: string;
    default?: string;
  }>
): string {
  let content = "";

  for (const variable of variables) {
    content += `variable "${variable.name}" {\n`;
    content += `  type        = ${variable.type}\n`;
    if (variable.description) {
      content += `  description = "${variable.description}"\n`;
    }
    if (variable.default) {
      content += `  default     = ${variable.default}\n`;
    }
    content += `}\n\n`;
  }

  return content;
}

function generateOutputsFile(
  outputs: Array<{ name: string; description?: string; value: string }>
): string {
  let content = "";

  for (const output of outputs) {
    content += `output "${output.name}" {\n`;
    if (output.description) {
      content += `  description = "${output.description}"\n`;
    }
    content += `  value       = ${output.value}\n`;
    content += `}\n\n`;
  }

  return content;
}

const server = new Server(
  {
    name: "infra-sage",
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
      case "generate_module": {
        const moduleName = args.moduleName as string;
        const provider = args.provider as string;
        const variables = (args.variables as Array<{
          name: string;
          type: string;
          description?: string;
          default?: string;
        }>) || [];
        const outputs = (args.outputs as Array<{
          name: string;
          description?: string;
          value: string;
        }>) || [];

        const modulePath = path.join(TERRAFORM_DIR, "modules", moduleName);
        await fs.mkdir(modulePath, { recursive: true });

        // Generate main.tf
        const mainContent = generateProviderConfig(provider);
        await fs.writeFile(
          path.join(modulePath, "main.tf"),
          mainContent,
          "utf-8"
        );

        // Generate variables.tf
        if (variables.length > 0) {
          const variablesContent = generateVariablesFile(variables);
          await fs.writeFile(
            path.join(modulePath, "variables.tf"),
            variablesContent,
            "utf-8"
          );
        }

        // Generate outputs.tf
        if (outputs.length > 0) {
          const outputsContent = generateOutputsFile(outputs);
          await fs.writeFile(
            path.join(modulePath, "outputs.tf"),
            outputsContent,
            "utf-8"
          );
        }

        // Generate README.md
        const readmeContent = `# ${moduleName} Module

Provider: ${provider}

## Variables

${variables.map((v) => `- **${v.name}** (${v.type}): ${v.description || "No description"}`).join("\n")}

## Outputs

${outputs.map((o) => `- **${o.name}**: ${o.description || "No description"}`).join("\n")}

## Usage

\`\`\`hcl
module "${moduleName}" {
  source = "./modules/${moduleName}"

${variables.map((v) => `  ${v.name} = var.${v.name}`).join("\n")}
}
\`\`\`
`;
        await fs.writeFile(
          path.join(modulePath, "README.md"),
          readmeContent,
          "utf-8"
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  modulePath,
                  filesCreated: [
                    "main.tf",
                    "variables.tf",
                    "outputs.tf",
                    "README.md",
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "validate_config": {
        const directory = (args.directory as string) || TERRAFORM_DIR;

        // First, init if needed
        try {
          await runTerraform(["init", "-backend=false"], directory);
        } catch (error) {
          // Ignore init errors, continue with validation
        }

        const result = await runTerraform(["validate", "-json"], directory);
        const validation = JSON.parse(result.stdout);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  valid: validation.valid,
                  diagnostics: validation.diagnostics || [],
                  errorCount: validation.error_count || 0,
                  warningCount: validation.warning_count || 0,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "plan_changes": {
        const directory = (args.directory as string) || TERRAFORM_DIR;
        const varFile = args.varFile as string | undefined;
        const target = args.target as string | undefined;

        const planArgs = ["plan", "-no-color"];

        if (varFile) {
          planArgs.push(`-var-file=${varFile}`);
        }

        if (target) {
          planArgs.push(`-target=${target}`);
        }

        const result = await runTerraform(planArgs, directory);

        // Parse plan output for summary
        const output = result.stdout;
        const lines = output.split("\n");
        let summary = "";
        let capturing = false;

        for (const line of lines) {
          if (line.includes("Plan:") || line.includes("No changes")) {
            capturing = true;
          }
          if (capturing) {
            summary += line + "\n";
            if (line.trim() === "") {
              break;
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  summary: summary.trim(),
                  fullOutput: output.substring(0, 2000), // Limit output size
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_resources": {
        const directory = (args.directory as string) || TERRAFORM_DIR;
        const filter = args.filter as string | undefined;

        const result = await runTerraform(["state", "list"], directory);
        let resources = result.stdout.split("\n").filter((r) => r.trim());

        if (filter) {
          resources = resources.filter((r) =>
            r.toLowerCase().includes(filter.toLowerCase())
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: resources.length,
                  resources,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "check_drift": {
        const directory = (args.directory as string) || TERRAFORM_DIR;
        const detailed = (args.detailed as boolean) || false;

        const refreshArgs = ["plan", "-refresh-only", "-no-color"];
        const result = await runTerraform(refreshArgs, directory);

        const output = result.stdout;
        const hasDrift = !output.includes("No changes");

        let driftDetails = "";
        if (detailed && hasDrift) {
          // Extract drift information
          const lines = output.split("\n");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes("will be updated") || line.includes("has changed")) {
              driftDetails += line + "\n";
              // Capture next few lines for context
              for (let j = 1; j <= 5 && i + j < lines.length; j++) {
                driftDetails += lines[i + j] + "\n";
              }
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  hasDrift,
                  message: hasDrift
                    ? "Configuration drift detected"
                    : "No drift detected",
                  details: detailed ? driftDetails : undefined,
                  summary: output.substring(0, 1000),
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
  console.error("Infra Sage MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
