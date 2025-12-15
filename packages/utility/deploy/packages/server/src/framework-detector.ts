/**
 * Framework detection service
 * Automatically detects the framework from package.json and project files
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Framework, FrameworkDetection, BuildConfig } from './types.js';

export class FrameworkDetector {
  /**
   * Detect framework from project directory
   */
  detect(projectPath: string): FrameworkDetection {
    const packageJsonPath = join(projectPath, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return {
        framework: 'static',
        confidence: 1.0,
        indicators: ['No package.json found - treating as static site'],
      };
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const scripts = packageJson.scripts || {};
      const indicators: string[] = [];

      // Next.js detection
      if (dependencies['next']) {
        indicators.push('next dependency found');
        return { framework: 'nextjs', confidence: 1.0, indicators };
      }

      // Gatsby detection
      if (dependencies['gatsby']) {
        indicators.push('gatsby dependency found');
        return { framework: 'gatsby', confidence: 1.0, indicators };
      }

      // Vite detection
      if (dependencies['vite']) {
        indicators.push('vite dependency found');

        // Check for specific Vite frameworks
        if (dependencies['@vitejs/plugin-react'] || dependencies['react']) {
          indicators.push('React with Vite');
          return { framework: 'vite', confidence: 1.0, indicators };
        }

        if (dependencies['@vitejs/plugin-vue'] || dependencies['vue']) {
          indicators.push('Vue with Vite');
          return { framework: 'vite', confidence: 1.0, indicators };
        }

        if (dependencies['svelte']) {
          indicators.push('Svelte with Vite');
          return { framework: 'vite', confidence: 1.0, indicators };
        }

        return { framework: 'vite', confidence: 0.9, indicators };
      }

      // Create React App detection
      if (dependencies['react-scripts']) {
        indicators.push('react-scripts found (Create React App)');
        return { framework: 'react', confidence: 1.0, indicators };
      }

      // Vue CLI detection
      if (dependencies['@vue/cli-service']) {
        indicators.push('@vue/cli-service found');
        return { framework: 'vue', confidence: 1.0, indicators };
      }

      // Angular detection
      if (dependencies['@angular/core']) {
        indicators.push('@angular/core found');
        return { framework: 'angular', confidence: 1.0, indicators };
      }

      // Svelte detection (without Vite)
      if (dependencies['svelte']) {
        indicators.push('svelte dependency found');
        return { framework: 'svelte', confidence: 0.9, indicators };
      }

      // Hugo detection
      if (existsSync(join(projectPath, 'config.toml')) ||
          existsSync(join(projectPath, 'config.yaml'))) {
        indicators.push('Hugo config file found');
        return { framework: 'hugo', confidence: 0.9, indicators };
      }

      // Jekyll detection
      if (existsSync(join(projectPath, '_config.yml'))) {
        indicators.push('Jekyll _config.yml found');
        return { framework: 'jekyll', confidence: 0.9, indicators };
      }

      // Generic React (without CRA)
      if (dependencies['react'] && dependencies['react-dom']) {
        indicators.push('React dependencies found (custom setup)');
        return { framework: 'react', confidence: 0.7, indicators };
      }

      // Generic Vue (without Vue CLI)
      if (dependencies['vue']) {
        indicators.push('Vue dependency found (custom setup)');
        return { framework: 'vue', confidence: 0.7, indicators };
      }

      // Has build scripts but no known framework
      if (scripts.build || scripts.start) {
        indicators.push('Build scripts found, no specific framework detected');
        return { framework: 'static', confidence: 0.5, indicators };
      }

      // Default to static
      indicators.push('No framework detected - treating as static site');
      return { framework: 'static', confidence: 0.8, indicators };
    } catch (error) {
      return {
        framework: 'static',
        confidence: 0.5,
        indicators: [`Error reading package.json: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Get build configuration for detected framework
   */
  getBuildConfig(framework: Framework, projectPath: string): BuildConfig {
    const packageJson = this.readPackageJson(projectPath);
    const packageManager = this.detectPackageManager(projectPath);

    const configs: Record<Framework, BuildConfig> = {
      nextjs: {
        framework: 'nextjs',
        buildCommand: 'next build',
        outputDirectory: '.next',
        installCommand: `${packageManager} install`,
        packageManager,
      },
      react: {
        framework: 'react',
        buildCommand: packageJson?.scripts?.build || 'react-scripts build',
        outputDirectory: 'build',
        installCommand: `${packageManager} install`,
        packageManager,
      },
      vue: {
        framework: 'vue',
        buildCommand: packageJson?.scripts?.build || 'vue-cli-service build',
        outputDirectory: 'dist',
        installCommand: `${packageManager} install`,
        packageManager,
      },
      vite: {
        framework: 'vite',
        buildCommand: 'vite build',
        outputDirectory: 'dist',
        installCommand: `${packageManager} install`,
        packageManager,
      },
      svelte: {
        framework: 'svelte',
        buildCommand: packageJson?.scripts?.build || 'rollup -c',
        outputDirectory: 'public/build',
        installCommand: `${packageManager} install`,
        packageManager,
      },
      angular: {
        framework: 'angular',
        buildCommand: 'ng build --configuration production',
        outputDirectory: 'dist',
        installCommand: `${packageManager} install`,
        packageManager,
      },
      gatsby: {
        framework: 'gatsby',
        buildCommand: 'gatsby build',
        outputDirectory: 'public',
        installCommand: `${packageManager} install`,
        packageManager,
      },
      hugo: {
        framework: 'hugo',
        buildCommand: 'hugo',
        outputDirectory: 'public',
        installCommand: 'echo "Hugo requires no installation"',
        packageManager: 'npm',
      },
      jekyll: {
        framework: 'jekyll',
        buildCommand: 'jekyll build',
        outputDirectory: '_site',
        installCommand: 'bundle install',
        packageManager: 'npm',
      },
      static: {
        framework: 'static',
        buildCommand: 'echo "No build required for static files"',
        outputDirectory: '.',
        installCommand: 'echo "No installation required"',
        packageManager: 'npm',
      },
    };

    return configs[framework];
  }

  /**
   * Detect package manager from lock files
   */
  private detectPackageManager(projectPath: string): 'npm' | 'yarn' | 'pnpm' {
    if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }

    if (existsSync(join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }

    return 'npm';
  }

  /**
   * Read and parse package.json
   */
  private readPackageJson(projectPath: string): any | null {
    const packageJsonPath = join(projectPath, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    } catch {
      return null;
    }
  }
}
