import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileArchive, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '../api/client';

interface UploadZoneProps {
  onSuccess?: () => void;
}

export function UploadZone({ onSuccess }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [subdomain, setSubdomain] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Auto-generate project name and subdomain from filename if not set
      if (!projectName) {
        const name = file.name.split('.')[0];
        setProjectName(name);
        setSubdomain(name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        return; // Wait for user to confirm
      }

      setUploading(true);
      setError(null);
      setSuccess(false);

      try {
        await apiClient.deployFromUpload(file, projectName, subdomain);
        setSuccess(true);
        setProjectName('');
        setSubdomain('');
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [projectName, subdomain, onSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-tar': ['.tar'],
      'application/gzip': ['.tar.gz', '.tgz'],
    },
    maxFiles: 1,
    disabled: uploading || !projectName || !subdomain,
  });

  const handleDeploy = async () => {
    if (!projectName || !subdomain) return;

    // Trigger file picker
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">📦 Upload & Deploy</h2>

      {/* Project Info Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Awesome Project"
            className="input"
            disabled={uploading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subdomain
          </label>
          <input
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="my-project"
            className="input"
            disabled={uploading}
          />
          {subdomain && (
            <p className="text-sm text-gray-500 mt-1">
              Your site: <span className="font-mono">{subdomain}.localhost:3000</span>
            </p>
          )}
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 cursor-pointer
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400 hover:bg-primary-50'}
          ${!projectName || !subdomain ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <Loader2 className="w-16 h-16 text-primary-500 mb-4 animate-spin" />
              <p className="text-lg font-medium text-gray-700">Uploading & Deploying...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a minute</p>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-green-700">Deployment Started!</p>
              <p className="text-sm text-gray-500 mt-2">Building in background...</p>
            </>
          ) : error ? (
            <>
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-lg font-medium text-red-700">Upload Failed</p>
              <p className="text-sm text-red-600 mt-2">{error}</p>
            </>
          ) : (
            <>
              {isDragActive ? (
                <FileArchive className="w-16 h-16 text-primary-500 mb-4" />
              ) : (
                <Upload className="w-16 h-16 text-gray-400 mb-4" />
              )}
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive ? 'Drop it like it\'s hot! 🔥' : 'Drag & drop your project'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                .zip, .tar, or .tar.gz files supported
              </p>
              {projectName && subdomain ? (
                <button onClick={handleDeploy} className="btn btn-primary mt-2">
                  Or click to browse files
                </button>
              ) : (
                <p className="text-sm text-orange-600 font-medium">
                  ⚠️ Enter project name and subdomain first
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* File Size Limit Info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Max file size: 100MB • Supports: Next.js, React, Vue, Vite, and more</p>
      </div>
    </div>
  );
}
