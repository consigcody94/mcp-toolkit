import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import autocomplete from 'inquirer-autocomplete-prompt';
import fuzzy from 'fuzzy';
import { WorktreeManager } from '../managers/worktree-manager';
import { formatPath, formatBranch } from '../utils/format';
import { isVSCodeInstalled, openInVSCode, openInTerminal } from '../utils/vscode';

// Register autocomplete prompt
inquirer.registerPrompt('autocomplete', autocomplete);

export async function switchCommand(options: { vscode?: boolean; terminal?: boolean } = {}): Promise<void> {
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

    spinner.stop();

    // Create choices for fuzzy search
    const choices = worktrees.map(wt => ({
      name: `${formatBranch(wt.branch, wt.isMain)} - ${formatPath(wt.path)}`,
      value: wt,
      branch: wt.branch,
      path: wt.path,
    }));

    // Fuzzy search function
    const searchWorktrees = async (_answers: any, input = '') => {
      const results = fuzzy.filter(input, choices, {
        extract: (choice) => `${choice.branch} ${choice.path}`,
      });

      return results.map(result => result.original);
    };

    // Interactive selection with fuzzy search
    const answers = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'worktree',
        message: 'Search worktrees:',
        source: searchWorktrees,
        pageSize: 10,
      },
    ]);

    const selectedWorktree = answers.worktree;

    // Determine what to do
    if (options.vscode) {
      const hasVSCode = await isVSCodeInstalled();
      if (!hasVSCode) {
        console.log(chalk.red('VS Code is not installed'));
        process.exit(1);
      }

      const openSpinner = ora('Opening in VS Code...').start();
      try {
        await openInVSCode(selectedWorktree.path, true);
        openSpinner.succeed(`Opened ${chalk.cyan(selectedWorktree.branch)} in VS Code`);
      } catch (error) {
        openSpinner.fail('Failed to open VS Code');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    } else if (options.terminal) {
      const termSpinner = ora('Opening terminal...').start();
      try {
        await openInTerminal(selectedWorktree.path);
        termSpinner.succeed(`Opened terminal in ${chalk.cyan(selectedWorktree.branch)}`);
      } catch (error) {
        termSpinner.fail('Failed to open terminal');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    } else {
      // Just show the path to cd into
      console.log(chalk.gray('\nTo switch to this worktree, run:'));
      console.log(chalk.cyan(`  cd ${selectedWorktree.path}`));
      console.log();
    }
  } catch (error) {
    spinner.fail('Failed to switch worktrees');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
