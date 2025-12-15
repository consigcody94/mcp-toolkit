/**
 * Report formatters for different output formats
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { ScanResult, Finding, SeverityLevel } from './types.js';

export class TerminalReporter {
  report(result: ScanResult): void {
    console.log('\n' + chalk.bold.cyan('🛡️  Code Guardian Security Report'));
    console.log(chalk.gray('─'.repeat(80)));

    this.printSummary(result);
    this.printRiskLevel(result);

    if (result.findings.length > 0) {
      console.log();
      this.printFindings(result.findings);
    } else {
      console.log('\n' + chalk.green.bold('✓ No security issues found!'));
    }

    this.printFooter(result);
  }

  private printSummary(result: ScanResult): void {
    const table = new Table({
      head: ['Metric', 'Value'],
      style: { head: ['cyan'] },
    });

    table.push(
      ['Files Scanned', result.filesScanned.toLocaleString()],
      ['Lines Scanned', result.linesScanned.toLocaleString()],
      ['Duration', `${result.duration}ms`],
      ['Trust Score', this.formatTrustScore(result.trustScore)],
      ['Risk Level', this.formatRiskLevel(result.riskLevel)]
    );

    console.log('\n' + table.toString());
  }

  private printRiskLevel(result: ScanResult): void {
    const { summary } = result;
    const table = new Table({
      head: ['Severity', 'Count'],
      style: { head: ['cyan'] },
    });

    table.push(
      ['Critical', this.formatCount(summary.critical, 'critical')],
      ['High', this.formatCount(summary.high, 'high')],
      ['Medium', this.formatCount(summary.medium, 'medium')],
      ['Low', this.formatCount(summary.low, 'low')],
      ['Info', this.formatCount(summary.info, 'info')],
      [chalk.bold('Total'), chalk.bold(summary.total.toString())]
    );

    console.log('\n' + table.toString());
  }

  private printFindings(findings: Finding[]): void {
    console.log(chalk.bold.yellow('\n⚠️  Security Issues Found:\n'));

    const grouped = this.groupBySeverity(findings);

    for (const [severity, items] of Object.entries(grouped)) {
      if (items.length === 0) continue;

      console.log(this.formatSeverityHeader(severity as SeverityLevel, items.length));

      for (const finding of items.slice(0, 20)) {
        // Limit to first 20 per severity
        this.printFinding(finding);
      }

      if (items.length > 20) {
        console.log(chalk.gray(`  ... and ${items.length - 20} more ${severity} issues\n`));
      }
    }
  }

  private printFinding(finding: Finding): void {
    const location = chalk.gray(`${finding.file}:${finding.line}:${finding.column}`);
    const pattern = chalk.bold(finding.pattern);
    const category = chalk.cyan(`[${finding.category}]`);

    console.log(`  ${location}`);
    console.log(`  ${category} ${pattern}`);
    console.log(chalk.gray(`  ${finding.description}`));
    console.log(chalk.yellow(`  💡 ${finding.recommendation}`));

    if (finding.context) {
      console.log(chalk.gray(`  ❯ ${finding.context.substring(0, 100)}`));
    }

    if (finding.cwe) {
      console.log(chalk.gray(`  CWE: ${finding.cwe}`));
    }

    if (finding.aiGenerated) {
      console.log(chalk.magenta(`  🤖 Likely AI-generated code`));
    }

    console.log();
  }

  private printFooter(result: ScanResult): void {
    console.log(chalk.gray('─'.repeat(80)));
    console.log(chalk.gray(`Report generated: ${new Date(result.timestamp).toLocaleString()}`));

    if (result.summary.total > 0) {
      console.log(
        chalk.yellow(
          `\n⚡ Found ${result.summary.total} issue${result.summary.total === 1 ? '' : 's'}. ` +
          'Review and fix before deploying.'
        )
      );
    }
  }

  private formatTrustScore(score: number): string {
    if (score >= 90) return chalk.green.bold(`${score}/100`);
    if (score >= 70) return chalk.yellow.bold(`${score}/100`);
    if (score >= 50) return chalk.hex('#FFA500').bold(`${score}/100`);
    return chalk.red.bold(`${score}/100`);
  }

  private formatRiskLevel(level: ScanResult['riskLevel']): string {
    const colors: Record<typeof level, (s: string) => string> = {
      safe: chalk.green.bold,
      low: chalk.cyan.bold,
      medium: chalk.yellow.bold,
      high: chalk.hex('#FFA500').bold,
      critical: chalk.red.bold,
    };
    return colors[level](level.toUpperCase());
  }

  private formatCount(count: number, severity: SeverityLevel): string {
    if (count === 0) return chalk.gray('0');

    const colors: Record<SeverityLevel, (s: string) => string> = {
      critical: chalk.red.bold,
      high: chalk.hex('#FFA500').bold,
      medium: chalk.yellow.bold,
      low: chalk.cyan,
      info: chalk.gray,
    };

    return colors[severity](count.toString());
  }

  private formatSeverityHeader(severity: SeverityLevel, count: number): string {
    const symbols: Record<SeverityLevel, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵',
      info: '⚪',
    };

    const colors: Record<SeverityLevel, (s: string) => string> = {
      critical: chalk.red.bold,
      high: chalk.hex('#FFA500').bold,
      medium: chalk.yellow.bold,
      low: chalk.cyan.bold,
      info: chalk.gray.bold,
    };

    return colors[severity](
      `\n${symbols[severity]} ${severity.toUpperCase()} (${count})\n`
    );
  }

  private groupBySeverity(findings: Finding[]): Record<SeverityLevel, Finding[]> {
    return findings.reduce(
      (acc, finding) => {
        acc[finding.severity].push(finding);
        return acc;
      },
      {
        critical: [],
        high: [],
        medium: [],
        low: [],
        info: [],
      } as Record<SeverityLevel, Finding[]>
    );
  }
}

export class JSONReporter {
  report(result: ScanResult): string {
    return JSON.stringify(result, null, 2);
  }
}

export class SARIFReporter {
  report(result: ScanResult): string {
    const sarif = {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'code-guardian',
              version: '1.0.0',
              informationUri: 'https://github.com/consigcody94/code-guardian',
              rules: this.generateRules(result),
            },
          },
          results: this.generateResults(result),
        },
      ],
    };

    return JSON.stringify(sarif, null, 2);
  }

  private generateRules(result: ScanResult) {
    const uniquePatterns = new Set(result.findings.map(f => f.pattern));
    return Array.from(uniquePatterns).map((pattern, index) => ({
      id: `rule-${index}`,
      name: pattern,
      shortDescription: { text: pattern },
    }));
  }

  private generateResults(result: ScanResult) {
    return result.findings.map(finding => ({
      ruleId: finding.pattern,
      level: this.mapSeverity(finding.severity),
      message: { text: finding.description },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: finding.file },
            region: {
              startLine: finding.line,
              startColumn: finding.column,
            },
          },
        },
      ],
    }));
  }

  private mapSeverity(severity: SeverityLevel): string {
    const map: Record<SeverityLevel, string> = {
      critical: 'error',
      high: 'error',
      medium: 'warning',
      low: 'note',
      info: 'note',
    };
    return map[severity];
  }
}
