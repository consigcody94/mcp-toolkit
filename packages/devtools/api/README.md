# API Pilot 🚀

**Comprehensive MCP server for API mocking and exploration through natural language**

Build mock APIs, test endpoints, explore OpenAPI specifications, and manage API collections - all through conversational commands in Claude Desktop.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)

## Features

### Mock API Server 🎭

- **Create Mock Servers**: Spin up local HTTP servers for testing
- **Dynamic Routes**: Add GET/POST/PUT/PATCH/DELETE endpoints on the fly
- **Response Control**: Configure status codes, headers, bodies, and delays
- **Server Management**: Start/stop servers, list active servers, manage routes
- **Perfect for**: Frontend development, integration testing, API prototyping

### API Client & Collections 📡

- **HTTP Requests**: Make requests to any API with full control
- **Collections**: Organize requests like Postman/Insomnia
- **Variables**: Use `{{variable}}` placeholders in URLs and bodies
- **Authentication**: Support for Bearer, Basic, and API Key auth
- **Request Library**: Save and reuse common API calls

### OpenAPI/Swagger Exploration 📖

- **Spec Parsing**: Load OpenAPI 2.0/3.0 specs from URLs or files
- **Endpoint Discovery**: List all available endpoints with descriptions
- **Schema Introspection**: Browse data models and types
- **Detailed Exploration**: Get full documentation for any endpoint
- **Generate Collections**: Convert specs into executable request collections

## Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Claude Desktop** (for MCP integration)

### Install API Pilot

```bash
# Clone the repository
git clone https://github.com/consigcody94/api-pilot.git
cd api-pilot

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional, for easier access)
npm link
```

### Configure Claude Desktop

