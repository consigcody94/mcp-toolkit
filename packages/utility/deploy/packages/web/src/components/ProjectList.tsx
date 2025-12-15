import { useEffect, useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import type { Project } from '../types';
import { apiClient } from '../api/client';
import { ProjectCard } from './ProjectCard';

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadProjects} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">
            Deploy your first project using the forms above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Your Projects <span className="text-primary-600">({projects.length})</span>
        </h2>
        <button onClick={loadProjects} className="btn btn-secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onUpdate={loadProjects} />
        ))}
      </div>
    </div>
  );
}

// Import RefreshCw at top
import { RefreshCw } from 'lucide-react';
