import { Stats } from '../components/Stats';
import { UploadZone } from '../components/UploadZone';
import { GitDeployForm } from '../components/GitDeployForm';
import { ProjectList } from '../components/ProjectList';
import { useState } from 'react';
import { Zap, Rocket } from 'lucide-react';

export function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDeploySuccess = () => {
    // Force ProjectList to refresh
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-600/20 rounded-full border border-orange-500/30 mb-6">
          <Zap className="w-4 h-4 text-orange-400 lightning-icon" />
          <span className="text-sm font-semibold text-orange-300">Powered by SiteFast Engine</span>
        </div>

        <h1 className="text-6xl font-black mb-4">
          <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
            Deploy in Seconds
          </span>
        </h1>
        <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Like Netlify, but{' '}
          <span className="text-orange-400 font-semibold">fully self-hosted</span> and{' '}
          <span className="text-orange-400 font-semibold">blazingly fast</span>
        </p>

        {/* Animated Icon */}
        <div className="mt-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-full blur-2xl opacity-50 glow-effect"></div>
            <div className="relative p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full">
              <Rocket className="w-16 h-16 text-white rocket-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
        <Stats />
      </div>

      {/* Deployment Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="slide-in-left" style={{ animationDelay: '0.2s' }}>
          <UploadZone onSuccess={handleDeploySuccess} />
        </div>
        <div className="slide-in-right" style={{ animationDelay: '0.2s' }}>
          <GitDeployForm onSuccess={handleDeploySuccess} />
        </div>
      </div>

      {/* Projects List */}
      <div key={refreshKey} className="fade-in-up" style={{ animationDelay: '0.3s' }}>
        <ProjectList />
      </div>
    </div>
  );
}
