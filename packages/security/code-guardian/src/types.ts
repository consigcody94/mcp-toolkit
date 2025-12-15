/**
 * Core types for code-guardian security scanner
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type VulnerabilityCategory =
  | 'secrets'
  | 'sql-injection'
  | 'xss'
  | 'path-traversal'
  | 'command-injection'
  | 'privilege-escalation'
  | 'insecure-deserialization'
  | 'hardcoded-credentials'
  | 'weak-crypto'
  | 'unsafe-regex';

export interface SecurityPattern {
  id: string;
  name: string;
  category: VulnerabilityCategory;
  severity: SeverityLevel;
  pattern: RegExp;
  description: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration ID
  owasp?: string; // OWASP Top 10 reference
}

export interface Finding {
  id: string;
  file: string;
  line: number;
  column: number;
  severity: SeverityLevel;
  category: VulnerabilityCategory;
  pattern: string;
  match: string;
  description: string;
  recommendation: string;
  cwe?: string;
  owasp?: string;
  context: string; // Line of code with issue
  aiGenerated?: boolean; // Heuristic: was this likely AI-generated?
}

export interface ScanResult {
  timestamp: string;
  duration: number; // milliseconds
  filesScanned: number;
  linesScanned: number;
  findings: Finding[];
  summary: ScanSummary;
  trustScore: number; // 0-100
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

export interface ScanSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
  categoryCounts: Record<VulnerabilityCategory, number>;
}

export interface ScanOptions {
  paths: string[];
  exclude?: string[];
  severity?: SeverityLevel[];
  categories?: VulnerabilityCategory[];
  format?: 'terminal' | 'json' | 'html' | 'sarif';
  output?: string;
  failOn?: SeverityLevel;
  includeAiHeuristics?: boolean;
  maxIssues?: number;
}

export interface AICodeHeuristics {
  hasLongFunctionNames: boolean; // AI loves descriptive names
  hasExcessiveComments: boolean; // AI over-comments
  hasBoilerplatePatterns: boolean; // Common AI scaffolding
  hasMultipleTodos: boolean; // AI leaves TODOs
  confidenceScore: number; // 0-100
}
