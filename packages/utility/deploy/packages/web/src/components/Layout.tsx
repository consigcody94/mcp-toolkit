import { Link, Outlet, useLocation } from 'react-router-dom';
import { Zap, Home, Package, Github, Rocket } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen relative">
      {/* Animated Speed Lines Background */}
      <div className="speed-lines">
        <div className="speed-line"></div>
        <div className="speed-line"></div>
        <div className="speed-line"></div>
        <div className="speed-line"></div>
      </div>

      {/* Header */}
      <header className="glass-card border-b border-orange-500/20 sticky top-0 z-50 slide-in-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                  <Rocket className="w-6 h-6 text-white rocket-icon" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                  SiteFast
                </span>
                <div className="text-xs text-gray-400 font-medium">Lightning-Fast Deployment</div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                to="/"
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${
                    isActive('/')
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/50'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                to="/projects"
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${
                    isActive('/projects')
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/50'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Package className="w-4 h-4" />
                Projects
              </Link>

              <a
                href="https://github.com/consigcody94/sitefast"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-orange-500/20 mt-12 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-300 flex items-center gap-2">
              Built with <span className="text-red-500">❤️</span> using React, TypeScript, and Express
            </p>
            <p className="text-orange-400 font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 lightning-icon" />
              Deploy locally, deploy fast!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
