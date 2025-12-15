/**
 * Analyze pull requests and generate reviews
 */

import type { PRFile, PRAnalysis, ReviewSuggestion } from '../types.js';

export class PRAnalyzer {
  /**
   * Analyze pull request files
   */
  analyzePR(files: PRFile[], title: string, _body: string | null): PRAnalysis {
    const summary = this.generateSummary(files, title);
    const impact = this.assessImpact(files);
    const complexity = this.assessComplexity(files);
    const suggestions = this.generateSuggestions(files);
    const strengths = this.identifyStrengths(files);
    const concerns = this.identifyConcerns(files);
    const testCoverage = this.analyzeTestCoverage(files);
    const documentation = this.analyzeDocumentation(files);

    return {
      summary,
      impact,
      complexity,
      suggestions,
      strengths,
      concerns,
      testCoverage,
      documentation,
    };
  }

  /**
   * Generate summary of changes
   */
  private generateSummary(files: PRFile[], title: string): string {
    const totalFiles = files.length;
    const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
    const netChange = totalAdditions - totalDeletions;

    const fileTypes = this.categorizeFileTypes(files);

    let summary = `${title}\n\n`;
    summary += `This PR modifies ${totalFiles} file(s) with ${totalAdditions} additions and ${totalDeletions} deletions `;
    summary += `(net ${netChange >= 0 ? '+' : ''}${netChange} lines).\n\n`;

    if (fileTypes.length > 0) {
      summary += `File types: ${fileTypes.join(', ')}`;
    }

    return summary;
  }

  /**
   * Categorize file types
   */
  private categorizeFileTypes(files: PRFile[]): string[] {
    const types = new Set<string>();

    for (const file of files) {
      if (file.filename.includes('test') || file.filename.includes('spec')) {
        types.add('tests');
      } else if (file.filename.endsWith('.md')) {
        types.add('documentation');
      } else if (file.filename.includes('config') || file.filename.endsWith('.json')) {
        types.add('configuration');
      } else if (file.filename.endsWith('.ts') || file.filename.endsWith('.js')) {
        types.add('source code');
      } else if (file.filename.endsWith('.tsx') || file.filename.endsWith('.jsx')) {
        types.add('UI components');
      } else if (file.filename.endsWith('.css') || file.filename.endsWith('.scss')) {
        types.add('styles');
      } else {
        types.add('other');
      }
    }

    return Array.from(types);
  }

  /**
   * Assess impact of changes
   */
  private assessImpact(files: PRFile[]): 'major' | 'minor' | 'patch' {
    const totalChanges = files.reduce((sum, f) => sum + f.changes, 0);

    // Check for breaking changes
    const hasBreakingFiles = files.some(
      f =>
        f.status === 'removed' ||
        f.filename.includes('migration') ||
        f.filename.includes('schema')
    );

    if (hasBreakingFiles || totalChanges > 500) {
      return 'major';
    }

    if (totalChanges > 100 || files.length > 10) {
      return 'minor';
    }

    return 'patch';
  }

