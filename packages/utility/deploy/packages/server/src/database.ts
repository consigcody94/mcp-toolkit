/**
 * Database service using SQLite
 */

import Database from 'better-sqlite3';
import type { Project, Deployment, DeploymentStatus } from './types.js';

export class DatabaseService {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  private initSchema(): void {
    // Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subdomain TEXT UNIQUE NOT NULL,
        repository TEXT,
        branch TEXT,
        framework TEXT,
        build_command TEXT,
        output_directory TEXT,
        environment_variables TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Deployments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS deployments (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        status TEXT NOT NULL,
        url TEXT NOT NULL,
        commit_hash TEXT,
        commit_message TEXT,
        build_log TEXT NOT NULL,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        error TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);
      CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
      CREATE INDEX IF NOT EXISTS idx_projects_subdomain ON projects(subdomain);
    `);
  }

  // ==================== Projects ====================

  createProject(project: Project): void {
    const stmt = this.db.prepare(`
      INSERT INTO projects (
        id, name, subdomain, repository, branch, framework,
        build_command, output_directory, environment_variables,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      project.id,
      project.name,
      project.subdomain,
      project.repository || null,
      project.branch || null,
      project.framework || null,
      project.buildCommand || null,
      project.outputDirectory || null,
      project.environmentVariables ? JSON.stringify(project.environmentVariables) : null,
      project.createdAt,
      project.updatedAt
    );
  }

  getProject(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToProject(row);
  }

  getProjectBySubdomain(subdomain: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE subdomain = ?');
    const row = stmt.get(subdomain) as any;

    if (!row) return null;

    return this.rowToProject(row);
  }

  getAllProjects(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    const rows = stmt.all() as any[];

    return rows.map((row) => this.rowToProject(row));
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.repository !== undefined) {
      fields.push('repository = ?');
      values.push(updates.repository);
    }
    if (updates.branch !== undefined) {
      fields.push('branch = ?');
      values.push(updates.branch);
    }
    if (updates.framework !== undefined) {
      fields.push('framework = ?');
      values.push(updates.framework);
    }
    if (updates.buildCommand !== undefined) {
      fields.push('build_command = ?');
      values.push(updates.buildCommand);
    }
    if (updates.outputDirectory !== undefined) {
      fields.push('output_directory = ?');
      values.push(updates.outputDirectory);
    }
    if (updates.environmentVariables !== undefined) {
      fields.push('environment_variables = ?');
      values.push(JSON.stringify(updates.environmentVariables));
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`
    );
    stmt.run(...values);
  }

  deleteProject(id: string): void {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
  }

  // ==================== Deployments ====================

  createDeployment(deployment: Deployment): void {
    const stmt = this.db.prepare(`
      INSERT INTO deployments (
        id, project_id, status, url, commit_hash, commit_message,
        build_log, created_at, completed_at, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      deployment.id,
      deployment.projectId,
      deployment.status,
      deployment.url,
      deployment.commitHash || null,
      deployment.commitMessage || null,
      JSON.stringify(deployment.buildLog),
      deployment.createdAt,
      deployment.completedAt || null,
      deployment.error || null
    );
  }

  getDeployment(id: string): Deployment | null {
    const stmt = this.db.prepare('SELECT * FROM deployments WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToDeployment(row);
  }

  getProjectDeployments(projectId: string, limit = 50): Deployment[] {
    const stmt = this.db.prepare(
      'SELECT * FROM deployments WHERE project_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    const rows = stmt.all(projectId, limit) as any[];

    return rows.map((row) => this.rowToDeployment(row));
  }

  getLatestDeployment(projectId: string): Deployment | null {
    const stmt = this.db.prepare(
      'SELECT * FROM deployments WHERE project_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1'
    );
    const row = stmt.get(projectId, 'ready') as any;

    if (!row) return null;

    return this.rowToDeployment(row);
  }

  updateDeploymentStatus(
    id: string,
    status: DeploymentStatus,
    logs?: string[],
    error?: string
  ): void {
    const updates: string[] = ['status = ?'];
    const values: any[] = [status];

    if (logs !== undefined) {
      updates.push('build_log = ?');
      values.push(JSON.stringify(logs));
    }

    if (error !== undefined) {
      updates.push('error = ?');
      values.push(error);
    }

    if (status === 'ready' || status === 'failed') {
      updates.push('completed_at = ?');
      values.push(new Date().toISOString());
    }

    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE deployments SET ${updates.join(', ')} WHERE id = ?`
    );
    stmt.run(...values);
  }

  addDeploymentLog(id: string, logEntry: string): void {
    const deployment = this.getDeployment(id);
    if (!deployment) return;

    const logs = [...deployment.buildLog, logEntry];

    const stmt = this.db.prepare('UPDATE deployments SET build_log = ? WHERE id = ?');
    stmt.run(JSON.stringify(logs), id);
  }

  deleteDeployment(id: string): void {
    const stmt = this.db.prepare('DELETE FROM deployments WHERE id = ?');
    stmt.run(id);
  }

  // ==================== Utilities ====================

  private rowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      subdomain: row.subdomain,
      repository: row.repository || undefined,
      branch: row.branch || undefined,
      framework: row.framework || undefined,
      buildCommand: row.build_command || undefined,
      outputDirectory: row.output_directory || undefined,
      environmentVariables: row.environment_variables
        ? JSON.parse(row.environment_variables)
        : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private rowToDeployment(row: any): Deployment {
    return {
      id: row.id,
      projectId: row.project_id,
      status: row.status,
      url: row.url,
      commitHash: row.commit_hash || undefined,
      commitMessage: row.commit_message || undefined,
      buildLog: JSON.parse(row.build_log),
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
      error: row.error || undefined,
    };
  }

  close(): void {
    this.db.close();
  }
}
