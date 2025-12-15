# Notion Weaver

A production-ready Model Context Protocol (MCP) server for Notion workspace automation. Seamlessly integrate Notion into your AI workflows with full TypeScript support.

## Features

- **6 Powerful Tools**: Complete Notion API coverage
  - `create_page` - Create new pages in databases or as child pages
  - `create_database` - Create new databases with custom schemas
  - `query_database` - Query databases with filters and sorting
  - `update_page` - Update page properties and content
  - `get_page` - Retrieve specific pages by ID
  - `search_content` - Search across your entire workspace

- **Type-Safe**: Full TypeScript strict mode implementation
- **Production-Ready**: Comprehensive error handling and validation
- **Standards-Compliant**: Implements MCP JSON-RPC 2.0 protocol
- **Well-Documented**: Extensive examples and setup guides

## Installation

```bash
npm install notion-weaver
```

Or clone and build from source:

```bash
git clone https://github.com/consigcody94/notion-weaver.git
cd notion-weaver
npm install
npm run build
```

## Setup

### 1. Get Your Notion API Key

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Name your integration and select the workspace
4. Copy the "Internal Integration Token"

### 2. Share Pages/Databases with Your Integration

1. Open the Notion page or database you want to access
2. Click the "..." menu in the top right
3. Scroll to "Add connections"
4. Select your integration

### 3. Configure Environment Variable

```bash
export NOTION_API_KEY="your_integration_token_here"
```

For persistent configuration, add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
echo 'export NOTION_API_KEY="your_integration_token_here"' >> ~/.bashrc
source ~/.bashrc
```

## Configuration for Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "notion-weaver": {
      "command": "node",
      "args": ["/path/to/notion-weaver/dist/index.js"],
      "env": {
        "NOTION_API_KEY": "your_integration_token_here"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "notion-weaver": {
      "command": "notion-weaver",
      "env": {
        "NOTION_API_KEY": "your_integration_token_here"
      }
    }
  }
}
```

## Usage Examples

### Create a Page

```typescript
// In a database
{
  "tool": "create_page",
  "arguments": {
    "parent_database_id": "abc123...",
    "title": "New Project",
    "content": "Project description goes here"
  }
}

// As a child page
{
  "tool": "create_page",
  "arguments": {
    "parent_page_id": "xyz789...",
    "title": "Meeting Notes",
    "content": "Discussion points..."
  }
}
```

### Create a Database

```typescript
{
  "tool": "create_database",
  "arguments": {
    "parent_page_id": "xyz789...",
    "title": "Task Tracker",
    "properties": {
      "Name": { "title": {} },
      "Status": {
        "select": {
          "options": [
            { "name": "Not Started", "color": "red" },
            { "name": "In Progress", "color": "yellow" },
            { "name": "Complete", "color": "green" }
          ]
        }
      },
      "Due Date": { "date": {} }
    }
  }
}
```

### Query a Database

```typescript
{
  "tool": "query_database",
  "arguments": {
    "database_id": "abc123...",
    "filter": {
      "property": "Status",
      "select": {
        "equals": "In Progress"
      }
    },
    "sorts": [
      {
        "property": "Due Date",
        "direction": "ascending"
      }
    ]
  }
}
```

### Update a Page

```typescript
{
  "tool": "update_page",
  "arguments": {
    "page_id": "page123...",
    "properties": {
      "Status": {
        "select": {
          "name": "Complete"
        }
      }
    }
  }
}
```

### Get a Page

```typescript
{
  "tool": "get_page",
  "arguments": {
    "page_id": "page123..."
  }
}
```

### Search Content

```typescript
{
  "tool": "search_content",
  "arguments": {
    "query": "project requirements",
    "filter": {
      "property": "object",
      "value": "page"
    }
  }
}
```

## Finding Page and Database IDs

### From URL
When viewing a page or database in Notion, the ID is in the URL:
```
https://www.notion.so/My-Page-abc123def456...
                              ^----- This is the ID
```

### Using search_content
Search for pages/databases by title:
```typescript
{
  "tool": "search_content",
  "arguments": {
    "query": "My Database Name"
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode for development
npm run watch
```

## Requirements

- Node.js >= 18.0.0
- Notion API Key
- TypeScript 5.7+

## Security

- Never commit your `NOTION_API_KEY` to version control
- Use environment variables for sensitive credentials
- Regularly rotate your API keys
- Limit integration permissions to only required pages/databases

## Troubleshooting

### "Error: NOTION_API_KEY environment variable is required"
- Ensure you've set the `NOTION_API_KEY` environment variable
- Check that the variable is available in the process environment

### "Object not found" errors
- Verify the page/database ID is correct
- Ensure your integration has been added to the page/database
- Check that the page/database hasn't been deleted

### "Validation failed" errors
- Verify property types match the database schema
- Check that required properties are included
- Ensure property names are spelled correctly

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [Notion API Documentation](https://developers.notion.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Issue Tracker](https://github.com/consigcody94/notion-weaver/issues)

## Support

For bugs and feature requests, please use [GitHub Issues](https://github.com/consigcody94/notion-weaver/issues).
