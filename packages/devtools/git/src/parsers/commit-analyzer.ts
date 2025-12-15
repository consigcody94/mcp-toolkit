/**
 * Analyze changes and generate commit messages
 */

// @ts-ignore - No type definitions available
import commitParser from 'conventional-commits-parser';
import type {
  GitDiff,
  ChangeAnalysis,
  CommitSuggestion,
  CommitType,
  ParsedCommit,
} from '../types.js';

export class CommitAnalyzer {
  /**
   * Analyze changes and suggest commits
   */
  analyzeChanges(diffs: GitDiff[], stagedFiles: string[]): ChangeAnalysis {
    const files = this.categorizeFiles(stagedFiles);
    const patterns = this.detectPatterns(stagedFiles);
    const scope = this.detectScope(stagedFiles);
    const impact = this.assessImpact(diffs);
    const suggestions = this.generateSuggestions(files, patterns, scope, impact);

    return {
      files,
      patterns,
      scope,
      impact,
      suggestions,
    };
  }

  /**
   * Categorize files by change type
   */
  private categorizeFiles(files: string[]): ChangeAnalysis['files'] {
    return {
      added: files.filter(f => !files.includes(f.replace(/^M /, ''))),
      modified: files.filter(f => f.startsWith('M ')).map(f => f.slice(2)),
      deleted: files.filter(f => f.startsWith('D ')).map(f => f.slice(2)),
      renamed: [],
    };
  }

  /**
   * Detect patterns in changed files
   */
  private detectPatterns(files: string[]): ChangeAnalysis['patterns'] {
    const fileList = files.map(f => f.toLowerCase());

    return {
      hasTests: fileList.some(
        f =>
          f.includes('test') ||
          f.includes('spec') ||
          f.includes('__tests__') ||
          f.endsWith('.test.ts') ||
          f.endsWith('.spec.ts')
      ),
      hasDocs: fileList.some(
        f =>
          f.includes('readme') ||
          f.includes('docs') ||
          f.includes('documentation') ||
          f.endsWith('.md')
      ),
      hasConfig: fileList.some(
        f =>
          f.includes('config') ||
          f.includes('.json') ||
          f.includes('.yaml') ||
          f.includes('.yml') ||
          f.includes('.toml') ||
          f.includes('.env')
      ),
      hasUI: fileList.some(
        f =>
          f.includes('component') ||
          f.includes('view') ||
          f.includes('page') ||
          f.includes('ui') ||
          f.endsWith('.vue') ||
          f.endsWith('.jsx') ||
          f.endsWith('.tsx')
      ),
      hasAPI: fileList.some(
        f =>
          f.includes('api') ||
          f.includes('endpoint') ||
          f.includes('route') ||
          f.includes('controller')
      ),
      hasDatabase: fileList.some(
        f =>
          f.includes('migration') ||
          f.includes('schema') ||
          f.includes('model') ||
          f.includes('entity') ||
          f.includes('repository')
      ),
    };
  }

  /**
   * Detect scope from file paths
   */
  private detectScope(files: string[]): string[] {
    const scopes = new Set<string>();

    for (const file of files) {
      const parts = file.split('/');

      // Extract directory names as potential scopes
      if (parts.length > 1) {
        // Skip common root directories
        const filtered = parts.filter(
          p =>
            p !== 'src' &&
            p !== 'lib' &&
            p !== 'dist' &&
            p !== 'build' &&
            p !== 'test' &&
            p !== 'tests' &&
            !p.includes('.')
        );

        if (filtered.length > 0) {
          scopes.add(filtered[0]);
        }
      }

      // Extract from filename
      const filename = parts[parts.length - 1];
      const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

      if (nameWithoutExt.includes('-')) {
        scopes.add(nameWithoutExt.split('-')[0]);
      } else if (nameWithoutExt.includes('.')) {
        scopes.add(nameWithoutExt.split('.')[0]);
      }
    }

    return Array.from(scopes).slice(0, 3); // Top 3 scopes
  }

  /**
   * Assess impact of changes
   */
  private assessImpact(diffs: GitDiff[]): 'major' | 'minor' | 'patch' {
    const totalChanges = diffs.reduce((sum, diff) => sum + diff.changes, 0);
    const fileCount = diffs.length;

    // Heuristic: major if many files or large changes
    if (fileCount > 20 || totalChanges > 1000) {
      return 'major';
    }

    if (fileCount > 5 || totalChanges > 200) {
      return 'minor';
    }

    return 'patch';
  }