  /**
   * Assess complexity of changes
   */
  private assessComplexity(files: PRFile[]): 'low' | 'medium' | 'high' {
    const avgChangesPerFile = files.reduce((sum, f) => sum + f.changes, 0) / files.length;

    if (avgChangesPerFile > 200 || files.length > 20) {
      return 'high';
    }

    if (avgChangesPerFile > 50 || files.length > 5) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate review suggestions
   */
  private generateSuggestions(files: PRFile[]): ReviewSuggestion[] {
    const suggestions: ReviewSuggestion[] = [];

    // Check for security issues
    suggestions.push(...this.checkSecurity(files));

    // Check for performance issues
    suggestions.push(...this.checkPerformance(files));

    // Check for code style
    suggestions.push(...this.checkStyle(files));

    // Check for testing
    suggestions.push(...this.checkTesting(files));

    // Check for documentation
    suggestions.push(...this.checkDocumentation(files));

    // Check for best practices
    suggestions.push(...this.checkBestPractices(files));

    return suggestions.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2, nitpick: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Check for security issues
   */
  private checkSecurity(files: PRFile[]): ReviewSuggestion[] {
    const suggestions: ReviewSuggestion[] = [];

    for (const file of files) {
      const content = file.patch || '';

      // Check for hardcoded credentials
      if (content.match(/password\s*=\s*["'][^"']+["']/i)) {
        suggestions.push({
          severity: 'critical',
          file: file.filename,
          message: 'Potential hardcoded password detected',
          suggestion: 'Use environment variables for sensitive data',
          category: 'security',
        });
      }

      // Check for API keys
      if (content.match(/(api[_-]?key|secret|token)\s*=\s*["'][^"']+["']/i)) {
        suggestions.push({
          severity: 'critical',
          file: file.filename,
          message: 'Potential API key or secret in code',
          suggestion: 'Move secrets to environment variables or secret manager',
          category: 'security',
        });
      }

      // Check for eval usage
      if (content.includes('eval(')) {
        suggestions.push({
          severity: 'warning',
          file: file.filename,
          message: 'Usage of eval() detected',
          suggestion: 'Avoid eval() as it can lead to code injection vulnerabilities',
          category: 'security',
        });
      }

      // Check for SQL injection
      if (content.match(/execute\s*\(\s*["'].*\$\{/)) {
        suggestions.push({
          severity: 'warning',
          file: file.filename,
          message: 'Potential SQL injection vulnerability',
          suggestion: 'Use parameterized queries instead of string concatenation',
          category: 'security',
        });
      }
    }

    return suggestions;
  }

  /**
   * Check for performance issues
   */
  private checkPerformance(files: PRFile[]): ReviewSuggestion[] {
    const suggestions: ReviewSuggestion[] = [];

    for (const file of files) {
      const content = file.patch || '';

      // Check for synchronous operations
      if (content.match(/\.sync\(|readFileSync|writeFileSync/)) {
        suggestions.push({
          severity: 'info',
          file: file.filename,
          message: 'Synchronous operation detected',
          suggestion: 'Consider using async alternatives for better performance',
          category: 'performance',
        });
      }

      // Check for large loops
      if (content.match(/for\s*\(.*\.length/)) {
        suggestions.push({
          severity: 'info',
          file: file.filename,
          message: 'Loop detected',
          suggestion: 'Verify loop efficiency, consider using map/filter/reduce',
          category: 'performance',
        });
      }

      // Check for nested loops
      if (content.match(/for\s*\([^)]+\)[\s\S]*for\s*\(/)) {
        suggestions.push({
          severity: 'warning',
          file: file.filename,
          message: 'Nested loops detected',
          suggestion: 'Consider optimizing with data structures (Map, Set) for O(n) complexity',
          category: 'performance',
        });
      }
    }

    return suggestions;
  }

  /**
   * Check code style
   */
  private checkStyle(files: PRFile[]): ReviewSuggestion[] {
    const suggestions: ReviewSuggestion[] = [];

    for (const file of files) {
      const content = file.patch || '';

      // Check for console.log
      if (content.includes('console.log')) {
        suggestions.push({
          severity: 'nitpick',
          file: file.filename,
          message: 'console.log detected',
          suggestion: 'Remove debug console.log statements before merging',
          category: 'style',
        });
      }

      // Check for TODO comments
      if (content.match(/\/\/\s*TODO|\/\*\s*TODO/i)) {
        suggestions.push({
          severity: 'info',
          file: file.filename,
          message: 'TODO comment found',
          suggestion: 'Create an issue for TODO items instead of leaving them in code',
          category: 'style',
        });
      }

      // Check for long lines
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 120 && lines[i].startsWith('+')) {
          suggestions.push({
            severity: 'nitpick',
            file: file.filename,
            line: i + 1,
            message: 'Line exceeds 120 characters',
            suggestion: 'Consider breaking long lines for better readability',
            category: 'style',
          });
          break; // Only report once per file
        }
      }
    }

    return suggestions;
  }

  /**
   * Check testing coverage
   */
  private checkTesting(files: PRFile[]): ReviewSuggestion[] {
    const suggestions: ReviewSuggestion[] = [];

    const hasSourceChanges = files.some(
      f =>
        (f.filename.endsWith('.ts') || f.filename.endsWith('.js')) &&
        !f.filename.includes('test') &&
        !f.filename.includes('spec')
    );

    const hasTestChanges = files.some(
      f => f.filename.includes('test') || f.filename.includes('spec')
    );

    if (hasSourceChanges && !hasTestChanges) {
      suggestions.push({
        severity: 'warning',
        message: 'No test changes detected for source code changes',
        suggestion: 'Add tests to cover new functionality or changes',
        category: 'testing',
      });
    }

    return suggestions;
  }

  /**
   * Check documentation
   */
  private checkDocumentation(files: PRFile[]): ReviewSuggestion[] {
    const suggestions: ReviewSuggestion[] = [];

    const hasSignificantChanges = files.filter(f => f.changes > 50).length > 0;
    const hasDocsChanges = files.some(f => f.filename.endsWith('.md'));

    if (hasSignificantChanges && !hasDocsChanges) {
      suggestions.push({
        severity: 'info',
        message: 'Significant changes without documentation updates',
        suggestion: 'Update README or docs to reflect changes',
        category: 'documentation',
      });
    }

    return suggestions;
  }

  /**
   * Check best practices
   */
  private checkBestPractices(files: PRFile[]): ReviewSuggestion[] {
    const suggestions: ReviewSuggestion[] = [];

    for (const file of files) {
      const content = file.patch || '';

      // Check for any type in TypeScript
      if (content.match(/:\s*any[,\s\)]/)) {
        suggestions.push({
          severity: 'info',
          file: file.filename,
          message: 'Usage of "any" type',
          suggestion: 'Use specific types instead of any for better type safety',
          category: 'best-practice',
        });
      }

      // Check for missing error handling
      if (content.includes('async ') && !content.includes('try') && !content.includes('catch')) {
        suggestions.push({
          severity: 'warning',
          file: file.filename,
          message: 'Async function without error handling',
          suggestion: 'Add try-catch blocks for async functions',
          category: 'best-practice',
        });
      }
    }

    return suggestions;
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(files: PRFile[]): string[] {
    const strengths: string[] = [];

    const hasTests = files.some(f => f.filename.includes('test') || f.filename.includes('spec'));
    const hasDocs = files.some(f => f.filename.endsWith('.md'));
    const smallChanges = files.every(f => f.changes < 100);
    const focused = files.length < 10;

    if (hasTests) {
      strengths.push('Includes test coverage');
    }

    if (hasDocs) {
      strengths.push('Documentation updated');
    }

    if (smallChanges && focused) {
      strengths.push('Small, focused changes that are easy to review');
    }

    if (files.some(f => f.filename.includes('type') || f.filename.endsWith('.d.ts'))) {
      strengths.push('Type definitions included');
    }

    return strengths;
  }

  /**
   * Identify concerns
   */
  private identifyConcerns(files: PRFile[]): string[] {
    const concerns: string[] = [];

    const totalChanges = files.reduce((sum, f) => sum + f.changes, 0);

    if (totalChanges > 500) {
      concerns.push('Large PR with many changes - consider splitting into smaller PRs');
    }

    if (files.length > 20) {
      concerns.push('Many files modified - review scope and ensure changes are related');
    }

    const hasBreaking = files.some(f => f.status === 'removed' || f.filename.includes('migration'));
    if (hasBreaking) {
      concerns.push('Potential breaking changes detected');
    }

    return concerns;
  }

  /**
   * Analyze test coverage
   */
  private analyzeTestCoverage(files: PRFile[]): { hasTests: boolean; testFiles: string[] } {
    const testFiles = files
      .filter(f => f.filename.includes('test') || f.filename.includes('spec'))
      .map(f => f.filename);

    return {
      hasTests: testFiles.length > 0,
      testFiles,
    };
  }

  /**
   * Analyze documentation
   */
  private analyzeDocumentation(files: PRFile[]): { hasDocs: boolean; docFiles: string[] } {
    const docFiles = files.filter(f => f.filename.endsWith('.md')).map(f => f.filename);

    return {
      hasDocs: docFiles.length > 0,
      docFiles,
    };
  }

  /**
   * Generate review comment
   */
  generateReviewComment(analysis: PRAnalysis): string {
    let comment = `## PR Review\n\n`;

    comment += `${analysis.summary}\n\n`;

    comment += `**Impact:** ${analysis.impact} | **Complexity:** ${analysis.complexity}\n\n`;

    if (analysis.strengths.length > 0) {
      comment += `### ✅ Strengths\n\n`;
      for (const strength of analysis.strengths) {
        comment += `- ${strength}\n`;
      }
      comment += `\n`;
    }

    if (analysis.concerns.length > 0) {
      comment += `### ⚠️ Concerns\n\n`;
      for (const concern of analysis.concerns) {
        comment += `- ${concern}\n`;
      }
      comment += `\n`;
    }

    const criticalSuggestions = analysis.suggestions.filter(s => s.severity === 'critical');
    const warningSuggestions = analysis.suggestions.filter(s => s.severity === 'warning');

    if (criticalSuggestions.length > 0) {
      comment += `### 🔴 Critical Issues\n\n`;
      for (const suggestion of criticalSuggestions) {
        comment += `- **${suggestion.file || 'General'}**: ${suggestion.message}\n`;
        if (suggestion.suggestion) {
          comment += `  - 💡 ${suggestion.suggestion}\n`;
        }
      }
      comment += `\n`;
    }

    if (warningSuggestions.length > 0) {
      comment += `### ⚠️ Warnings\n\n`;
      for (const suggestion of warningSuggestions) {
        comment += `- **${suggestion.file || 'General'}**: ${suggestion.message}\n`;
        if (suggestion.suggestion) {
          comment += `  - 💡 ${suggestion.suggestion}\n`;
        }
      }
      comment += `\n`;
    }

    return comment;
  }
}
