import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { fetchApps } from '../../services/appsService';
import { AppModel } from '../../types';
import { Plus, ChevronDown, Sparkles, Smartphone, Menu } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apps, setApps] = useState<AppModel[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (user) {
        const list = await fetchApps(user.uid);
        setApps(list);
        if (list.length > 0 && !selectedAppId) {
          setSelectedAppId(list[0].id);
        }
      }
    }
    load();
  }, [user]);

  const currentApp = apps.find(a => a.id === selectedAppId);

  const handleAppChange = (newAppId: string) => {
    setSelectedAppId(newAppId);
    if (!newAppId) return;
    // If currently on an app details page, navigate to the selected app's details
    if (location.pathname.startsWith('/dashboard/apps/')) {
      navigate(`/dashboard/apps/${newAppId}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 animate-slide-right">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* App Switcher */}
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-slate-500 text-xs uppercase tracking-wider font-semibold">
                Active App:
              </span>
              <div className="relative">
                <select
                  value={selectedAppId}
                  onChange={e => handleAppChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer pr-7 sm:pr-8 appearance-none transition-all shadow-xs max-w-[170px] sm:max-w-xs truncate"
                >
                  {apps.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.name} ({app.basePackageName.toLowerCase()})
                    </option>
                  ))}
                  {apps.length === 0 && <option value="">No apps found</option>}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {currentApp && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                  {currentApp.environments.length} Envs
                </span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono flex items-center gap-1 font-medium">
                  <Smartphone className="w-3 h-3 text-emerald-600" />
                  {currentApp.platforms.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard/simulator"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/70 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Live Tester
            </Link>

            <Link
              to="/dashboard/releases?new=true"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-sm shadow-emerald-600/25"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">Push Release</span>
              <span className="xs:hidden">Release</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          <Outlet
            context={{
              apps,
              selectedAppId,
              setSelectedAppId,
              refreshApps: () => user && fetchApps(user.uid).then(setApps),
            }}
          />
        </main>
      </div>
    </div>
  );
};
