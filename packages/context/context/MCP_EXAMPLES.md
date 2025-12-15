# 🧭 Context Pilot - MCP Examples

## Real-World Usage with Claude Desktop

### Example 1: Understanding a New Codebase

```
You: "Analyze my project at /home/user/my-app"

Claude: (uses analyze_project tool)

📊 Project Analysis Complete

**Project:** my-app
**Analyzed:** 2025-01-15T10:30:00Z

## Summary
- **Files:** 247
- **Lines of Code:** 18,453
- **Languages:** TypeScript, JavaScript, CSS
- **Frameworks:** Next.js, React

## Architecture
- **Type:** monolith
- **Structure:** feature-based
- **Frontend:** Next.js
- **Backend:** Express
- **Databases:** PostgreSQL, Redis

✅ Context built successfully.

You: "What are the coding conventions?"

Claude: (uses get_conventions tool)

📐 Code Conventions

## Naming Conventions
- **class**: PascalCase (e.g., UserService, AuthController)
- **function**: camelCase (e.g., getUserById, validateInput)
- **file**: kebab-case

## File Organization
Feature-based (features/)

## Code Style
- **Indentation:** 2 spaces
- **Quotes:** single
- **Semicolons:** Yes
- **Trailing Commas:** Yes

💡 Follow these conventions when adding new code to maintain consistency.
```

### Example 2: Adding a New Feature

```
You: "I need to add a new feature for user notifications"

Claude: (uses get_relevant_context with task_type='new_feature')

🎯 Relevant Context for NEW FEATURE

## Architecture
- **Type:** monolith
- **Structure:** feature-based
- **Frameworks:** Next.js, Express

## Code Conventions
- **Style:** 2 spaces, single quotes
- **Organization:** Feature-based (features/)

## Development Guidelines
- Follow feature-based architecture
- Place feature code according to Feature-based (features/)
- Match naming conventions: camelCase, PascalCase

Based on your architecture, I recommend:

1. **Create feature directory**: `features/notifications/`
2. **Structure**:
   ```
   features/notifications/
   ├── api/
   │   └── send-notification.ts
   ├── components/
   │   └── NotificationBell.tsx
   ├── hooks/
   │   └── useNotifications.ts
   └── types.ts
   ```
3. **Database**: Use Prisma (your ORM) for data access
4. **API Routes**: Add to `app/api/notifications/`
5. **Follow conventions**: camelCase functions, PascalCase components

Would you like me to scaffold this structure?
```

### Example 3: Debugging Context

```
You: "There's a bug in the authentication module. What's the current setup?"

Claude: (uses search_context with query='authentication')

🔍 Search Results for "authentication"

**Dependencies:** passport, jsonwebtoken, bcrypt

(uses get_architecture)

🏗️ Project Architecture

## Technology Stack
- **Frontend Framework:** Next.js
- **Backend Framework:** Express
- **Databases:** PostgreSQL, Redis

Based on your codebase:
- Authentication uses **JWT tokens** (jsonwebtoken dependency)
- Password hashing with **bcrypt**
- Session management likely in **Redis**

Let me check the auth implementation...
```

### Example 4: Refactoring Safely

```
You: "I want to refactor the user service"

Claude: (uses get_architecture and get_conventions)

Before refactoring the user service, let me understand the context:

**Architecture:** feature-based monolith
**Conventions:**
- Functions: camelCase
- Classes: PascalCase
- File organization: features/

**Current patterns detected:**
- React Hooks for state management
- API routes in app/api/

For safe refactoring:
1. ✅ Keep existing function names (camelCase)
2. ✅ Maintain feature-based organization
3. ✅ Update tests in parallel
4. ✅ Follow single responsibility principle
5. ⚠️ Watch for dependencies - this service is used in 12 files

Shall I help with the refactoring while preserving these patterns?
```

## Claude Desktop Configuration

### macOS
```json
{
  "mcpServers": {
    "context-pilot": {
      "command": "npx",
      "args": ["context-pilot"]
    }
  }
}
```

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`

### Linux
```json
{
  "mcpServers": {
    "context-pilot": {
      "command": "npx",
      "args": ["context-pilot"]
    }
  }
}
```

**Location:** `~/.config/Claude/claude_desktop_config.json`

### Windows
```json
{
  "mcpServers": {
    "context-pilot": {
      "command": "npx",
      "args": ["context-pilot"]
    }
  }
}
```

**Location:** `%APPDATA%\Claude\claude_desktop_config.json`

## Available MCP Tools

### 1. analyze_project
Analyzes entire codebase - run this first!

**Usage:**
```
"Analyze my project at /path/to/project"
```

**Returns:**
- File and line counts
- Languages detected
- Frameworks and tech stack
- Architecture type and structure
- Dependencies overview

### 2. get_context_summary
High-level overview of project stats.

**Usage:**
```
"Give me a project summary"
```

### 3. get_architecture
Detailed architectural information.

**Usage:**
```
"What's the architecture?"
"How is this project structured?"
```

### 4. get_dependencies
Internal and external dependency information.

**Usage:**
```
"What are the project dependencies?"
"Show me the dependency graph"
```

### 5. get_conventions
Code style and naming conventions.

**Usage:**
```
"What are the coding conventions?"
"How should I name my functions?"
```

### 6. get_patterns
Detected code patterns and best practices.

**Usage:**
```
"What patterns does this codebase use?"
```

### 7. search_context
Search across all context.

**Usage:**
```
"Search for postgres"
"Find authentication related code"
```

### 8. get_relevant_context
Task-specific context.

**Usage:**
```
"I'm refactoring the auth module"
"I need to fix a bug in payments"
"I'm adding a new feature for analytics"
```

**Task Types:**
- `refactoring`
- `bug_fix`
- `new_feature`
- `testing`
- `general`

## Tips for Best Results

1. **Always run analyze_project first** - This builds the context
2. **Be specific** - "Add authentication" vs "Add JWT-based authentication to Express API"
3. **Ask about conventions early** - Helps Claude match your style
4. **Reference the architecture** - "Following our feature-based structure..."
5. **Use search_context** - When you need to find specific information

## Troubleshooting

### Tool not showing in Claude Desktop

1. **Check config location** - Must be exact path for your OS
2. **Restart Claude Desktop** - Required after config changes
3. **Check JSON syntax** - Use a JSON validator
4. **Verify npx works** - Run `npx context-pilot --version` in terminal

### Context seems outdated

Run `analyze_project` again - context is not auto-updated (yet!)

### "Project not analyzed" error

You must run `analyze_project` before using other tools.
