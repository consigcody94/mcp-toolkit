import { useEffect, useState } from 'react';
import { Activity, Zap, Package, XCircle } from 'lucide-react';
import type { Stats as StatsType } from '../types';
import { apiClient } from '../api/client';

export function Stats() {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await apiClient.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return null;
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Projects */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
          </div>
          <div className="p-3 bg-primary-100 rounded-xl">
            <Package className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Active Deployments */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Active Deployments</p>
            <p className="text-3xl font-bold text-green-600">{stats.activeDeployments}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-xl">
            <Zap className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Failed Deployments */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Failed Deployments</p>
            <p className="text-3xl font-bold text-red-600">{stats.failedDeployments}</p>
          </div>
          <div className="p-3 bg-red-100 rounded-xl">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Uptime */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Server Uptime</p>
            <p className="text-3xl font-bold text-blue-600">{formatUptime(stats.uptime)}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