  /**
   * Generate commit suggestions
   */
  private generateSuggestions(
    files: ChangeAnalysis['files'],
    patterns: ChangeAnalysis['patterns'],
    scopes: string[],
    _impact: 'major' | 'minor' | 'patch'
  ): CommitSuggestion[] {
    const suggestions: CommitSuggestion[] = [];

    // Feature suggestion
    if (files.added.length > 0 && !patterns.hasTests) {
      suggestions.push({
        type: 'feat',
        scope: scopes[0],
        subject: `add ${this.guessFeatureName(files.added)}`,
        confidence: 0.8,
        reasoning: 'New files added suggest a new feature',
      });
    }

    // Fix suggestion
    if (files.modified.length > 0 && files.modified.length < 5) {
      suggestions.push({
        type: 'fix',
        scope: scopes[0],
        subject: `resolve issue in ${this.guessModuleName(files.modified)}`,
        confidence: 0.6,
        reasoning: 'Small number of modified files suggests a bug fix',
      });
    }

    // Test suggestion
    if (patterns.hasTests && files.added.some(f => f.includes('test'))) {
      suggestions.push({
        type: 'test',
        scope: scopes[0],
        subject: 'add tests',
        confidence: 0.9,
        reasoning: 'Test files were added',
      });
    }

    // Docs suggestion
    if (patterns.hasDocs) {
      suggestions.push({
        type: 'docs',
        scope: scopes[0],
        subject: 'update documentation',
        confidence: 0.85,
        reasoning: 'Documentation files were modified',
      });
    }

    // Refactor suggestion
    if (files.modified.length > 5 && files.added.length === 0 && files.deleted.length === 0) {
      suggestions.push({
        type: 'refactor',
        scope: scopes[0],
        subject: 'improve code structure',
        confidence: 0.7,
        reasoning: 'Multiple files modified without additions suggests refactoring',
      });
    }

    // Config/chore suggestion
    if (patterns.hasConfig) {
      suggestions.push({
        type: 'chore',
        scope: 'config',
        subject: 'update configuration',
        confidence: 0.8,
        reasoning: 'Configuration files were modified',
      });
    }

    // Performance suggestion (heuristic)
    if (files.modified.some(f => f.includes('optim') || f.includes('perf'))) {
      suggestions.push({
        type: 'perf',
        scope: scopes[0],
        subject: 'improve performance',
        confidence: 0.6,
        reasoning: 'File names suggest performance optimization',
      });
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Guess feature name from files
   */
  private guessFeatureName(files: string[]): string {
    if (files.length === 0) return 'new feature';

    const firstFile = files[0];
    const filename = firstFile.split('/').pop() || 'feature';
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

    // Convert kebab-case or snake_case to readable text
    return nameWithoutExt
      .replace(/[-_]/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  /**
   * Guess module name from files
   */
  private guessModuleName(files: string[]): string {
    if (files.length === 0) return 'module';

    const scopes = new Set<string>();
    for (const file of files) {
      const parts = file.split('/');
      if (parts.length > 1) {
        scopes.add(parts[0]);
      }
    }

    return scopes.size === 1 ? Array.from(scopes)[0] : 'multiple modules';
  }

  /**
   * Format commit message
   */
  formatCommit(
    type: CommitType,
    subject: string,
    scope?: string,
    body?: string,
    breaking?: boolean,
    footer?: string
  ): string {
    let message = type;

    if (scope) {
      message += `(${scope})`;
    }

    if (breaking) {
      message += '!';
    }

    message += `: ${subject}`;

    if (body) {
      message += `\n\n${body}`;
    }

    if (breaking && !footer?.includes('BREAKING CHANGE:')) {
      const breakingFooter = 'BREAKING CHANGE: This commit introduces breaking changes';
      message += `\n\n${footer ? `${footer}\n\n${breakingFooter}` : breakingFooter}`;
    } else if (footer) {
      message += `\n\n${footer}`;
    }

    return message;
  }

  /**
   * Parse commit message
   */
  parseCommit(message: string): ParsedCommit {
    const parsed = commitParser.sync(message);
    return parsed as ParsedCommit;
  }

  /**
   * Validate commit message
   */
  validateCommit(message: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if message is empty
    if (!message.trim()) {
      errors.push('Commit message cannot be empty');
      return { valid: false, errors };
    }

    const parsed = this.parseCommit(message);

    // Check type
    const validTypes: CommitType[] = [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'build',
      'ci',
      'chore',
      'revert',
    ];

    if (parsed.type && !validTypes.includes(parsed.type as CommitType)) {
      errors.push(`Invalid commit type: ${parsed.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Check subject length
    if (parsed.subject && parsed.subject.length > 72) {
      errors.push('Subject line should not exceed 72 characters');
    }

    // Check subject starts with lowercase
    if (parsed.subject && /^[A-Z]/.test(parsed.subject)) {
      errors.push('Subject should start with lowercase letter');
    }

    // Check subject doesn't end with period
    if (parsed.subject && parsed.subject.endsWith('.')) {
      errors.push('Subject should not end with a period');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate changelog entry from commit
   */
  generateChangelogEntry(commit: ParsedCommit): string {
    let entry = '- ';

    if (commit.scope) {
      entry += `**${commit.scope}**: `;
    }

    entry += commit.subject || commit.header || 'No description';

    if (commit.references.length > 0) {
      const refs = commit.references.map(r => `#${r.issue}`).join(', ');
      entry += ` (${refs})`;
    }

    return entry;
  }
}
