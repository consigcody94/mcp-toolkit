import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { WorktreeManager } from '../managers/worktree-manager';
import { formatPath, formatBranch } from '../utils/format';

export async function removeCommand(
  identifier?: string,
  options: { force?: boolean; yes?: boolean } = {}
): Promise<void> {
  const spinner = ora('Loading worktrees...').start();

  try {
    const manager = new WorktreeManager();
    await manager.initialize();

    const worktrees = await manager.listWorktrees();
    const selectableWorktrees = worktrees.filter(wt => !wt.isMain);

    if (selectableWorktrees.length === 0) {
      spinner.stop();
      console.log(chalk.yellow('No worktrees to remove'));
      return;
    }

    let targetWorktree;

    if (identifier) {
      // Try to find by branch name or path
      targetWorktree = selectableWorktrees.find(
        wt => wt.branch === identifier || wt.path === identifier || wt.path.endsWith(identifier)
      );

      if (!targetWorktree) {
        spinner.fail(`Worktree not found: ${identifier}`);
        process.exit(1);
      }
    } else {
      // Interactive selection
      spinner.stop();

      const choices = selectableWorktrees.map(wt => ({
        name: `${formatBranch(wt.branch)} - ${formatPath(wt.path)}`,
        value: wt,
      }));

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'worktree',
          message: 'Select worktree to remove:',
          choices,
        },
      ]);

      targetWorktree = answers.worktree;
      spinner.start();
    }

    // Confirm removal
    if (!options.yes) {
      spinner.stop();
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'remove',
          message: `Remove worktree '${chalk.cyan(targetWorktree.branch)}' at ${targetWorktree.path}?`,
          default: false,
        },
      ]);

      if (!confirm.remove) {
        console.log(chalk.gray('Cancelled'));
        return;
      }

      spinner.start('Removing worktree...');
    } else {
      spinner.text = 'Removing worktree...';
    }

    // Remove the worktree
    await manager.removeWorktree(targetWorktree.path, { force: options.force });

    spinner.succeed(`Removed worktree '${chalk.cyan(targetWorktree.branch)}'`);
  } catch (error) {
    spinner.fail('Failed to remove worktree');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
