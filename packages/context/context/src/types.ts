/**
 * Types for context-pilot MCP server
 */

export interface CodebaseContext {
  projectName: string;
  rootPath: string;
  timestamp: string;
  summary: ProjectSummary;
  architecture: ArchitectureInfo;
  patterns: CodePattern[];
  dependencies: DependencyGraph;
  conventions: CodeConventions;
}

export interface ProjectSummary {
  totalFiles: number;
  totalLines: number;
  languages: Record<string, number>; // language -> line count
  frameworks: string[];
  packageManagers: string[];
  testFrameworks: string[];
}

export interface ArchitectureInfo {
  type: 'monolith' | 'microservices' | 'monorepo' | 'library' | 'unknown';
  structure: 'mvc' | 'clean' | 'feature-based' | 'layered' | 'unknown';
  frontendFramework?: string;
  backendFramework?: string;
  database?: string[];
  deployment?: string;
}

export interface CodePattern {
  name: string;
  description: string;
  frequency: number;
  examples: string[];
  category: 'architectural' | 'design' | 'testing' | 'error-handling' | 'other';
}

export interface DependencyGraph {
  internal: ModuleDependency[];
  external: Record<string, string>; // package -> version
  unusedDeps: string[];
}

export interface ModuleDependency {
  from: string;
  to: string;
  type: 'import' | 'require' | 'dynamic';
  count: number;
}

export interface CodeConventions {
  namingConventions: NamingConvention[];
  fileOrganization: string;
  codeStyle: CodeStyle;
  commonPatterns: string[];
}

export interface NamingConvention {
  type: 'variable' | 'function' | 'class' | 'interface' | 'file';
  pattern: string;
  examples: string[];
}

export interface CodeStyle {
  indentation: 'spaces' | 'tabs';
  indentSize: number;
  quotes: 'single' | 'double' | 'mixed';
  semicolons: boolean;
  trailingComma: boolean;
}

export interface FileInfo {
  path: string;
  relativePath: string;
  size: number;
  lines: number;
  language: string;
  imports: string[];
  exports: string[];
  classes: string[];
  functions: string[];
  complexity: number; // cyclomatic complexity
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}
