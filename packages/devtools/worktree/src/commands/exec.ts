import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { WorktreeManager } from '../managers/worktree-manager';
import { formatBranch } from '../utils/format';

const execAsync = promisify(exec);

interface ExecResult {
  worktree: string;
  branch: string;
  success: boolean;
  output?: string;
  error?: string;
}

export async function execCommand(
  command: string,
  options: { parallel?: boolean; 'include-main'?: boolean } = {}
): Promise<void> {
  const spinner = ora('Loading worktrees...').start();

  try {
    const manager = new WorktreeManager();
    await manager.initialize();

    let worktrees = await manager.listWorktrees();

    // Filter out main worktree if requested
    if (!options['include-main']) {
      worktrees = worktrees.filter(wt => !wt.isMain);
    }

    if (worktrees.length === 0) {
      spinner.stop();
      console.log(chalk.yellow('No worktrees to execute command in'));
      return;
    }

    spinner.text = `Executing in ${worktrees.length} worktree${worktrees.length === 1 ? '' : 's'}...`;

    const results: ExecResult[] = [];

    if (options.parallel) {
      // Execute in parallel
      const promises = worktrees.map(async (wt) => {
        try {
          const { stdout, stderr } = await execAsync(command, { cwd: wt.path });
          return {
            worktree: wt.path,
            branch: wt.branch,
            success: true,
            output: stdout.trim(),
            error: stderr.trim(),
          };
        } catch (error: any) {
          return {
            worktree: wt.path,
            branch: wt.branch,
            success: false,
            error: error.message || String(error),
          };
        }
      });

      const execResults = await Promise.all(promises);
      results.push(...execResults);
    } else {
      // Execute sequentially
      for (const wt of worktrees) {
        spinner.text = `Executing in ${formatBranch(wt.branch)}...`;

        try {
          const { stdout, stderr } = await execAsync(command, { cwd: wt.path });
          results.push({
            worktree: wt.path,
            branch: wt.branch,
            success: true,
            output: stdout.trim(),
            error: stderr.trim(),
          });
        } catch (error: any) {
          results.push({
            worktree: wt.path,
            branch: wt.branch,
            success: false,
            error: error.message || String(error),
          });
        }
      }
    }

    spinner.succeed('Execution complete');

    // Display results
    console.log(chalk.gray(`\nCommand: ${command}\n`));

    for (const result of results) {
      const status = result.success ? chalk.green('✓') : chalk.red('✗');
      console.log(`${status} ${formatBranch(result.branch)}`);

      if (result.output) {
        console.log(chalk.gray('  Output:'));
        result.output.split('\n').forEach(line => {
          console.log(chalk.gray(`    ${line}`));
        });
      }

      if (result.error && result.error.length > 0) {
        console.log(chalk.yellow('  Error/Warnings:'));
        result.error.split('\n').forEach(line => {
          console.log(chalk.yellow(`    ${line}`));
        });
      }

      console.log();
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(chalk.gray('Summary:'));
    console.log(`  ${chalk.green(`${successCount} succeeded`)}, ${chalk.red(`${failCount} failed`)}`);
  } catch (error) {
    spinner.fail('Failed to execute command');
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}
