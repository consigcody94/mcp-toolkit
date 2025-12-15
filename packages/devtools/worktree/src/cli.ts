#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { listCommand } from './commands/list';
import { newCommand } from './commands/new';
import { removeCommand } from './commands/remove';
import { cleanCommand } from './commands/clean';
import { switchCommand } from './commands/switch';
import { execCommand } from './commands/exec';

const program = new Command();

program
  .name('wt')
  .description('🌳 Beautiful, intuitive CLI for managing Git worktrees')
  .version('1.0.0');

// List command
program
  .command('list')
  .alias('ls')
  .description('List all worktrees with their status')
  .option('-v, --verbose', 'Show detailed information')
  .action(listCommand);

// New command
program
  .command('new [branch]')
  .alias('create')
  .description('Create a new worktree')
  .option('-p, --path <path>', 'Custom path for worktree')
  .option('-f, --force', 'Force creation even if branch exists')
  .option('--no-open', 'Do not offer to open in VS Code')
  .action(newCommand);

// Remove command
program
  .command('remove [identifier]')
  .alias('rm')
  .description('Remove a worktree')
  .option('-f, --force', 'Force removal even if worktree has changes')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(removeCommand);

// Clean command
program
  .command('clean')
  .description('Remove stale worktrees')
  .option('-d, --days <days>', 'Days threshold for stale worktrees', '90')
  .option('-y, --yes', 'Skip confirmation prompt')
  .option('--dry', 'Show what would be removed without removing')
  .action((options) => {
    const days = parseInt(options.days, 10);
    cleanCommand({ ...options, days });
  });

// Switch command
program
  .command('switch')
  .alias('sw')
  .description('Switch to a worktree (with fuzzy search)')
  .option('--vscode', 'Open in VS Code')
  .option('--terminal', 'Open in new terminal')
  .action(switchCommand);

// Exec command
program
  .command('exec <command>')
  .description('Execute a command in all worktrees')
  .option('-p, --parallel', 'Execute in parallel')
  .option('--include-main', 'Include main worktree')
  .action(execCommand);

// Show help by default
if (process.argv.length === 2) {
  program.help();
}

// Error handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (error: any) {
  if (error.code !== 'commander.help' && error.code !== 'commander.helpDisplayed') {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
