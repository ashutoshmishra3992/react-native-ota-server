import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { AppModel, TargetPlatform } from '../types';
import { createRelease } from '../services/releasesService';
import { computeFileHash } from '../utils/hash';
import { formatBytes } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileCode,
  AlertCircle,
} from 'lucide-react';

interface NewReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppModel[];
  preSelectedAppId?: string;
  onCreated: () => void;
}

export const NewReleaseModal: React.FC<NewReleaseModalProps> = ({
  isOpen,
  onClose,
  apps,
  preSelectedAppId,
  onCreated,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appId, setAppId] = useState<string>(preSelectedAppId || apps[0]?.id || '');
  const selectedApp = apps.find(a => a.id === appId) || apps[0];

  const [environmentId, setEnvironmentId] = useState<string>(
    selectedApp?.environments[0]?.id || 'development'
  );

  // Compute allowed platforms based strictly on what was chosen when creating the app
  const availablePlatforms = React.useMemo<{ id: TargetPlatform; label: string }[]>(() => {
    if (!selectedApp || !selectedApp.platforms || selectedApp.platforms.length === 0) {
      return [
        { id: 'universal', label: 'Universal (Android & iOS)' },
        { id: 'android', label: 'Android Only' },
        { id: 'ios', label: 'iOS Only' },
      ];
    }

    const appPlatforms = selectedApp.platforms;
    const hasAndroid = appPlatforms.includes('android');
    const hasIos = appPlatforms.includes('ios');
    const hasUniversal = appPlatforms.includes('universal');

    if (hasUniversal) {
      return [{ id: 'universal', label: 'Universal (Android & iOS)' }];
    }
    if (hasAndroid && hasIos) {
      return [
        { id: 'universal', label: 'Universal (Android & iOS)' },
        { id: 'android', label: 'Android Only' },
        { id: 'ios', label: 'iOS Only' },
      ];
    }
    if (hasAndroid) {
      return [{ id: 'android', label: 'Android Only' }];
    }
    if (hasIos) {
      return [{ id: 'ios', label: 'iOS Only' }];
    }
    return [{ id: 'universal', label: 'Universal (Android & iOS)' }];
  }, [selectedApp]);

  const [platform, setPlatform] = useState<TargetPlatform>(availablePlatforms[0]?.id || 'universal');

  // Keep platform in sync with selected app's allowed platforms
  useEffect(() => {
    if (availablePlatforms.length > 0) {
      const isValid = availablePlatforms.some(p => p.id === platform);
      if (!isValid) {
        setPlatform(availablePlatforms[0].id);
      }
    }
  }, [availablePlatforms, platform]);

  useEffect(() => {
    if (!appId && apps.length > 0) {
      const initialApp = preSelectedAppId ? apps.find(a => a.id === preSelectedAppId) || apps[0] : apps[0];
      setAppId(initialApp.id);
      if (initialApp.environments.length > 0) {
        setEnvironmentId(initialApp.environments[0].id);
      }
    }
  }, [apps, appId, preSelectedAppId]);
  const [targetAppVersion, setTargetAppVersion] = useState('1.0.0');
  const [isMandatory, setIsMandatory] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState<number>(100);
  const [releaseNotes, setReleaseNotes] = useState('');

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [computedHash, setComputedHash] = useState<string>('');
  const [calculatingHash, setCalculatingHash] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAppChange = (newAppId: string) => {
    setAppId(newAppId);
    const app = apps.find(a => a.id === newAppId);
    if (app && app.environments.length > 0) {
      setEnvironmentId(app.environments[0].id);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setCalculatingHash(true);
    setError(null);
    try {
      const hash = await computeFileHash(selectedFile);
      setComputedHash(hash);
    } catch (err: any) {
      setError('Failed to compute bundle checksum: ' + err.message);
    } finally {
      setCalculatingHash(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !environmentId) {
      setError('Please select an application and environment.');
      return;
    }
    if (!targetAppVersion.trim()) {
      setError('Target App Version (semver) is required.');
      return;
    }

    if (!user) {
      setError('You must be signed in to deploy releases.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setUploadProgress(10);

    try {
      await createRelease(
        {
          appId,
          environmentId,
          platform,
          targetAppVersion: targetAppVersion.trim(),
          releaseNotes: releaseNotes.trim(),
          isMandatory,
          rolloutPercentage,
          file: file || undefined,
          bundleFileName: file?.name || 'index.android.bundle',
          bundleSize: file?.size || 1572864,
          bundleHash: computedHash || '3f786850e387550fdab836ed7e6dc881de23001b70e87038c0136221456c21cf',
        },
        user.uid,
        progress => setUploadProgress(progress)
      );

      setFile(null);
      setComputedHash('');
      setReleaseNotes('');
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to publish OTA release.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Push React Native OTA Release"
      description="Deploy a new JavaScript bundle or assets zip over-the-air."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* App & Environment Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Application</label>
            <select
              name="appId"
              value={appId}
              onChange={e => handleAppChange(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
            >
              {apps.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.basePackageName.toLowerCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Environment</label>
            <select
              name="environmentId"
              value={environmentId}
              onChange={e => setEnvironmentId(e.target.value)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer capitalize transition-all"
            >
              {selectedApp?.environments.map(env => (
                <option key={env.id} value={env.id}>
                  {env.name} ({env.computedPackageName.toLowerCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Platform Target & Target Binary Version */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Target Platform</label>
              <span className="text-[10px] text-slate-400 font-mono">
                App supports: {selectedApp?.platforms.join(', ')}
              </span>
            </div>
            <select
              name="platform"
              value={platform}
              onChange={e => setPlatform(e.target.value as TargetPlatform)}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
            >
              {availablePlatforms.map(p => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Binary Version</label>
              <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Semver</span>
            </div>
            <input
              type="text"
              required
              value={targetAppVersion}
              onChange={e => setTargetAppVersion(e.target.value)}
              placeholder="e.g. 1.0.0 or ^1.0.0"
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Bundle will only be served to native app binaries matching this semver range.
            </p>
          </div>
        </div>

        {/* Bundle File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            React Native Bundle File <span className="text-slate-400 font-normal">(JS Bundle or Assets Zip)</span>
          </label>
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all group shadow-xs ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                : file
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept=".bundle,.js,.zip,.tar"
              className="hidden"
            />

            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-600" />
                  {file.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {formatBytes(file.size)} • {file.type || 'React Native Bundle'}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setComputedHash('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="mt-2 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline inline-block"
                >
                  Remove File & Reselect
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Click to browse or drag and drop bundle file
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports <code className="text-emerald-700 font-semibold">index.android.bundle</code>, <code className="text-emerald-700 font-semibold">main.jsbundle</code>, or <code className="text-emerald-700 font-semibold">.zip</code> archive
                </p>
              </div>
            )}
          </div>

          {/* Cryptographic SHA-256 Preview */}
          {(calculatingHash || computedHash) && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono flex items-center justify-between">
              <span className="text-slate-500 font-sans font-semibold">SHA-256 Checksum:</span>
              <span className="text-emerald-800 font-semibold truncate max-w-xs">
                {calculatingHash ? 'Computing...' : computedHash}
              </span>
            </div>
          )}
        </div>

        {/* Mandatory & Rollout Controls */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Mandatory Update</span>
              <span className="text-[11px] text-slate-500 block">
                Forces app to reload immediately instead of waiting for next launch.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={e => setIsMandatory(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Staged Rollout Percentage</span>
                <span className="text-[11px] text-slate-500">
                  Deploy to a percentage of devices using deterministic hashing.
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {rolloutPercentage}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={rolloutPercentage}
              onChange={e => setRolloutPercentage(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Release Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Release Notes / Changelog
          </label>
          <textarea
            rows={2}
            value={releaseNotes}
            onChange={e => setReleaseNotes(e.target.value)}
            placeholder="e.g. Critical bug fix in checkout payment flow."
            className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
          />
        </div>

        {/* Progress Bar */}
        {submitting && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Deploying to CDN...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all shadow-sm shadow-emerald-600/25 disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : 'Deploy Release'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
