# 🚀 MCP Server Generator from OpenAPI

**Automatically generate production-ready Model Context Protocol (MCP) servers from OpenAPI/Swagger specifications.**

Save hours of boilerplate coding. Just provide your API spec, and get a complete, type-safe MCP server ready to deploy.

## Features

- ✅ **OpenAPI 3.0 & Swagger 2.0** support
- ✅ **TypeScript or Python** output
- ✅ **Type-safe** tool definitions
- ✅ **Authentication** handling (API keys, OAuth, Bearer tokens)
- ✅ **Automatic** parameter validation
- ✅ **Error handling** built-in
- ✅ **Documentation** generated
- ✅ **Ready to deploy** - complete package with dependencies

## Use Cases

| Scenario | Benefit |
|----------|---------|
| **API Integration** | Turn any OpenAPI API into MCP tools in minutes |
| **LLM Agents** | Give AI agents access to your APIs instantly |
| **Rapid Prototyping** | Test MCP integrations without writing boilerplate |
| **Multi-API Orchestration** | Generate servers for multiple APIs and compose them |

## Quick Start

1. **Find your API's OpenAPI spec** (Swagger JSON/YAML URL)
2. **Run this Actor** with the spec URL
3. **Download generated code** from Key-Value Store
4. **Deploy** your MCP server

## Input

```json
{
  "openApiSource": "https://petstore.swagger.io/v2/swagger.json",
  "language": "typescript",
  "serverName": "petstore-mcp",
  "includeAllEndpoints": true,
  "includeAuth": true
}
```

## Output

Complete MCP server with:
- `server.ts` or `server.py` - Main MCP server implementation
- `package.json` or `requirements.txt` - Dependencies
- `README.md` - Usage documentation

All files saved to Key-Value Store and dataset.

## Example Generated Code

**TypeScript:**
```typescript
server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name === 'get_pet_by_id') {
        const response = await axios.get(`${API_BASE_URL}/pet/${request.params.arguments.petId}`);
        return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
    }
});
```

**Python:**
```python
@server.call_tool()
async def get_pet_by_id(pet_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/pet/{pet_id}")
        return response.json()
```

## Why MCP?

Model Context Protocol (MCP) is the standard protocol for connecting AI assistants to external tools and data sources. Adopted by Anthropic, Google, and OpenAI.

Building MCP servers manually requires:
- Understanding MCP protocol specifications
- Writing request/response handlers
- Type definitions for all endpoints
- Error handling
- Authentication logic

**This Actor does all of that automatically.**

## Advanced Features

### Tag Filtering
Only generate tools for specific API sections:
```json
{
  "includeAllEndpoints": false,
  "filterTags": ["pets", "store"]
}
```

### Authentication
Automatically handles:
- API Key authentication (header, query param)
- Bearer token authentication
- OAuth 2.0 flows (code generated, you add tokens)

### Test Generation
```json
{
  "generateTests": true
}
```
Includes unit test templates for all generated tools.

## Technical Details

**Parsing**: Uses `swagger-parser` for robust OpenAPI validation and dereferencing

**Code Generation**: Handlebars templates for clean, maintainable output

**Type Safety**: Full TypeScript type definitions or Python type hints

**Error Handling**: Try-catch blocks with meaningful error messages

**Standards Compliant**: Follows MCP 1.0 specification exactly

## Limitations

- Complex authentication flows may require manual enhancement
- Custom request/response transformations not supported
- Generated code is a starting point - customize for production

## Built for Apify $1M Challenge

This Actor solves a real problem in the exploding MCP ecosystem. Every API with an OpenAPI spec can now become MCP-enabled in seconds.

---

**Ready to generate your MCP server?** [Run now →](https://apify.com/actors)
