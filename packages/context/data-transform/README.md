# 🔄 Data Transform

**Universal data transformation suite via Model Context Protocol for Claude Desktop**

Transform between CSV, JSON, XML, YAML, and more with AI-powered analysis, validation, and intelligent format detection.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### Format Support
- **CSV** (Comma-Separated Values)
- **TSV** (Tab-Separated Values)
- **JSON** (JavaScript Object Notation)
- **XML** (eXtensible Markup Language)
- **YAML** (YAML Ain't Markup Language)
- **SQL** (INSERT statements)

### Core Capabilities
- **Automatic Detection**: Intelligently detect data format from content
- **Universal Conversion**: Transform between any supported formats
- **Data Parsing**: Parse and structure data with metadata
- **Validation**: Validate data integrity and structure
- **Analysis**: Generate schema, statistics, and insights
- **Type Inference**: Automatically detect column types
- **Smart Formatting**: Customizable output options per format

## 🚀 Quick Start

### Prerequisites

- **Claude Desktop** installed
- **Node.js** 16+ and npm

### Installation

```bash
git clone https://github.com/consigcody94/data-transform.git
cd data-transform
npm install
npm run build
```

### Configure Claude Desktop

Add to Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "data-transform": {
      "command": "node",
      "args": ["/absolute/path/to/data-transform/dist/mcp-server.js"]
    }
  }
}
```

### Restart Claude Desktop

## 💬 Usage Examples

### Format Detection

```
"Detect the format of this data: name,age,city\nJohn,30,NYC"
→ Automatically identifies CSV format with comma delimiter
```

### Data Conversion

```
"Convert this CSV to JSON:
name,age,city
John,30,NYC
Jane,25,LA"

→ Returns structured JSON array with proper typing
```

```
"Transform this JSON to SQL INSERT statements:
[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]"

→ Generates SQL INSERT statements for database import
```

### Data Analysis

```
"Analyze this CSV data:
product,price,quantity,category
Laptop,999,50,Electronics
Mouse,25,200,Electronics
Desk,299,30,Furniture"

→ Shows:
- Row/column counts
- Data types per column
- Null value analysis
- Statistics (min/max/avg for numbers)
- Unique value counts
```

### Data Parsing

```
"Parse this XML and show structure:
<products>
  <product>
    <name>Laptop</name>
    <price>999</price>
  </product>
</products>"

→ Displays headers, row preview, and metadata
```

### Data Validation

```
"Validate this CSV data:
name,email
John,john@example.com
Jane,
Bob,bob@example"

→ Reports:
- Empty cells
- Malformed email addresses
- Inconsistent column counts
```

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `detect_format` | Automatically detect data format from content |
| `convert_data` | Convert between any supported formats |
| `parse_data` | Parse data and return structured format with metadata |
| `validate_data` | Validate data structure and identify issues |
| `analyze_data` | Generate schema, statistics, and column analysis |

## 📋 Format Options

### CSV/TSV Options

```
- delimiter: string (default: ',' for CSV, '\t' for TSV)
- quoteChar: string (default: '"')
- header: boolean (default: true)
- skipEmptyLines: boolean (default: true)
- encoding: string (default: 'utf-8')
```

### JSON Options

```
- pretty: boolean (default: false)
- indent: number (default: 2)
- arrayFormat: 'single' | 'multiple'
```

### XML Options

```
- rootElement: string (default: 'data')
- rowElement: string (default: 'row')
- attributePrefix: string (default: '@_')
- textNodeName: string (default: '#text')
- pretty: boolean (default: false)
```

### SQL Options

```
- tableName: string (default: 'data')
- batchSize: number (default: 1000)
- includeSchema: boolean (default: false)
```

## 🎯 Use Cases

### Data Migration
- Convert legacy CSV files to JSON for modern apps
- Transform XML to SQL for database imports
- Convert Excel exports to YAML for configuration

### API Development
- Convert CSV data to JSON for API responses
- Transform JSON payloads to SQL for storage
- Generate XML from JSON for legacy systems

### Data Analysis
- Analyze CSV files from exports
- Validate data integrity before import
- Generate statistics and insights

### Configuration Management
- Convert JSON configs to YAML
- Transform YAML to JSON for JavaScript apps
- Generate SQL seed data from CSV

## 🏗️ Architecture

```
data-transform/
├── src/
│   ├── types.ts           # TypeScript type definitions
│   ├── converter.ts       # Universal format converter
│   ├── mcp-server.ts      # MCP protocol server
│   └── index.ts           # Public API exports
├── dist/                  # Compiled JavaScript
└── package.json
```

### Components

**DataConverter** (`converter.ts`):
- Format detection with content analysis
- Parsing engines for all formats
- Conversion between any formats
- Smart type inference
- Custom formatting options

**MCP Server** (`mcp-server.ts`):
- 5 powerful transformation tools
- JSON-RPC 2.0 protocol
- Markdown-formatted responses
- Error handling and validation

## 🔧 Development

```bash
npm run build       # Build TypeScript
npm run typecheck   # Type checking
npm run lint        # ESLint
npm run format      # Prettier
```

## 🐛 Troubleshooting

### "Parsing failed: Invalid JSON"

**Cause**: Malformed JSON content.

**Solutions**:
- Verify JSON syntax
- Check for trailing commas
- Validate with online JSON validator

### "Conversion failed: Unknown format"

**Cause**: Unsupported format or detection failure.

**Solutions**:
- Explicitly specify format instead of auto-detection
- Check if format is supported
- Verify content structure

## 📚 Resources

- [PapaParse](https://www.papaparse.com/) - CSV parser
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) - XML parser
- [YAML](https://github.com/eemeli/yaml) - YAML parser
- [Model Context Protocol](https://github.com/anthropics/mcp)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](LICENSE).

---

**Transform your data with AI** 🔄
