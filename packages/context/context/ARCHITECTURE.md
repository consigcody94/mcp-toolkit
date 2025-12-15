# 🏗️ Context Pilot Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Desktop / AI                      │
└────────────────────┬────────────────────────────────────────┘
                     │ MCP Protocol (JSON-RPC 2.0)
                     │
┌────────────────────▼────────────────────────────────────────┐
│                   MCP Server (mcp-server.ts)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  8 MCP Tools:                                        │   │
│  │  - analyze_project                                   │   │
│  │  - get_context_summary                              │   │
│  │  - get_architecture                                  │   │
│  │  - get_dependencies                                  │   │
│  │  - get_conventions                                   │   │
│  │  - get_patterns                                      │   │
│  │  - search_context                                    │   │
│  │  - get_relevant_context                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Codebase Analyzer (analyzer.ts)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Analysis Components:                                │   │
│  │  - File scanner (respects .gitignore)               │   │
│  │  - Language detector                                 │   │
│  │  - Framework recognizer                             │   │
│  │  - Architecture classifier                          │   │
│  │  - Dependency graph builder                         │   │
│  │  - Convention extractor                             │   │
│  │  - Pattern detector                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     Your Codebase                            │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. MCP Server (`src/mcp-server.ts`)
**Responsibilities:**
- Implements JSON-RPC 2.0 protocol
- Handles tool registration and calls
- Formats responses for AI consumption
- Manages analysis state

**Key Methods:**
- `initialize()` - MCP handshake
- `listTools()` - Register 8 tools
- `callTool()` - Route tool calls
- `analyzeProject()` - Trigger analysis
- `get*()` - Context retrieval methods

### 2. Codebase Analyzer (`src/analyzer.ts`)
**Responsibilities:**
- Scans files (respecting .gitignore)
- Detects languages and frameworks
- Classifies architecture patterns
- Builds dependency graphs
- Extracts coding conventions

**Key Methods:**
- `analyze()` - Main entry point
- `getFiles()` - File discovery with ignore
- `analyzeFile()` - Individual file analysis
- `detectArchitecture()` - Architecture classification
- `buildSummary()` - Aggregate statistics

### 3. Type System (`src/types.ts`)
**Responsibilities:**
- TypeScript interfaces for all data structures
- Ensures type safety across components
- Documents data shapes

**Key Types:**
- `CodebaseContext` - Complete analysis result
- `ProjectSummary` - High-level stats
- `ArchitectureInfo` - Structure and stack
- `DependencyGraph` - Module relationships
- `CodeConventions` - Style and patterns

## Analysis Pipeline

```
1. Scan Phase
   └─> Load .gitignore
   └─> Glob all files
   └─> Filter ignored files
   └─> Result: List of files to analyze

2. File Analysis Phase (parallel)
   For each file:
   └─> Detect language
   └─> Extract imports/exports
   └─> Extract classes/functions
   └─> Calculate complexity
   └─> Result: FileInfo[]

3. Aggregation Phase
   └─> Build summary (counts, languages)
   └─> Detect frameworks (from imports)
   └─> Classify architecture type
   └─> Build dependency graph
   └─> Extract conventions
   └─> Detect patterns
   └─> Result: CodebaseContext

4. Caching Phase
   └─> Store context in memory
   └─> Ready for MCP tool calls
```

## Architecture Detection Logic

### Type Classification
```typescript
if (hasWorkspaces) return 'monorepo';
if (hasServices) return 'microservices';
if (hasPackageJson && hasSrc) return 'monolith';
if (hasPackageJson && !hasSrc) return 'library';
return 'unknown';
```

### Structure Classification
```typescript
if (hasFeatures || hasModules) return 'feature-based';
if (hasModel && hasView) return 'mvc';
if (hasDomain && hasInfra) return 'clean';
if (hasLayers || hasCore) return 'layered';
return 'unknown';
```

## Framework Detection

**Method:** Pattern matching on imports

**Examples:**
- `import ... from 'next'` → Next.js
- `import ... from 'react'` → React
- `import ... from '@angular/...'` → Angular
- `import ... from 'express'` → Express

## Convention Extraction

### Naming Conventions
Analyzes class names, function names, file names to detect:
- PascalCase for classes
- camelCase for functions
- kebab-case for files

### Code Style
Heuristic detection based on file extensions:
- TypeScript → single quotes, semicolons
- JavaScript → varies
- Python → 4 spaces, no semicolons

## Performance Characteristics

**Typical Project (1000 files):**
- Scan: ~100ms
- Analysis: ~500ms
- Total: ~600ms

**Large Project (5000 files):**
- Scan: ~300ms
- Analysis: ~2000ms
- Total: ~2.3s

**Memory:**
- Small project (<1000 files): ~50MB
- Large project (5000 files): ~200MB

## Future Enhancements

1. **Incremental Analysis** - Only re-analyze changed files
2. **Persistence** - Cache analysis results to disk
3. **Git Integration** - Track architectural evolution over time
4. **Pattern Learning** - ML-based pattern detection
5. **Multi-repo** - Analyze microservices together
6. **Real-time** - Watch mode for live updates
