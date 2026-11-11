import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { AppModel } from '../types';
import { deleteApp } from '../services/appsService';
import { useAuth } from '../context/AuthContext';
import { CreateAppModal } from './CreateAppModal';
import { NewReleaseModal } from './NewReleaseModal';
import {
  Layers,
  Plus,
  Smartphone,
  Copy,
  Check,
  Trash2,
  UploadCloud,
  ChevronRight,
} from 'lucide-react';

export const AppsListPage: React.FC = () => {
  const { apps, refreshApps } = useOutletContext<{
    apps: AppModel[];
    refreshApps: () => void;
  }>();
  const { user } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAppForRelease, setSelectedAppForRelease] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async (appId: string, name: string) => {
    if (confirm(`Are you sure you want to delete app "${name}"? This cannot be undone.`)) {
      if (!user) return;
      try {
        await deleteApp(appId, user.uid);
        refreshApps();
      } catch (err: any) {
        alert('Failed to delete app: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Applications</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your React Native apps, package name suffixes, environments, and deployment keys.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-sm shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Register New App
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl p-8 shadow-sm">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No applications configured yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Add your first app to configure environments (Development, Staging, Production) with respective package name suffixes.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Application Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {apps.map(app => (
            <div
              key={app.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/dashboard/apps/${app.id}`}
                        className="text-lg font-bold text-slate-900 hover:text-emerald-700 transition-colors"
                      >
                        {app.name}
                      </Link>
                      <div className="flex items-center gap-1.5">
                        {app.platforms.map(p => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs font-mono font-semibold text-emerald-800 mt-0.5 lowercase">
                      Base Package: {app.basePackageName.toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedAppForRelease(app.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200 text-xs font-semibold transition-all shadow-xs"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
                    Push Release
                  </button>
                  <Link
                    to={`/dashboard/apps/${app.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(app.id, app.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete App"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Environments Table */}
              <div className="mt-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Configured Environments & Deployment Keys
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {app.environments.map(env => (
                    <div
                      key={env.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 capitalize">{env.name}</span>
                        <span className="text-[10px] font-mono lowercase px-2 py-0.5 rounded bg-white text-emerald-800 border border-slate-200 font-semibold">
                          {env.suffix.toLowerCase() || '(no suffix)'}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono lowercase text-slate-600 truncate">
                        <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Computed Package:</span>
                        <span className="text-slate-800 font-medium lowercase">{env.computedPackageName.toLowerCase()}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-sans text-[10px] font-bold">Key:</span>
                        <div className="flex items-center gap-1.5 max-w-[170px]">
                          <span className="font-mono text-slate-600 truncate text-[10px]">
                            {env.deploymentKey}
                          </span>
                          <button
                            onClick={() => handleCopy(env.deploymentKey)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-white transition-colors shrink-0"
                            title="Copy Deployment Key"
                          >
                            {copiedKey === env.deploymentKey ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateAppModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          refreshApps();
        }}
      />

      <NewReleaseModal
        isOpen={Boolean(selectedAppForRelease)}
        onClose={() => setSelectedAppForRelease(null)}
        apps={apps}
        preSelectedAppId={selectedAppForRelease || undefined}
        onCreated={() => {
          setSelectedAppForRelease(null);
          refreshApps();
        }}
      />
    </div>
  );
};
