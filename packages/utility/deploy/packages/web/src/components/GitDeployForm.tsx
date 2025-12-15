import { useState } from 'react';
import { GitBranch, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../api/client';

interface GitDeployFormProps {
  onSuccess?: () => void;
}

export function GitDeployForm({ onSuccess }: GitDeployFormProps) {
  const [deploying, setDeploying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projectName: '',
    subdomain: '',
    repositoryUrl: '',
    branch: 'main',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setDeploying(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.deployFromGit(
        formData.projectName,
        formData.subdomain,
        formData.repositoryUrl,
        formData.branch
      );

      setSuccess(true);
      setFormData({
        projectName: '',
        subdomain: '',
        repositoryUrl: '',
        branch: 'main',
      });

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const isValid =
    formData.projectName &&
    formData.subdomain &&
    formData.repositoryUrl &&
    formData.branch;

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <GitBranch className="w-6 h-6" />
        Deploy from Git
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={formData.projectName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, projectName: e.target.value }))
            }
            placeholder="My React App"
            className="input"
            disabled={deploying}
            required
          />
        </div>

        {/* Subdomain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subdomain
          </label>
          <input
            type="text"
            value={formData.subdomain}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
              }))
            }
            placeholder="my-react-app"
            className="input"
            disabled={deploying}
            required
          />
          {formData.subdomain && (
            <p className="text-sm text-gray-500 mt-1">
              Your site: <span className="font-mono">{formData.subdomain}.localhost:3000</span>
            </p>
          )}
        </div>

        {/* Repository URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Git Repository URL
          </label>
          <input
            type="url"
            value={formData.repositoryUrl}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, repositoryUrl: e.target.value }))
            }
            placeholder="https://github.com/username/repo.git"
            className="input"
            disabled={deploying}
            required
          />
        </div>

        {/* Branch */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch
          </label>
          <input
            type="text"
            value={formData.branch}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, branch: e.target.value }))
            }
            placeholder="main"
            className="input"
            disabled={deploying}
            required
          />
        </div>

        {/* Status Messages */}
        {success && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 font-medium">
              Deployment started! Building in background...
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isValid || deploying}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          {deploying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <GitBranch className="w-5 h-5" />
              Deploy from Git
            </>
          )}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Make sure your repository is public or SiteFast has access.
          One-click redeployments will be available after first deploy.
        </p>
      </div>
    </div>
  );
}
