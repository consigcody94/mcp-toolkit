import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { WorktreeManager } from '../managers/worktree-manager';
import { isVSCodeInstalled, openInVSCode } from '../utils/vscode';

export async function newCommand(
  branchName?: string,
  options: { path?: string; force?: boolean; open?: boolean } = {}
): Promise<void> {
  const spinner = ora('Initializing...').start();

  try {
    const manager = new WorktreeManager();
    await manager.initialize();

    // If no branch name provided, prompt for it
    if (!branchName) {
      spinner.stop();
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'branch',
          message: 'Branch name:',
          validate: (input: string) => {
            if (!input || input.trim() === '') {
              return 'Branch name is required';
            }
            if (input.includes(' ')) {
              return 'Branch name cannot contain spaces';
            }
            return true;
          },
        },
      ]);
      branchName = answers.branch;
      spinner.start('Creating worktree...');
    } else {
      spinner.text = 'Creating worktree...';
    }

    // At this point branchName is guaranteed to be defined
    const branch = branchName as string;

    // Check if branch is already in use
    const inUse = await manager.isBranchInUse(branch);
    if (inUse && !options.force) {
      spinner.fail('Branch already has a worktree');
      const existing = await manager.findWorktreeByBranch(branch);
      if (existing) {
        console.log(chalk.yellow(`\nExisting worktree at: ${existing.path}`));
        console.log(chalk.gray('Use --force to create anyway'));
      }
      process.exit(1);
    }

    // Create the worktree
    const worktreePath = await manager.createWorktree({
      branch,
      path: options.path,
      force: options.force,
    });

    spinner.succeed(`Created worktree for branch '${chalk.cyan(branch)}'`);
    console.log(chalk.gray(`Location: ${worktreePath}`));

    // Offer to open in VS Code
    if (options.open !== false) {
      const hasVSCode = await isVSCodeInstalled();

      if (hasVSCode) {
        const shouldOpen = options.open || (await inquirer.prompt([
          {
            type: 'confirm',
            name: 'open',
            message: 'Open in VS Code?',
            default: true,
          },
        ])).open;

        if (shouldOpen) {
          const openSpinner = ora('Opening in VS Code...').start();
          try {
            await openInVSCode(worktreePath, true);
            openSpinner.succeed('Opened in VS Code');
          } catch (error) {
            openSpinner.fail('Failed to open VS Code');
          }
        }
      }
    }
  } catch (error) {
    spinner.fail('Failed to create worktree');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
