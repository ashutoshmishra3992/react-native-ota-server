import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppModel, ReleaseModel } from '../types';
import { fetchAppById, addEnvironment } from '../services/appsService';
import { fetchReleases, rollbackRelease } from '../services/releasesService';
import { formatBytes } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { NewReleaseModal } from './NewReleaseModal';
import {
  UploadCloud,
  Copy,
  Check,
  Plus,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';

export const AppDetailsPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const { user } = useAuth();

  const [app, setApp] = useState<AppModel | null>(null);
  const [releases, setReleases] = useState<ReleaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isNewReleaseOpen, setIsNewReleaseOpen] = useState(false);

  // Add environment form state
  const [showAddEnv, setShowAddEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvSuffix, setNewEnvSuffix] = useState('');

  const loadData = async () => {
    if (!appId || !user) return;
    setLoading(true);
    try {
      const appData = await fetchAppById(appId, user.uid);
      setApp(appData);
      const releasesData = await fetchReleases(appId);
      setReleases(releasesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [appId]);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !newEnvName || !user) return;
    try {
      await addEnvironment(appId, newEnvName.trim(), newEnvSuffix.trim().toLowerCase(), user.uid);
      setNewEnvName('');
      setNewEnvSuffix('');
      setShowAddEnv(false);
      loadData();
    } catch (err: any) {
      alert('Failed to add environment: ' + err.message);
    }
  };

  const handleRollback = async (releaseId: string) => {
    if (!appId) return;
    if (confirm('Rollback this release? Mobile clients will stop downloading this bundle.')) {
      await rollbackRelease(appId, releaseId);
      loadData();
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-sm">Loading application details...</div>;
  }

  if (!app) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-700 font-semibold">Application not found.</p>
        <Link to="/dashboard/apps" className="text-emerald-700 text-xs mt-2 inline-block hover:underline">
          ← Back to Apps
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            to="/dashboard/apps"
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Applications
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{app.name}</h2>
            <div className="flex items-center gap-1">
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
          <p className="text-xs font-mono lowercase font-semibold text-emerald-800 mt-1">
            Base Package Name: {app.basePackageName.toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewReleaseOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-sm shadow-emerald-600/20"
          >
            <UploadCloud className="w-4 h-4" />
            Push Update to {app.name}
          </button>
        </div>
      </div>

      {/* Environments Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Environments & Suffixes</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique deployment keys and computed bundle IDs for each build flavor.
            </p>
          </div>
          <button
            onClick={() => setShowAddEnv(!showAddEnv)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Environment
          </button>
        </div>

        {/* Add Environment Inline Box */}
        {showAddEnv && (
          <form
            onSubmit={handleAddEnv}
            className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-end gap-3 shadow-xs"
          >
            <div className="w-48">
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Environment Name
              </label>
              <input
                type="text"
                required
                value={newEnvName}
                onChange={e => setNewEnvName(e.target.value)}
                placeholder="e.g. Beta"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="w-48">
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Package Name Suffix
              </label>
              <input
                type="text"
                value={newEnvSuffix}
                onChange={e => setNewEnvSuffix(e.target.value.toLowerCase())}
                placeholder="e.g. .beta"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono lowercase font-semibold text-emerald-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow-xs"
            >
              Save Environment
            </button>
            <button
              type="button"
              onClick={() => setShowAddEnv(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {app.environments.map(env => (
            <div
              key={env.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 capitalize">{env.name}</span>
                <span className="text-[10px] font-mono lowercase px-2 py-0.5 rounded bg-white text-emerald-800 border border-slate-200 font-semibold">
                  {env.suffix.toLowerCase() || '(none)'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block mb-0.5">
                  Computed Package Name:
                </span>
                <span className="text-xs font-mono lowercase font-medium text-slate-800 break-all">
                  {env.computedPackageName.toLowerCase()}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-sans text-[10px] font-bold">Deployment Key:</span>
                  <button
                    onClick={() => handleCopy(env.deploymentKey)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 hover:text-emerald-800 font-semibold"
                  >
                    {copiedKey === env.deploymentKey ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Key
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 truncate shadow-xs">
                  {env.deploymentKey}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Releases Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Deployment History</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              All over-the-air updates published to this application.
            </p>
          </div>
        </div>

        {releases.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            No releases published to this app yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold bg-slate-50/50">
                  <th className="py-2.5 px-3">File / Release</th>
                  <th className="py-2.5 px-3">Environment</th>
                  <th className="py-2.5 px-3">Target App Version</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Rollout %</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Downloads</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {releases.map(rel => (
                  <tr key={rel.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{rel.bundleFileName}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                        SHA: {rel.bundleHash.substring(0, 16)}...
                      </div>
                    </td>
                    <td className="py-3 px-3 capitalize">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-700">
                        {rel.environmentId}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-700">{rel.targetAppVersion}</td>
                    <td className="py-3 px-3 font-mono uppercase text-slate-600">{rel.platform}</td>
                    <td className="py-3 px-3 font-mono">{rel.rolloutPercentage}%</td>
                    <td className="py-3 px-3">
                      {rel.status === 'active' && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          Active
                        </span>
                      )}
                      {rel.status === 'rolled_back' && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          Rolled Back
                        </span>
                      )}
                      {rel.status === 'disabled' && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{formatBytes(rel.bundleSize)}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">{rel.downloadCount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">
                      {rel.status === 'active' && (
                        <button
                          onClick={() => handleRollback(rel.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all shadow-xs"
                        >
                          <RotateCcw className="w-3 h-3" /> Rollback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Release Modal */}
      <NewReleaseModal
        isOpen={isNewReleaseOpen}
        onClose={() => setIsNewReleaseOpen(false)}
        apps={[app]}
        preSelectedAppId={app.id}
        onCreated={() => {
          setIsNewReleaseOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
