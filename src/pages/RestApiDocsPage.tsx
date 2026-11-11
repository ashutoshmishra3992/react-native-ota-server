import React, { useState, useEffect } from 'react';
import { UserApiKey } from '../types';
import { fetchApiKeys, createApiKey, revokeApiKey } from '../services/apiKeysService';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import {
  KeyRound,
  Copy,
  Check,
  Trash2,
  Terminal,
} from 'lucide-react';

export const RestApiDocsPage: React.FC = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadKeys = async () => {
    if (!user) return;
    const list = await fetchApiKeys(user.uid);
    setApiKeys(list);
  };

  useEffect(() => {
    loadKeys();
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    if (!user) return;
    setGenerating(true);
    try {
      await createApiKey(newKeyName.trim(), user.uid);
      setNewKeyName('');
      await loadKeys();
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (confirm('Revoke this API Key? Any automated CI/CD pipeline using it will be rejected.')) {
      await revokeApiKey(keyId);
      await loadKeys();
    }
  };

  const sampleApiKey = apiKeys.find(k => k.status === 'active')?.key || 'ota_live_sec_your_api_key_here';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://airota-server-83921.web.app';

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200">
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span>Automation & CI/CD REST API Suite</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">REST API & Access Keys</h2>
        <p className="text-sm text-slate-600 mt-1">
          Expose all AirOTA functionalities programmatically. Use User API Keys for CI/CD pipelines (GitHub Actions, Bitrise, Fastlane) and Deployment Keys for mobile clients.
        </p>
      </div>

      {/* API Keys Management Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              User API Keys (CI/CD Deployment Tokens)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Secret keys with full administrative rights to push releases and query applications.
            </p>
          </div>

          <form onSubmit={handleCreateKey} className="flex items-center gap-2">
            <input
              type="text"
              required
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="e.g. GitHub Actions CI/CD"
              className="bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-52 transition-all"
            />
            <button
              type="submit"
              disabled={generating}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 shrink-0"
            >
              {generating ? 'Generating...' : 'Create Key'}
            </button>
          </form>
        </div>

        {/* Keys List */}
        <div className="space-y-2.5">
          {apiKeys.map(key => (
            <div
              key={key.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{key.name}</span>
                  {key.status === 'active' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Revoked
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-xs text-slate-600">
                  <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-emerald-800 font-semibold text-[11px] select-all shadow-xs">
                    {key.key}
                  </span>
                  <button
                    onClick={() => handleCopy(key.key)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
                    title="Copy API Key"
                  >
                    {copiedKey === key.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Created {formatDate(key.createdAt)}
                </span>
                {key.status === 'active' && (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REST API Endpoints Interactive Documentation */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">API Endpoints Reference</h3>
          <p className="text-xs text-slate-500 mt-1">
            Standard REST API mounted under <code className="text-emerald-700 font-mono font-semibold">/api/v1</code>. Pass API Key in <code className="text-emerald-700 font-mono font-semibold">Authorization: Bearer &lt;KEY&gt;</code> or <code className="text-emerald-700 font-mono font-semibold">X-API-Key: &lt;KEY&gt;</code>.
          </p>
        </div>

        {/* Endpoint 1: Mobile Client Update Check */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                GET
              </span>
              <span className="font-mono text-sm font-semibold text-slate-900">/api/v1/updates/check</span>
            </div>
            <span className="text-xs text-cyan-700 font-medium bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
              Public Client Endpoint (Uses deploymentKey)
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Called by the React Native client app on app start to check if a new bundle is available for the current deployment channel and native binary version.
          </p>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Example cURL Request:</span>
            <div className="relative group">
              <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
{`curl -X GET "${baseUrl}/api/v1/updates/check?deploymentKey=dep_prod_shop_9934ea120d&appVersion=1.0.0&platform=android&currentHash=&deviceId=device-uuid-99"`}
              </pre>
              <button
                onClick={() => handleCopy(`curl -X GET "${baseUrl}/api/v1/updates/check?deploymentKey=dep_prod_shop_9934ea120d&appVersion=1.0.0&platform=android&currentHash=&deviceId=device-uuid-99"`)}
                className="absolute right-3 top-3 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Response Sample (200 OK):</span>
            <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "isAvailable": true,
  "updateId": "rel_shopsphere_v1_2_1",
  "downloadUrl": "https://storage.googleapis.com/.../bundle.zip",
  "bundleHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "bundleSize": 1845200,
  "isMandatory": true,
  "targetAppVersion": "1.2.0",
  "releaseNotes": "Fixed checkout voucher bug and upgraded cart animation engine.",
  "createdAt": 1715423000000
}`}
            </pre>
          </div>
        </div>

        {/* Endpoint 2: Push Release via CI/CD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                POST
              </span>
              <span className="font-mono text-sm font-semibold text-slate-900">/api/v1/apps/:appId/releases</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Requires User API Key</span>
          </div>

          <p className="text-xs text-slate-600">
            Publish a new OTA update directly from GitHub Actions, Fastlane, or local scripts.
          </p>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Example cURL Request:</span>
            <div className="relative group">
              <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
{`curl -X POST "${baseUrl}/api/v1/apps/app_shopsphere_101/releases" \\
  -H "Authorization: Bearer ${sampleApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environmentId": "production",
    "platform": "universal",
    "targetAppVersion": "1.2.0",
    "isMandatory": true,
    "rolloutPercentage": 100,
    "releaseNotes": "Emergency fix for payment crash",
    "bundleUrl": "https://storage.googleapis.com/.../index.android.bundle",
    "bundleHash": "3f786850e387550fdab836ed7e6dc881de23001b70e87038c0136221456c21cf",
    "bundleSize": 1542000,
    "bundleFileName": "index.android.bundle"
  }'`}
              </pre>
              <button
                onClick={() => handleCopy(`curl -X POST "${baseUrl}/api/v1/apps/app_shopsphere_101/releases" -H "Authorization: Bearer ${sampleApiKey}" -H "Content-Type: application/json" -d '{"environmentId":"production","platform":"universal","targetAppVersion":"1.2.0","isMandatory":true,"rolloutPercentage":100,"releaseNotes":"Emergency fix","bundleUrl":"https://storage...","bundleHash":"...","bundleSize":1542000}'`)}
                className="absolute right-3 top-3 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Endpoint 3: Instant Rollback */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                POST
              </span>
              <span className="font-mono text-sm font-semibold text-slate-900">/api/v1/apps/:appId/releases/:releaseId/rollback</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Requires User API Key</span>
          </div>

          <p className="text-xs text-slate-600">
            Instantly deactivates the release and reactivates the previous stable release.
          </p>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Example cURL Request:</span>
            <div className="relative group">
              <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
{`curl -X POST "${baseUrl}/api/v1/apps/app_shopsphere_101/releases/rel_shopsphere_v1_2_1/rollback" \\
  -H "Authorization: Bearer ${sampleApiKey}"`}
              </pre>
              <button
                onClick={() => handleCopy(`curl -X POST "${baseUrl}/api/v1/apps/app_shopsphere_101/releases/rel_shopsphere_v1_2_1/rollback" -H "Authorization: Bearer ${sampleApiKey}"`)}
                className="absolute right-3 top-3 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Endpoint 4: Create Application */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
                POST
              </span>
              <span className="font-mono text-sm font-semibold text-slate-900">/api/v1/apps</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Requires User API Key</span>
          </div>

          <p className="text-xs text-slate-600">
            Register a new application with environments and respective package name suffixes.
          </p>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Example cURL Request:</span>
            <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
{`curl -X POST "${baseUrl}/api/v1/apps" \\
  -H "Authorization: Bearer ${sampleApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "SuperRider",
    "basePackageName": "com.superrider.app",
    "platforms": ["android", "ios"],
    "environments": [
      { "name": "Development", "suffix": ".development" },
      { "name": "Staging", "suffix": ".staging" },
      { "name": "Production", "suffix": "" }
    ]
  }'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
