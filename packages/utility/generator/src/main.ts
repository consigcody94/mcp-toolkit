import { Actor } from 'apify';
import { log } from 'crawlee';
import SwaggerParser from 'swagger-parser';
import axios from 'axios';
import Handlebars from 'handlebars';
import yaml from 'js-yaml';

interface Input {
    openApiSource: string;
    language: 'typescript' | 'python';
    serverName: string;
    includeAllEndpoints: boolean;
    filterTags: string[];
    includeAuth: boolean;
    generateTests: boolean;
}

interface MCPTool {
    name: string;
    description: string;
    method: string;
    path: string;
    parameters: any[];
    requestBody?: any;
    responses: any;
}

const TYPESCRIPT_TEMPLATE = `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';

const API_BASE_URL = '{{baseUrl}}';
const server = new Server({ name: '{{serverName}}', version: '1.0.0' }, { capabilities: { tools: {} } });

{{#each tools}}
server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name === '{{name}}') {
        try {
            const response = await axios.{{method}}(\`\${API_BASE_URL}{{path}}\`, {
                {{#if hasParams}}params: request.params.arguments,{{/if}}
                {{#if hasBody}}data: request.params.arguments,{{/if}}
            });
            return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
        } catch (error) {
            return { content: [{ type: 'text', text: \`Error: \${error.message}\` }], isError: true };
        }
    }
});

{{/each}}

server.setRequestHandler('tools/list', async () => ({
    tools: [
        {{#each tools}}
        { name: '{{name}}', description: '{{description}}', inputSchema: { type: 'object', properties: {} } },
        {{/each}}
    ]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
`;

const PYTHON_TEMPLATE = `from mcp.server import Server
from mcp.server.stdio import stdio_server
import httpx

API_BASE_URL = "{{baseUrl}}"
server = Server("{{serverName}}")

{{#each tools}}
@server.call_tool()
async def {{name}}(**kwargs):
    \"\"\"{{description}}\"\"\"
    async with httpx.AsyncClient() as client:
        response = await client.{{method}}(f"{API_BASE_URL}{{path}}", {{#if hasParams}}params=kwargs{{/if}}{{#if hasBody}}json=kwargs{{/if}})
        return response.json()

{{/each}}

if __name__ == "__main__":
    stdio_server(server)
`;

async function main() {
    await Actor.init();

    try {
        const input = await Actor.getInput<Input>();

        if (!input?.openApiSource) {
            throw new Error('Missing required input: openApiSource');
        }

        log.info('Starting MCP Server Generator', { input });

        // Parse OpenAPI spec
        let openApiSpec: any;

        if (input.openApiSource.startsWith('http')) {
            log.info('Fetching OpenAPI spec from URL', { url: input.openApiSource });
            const response = await axios.get(input.openApiSource);
            openApiSpec = response.data;
        } else {
            // Try parsing as JSON or YAML
            try {
                openApiSpec = JSON.parse(input.openApiSource);
            } catch {
                openApiSpec = yaml.load(input.openApiSource) as any;
            }
        }

        log.info('Validating and dereferencing OpenAPI spec');
        const parser = new (SwaggerParser as any)();
        const api = await parser.validate(openApiSpec);

        log.info('OpenAPI spec validated', {
            title: api.info?.title,
            version: api.info?.version,
            pathCount: Object.keys(api.paths || {}).length,
        });

        // Extract base URL
        const baseUrl = api.servers?.[0]?.url || 'https://api.example.com';

        // Generate MCP tools from endpoints
        const tools: MCPTool[] = [];

        for (const [path, pathItem] of Object.entries(api.paths || {})) {
            for (const [method, operation] of Object.entries(pathItem as any)) {
                if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                    const op = operation as any;

                    // Filter by tags if needed
                    if (!input.includeAllEndpoints && input.filterTags.length > 0) {
                        const operationTags = op.tags || [];
                        if (!operationTags.some((tag: string) => input.filterTags.includes(tag))) {
                            continue;
                        }
                    }

                    const toolName = (op.operationId || `${method}_${path.replace(/[\/\{\}]/g, '_')}`)
                        .replace(/[^a-zA-Z0-9_]/g, '_')
                        .toLowerCase();

                    tools.push({
                        name: toolName,
                        description: op.summary || op.description || `${method.toUpperCase()} ${path}`,
                        method: method.toLowerCase(),
                        path,
                        parameters: op.parameters || [],
                        requestBody: op.requestBody,
                        responses: op.responses,
                    });
                }
            }
        }

        log.info(`Generated ${tools.length} MCP tools from OpenAPI spec`);

        // Generate server code
        const template = input.language === 'typescript' ? TYPESCRIPT_TEMPLATE : PYTHON_TEMPLATE;
        const compiled = Handlebars.compile(template);

        const serverCode = compiled({
            serverName: input.serverName,
            baseUrl,
            tools: tools.map(t => ({
                ...t,
                hasParams: t.parameters.length > 0,
                hasBody: !!t.requestBody,
            })),
        });

        // Generate package.json or requirements.txt
        const dependencies = input.language === 'typescript'
            ? {
                  name: input.serverName,
                  version: '1.0.0',
                  type: 'module',
                  dependencies: {
                      '@modelcontextprotocol/sdk': '^1.0.0',
                      axios: '^1.6.0',
                  },
              }
            : {
                  requirements: ['mcp>=1.0.0', 'httpx>=0.25.0'],
              };

        // Generate README
        const readme = `# ${input.serverName}

MCP Server generated from OpenAPI specification

## Installation

\`\`\`bash
${input.language === 'typescript' ? 'npm install' : 'pip install -r requirements.txt'}
\`\`\`

## Usage

\`\`\`bash
${input.language === 'typescript' ? 'node server.js' : 'python server.py'}
\`\`\`

## Available Tools

${tools.map(t => `- **${t.name}**: ${t.description}`).join('\n')}

## Generated by Apify MCP Server Generator
`;

        // Save outputs
        await Actor.setValue('server_code', serverCode);
        await Actor.setValue('package_config', JSON.stringify(dependencies, null, 2));
        await Actor.setValue('readme', readme);

        await Actor.pushData({
            serverName: input.serverName,
            language: input.language,
            toolCount: tools.length,
            baseUrl,
            files: {
                server: input.language === 'typescript' ? 'server.ts' : 'server.py',
                config: input.language === 'typescript' ? 'package.json' : 'requirements.txt',
                readme: 'README.md',
            },
        });

        log.info('✅ MCP Server generation complete', {
            toolCount: tools.length,
            language: input.language,
        });

    } catch (error) {
        log.error('Actor failed with error', { error });
        throw error;
    }

    await Actor.exit();
}

main();
