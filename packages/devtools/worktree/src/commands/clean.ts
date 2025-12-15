import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { WorktreeManager } from '../managers/worktree-manager';
import { formatBranch, formatPath, formatDaysAgo } from '../utils/format';
import simpleGit from 'simple-git';

export async function cleanCommand(options: { days?: number; yes?: boolean; dry?: boolean } = {}): Promise<void> {
  const spinner = ora('Finding stale worktrees...').start();
  const daysThreshold = options.days || 90;

  try {
    const manager = new WorktreeManager();
    await manager.initialize();

    const staleWorktrees = await manager.getStaleWorktrees(daysThreshold);

    if (staleWorktrees.length === 0) {
      spinner.succeed(`No stale worktrees found (older than ${daysThreshold} days)`);
      return;
    }

    spinner.succeed(`Found ${staleWorktrees.length} stale worktree${staleWorktrees.length === 1 ? '' : 's'}`);

    // Show stale worktrees
    console.log(chalk.gray(`\nWorktrees with no commits in ${daysThreshold}+ days:\n`));

    for (const wt of staleWorktrees) {
      const git = simpleGit(wt.path);
      const log = await git.log({ maxCount: 1 });

      if (log.latest) {
        const lastCommitDate = new Date(log.latest.date);
        const daysSinceLastCommit = Math.floor(
          (Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        console.log(`  ${formatBranch(wt.branch)} - ${formatPath(wt.path)}`);
        console.log(chalk.gray(`    Last commit: ${formatDaysAgo(daysSinceLastCommit)}`));
      }
    }

    console.log();

    if (options.dry) {
      console.log(chalk.gray('Dry run - no worktrees removed'));
      return;
    }

    // Confirm removal
    if (!options.yes) {
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'remove',
          message: `Remove ${staleWorktrees.length} stale worktree${staleWorktrees.length === 1 ? '' : 's'}?`,
          default: false,
        },
      ]);

      if (!confirm.remove) {
        console.log(chalk.gray('Cancelled'));
        return;
      }
    }

    // Remove stale worktrees
    const removeSpinner = ora('Removing stale worktrees...').start();

    let removed = 0;
    let failed = 0;

    for (const wt of staleWorktrees) {
      try {
        await manager.removeWorktree(wt.path, { force: true });
        removed++;
        removeSpinner.text = `Removed ${removed}/${staleWorktrees.length}...`;
      } catch (error) {
        failed++;
        console.log(chalk.yellow(`\nWarning: Failed to remove ${wt.branch}`));
      }
    }

    if (failed === 0) {
      removeSpinner.succeed(`Removed ${removed} stale worktree${removed === 1 ? '' : 's'}`);
    } else {
      removeSpinner.warn(`Removed ${removed} worktrees, ${failed} failed`);
    }

    // Prune
    await manager.pruneWorktrees();
  } catch (error) {
    spinner.fail('Failed to clean worktrees');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
