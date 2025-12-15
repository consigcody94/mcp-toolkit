/**
 * Codebase analyzer - semantic understanding of project structure
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';
import {
  CodebaseContext,
  ProjectSummary,
  ArchitectureInfo,
  CodePattern,
  DependencyGraph,
  CodeConventions,
  FileInfo,
  ModuleDependency,
  NamingConvention,
  CodeStyle,
} from './types.js';

export class CodebaseAnalyzer {
  private rootPath: string;
  private ig: ReturnType<typeof ignore>;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.ig = ignore();
  }

  async analyze(): Promise<CodebaseContext> {
    await this.loadGitignore();

    const files = await this.getFiles();
    const fileInfos = await Promise.all(files.map(f => this.analyzeFile(f)));

    const summary = this.buildSummary(fileInfos);
    const architecture = await this.detectArchitecture(fileInfos);
    const patterns = this.detectPatterns(fileInfos);
    const dependencies = await this.analyzeDependencies(fileInfos);
    const conventions = this.detectConventions(fileInfos);

    return {
      projectName: path.basename(this.rootPath),
      rootPath: this.rootPath,
      timestamp: new Date().toISOString(),
      summary,
      architecture,
      patterns,
      dependencies,
      conventions,
    };
  }

  private async loadGitignore(): Promise<void> {
    const gitignorePath = path.join(this.rootPath, '.gitignore');
    try {
      const content = await fs.readFile(gitignorePath, 'utf-8');
      this.ig.add(content);
    } catch {
      // No .gitignore file
    }

    // Always ignore common directories
    this.ig.add([
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      '.vercel',
      'out',
      '*.min.js',
      '*.bundle.js',
    ]);
  }

  private async getFiles(): Promise<string[]> {
    const pattern = path.join(this.rootPath, '**/*');
    const allFiles = await glob(pattern, { nodir: true });

    return allFiles.filter(file => {
      const relativePath = path.relative(this.rootPath, file);
      return !this.ig.ignores(relativePath);
    });
  }

  private async analyzeFile(filePath: string): Promise<FileInfo> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    const lines = content.split('\n');

    return {
      path: filePath,
      relativePath: path.relative(this.rootPath, filePath),
      size: stats.size,
      lines: lines.length,
      language: this.detectLanguage(filePath),
      imports: this.extractImports(content),
      exports: this.extractExports(content),
      classes: this.extractClasses(content),
      functions: this.extractFunctions(content),
      complexity: this.calculateComplexity(content),
    };
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath);
    const languageMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.py': 'Python',
      '.java': 'Java',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.md': 'Markdown',
      '.json': 'JSON',
      '.yml': 'YAML',
      '.yaml': 'YAML',
    };

    return languageMap[ext] || 'Unknown';
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const patterns = [
      /import\s+.*?from\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /import\s+['"]([^'"]+)['"]/g,
      /from\s+([a-zA-Z0-9_@/.-]+)\s+import/g, // Python
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        imports.push(match[1]);
      }
    }

    return [...new Set(imports)];
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const patterns = [
      /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /export\s+\{([^}]+)\}/g,
      /module\.exports\s*=\s*\{?([^;]+)/g,
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const names = match[1].split(',').map(s => s.trim());
        exports.push(...names);
      }
    }

    return [...new Set(exports)];
  }

  private extractClasses(content: string): string[] {
    const classes: string[] = [];
    const patterns = [
      /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        classes.push(match[1]);
      }
    }

    return classes;
  }

  private extractFunctions(content: string): string[] {
    const functions: string[] = [];
    const patterns = [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /def\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, // Python
    ];

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        functions.push(match[1]);
      }
    }

    return functions;
  }

  private calculateComplexity(content: string): number {
    // Simple cyclomatic complexity: count decision points
    let complexity = 1;

    const decisionPoints = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /&&/g,
      /\|\|/g,
      /\?/g, // ternary
    ];

    for (const pattern of decisionPoints) {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    }

    return complexity;
  }

  private buildSummary(fileInfos: FileInfo[]): ProjectSummary {
    const languages: Record<string, number> = {};
    let totalLines = 0;

    for (const file of fileInfos) {
      totalLines += file.lines;
      languages[file.language] = (languages[file.language] || 0) + file.lines;
    }

    return {
      totalFiles: fileInfos.length,
      totalLines,
      languages,
      frameworks: this.detectFrameworks(fileInfos),
      packageManagers: this.detectPackageManagers(fileInfos),
      testFrameworks: this.detectTestFrameworks(fileInfos),
    };
  }

  private detectFrameworks(fileInfos: FileInfo[]): string[] {
    const frameworks = new Set<string>();
    const allImports = fileInfos.flatMap(f => f.imports);

    const frameworkPatterns: Record<string, RegExp> = {
      'Next.js': /^next(\/|$)/,
      React: /^react(\/|$|-dom)/,
      Vue: /^vue(\/|$)/,
      Angular: /^@angular\//,
      Express: /^express$/,
      'Nest.js': /^@nestjs\//,
      Django: /^django/,
      Flask: /^flask/,
      Rails: /^rails/,
    };

    for (const imp of allImports) {
      for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
        if (pattern.test(imp)) {
          frameworks.add(framework);
        }
      }
    }

    return Array.from(frameworks);
  }

  private detectPackageManagers(fileInfos: FileInfo[]): string[] {
    const managers: string[] = [];
    const files = fileInfos.map(f => path.basename(f.path));

    if (files.includes('package-lock.json')) managers.push('npm');
    if (files.includes('yarn.lock')) managers.push('yarn');
    if (files.includes('pnpm-lock.yaml')) managers.push('pnpm');
    if (files.includes('Pipfile')) managers.push('pipenv');
    if (files.includes('poetry.lock')) managers.push('poetry');
    if (files.includes('Gemfile.lock')) managers.push('bundler');
    if (files.includes('go.sum')) managers.push('go modules');
    if (files.includes('Cargo.lock')) managers.push('cargo');

    return managers;
  }

  private detectTestFrameworks(fileInfos: FileInfo[]): string[] {
    const frameworks = new Set<string>();
    const allImports = fileInfos.flatMap(f => f.imports);

    const testPatterns: Record<string, RegExp> = {
      Jest: /^jest$|^@jest\//,
      Vitest: /^vitest$/,
      Mocha: /^mocha$/,
      Chai: /^chai$/,
      'Testing Library': /@testing-library\//,
      Cypress: /^cypress$/,
      Playwright: /^@playwright\//,
      pytest: /^pytest$/,
    };

    for (const imp of allImports) {
      for (const [framework, pattern] of Object.entries(testPatterns)) {
        if (pattern.test(imp)) {
          frameworks.add(framework);
        }
      }
    }

    return Array.from(frameworks);
  }

  private async detectArchitecture(fileInfos: FileInfo[]): Promise<ArchitectureInfo> {
    const structure = this.detectStructure(fileInfos);
    const type = this.detectArchitectureType(fileInfos);

    return {
      type,
      structure,
      frontendFramework: this.detectFrontendFramework(fileInfos),
      backendFramework: this.detectBackendFramework(fileInfos),
      database: this.detectDatabases(fileInfos),
    };
  }

  private detectStructure(fileInfos: FileInfo[]): ArchitectureInfo['structure'] {
    const paths = fileInfos.map(f => f.relativePath.toLowerCase());

    if (paths.some(p => p.includes('features/') || p.includes('modules/'))) {
      return 'feature-based';
    }
    if (paths.some(p => p.includes('model')) && paths.some(p => p.includes('view'))) {
      return 'mvc';
    }
    if (paths.some(p => p.includes('domain')) && paths.some(p => p.includes('infrastructure'))) {
      return 'clean';
    }
    if (paths.some(p => p.includes('layers/') || p.includes('core/'))) {
      return 'layered';
    }

    return 'unknown';
  }

  private detectArchitectureType(fileInfos: FileInfo[]): ArchitectureInfo['type'] {
    const hasWorkspaces = fileInfos.some(f => f.relativePath.includes('packages/'));
    const hasServices = fileInfos.some(f => f.relativePath.includes('services/'));

    if (hasWorkspaces) return 'monorepo';
    if (hasServices) return 'microservices';

    const hasPackageJson = fileInfos.some(f => path.basename(f.path) === 'package.json');
    if (hasPackageJson) {
      const hasSrc = fileInfos.some(f => f.relativePath.startsWith('src/'));
      return hasSrc ? 'monolith' : 'library';
    }

    return 'unknown';
  }

  private detectFrontendFramework(fileInfos: FileInfo[]): string | undefined {
    const allImports = fileInfos.flatMap(f => f.imports);

    if (allImports.some(i => i.startsWith('next'))) return 'Next.js';
    if (allImports.some(i => i.startsWith('react'))) return 'React';
    if (allImports.some(i => i.startsWith('vue'))) return 'Vue';
    if (allImports.some(i => i.startsWith('@angular'))) return 'Angular';
    if (allImports.some(i => i.startsWith('svelte'))) return 'Svelte';

    return undefined;
  }

  private detectBackendFramework(fileInfos: FileInfo[]): string | undefined {
    const allImports = fileInfos.flatMap(f => f.imports);

    if (allImports.some(i => i === 'express')) return 'Express';
    if (allImports.some(i => i.startsWith('@nestjs'))) return 'NestJS';
    if (allImports.some(i => i.startsWith('fastify'))) return 'Fastify';
    if (allImports.some(i => i.startsWith('django'))) return 'Django';
    if (allImports.some(i => i.startsWith('flask'))) return 'Flask';
    if (allImports.some(i => i.startsWith('rails'))) return 'Rails';

    return undefined;
  }

  private detectDatabases(fileInfos: FileInfo[]): string[] {
    const databases = new Set<string>();
    const allImports = fileInfos.flatMap(f => f.imports);

    const dbPatterns: Record<string, RegExp> = {
      PostgreSQL: /^pg$|^postgres$/,
      MongoDB: /^mongodb$|^mongoose$/,
      MySQL: /^mysql$|^mysql2$/,
      Redis: /^redis$|^ioredis$/,
      SQLite: /^sqlite$|^better-sqlite3$/,
      Prisma: /^@prisma\/client$/,
      TypeORM: /^typeorm$/,
    };

    for (const imp of allImports) {
      for (const [db, pattern] of Object.entries(dbPatterns)) {
        if (pattern.test(imp)) {
          databases.add(db);
        }
      }
    }

    return Array.from(databases);
  }

  private detectPatterns(fileInfos: FileInfo[]): CodePattern[] {
    const patterns: CodePattern[] = [];

    // Detect common architectural patterns
    const hasReactHooks = fileInfos.some(f =>
      f.imports.some(i => i.includes('react')) && f.functions.some(fn => fn.startsWith('use'))
    );
    if (hasReactHooks) {
      patterns.push({
        name: 'React Hooks',
        description: 'Custom hooks for state and side effects',
        frequency: fileInfos.filter(f => f.functions.some(fn => fn.startsWith('use'))).length,
        examples: fileInfos
          .flatMap(f => f.functions.filter(fn => fn.startsWith('use')))
          .slice(0, 3),
        category: 'architectural',
      });
    }

    return patterns;
  }

  private async analyzeDependencies(fileInfos: FileInfo[]): Promise<DependencyGraph> {
    const internal: ModuleDependency[] = [];
    const external: Record<string, string> = {};

    // Build internal dependency graph
    for (const file of fileInfos) {
      for (const imp of file.imports) {
        if (imp.startsWith('.') || imp.startsWith('/')) {
          // Internal import
          const existing = internal.find(d => d.from === file.relativePath && d.to === imp);
          if (existing) {
            existing.count++;
          } else {
            internal.push({
              from: file.relativePath,
              to: imp,
              type: 'import',
              count: 1,
            });
          }
        }
      }
    }

    // Load external dependencies from package.json
    try {
      const packageJsonPath = path.join(this.rootPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      Object.assign(external, packageJson.dependencies || {});
      Object.assign(external, packageJson.devDependencies || {});
    } catch {
      // No package.json
    }

    return {
      internal,
      external,
      unusedDeps: [], // TODO: Implement unused dependency detection
    };
  }

  private detectConventions(fileInfos: FileInfo[]): CodeConventions {
    return {
      namingConventions: this.detectNamingConventions(fileInfos),
      fileOrganization: this.detectFileOrganization(fileInfos),
      codeStyle: this.detectCodeStyle(fileInfos),
      commonPatterns: [],
    };
  }

  private detectNamingConventions(fileInfos: FileInfo[]): NamingConvention[] {
    const conventions: NamingConvention[] = [];

    // Detect class naming
    const allClasses = fileInfos.flatMap(f => f.classes);
    if (allClasses.every(c => /^[A-Z]/.test(c))) {
      conventions.push({
        type: 'class',
        pattern: 'PascalCase',
        examples: allClasses.slice(0, 3),
      });
    }

    // Detect function naming
    const allFunctions = fileInfos.flatMap(f => f.functions);
    if (allFunctions.every(f => /^[a-z]/.test(f))) {
      conventions.push({
        type: 'function',
        pattern: 'camelCase',
        examples: allFunctions.slice(0, 3),
      });
    }

    return conventions;
  }

  private detectFileOrganization(fileInfos: FileInfo[]): string {
    const paths = fileInfos.map(f => f.relativePath);

    if (paths.some(p => p.includes('features/'))) {
      return 'Feature-based (features/)';
    }
    if (paths.some(p => p.includes('app/'))) {
      return 'App Router (app/)';
    }
    if (paths.some(p => p.includes('pages/'))) {
      return 'Pages Router (pages/)';
    }
    if (paths.some(p => p.includes('src/'))) {
      return 'Source directory (src/)';
    }

    return 'Flat structure';
  }

  private detectCodeStyle(fileInfos: FileInfo[]): CodeStyle {
    // Simple heuristic based on file extensions and content patterns
    // In a real implementation, would read sample files asynchronously

    const hasTypeScript = fileInfos.some(f => f.language === 'TypeScript');
    const hasJavaScript = fileInfos.some(f => f.language === 'JavaScript');

    return {
      indentation: 'spaces',
      indentSize: 2,
      quotes: hasTypeScript ? 'single' : 'double',
      semicolons: hasTypeScript || hasJavaScript,
      trailingComma: true,
    };
  }
}
