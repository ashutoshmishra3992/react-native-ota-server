import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { AppModel, ReleaseModel } from '../types';
import { fetchReleases, rollbackRelease, updateRelease } from '../services/releasesService';
import { formatBytes, formatDate, timeAgo } from '../utils/formatters';
import { NewReleaseModal } from './NewReleaseModal';
import {
  UploadCloud,
  RotateCcw,
  Plus,
  Filter,
  FileCode,
  Download,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

export const ReleasesListPage: React.FC = () => {
  const { apps } = useOutletContext<{ apps: AppModel[] }>();
  const [searchParams] = useSearchParams();

  const [releases, setReleases] = useState<ReleaseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewReleaseOpen, setIsNewReleaseOpen] = useState(searchParams.get('new') === 'true');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [filterAppId, setFilterAppId] = useState<string>('all');
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

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

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleRollback = async (appId: string, releaseId: string) => {
    if (confirm('Are you sure you want to rollback this release? Mobile clients will stop downloading this bundle.')) {
      try {
        await rollbackRelease(appId, releaseId);
        setToastMessage(`Release successfully rolled back.`);
        setTimeout(() => setToastMessage(null), 4000);
        loadReleases();
      } catch (err: any) {
        alert('Failed to rollback release: ' + err.message);
      }
    }
  };

  const handleRolloutChange = async (releaseId: string, newPercentage: number) => {
    try {
      await updateRelease(releaseId, { rolloutPercentage: newPercentage });
      setReleases(prev =>
        prev.map(r => (r.id === releaseId ? { ...r, rolloutPercentage: newPercentage } : r))
      );
      setToastMessage(`Rollout updated to ${newPercentage}%.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert('Failed to update rollout percentage: ' + err.message);
    }
  };

  // Extract unique environments dynamically from releases and apps
  const availableEnvironments = Array.from(
    new Set([
      'development',
      'staging',
      'production',
      ...releases.map(r => r.environmentId),
      ...apps.flatMap(a => a.environments.map(e => e.id)),
    ])
  );

  const filteredReleases = releases.filter(r => {
    if (filterAppId !== 'all' && r.appId !== filterAppId) return false;
    if (filterEnv !== 'all' && r.environmentId !== filterEnv) return false;
    if (filterPlatform !== 'all' && r.platform !== filterPlatform) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Releases & OTA Deployments</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor deployments, inspect bundle hashes, adjust rollout percentages, and trigger instant rollbacks.
          </p>
        </div>

        <button
          onClick={() => setIsNewReleaseOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-all shadow-sm shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Push New Release
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter:
        </div>

        {/* Filter App */}
        <select
          value={filterAppId}
          onChange={e => setFilterAppId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">All Applications</option>
          {apps.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Filter Environment */}
        <select
          value={filterEnv}
          onChange={e => setFilterEnv(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 capitalize cursor-pointer"
        >
          <option value="all">All Environments</option>
          {availableEnvironments.map(env => (
            <option key={env} value={env} className="capitalize">
              {env}
            </option>
          ))}
        </select>

        {/* Filter Platform */}
        <select
          value={filterPlatform}
          onChange={e => setFilterPlatform(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="all">All Platforms</option>
          <option value="universal">Universal</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
        </select>

        <span className="text-slate-400 ml-auto font-mono text-[11px]">
          Showing {filteredReleases.length} releases
        </span>
      </div>

      {/* Releases Cards / List */}
      <div className="space-y-4">
        {filteredReleases.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">No releases match your filter</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters or deploy a new release.</p>
          </div>
        ) : (
          filteredReleases.map(rel => {
            const parentApp = apps.find(a => a.id === rel.appId);
            return (
              <div
                key={rel.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">
                          {rel.bundleFileName}
                        </span>
                        <span className="capitalize px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-700">
                          {rel.environmentId}
                        </span>
                        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {rel.platform}
                        </span>
                        {rel.isMandatory && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Mandatory
                          </span>
                        )}
                        {rel.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        )}
                        {rel.status === 'rolled_back' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Rolled Back
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Application: <span className="text-slate-900 font-semibold">{parentApp?.name || rel.appId}</span> • Deployed {formatDate(rel.createdAt)} ({timeAgo(rel.createdAt)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rel.bundleUrl && (
                      <a
                        href={rel.bundleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 shadow-2xs"
                        title="Download bundle from Firebase Storage"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        Download Bundle
                      </a>
                    )}
                    {rel.status === 'active' && (
                      <button
                        onClick={() => handleRollback(rel.appId, rel.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Rollback Release
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Native Binary:</span>
                    <span className="font-mono text-emerald-800 font-bold text-xs">{rel.targetAppVersion}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bundle Size:</span>
                    <span className="font-mono text-slate-700">{formatBytes(rel.bundleSize)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Downloads / Installed:</span>
                    <span className="font-mono text-slate-900 font-bold">{rel.downloadCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">SHA-256 Hash:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-600 text-[10px] truncate block" title={rel.bundleHash}>
                        {rel.bundleHash.substring(0, 14)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(rel.bundleHash)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-700 transition-colors"
                        title="Copy full SHA-256 hash"
                      >
                        {copiedHash === rel.bundleHash ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Staged Rollout Slider (if active) */}
                {rel.status === 'active' && (
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                      <span className="text-xs text-slate-600 font-medium">Staged Rollout:</span>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={rel.rolloutPercentage}
                        onChange={e => handleRolloutChange(rel.id, Number(e.target.value))}
                        className="accent-emerald-600 flex-1 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-emerald-800 min-w-10 text-right">
                        {rel.rolloutPercentage}%
                      </span>
                    </div>

                    {rel.releaseNotes && (
                      <p className="text-xs text-slate-500 italic truncate max-w-sm">
                        "{rel.releaseNotes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Release Modal */}
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
