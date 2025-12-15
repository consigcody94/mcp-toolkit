import Table from 'cli-table3';
import chalk from 'chalk';
import ora from 'ora';
import { WorktreeManager } from '../managers/worktree-manager';
import { formatPath, formatBranch, formatStatus, formatCommit, formatLocked, getStatusSymbol } from '../utils/format';

export async function listCommand(options: { verbose?: boolean }): Promise<void> {
  const spinner = ora('Loading worktrees...').start();

  try {
    const manager = new WorktreeManager();
    await manager.initialize();

    const worktrees = await manager.listWorktrees();

    if (worktrees.length === 0) {
      spinner.stop();
      console.log(chalk.yellow('No worktrees found'));
      return;
    }

    spinner.text = 'Fetching status...';

    // Get status for all worktrees
    const statuses = await Promise.all(
      worktrees.map(wt => manager.getWorktreeStatus(wt))
    );

    spinner.succeed(`Found ${worktrees.length} worktree${worktrees.length === 1 ? '' : 's'}`);

    // Create table
    const table = new Table({
      head: [
        chalk.white.bold(''),
        chalk.white.bold('Branch'),
        chalk.white.bold('Path'),
        chalk.white.bold('Commit'),
        chalk.white.bold('Status'),
      ],
      style: {
        head: [],
        border: ['gray'],
      },
    });

    for (const { worktree, status } of statuses) {
      const symbol = getStatusSymbol(status);
      const lock = formatLocked(worktree.isLocked);

      table.push([
        `${symbol} ${lock}`,
        formatBranch(worktree.branch, worktree.isMain),
        formatPath(worktree.path, 40),
        formatCommit(worktree.commit),
        formatStatus(status),
      ]);
    }

    console.log('\n' + table.toString());

    // Show legend
    if (options.verbose) {
      console.log(chalk.gray('\nLegend:'));
      console.log(chalk.gray('  ✓ = Clean'));
      console.log(chalk.gray('  ● = Modified'));
      console.log(chalk.gray('  ◆ = Out of sync'));
      console.log(chalk.gray('  ✗ = Conflicts'));
      console.log(chalk.gray('  🔒 = Locked'));
      console.log(chalk.gray('  ↑N = Ahead N commits'));
      console.log(chalk.gray('  ↓N = Behind N commits'));
      console.log(chalk.gray('  ~N = N modified files'));
      console.log(chalk.gray('  +N = N added files'));
      console.log(chalk.gray('  -N = N deleted files'));
      console.log(chalk.gray('  ?N = N untracked files'));
    }

    console.log();
  } catch (error) {
    spinner.fail('Failed to list worktrees');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
