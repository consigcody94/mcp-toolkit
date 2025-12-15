#!/usr/bin/env node

/**
 * Code Guardian CLI
 * Security scanner for AI-generated code
 */

import { program } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { SecurityScanner } from './scanner.js';
import { TerminalReporter, JSONReporter, SARIFReporter } from './reporters.js';
import { ScanOptions, SeverityLevel, VulnerabilityCategory } from './types.js';
import fs from 'fs/promises';

program
  .name('code-guardian')
  .description('Security scanner for AI-generated code')
  .version('1.0.0');

program
  .command('scan [paths...]')
  .description('Scan files or directories for security vulnerabilities')
  .option('-e, --exclude <patterns...>', 'Exclude patterns')
  .option('-s, --severity <levels...>', 'Filter by severity (critical,high,medium,low,info)')
  .option('-c, --category <categories...>', 'Filter by category')
  .option('-f, --format <type>', 'Output format (terminal,json,sarif)', 'terminal')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('--fail-on <severity>', 'Exit with error if issues of this severity found')
  .option('--ai-heuristics', 'Include AI code detection heuristics', false)
  .option('--max-issues <number>', 'Maximum issues to report', '1000')
  .action(async (paths: string[], options) => {
    if (!paths || paths.length === 0) {
      paths = [process.cwd()];
    }

    const spinner = ora('Scanning files...').start();

    try {
      const scanOptions: ScanOptions = {
        paths,
        exclude: options.exclude,
        severity: options.severity as SeverityLevel[],
        categories: options.category as VulnerabilityCategory[],
        format: options.format,
        output: options.output,
        failOn: options.failOn as SeverityLevel,
        includeAiHeuristics: options.aiHeuristics,
        maxIssues: parseInt(options.maxIssues),
      };

      const scanner = new SecurityScanner();
      const result = await scanner.scan(scanOptions);

      spinner.stop();

      // Generate report
      let output: string;

      switch (options.format) {
        case 'json':
          const jsonReporter = new JSONReporter();
          output = jsonReporter.report(result);
          break;

        case 'sarif':
          const sarifReporter = new SARIFReporter();
          output = sarifReporter.report(result);
          break;

        case 'terminal':
        default:
          const terminalReporter = new TerminalReporter();
          terminalReporter.report(result);
          output = ''; // Already printed
          break;
      }

      // Write to file if specified
      if (options.output && output) {
        await fs.writeFile(options.output, output);
        console.log(chalk.green(`✓ Report written to ${options.output}`));
      } else if (output) {
        console.log(output);
      }

      // Exit with error if failOn threshold met
      if (options.failOn) {
        const severityOrder: SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];
        const failOnIndex = severityOrder.indexOf(options.failOn);
        const hasFailingIssues = severityOrder
          .slice(0, failOnIndex + 1)
          .some(severity => result.summary[severity] > 0);

        if (hasFailingIssues) {
          process.exit(1);
        }
      }

      // Exit with error if critical issues found (default behavior)
      if (result.summary.critical > 0 && !options.failOn) {
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('patterns')
  .description('List all security patterns')
  .action(() => {
    const { SECURITY_PATTERNS } = require('./patterns.js');

    console.log(chalk.bold.cyan('\n🛡️  Security Patterns\n'));

    for (const pattern of SECURITY_PATTERNS) {
      console.log(chalk.bold(`${pattern.id}: ${pattern.name}`));
      console.log(chalk.gray(`  Category: ${pattern.category}`));
      console.log(chalk.gray(`  Severity: ${pattern.severity}`));
      console.log(chalk.gray(`  ${pattern.description}`));
      if (pattern.cwe) console.log(chalk.gray(`  CWE: ${pattern.cwe}`));
      if (pattern.owasp) console.log(chalk.gray(`  OWASP: ${pattern.owasp}`));
      console.log();
    }
  });

program.parse();
