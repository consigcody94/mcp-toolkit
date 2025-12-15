/**
 * Build engine for compiling and preparing deployments
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { FrameworkDetector } from './framework-detector.js';
import type { BuildConfig, BuildResult } from './types.js';

export class BuildEngine {
  private frameworkDetector: FrameworkDetector;

  constructor() {
    this.frameworkDetector = new FrameworkDetector();
  }

  /**
   * Build a project
   */
  async build(
    projectPath: string,
    environmentVariables: Record<string, string> = {},
    onLog?: (message: string) => void
  ): Promise<BuildResult> {
    const startTime = Date.now();
    const logs: string[] = [];

    const log = (message: string) => {
      logs.push(message);
      if (onLog) onLog(message);
    };

    try {
      log(`🔍 Detecting framework...`);
      const detection = this.frameworkDetector.detect(projectPath);
      log(`✅ Detected ${detection.framework} (confidence: ${(detection.confidence * 100).toFixed(0)}%)`);
      detection.indicators.forEach((indicator) => log(`   - ${indicator}`));

      const buildConfig = this.frameworkDetector.getBuildConfig(
        detection.framework,
        projectPath
      );

      log(`\n📦 Installing dependencies with ${buildConfig.packageManager}...`);
      await this.runCommand(buildConfig.installCommand, projectPath, environmentVariables, log);
      log(`✅ Dependencies installed`);

      if (detection.framework !== 'static') {
        log(`\n🔨 Building project...`);
        log(`   Command: ${buildConfig.buildCommand}`);
        await this.runCommand(buildConfig.buildCommand, projectPath, environmentVariables, log);
        log(`✅ Build complete`);
      } else {
        log(`\n📄 Static files - no build required`);
      }

      const outputPath = join(projectPath, buildConfig.outputDirectory);

      if (!existsSync(outputPath)) {
        throw new Error(`Build output directory not found: ${buildConfig.outputDirectory}`);
      }

      const buildTime = Date.now() - startTime;
      log(`\n🎉 Deployment ready in ${(buildTime / 1000).toFixed(2)}s`);

      return {
        success: true,
        outputPath,
        buildTime,
        logs,
      };
    } catch (error) {
      const buildTime = Date.now() - startTime;
      const errorMessage = (error as Error).message;
      log(`\n❌ Build failed: ${errorMessage}`);

      return {
        success: false,
        outputPath: '',
        buildTime,
        logs,
        error: errorMessage,
      };
    }
  }

  /**
   * Run a shell command and capture output
   */
  private runCommand(
    command: string,
    cwd: string,
    env: Record<string, string>,
    onLog: (message: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');

      const childProcess = spawn(cmd, args, {
        cwd,
        env: {
          ...process.env,
          ...env,
          CI: 'true',
          NODE_ENV: 'production',
        },
        shell: true,
      });

      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        output.split('\n').filter(Boolean).forEach((line: string) => {
          onLog(`   ${line}`);
        });
      });

      childProcess.stderr.on('data', (data) => {
        const output = data.toString();
        output.split('\n').filter(Boolean).forEach((line: string) => {
          onLog(`   ${line}`);
        });
      });

      childProcess.on('error', (error) => {
        reject(new Error(`Failed to run command: ${error.message}`));
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Get build configuration for a project
   */
  getBuildConfig(projectPath: string): BuildConfig {
    const detection = this.frameworkDetector.detect(projectPath);
    return this.frameworkDetector.getBuildConfig(detection.framework, projectPath);
  }
}
