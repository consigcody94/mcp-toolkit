import chalk from 'chalk';
import { GitStatus } from '../types';

export function formatPath(p: string, maxLength: number = 50): string {
  // Always replace home with tilde first
  const home = process.env.HOME || '';
  const withTilde = home ? p.replace(home, '~') : p;

  if (withTilde.length <= maxLength) {
    return withTilde;
  }

  return '...' + withTilde.slice(-(maxLength - 3));
}

export function formatBranch(branch: string, isMain: boolean = false): string {
  if (isMain) {
    return chalk.green.bold(branch);
  }
  return chalk.cyan(branch);
}

export function formatStatus(status: GitStatus): string {
  const parts: string[] = [];

  if (status.ahead > 0) {
    parts.push(chalk.green(`↑${status.ahead}`));
  }

  if (status.behind > 0) {
    parts.push(chalk.red(`↓${status.behind}`));
  }

  if (status.modified > 0) {
    parts.push(chalk.yellow(`~${status.modified}`));
  }

  if (status.added > 0) {
    parts.push(chalk.green(`+${status.added}`));
  }

  if (status.deleted > 0) {
    parts.push(chalk.red(`-${status.deleted}`));
  }

  if (status.untracked > 0) {
    parts.push(chalk.gray(`?${status.untracked}`));
  }

  if (status.conflicted > 0) {
    parts.push(chalk.red.bold(`!${status.conflicted}`));
  }

  if (parts.length === 0) {
    return chalk.gray('clean');
  }

  return parts.join(' ');
}

export function formatCommit(commit: string): string {
  return chalk.gray(commit.substring(0, 7));
}

export function formatLocked(isLocked: boolean): string {
  return isLocked ? chalk.red('🔒') : '';
}

export function formatDaysAgo(days: number): string {
  if (days === 0) {
    return 'today';
  } else if (days === 1) {
    return 'yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else if (days < 30) {
    return `${Math.floor(days / 7)} weeks ago`;
  } else if (days < 365) {
    return `${Math.floor(days / 30)} months ago`;
  } else {
    return `${Math.floor(days / 365)} years ago`;
  }
}

export function formatSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getStatusSymbol(status: GitStatus): string {
  if (status.conflicted > 0) {
    return chalk.red('✗');
  } else if (status.modified > 0 || status.added > 0 || status.deleted > 0) {
    return chalk.yellow('●');
  } else if (status.ahead > 0 || status.behind > 0) {
    return chalk.blue('◆');
  } else {
    return chalk.green('✓');
  }
}
