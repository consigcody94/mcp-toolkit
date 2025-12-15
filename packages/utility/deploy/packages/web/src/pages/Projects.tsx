import { ProjectList } from '../components/ProjectList';

export function Projects() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h1>
        <p className="text-gray-600">
          Manage all your deployed projects in one place
        </p>
      </div>

      {/* Projects */}
      <ProjectList />
    </div>
  );
}