Add API Pilot to your Claude Desktop MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "api-pilot": {
      "command": "node",
      "args": ["/absolute/path/to/api-pilot/dist/index.js"]
    }
  }
}
```

**Restart Claude Desktop** after configuration.

## Usage

### Mock Server Examples

**Create a Mock Server**:
```
Create a mock API server on port 3001
```

**Add Routes**:
```
Add a GET route to server-123 at /api/users that returns a list of 3 users
Add a POST route at /api/login with status 200 and a success message
Add a GET route at /api/products with a 2 second delay
```

**Start/Stop Servers**:
```
Start mock server server-123
Stop the mock server
List all my mock servers
```

### API Client Examples

**Make HTTP Requests**:
```
Make a GET request to https://api.github.com/users/octocat
POST to https://jsonplaceholder.typicode.com/posts with title and body
Make a GET request with Bearer token authentication
```

**Manage Collections**:
```
Create an API collection called "GitHub API"
Add a GET request to my collection for fetching user repos
Set the baseUrl variable to https://api.github.com in my collection
Execute the user repos request from my GitHub API collection
List all my API collections
```

**Variables**:
```
Create a collection with base URL https://api.example.com
Add a request with URL {{baseUrl}}/users/{{userId}}
Set variable userId to 123 in the collection
Execute the request (will use https://api.example.com/users/123)
```

### OpenAPI Examples

**Parse Specifications**:
```
Parse the OpenAPI spec at https://petstore.swagger.io/v2/swagger.json
Parse the Stripe API specification
Load the OpenAPI spec from ./api-docs/openapi.yaml
```

**Explore APIs**:
```
List all endpoints in spec-456
Show me details about the GET /pet/{petId} endpoint
Get all schemas from the parsed spec
Show me the User schema definition
```

## MCP Tools Reference

### Mock Server Tools (5 tools)

| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `create_mock_server` | Create a new mock API server | `port`, `name` |
| `add_mock_route` | Add a route to a server | `serverId`, `method`, `path`, `status`, `body`, `delay` |
| `start_mock_server` | Start a mock server | `serverId` |
| `stop_mock_server` | Stop a running server | `serverId` |
| `list_mock_servers` | List all mock servers | None |

### API Client Tools (6 tools)

| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `make_http_request` | Make an HTTP request | `method`, `url`, `headers`, `body`, `query` |
| `create_collection` | Create request collection | `name`, `description`, `baseUrl` |
| `add_request_to_collection` | Add request to collection | `collectionId`, `name`, `method`, `url` |
| `execute_collection_request` | Run saved request | `collectionId`, `requestId` |
| `list_collections` | List all collections | None |
| `set_collection_variable` | Set collection variable | `collectionId`, `key`, `value` |

### OpenAPI Tools (4 tools)

| Tool | Description | Key Arguments |
|------|-------------|---------------|
| `parse_openapi_spec` | Parse OpenAPI/Swagger spec | `source` (URL or file path) |
| `list_api_endpoints` | List all endpoints | `specId` |
| `get_endpoint_details` | Get endpoint details | `specId`, `method`, `path` |
| `get_api_schemas` | Get all schemas | `specId` |

## Architecture

```
api-pilot/
├── src/
│   ├── mock-server.ts      # Express-based mock API server (221 lines)
│   ├── api-client.ts       # Axios-based HTTP client with collections (217 lines)
│   ├── openapi-parser.ts   # OpenAPI spec parser with validation (201 lines)
│   ├── mcp-server.ts       # MCP protocol server with 15 tools (682 lines)
│   ├── types.ts            # TypeScript type definitions (222 lines)
│   └── index.ts            # Entry point and exports (40 lines)
├── package.json            # Project metadata
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file
```

### Technology Stack

- **TypeScript 5.3**: Strict type safety
- **Express 4.18**: Mock server framework
- **Axios 1.6**: HTTP client
- **swagger-parser 10.0**: OpenAPI validation
- **MCP Protocol**: JSON-RPC 2.0 over stdin/stdout

## Common Workflows

### Frontend Development Without Backend

1. Create a mock server on port 3001
2. Add routes matching your API contract
3. Point your frontend to `http://localhost:3001`
4. Develop and test UI without waiting for backend

### API Integration Testing

1. Create a collection for the target API
2. Add all required requests with authentication
3. Set environment variables (base URLs, tokens)
4. Execute requests and validate responses
5. Modify and re-run as needed

### Exploring Third-Party APIs

1. Find the API's OpenAPI/Swagger spec URL
2. Parse the spec with `parse_openapi_spec`
3. List endpoints to understand available operations
4. Get details for specific endpoints you need
5. Create collection requests based on the spec

### API Response Simulation

1. Create a mock server
2. Add routes with realistic data
3. Add delays to simulate network latency
4. Test error handling with 4xx/5xx responses
5. Validate frontend error states

## Development

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Watch Mode

```bash
npm run dev
```

## Troubleshooting

### Mock Server Issues

**Problem**: "Port already in use"

**Solutions**:
- Choose a different port number
- Stop the existing process using the port
- Check with `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

**Problem**: Routes not responding

**Solutions**:
- Verify server is started with `list_mock_servers`
- Check the server status shows "Running"
- Confirm route path matches exactly (case-sensitive)

### API Client Issues

**Problem**: "Collection not found"

**Solutions**:
- List collections to verify ID
- Ensure you're using the correct collection ID
- Collection IDs are generated when created

**Problem**: "Request failed with 401"

**Solutions**:
- Verify authentication credentials
- Check token hasn't expired
- Ensure auth header name is correct

### OpenAPI Issues

**Problem**: "Failed to parse OpenAPI spec"

**Solutions**:
- Verify URL is accessible
- Check spec format is valid OpenAPI 2.0/3.0
- Try downloading spec file and parsing locally
- Some specs require CORS - download and use local file

**Problem**: "Schema not found"

**Solutions**:
- List available schemas first
- Schema names are case-sensitive
- Not all specs have components/schemas defined

### Claude Desktop Integration

**Problem**: "api-pilot tools not showing in Claude"

**Solutions**:
- Restart Claude Desktop after config changes
- Verify config file path is correct for your OS
- Check absolute path to `dist/index.js` is correct
- Ensure project is built (`npm run build`)
- View Claude Desktop logs for errors

**Problem**: "Command not found" errors

**Solutions**:
- Verify Node.js 18+ is installed (`node --version`)
- Use full path to node executable in config
- Check file permissions on `dist/index.js`

## Security Notes

- **Never commit** API keys, tokens, or credentials
- Store sensitive data in environment variables
- Use `.gitignore` to exclude collection files with secrets
- Mock servers are HTTP only - use HTTPS reverse proxy in production
- Validate all user inputs in production mock servers

## Roadmap

- [ ] Request/response recording and replay
- [ ] GraphQL query builder and introspection
- [ ] WebSocket mock support
- [ ] Import/export Postman collections
- [ ] Generate OpenAPI specs from collections
- [ ] Request chaining and variable extraction
- [ ] Performance testing (load generation)
- [ ] API diff comparison
- [ ] Auto-generate mock data from schemas
- [ ] Contract testing support

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Express](https://expressjs.com/) - Fast, unopinionated web framework
- [Axios](https://axios-http.com/) - Promise-based HTTP client
- [Swagger Parser](https://github.com/APIDevTools/swagger-parser) - OpenAPI validation
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification

## Support

- **Issues**: [GitHub Issues](https://github.com/consigcody94/api-pilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/consigcody94/api-pilot/discussions)
- **Email**: consigcody94@gmail.com

---

**Made with ❤️ for developers building and testing APIs**
