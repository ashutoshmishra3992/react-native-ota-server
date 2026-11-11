import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppModel, ReleaseModel, UpdateCheckResponse } from '../types';
import { fetchReleases } from '../services/releasesService';
import { formatBytes } from '../utils/formatters';
import {
  Smartphone,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Zap,
} from 'lucide-react';

export const SimulatorPage: React.FC = () => {
  const { apps } = useOutletContext<{ apps: AppModel[] }>();

  const [selectedAppId, setSelectedAppId] = useState<string>(apps[0]?.id || '');
  const selectedApp = apps.find(a => a.id === selectedAppId) || apps[0];

  const [environmentId, setEnvironmentId] = useState<string>(
    selectedApp?.environments[0]?.id || 'development'
  );
  const selectedEnv = selectedApp?.environments.find(e => e.id === environmentId) || selectedApp?.environments[0];

  useEffect(() => {
    if (!selectedAppId && apps.length > 0) {
      setSelectedAppId(apps[0].id);
      if (apps[0].environments.length > 0) {
        setEnvironmentId(apps[0].environments[0].id);
      }
    }
  }, [apps, selectedAppId]);

  const [deviceVersion, setDeviceVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');
  const [currentBundleHash, setCurrentBundleHash] = useState('');
  const [deviceId, setDeviceId] = useState('device_simulator_pixel8');

  // Simulation state
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<UpdateCheckResponse | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [installedRelease, setInstalledRelease] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>(['[READY] Device booted. Base binary v1.0.0 initialized.']);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-8), `[${time}] ${msg}`]);
  };

  const handleResetPhone = () => {
    setInstalledRelease(null);
    setCurrentBundleHash('');
    setCheckResult(null);
    setLogs(['[RESET] Phone restored to factory base binary.']);
  };

  const runUpdateCheck = async () => {
    setChecking(true);
    setCheckResult(null);
    addLog(`Checking for OTA updates (channel: ${selectedEnv?.name || environmentId})...`);

    try {
      const activeApp = selectedApp || apps[0];
      const activeEnv = selectedEnv || activeApp?.environments[0];

      // Fetch all releases or app-specific releases
      let releases = await fetchReleases(activeApp?.id, activeEnv?.id);
      if (releases.length === 0 && activeApp) {
        releases = await fetchReleases(activeApp.id);
      }
      if (releases.length === 0) {
        releases = await fetchReleases();
      }

      const active = releases.filter(
        r =>
          r.status === 'active' &&
          (r.platform === 'universal' || r.platform === platform)
      );

      const matchingRelease = active.find(r => {
        return r.targetAppVersion === deviceVersion || r.targetAppVersion === '1.0.0' || r.targetAppVersion.startsWith('1.');
      }) || active[0];

      await new Promise(r => setTimeout(r, 400));

      if (!matchingRelease) {
        addLog(`No matching release found for binary v${deviceVersion}.`);
        setCheckResult({
          isAvailable: false,
          message: `No active release found matching target app version ${deviceVersion}`,
        });
        return;
      }

      if (currentBundleHash && currentBundleHash === matchingRelease.bundleHash) {
        addLog('Device already running latest bundle hash.');
        setCheckResult({
          isAvailable: false,
          message: 'Device already running latest bundle hash.',
        });
        return;
      }

      addLog(`Update found: ${matchingRelease.bundleFileName} (${matchingRelease.targetAppVersion})`);
      setCheckResult({
        isAvailable: true,
        updateId: matchingRelease.id,
        downloadUrl: matchingRelease.bundleUrl,
        bundleHash: matchingRelease.bundleHash,
        bundleSize: matchingRelease.bundleSize,
        isMandatory: matchingRelease.isMandatory,
        targetAppVersion: matchingRelease.targetAppVersion,
        releaseNotes: matchingRelease.releaseNotes || 'Bug fixes and performance improvements.',
        fileName: matchingRelease.bundleFileName,
      });
    } catch (err: any) {
      addLog(`Check error: ${err.message}`);
      setCheckResult({
        isAvailable: false,
        message: 'Update check failed: ' + err.message,
      });
    } finally {
      setChecking(false);
    }
  };

  const simulateDownloadAndApply = async () => {
    if (!checkResult || !checkResult.isAvailable) return;
    setDownloading(true);
    setDownloadProgress(0);
    addLog(`Downloading bundle from ${checkResult.downloadUrl ? 'Firebase Storage' : 'Cloud'}...`);

    for (let i = 20; i <= 100; i += 20) {
      await new Promise(r => setTimeout(r, 150));
      setDownloadProgress(i);
    }

    addLog(`Verifying SHA-256 hash checksum... Match!`);
    addLog(`Hot-reloading React Native bundle into JavaScript runtime.`);
    setInstalledRelease(checkResult);
    setCurrentBundleHash(checkResult.bundleHash || '');
    setDownloading(false);
    setCheckResult(null);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200">
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>Interactive Mobile Device Simulator</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Live Update Tester</h2>
        <p className="text-sm text-slate-600 mt-1">
          Test your deployment keys, version targeting, and bundle updates in real-time right in this browser window.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Device Configuration Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Device & Environment Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Application</label>
              <select
                value={selectedAppId}
                onChange={e => {
                  setSelectedAppId(e.target.value);
                  const app = apps.find(a => a.id === e.target.value);
                  if (app?.environments[0]) setEnvironmentId(app.environments[0].id);
                }}
                className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition-all font-medium"
              >
                {apps.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Environment Channel</label>
              <select
                value={environmentId}
                onChange={e => setEnvironmentId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 capitalize transition-all font-medium"
              >
                {selectedApp?.environments.map(env => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({env.suffix || 'no suffix'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-600 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-sans font-bold text-[11px] text-slate-500">Active Deployment Key:</span>
              <span className="text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{selectedEnv?.deploymentKey}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-sans font-bold text-[11px] text-slate-500">Client Package ID:</span>
              <span className="text-slate-800 font-semibold font-mono lowercase">{selectedEnv?.computedPackageName?.toLowerCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Simulated Platform</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('android')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    platform === 'android'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('ios')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    platform === 'ios'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  iOS
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Installed Binary App Version
              </label>
              <input
                type="text"
                value={deviceVersion}
                onChange={e => setDeviceVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            onClick={runUpdateCheck}
            disabled={checking || downloading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all shadow-sm shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Querying /api/v1/updates/check...' : 'Execute OTA Check Request'}
          </button>

          {/* Results Box */}
          {checkResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-3 animate-fade-in ${
                checkResult.isAvailable
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {checkResult.isAvailable ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-950">New OTA Update Available!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span>Up to Date</span>
                  </>
                )}
              </div>

              {checkResult.isAvailable ? (
                <div className="space-y-2 text-xs">
                  <p>
                    <strong>File:</strong> {checkResult.fileName} ({formatBytes(checkResult.bundleSize || 0)})
                  </p>
                  <p>
                    <strong>Notes:</strong> {checkResult.releaseNotes}
                  </p>
                  <p className="font-mono text-[11px] text-emerald-800 font-semibold">
                    Target Version: {checkResult.targetAppVersion} • Mandatory: {checkResult.isMandatory ? 'YES' : 'NO'}
                  </p>

                  <button
                    onClick={simulateDownloadAndApply}
                    disabled={downloading}
                    className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? `Downloading (${downloadProgress}%)...` : 'Download & Apply to Phone'}
                  </button>
                </div>
              ) : (
                <p className="text-slate-500">{checkResult.message}</p>
              )}
            </div>
          )}

          {/* Real-time Telemetry & Logs */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Device Terminal Logs:
              </span>
              <button
                type="button"
                onClick={handleResetPhone}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Reset Phone State
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-1 h-32 overflow-y-auto leading-relaxed shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className={log.includes('Match') || log.includes('activated') ? 'text-emerald-400' : log.includes('error') ? 'text-rose-400' : ''}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Virtual Phone Screen Rendering */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[300px] h-[580px] bg-slate-900 border-4 border-slate-300 rounded-[44px] shadow-2xl overflow-hidden relative flex flex-col p-3">
            {/* Phone Notch */}
            <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
            </div>

            {/* Simulated Phone Screen */}
            <div className="flex-1 bg-white rounded-[32px] p-4 flex flex-col justify-between text-slate-900 border border-slate-200 shadow-inner">
              {/* Status bar */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono font-medium">
                <span>9:41</span>
                <span>5G 100%</span>
              </div>

              {/* App Content */}
              <div className="text-center my-auto space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/25">
                  <Zap className="w-7 h-7 text-white fill-white" />
                </div>

                <div>
                  <h4 className="font-extrabold text-base tracking-tight text-slate-900">{selectedApp?.name}</h4>
                  <p className="text-[11px] text-emerald-700 font-mono lowercase font-semibold">{selectedEnv?.computedPackageName?.toLowerCase()}</p>
                </div>

                {installedRelease ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-1 shadow-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Active OTA Bundle
                    </span>
                    <p className="text-xs font-bold text-slate-900">{installedRelease.fileName}</p>
                    <p className="text-[10px] text-slate-600 italic">{installedRelease.releaseNotes}</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                    Running base embedded binary JS bundle (v{deviceVersion}).
                  </div>
                )}
              </div>

              {/* Bottom Phone Bar */}
              <div className="text-center">
                <span className="text-[10px] font-mono font-medium text-slate-400">
                  {platform.toUpperCase()} • AirOTA Client v1.0
                </span>
                <div className="w-24 h-1 bg-slate-300 rounded-full mx-auto mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
