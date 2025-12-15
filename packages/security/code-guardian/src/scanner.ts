/**
 * Core security scanner engine
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import {
  Finding,
  ScanResult,
  ScanOptions,
  SeverityLevel,
  ScanSummary,
  AICodeHeuristics,
  VulnerabilityCategory,
} from './types.js';
import { SECURITY_PATTERNS, AI_PATTERNS } from './patterns.js';

export class SecurityScanner {
  private findings: Finding[] = [];
  private filesScanned = 0;
  private linesScanned = 0;
  private startTime = 0;

  async scan(options: ScanOptions): Promise<ScanResult> {
    this.reset();
    this.startTime = Date.now();

    const files = await this.getFiles(options.paths, options.exclude);

    for (const file of files) {
      await this.scanFile(file, options);
    }

    const duration = Date.now() - this.startTime;
    const summary = this.generateSummary();
    const trustScore = this.calculateTrustScore(summary);
    const riskLevel = this.calculateRiskLevel(summary, trustScore);

    return {
      timestamp: new Date().toISOString(),
      duration,
      filesScanned: this.filesScanned,
      linesScanned: this.linesScanned,
      findings: this.sortFindings(this.findings),
      summary,
      trustScore,
      riskLevel,
    };
  }

  private reset(): void {
    this.findings = [];
    this.filesScanned = 0;
    this.linesScanned = 0;
  }

  private async getFiles(paths: string[], exclude: string[] = []): Promise<string[]> {
    const allFiles: string[] = [];
    const defaultExclude = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.bundle.js',
    ];

    const excludePatterns = [...defaultExclude, ...exclude];

    for (const p of paths) {
      const stats = await fs.stat(p).catch(() => null);

      if (!stats) continue;

      if (stats.isFile()) {
        allFiles.push(p);
      } else if (stats.isDirectory()) {
        const pattern = path.join(p, '**/*.{js,ts,jsx,tsx,py,java,rb,php,go,rs}');
        const files = await glob(pattern, {
          ignore: excludePatterns,
          nodir: true,
        });
        allFiles.push(...files);
      }
    }

    return allFiles;
  }

  private async scanFile(filePath: string, options: ScanOptions): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      this.filesScanned++;
      this.linesScanned += lines.length;

      const aiHeuristics = options.includeAiHeuristics
        ? this.detectAICode(content)
        : null;

      for (const pattern of SECURITY_PATTERNS) {
        // Filter by severity if specified
        if (options.severity && !options.severity.includes(pattern.severity)) {
          continue;
        }

        // Filter by category if specified
        if (options.categories && !options.categories.includes(pattern.category)) {
          continue;
        }

        this.scanPattern(filePath, content, lines, pattern, aiHeuristics);
      }
    } catch (error) {
      // Skip files that can't be read
      console.error(`Error scanning ${filePath}:`, error);
    }
  }

  private scanPattern(
    filePath: string,
    content: string,
    lines: string[],
    pattern: typeof SECURITY_PATTERNS[0],
    aiHeuristics: AICodeHeuristics | null
  ): void {
    const matches = content.matchAll(pattern.pattern);

    for (const match of matches) {
      if (!match.index) continue;

      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const lineContent = lines[lineNumber - 1] || '';
      const column = match.index - beforeMatch.lastIndexOf('\n');

      const finding: Finding = {
        id: `${pattern.id}-${this.findings.length + 1}`,
        file: filePath,
        line: lineNumber,
        column,
        severity: pattern.severity,
        category: pattern.category,
        pattern: pattern.name,
        match: match[0],
        description: pattern.description,
        recommendation: pattern.recommendation,
        cwe: pattern.cwe,
        owasp: pattern.owasp,
        context: lineContent.trim(),
        aiGenerated: aiHeuristics ? aiHeuristics.confidenceScore > 60 : undefined,
      };

      this.findings.push(finding);
    }
  }

  private detectAICode(content: string): AICodeHeuristics {
    let score = 0;
    const checks = {
      hasLongFunctionNames: false,
      hasExcessiveComments: false,
      hasBoilerplatePatterns: false,
      hasMultipleTodos: false,
    };

    // Check for AI patterns
    if (AI_PATTERNS.longFunctionNames.test(content)) {
      checks.hasLongFunctionNames = true;
      score += 20;
    }

    const commentMatches = content.match(AI_PATTERNS.excessiveComments);
    if (commentMatches && commentMatches.length > 3) {
      checks.hasExcessiveComments = true;
      score += 25;
    }

    const todoMatches = content.match(AI_PATTERNS.boilerplate);
    if (todoMatches && todoMatches.length > 5) {
      checks.hasBoilerplatePatterns = true;
      checks.hasMultipleTodos = true;
      score += 30;
    }

    // Additional heuristics
    const lines = content.split('\n');
    const commentLines = lines.filter(l => l.trim().startsWith('//')).length;
    const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;

    if (commentLines / Math.max(codeLines, 1) > 0.4) {
      score += 25;
    }

    return {
      ...checks,
      confidenceScore: Math.min(score, 100),
    };
  }

  private generateSummary(): ScanSummary {
    const summary: ScanSummary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      total: this.findings.length,
      categoryCounts: {} as Record<VulnerabilityCategory, number>,
    };

    for (const finding of this.findings) {
      summary[finding.severity]++;
      summary.categoryCounts[finding.category] =
        (summary.categoryCounts[finding.category] || 0) + 1;
    }

    return summary;
  }

  private calculateTrustScore(summary: ScanSummary): number {
    // Start at 100, deduct points for issues
    let score = 100;

    score -= summary.critical * 25; // Critical: -25 points each
    score -= summary.high * 10;     // High: -10 points each
    score -= summary.medium * 5;    // Medium: -5 points each
    score -= summary.low * 2;       // Low: -2 points each
    score -= summary.info * 0.5;    // Info: -0.5 points each

    return Math.max(0, Math.min(100, score));
  }

  private calculateRiskLevel(
    summary: ScanSummary,
    trustScore: number
  ): ScanResult['riskLevel'] {
    if (summary.critical > 0 || trustScore < 40) return 'critical';
    if (summary.high > 0 || trustScore < 60) return 'high';
    if (summary.medium > 0 || trustScore < 80) return 'medium';
    if (summary.low > 0 || trustScore < 95) return 'low';
    return 'safe';
  }

  private sortFindings(findings: Finding[]): Finding[] {
    const severityOrder: Record<SeverityLevel, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    };

    return findings.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      return a.file.localeCompare(b.file);
    });
  }
}
