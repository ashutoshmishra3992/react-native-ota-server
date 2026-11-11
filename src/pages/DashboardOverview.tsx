import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { AppModel, ReleaseModel } from '../types';
import { fetchReleases, rollbackRelease } from '../services/releasesService';
import { formatBytes, timeAgo } from '../utils/formatters';
import {
  Layers,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  Plus,
  ArrowRight,
  RotateCcw,
  Terminal,
  Activity,
  Smartphone,
} from 'lucide-react';
import { CreateAppModal } from './CreateAppModal';
import { NewReleaseModal } from './NewReleaseModal';

export const DashboardOverview: React.FC = () => {
  const { apps, refreshApps } = useOutletContext<{
    apps: AppModel[];
    refreshApps: () => void;
  }>();

  const [releases, setReleases] = useState<ReleaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateAppOpen, setIsCreateAppOpen] = useState(false);
  const [isNewReleaseOpen, setIsNewReleaseOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadReleases = async () => {
    setLoading(true);
    try {
      const data = await fetchReleases();
      setReleases(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const totalDownloads = releases.reduce((sum, r) => sum + (r.downloadCount || 0), 0);
  const activeReleases = releases.filter(r => r.status === 'active');

  const handleRollback = async (appId: string, releaseId: string) => {
    if (confirm('Are you sure you want to rollback this release? It will immediately stop serving to devices.')) {
      try {
        await rollbackRelease(appId, releaseId);
        setActionMessage(`Successfully rolled back release ${releaseId}`);
        await loadReleases();
        setTimeout(() => setActionMessage(null), 4000);
      } catch (err: any) {
        alert('Failed to rollback release: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status of your React Native applications and OTA deployments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateAppOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            Add Application
          </button>
          <button
            onClick={() => setIsNewReleaseOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-sm shadow-emerald-600/25"
          >
            <UploadCloud className="w-4 h-4" />
            Push OTA Update
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Apps</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{apps.length}</span>
            <span className="text-xs font-semibold text-emerald-600">active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Releases</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{activeReleases.length}</span>
            <span className="text-xs text-slate-500">across channels</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Updates Delivered</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <DownloadCloud className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totalDownloads.toLocaleString()}</span>
            <span className="text-xs text-cyan-700 font-medium">downloads</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deployment Keys</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">
              {apps.reduce((acc, a) => acc + (a.environments?.length || 0), 0)}
            </span>
            <span className="text-xs text-indigo-700 font-medium">endpoints</span>
          </div>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/dashboard/apps"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Manage Applications</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configure package name suffixes (<code className="text-emerald-700 font-mono bg-slate-100 px-1 rounded">.dev</code>, <code className="text-emerald-700 font-mono bg-slate-100 px-1 rounded">.staging</code>), targets, and keys.
          </p>
        </Link>

        <Link
          to="/dashboard/api-keys"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">REST API & CI/CD Keys</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate automation API tokens to push releases via GitHub Actions or Fastlane.
          </p>
        </Link>

        <Link
          to="/dashboard/sdk-guide"
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-500 hover:shadow-md transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Client SDK Integration</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Copy-pasteable React Native bundle URL loader for Android (<code className="text-teal-700 font-mono text-[11px] bg-slate-100 px-1 rounded">MainApplication.kt</code>) and iOS.
          </p>
        </Link>
      </div>

      {/* Recent Releases Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Deployments</h3>
            <p className="text-xs text-slate-500 mt-0.5">Most recent updates pushed to channels</p>
          </div>
          <Link
            to="/dashboard/releases"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View all releases <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {releases.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">No releases deployed yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Push your first React Native bundle update to start distributing instantly.
            </p>
            <button
              onClick={() => setIsNewReleaseOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Push First Release
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold bg-slate-50/50">
                  <th className="py-2.5 px-3">Release / App</th>
                  <th className="py-2.5 px-3">Environment</th>
                  <th className="py-2.5 px-3">Target Binary</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Rollout %</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Downloads</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {releases.slice(0, 5).map(rel => {
                  const parentApp = apps.find(a => a.id === rel.appId);
                  return (
                    <tr key={rel.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 text-sm">
                          {rel.bundleFileName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {parentApp?.name || rel.appId} • {timeAgo(rel.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="capitalize px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-700">
                          {rel.environmentId}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-emerald-700">
                        {rel.targetAppVersion}
                      </td>

                      <td className="py-3.5 px-3 uppercase text-slate-600 font-mono">
                        {rel.platform}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${rel.rolloutPercentage}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-slate-600">{rel.rolloutPercentage}%</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {rel.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        )}
                        {rel.status === 'rolled_back' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Rolled Back
                          </span>
                        )}
                        {rel.status === 'disabled' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 font-mono">
                        {formatBytes(rel.bundleSize)}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-900">
                        {rel.downloadCount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        {rel.status === 'active' ? (
                          <button
                            onClick={() => handleRollback(rel.appId, rel.id)}
                            title="Rollback release"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all shadow-sm"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Rollback
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAppModal
        isOpen={isCreateAppOpen}
        onClose={() => setIsCreateAppOpen(false)}
        onCreated={() => {
          setIsCreateAppOpen(false);
          refreshApps();
        }}
      />

      <NewReleaseModal
        isOpen={isNewReleaseOpen}
        onClose={() => setIsNewReleaseOpen(false)}
        apps={apps}
        onCreated={() => {
          setIsNewReleaseOpen(false);
          loadReleases();
        }}
      />
    </div>
  );
};
