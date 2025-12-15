import { useState } from 'react';
import { ExternalLink, GitBranch, Trash2, RefreshCw, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Project } from '../types';
import { apiClient } from '../api/client';

interface ProjectCardProps {
  project: Project;
  onUpdate: () => void;
}

export function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [redeploying, setRedeploying] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await apiClient.deleteProject(project.subdomain);
      onUpdate();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleRedeploy = async () => {
    if (!project.repository) {
      alert('Cannot redeploy: project was not deployed from Git');
      return;
    }

    setRedeploying(true);
    try {
      await apiClient.redeploy(project.id);
      alert('Redeployment started! Building in background...');
      onUpdate();
    } catch (error) {
      console.error('Redeploy failed:', error);
      alert('Failed to redeploy project');
    } finally {
      setRedeploying(false);
    }
  };

  const projectUrl = `http://${project.subdomain}.localhost:3000`;

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-mono">{project.subdomain}.localhost:3000</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Open site"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Framework Badge */}
      {project.framework && (
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="badge badge-info">
            {project.framework.charAt(0).toUpperCase() + project.framework.slice(1)}
          </span>
        </div>
      )}

      {/* Git Info */}
      {project.repository && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <GitBranch className="w-4 h-4" />
          <span className="font-mono text-xs truncate">{project.repository}</span>
          {project.branch && (
            <span className="badge badge-info">{project.branch}</span>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Clock className="w-4 h-4" />
        <span>
          Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        {project.repository && (
          <button
            onClick={handleRedeploy}
            disabled={redeploying}
            className="btn btn-secondary flex items-center gap-2 flex-1"
          >
            <RefreshCw className={`w-4 h-4 ${redeploying ? 'animate-spin' : ''}`} />
            {redeploying ? 'Redeploying...' : 'Redeploy'}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="btn bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
