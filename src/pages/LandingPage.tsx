import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  ShieldCheck,
  Smartphone,
  Layers,
  Terminal,
  ArrowRight,
  GitBranch,
  RotateCcw,
  Sparkles,
  Server,
  Cloud,
  Copy,
  Check,
  Code2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const targetCta = user ? '/dashboard' : '/login';

  const [activeApiTab, setActiveApiTab] = useState<'check' | 'push' | 'rollback'>('check');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.08),rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Next-Gen React Native 0.76+ & React 19 OTA Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
            Deploy React Native updates in <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">seconds</span>, not days.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate App Store and Google Play review delays. Push JS bundles and visual assets directly to your users with environment isolation, staged rollouts, and instant rollbacks.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={targetCta}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-all shadow-lg shadow-emerald-600/25 hover:scale-[1.02]"
            >
              {user ? 'Open Dashboard' : 'Get Started Free'}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/docs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-base transition-all shadow-sm"
            >
              <Terminal className="w-4 h-4 text-emerald-600" />
              SDK & REST API Docs
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-3xl font-extrabold text-slate-900 font-mono">0.0 sec</p>
              <p className="text-xs font-medium text-slate-500 mt-1">App Store Review Wait</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-3xl font-extrabold text-emerald-600 font-mono">1-Click</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Instant Safe Rollback</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-3xl font-extrabold text-slate-900 font-mono">SHA-256</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Cryptographic Integrity</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-3xl font-extrabold text-emerald-600 font-mono">100%</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Firebase Deployable</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & How It Works */}
      <section id="architecture" className="py-20 border-b border-slate-200/80 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-emerald-700 font-bold">Architecture</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              How React Native Over-The-Air Updates Work
            </p>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">
              React Native compiles your app into two halves: the native binary container and the JavaScript bundle with assets. AirOTA swaps the JavaScript layer dynamically on device restart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-5">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Bundle & Push</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate the JS bundle via Metro CLI (<code className="text-emerald-700 font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">npx react-native bundle</code>) and push to AirOTA via dashboard or REST API.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-cyan-500/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mb-5">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Intelligent Matching</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The AirOTA Edge API checks deployment keys, verifies native binary semver ranges (<code className="text-cyan-700 font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">targetAppVersion</code>), and hashes client device IDs for staged rollouts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-5">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Download & Apply</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mobile app verifies SHA-256 checksum, stores the bundle in internal sandbox storage, and reloads the JS runtime instantly or on next launch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* REST API & CI/CD Section */}
      <section id="rest-api" className="py-20 border-b border-slate-200 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200">
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full REST API Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built for Automation & CI/CD Pipelines
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Every feature in AirOTA can be triggered programmatically. Integrate update checks into your mobile clients or automate OTA bundle publishing straight from GitHub Actions.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {/* Endpoints Tab Header */}
            <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveApiTab('check')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border-t-2 ${
                  activeApiTab === 'check'
                    ? 'bg-white border-emerald-600 text-emerald-700 shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">GET</span>
                /api/v1/updates/check
              </button>

              <button
                onClick={() => setActiveApiTab('push')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border-t-2 ${
                  activeApiTab === 'push'
                    ? 'bg-white border-cyan-600 text-cyan-700 shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px]">POST</span>
                /api/v1/apps/:appId/releases
              </button>

              <button
                onClick={() => setActiveApiTab('rollback')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold font-mono transition-all flex items-center gap-2 border-t-2 ${
                  activeApiTab === 'rollback'
                    ? 'bg-white border-rose-600 text-rose-700 shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px]">POST</span>
                /releases/:id/rollback
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 md:p-8 space-y-6">
              {activeApiTab === 'check' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Mobile Client Update Check</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Query for new bundles using environment deployment keys. Deterministically filters by platform, target semver, and staged rollout percentage.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">cURL Request</span>
                      <button
                        onClick={() => handleCopy('curl-check', `curl -X GET "https://airota-server-83921.web.app/api/v1/updates/check?deploymentKey=dep_prod_9934ea120d&appVersion=1.0.0&platform=android&currentHash=&deviceId=pixel8-uuid"`)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                      >
                        {copiedId === 'curl-check' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === 'curl-check' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X GET "https://airota-server-83921.web.app/api/v1/updates/check?deploymentKey=dep_prod_9934ea120d&appVersion=1.0.0&platform=android&currentHash=&deviceId=pixel8-uuid"`}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">JSON Response (200 OK)</span>
                    <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto leading-relaxed">
{`{
  "isAvailable": true,
  "updateId": "rel_app_e92a10",
  "downloadUrl": "https://storage.googleapis.com/.../index.android.bundle",
  "bundleHash": "3f786850e387550fdab836ed7e6dc881de23001b70e87038c0136221456c21cf",
  "bundleSize": 1572864,
  "isMandatory": true,
  "targetAppVersion": "1.0.0",
  "releaseNotes": "Critical checkout speed fix and crash recovery"
}`}
                    </pre>
                  </div>
                </div>
              )}

              {activeApiTab === 'push' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Publish Release via CI/CD</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Automate releases in GitHub Actions, Bitrise, or Fastlane using your secret User API Key.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">cURL Request</span>
                      <button
                        onClick={() => handleCopy('curl-push', `curl -X POST "https://airota-server-83921.web.app/api/v1/apps/app_hyperdrive_rider/releases" \\
  -H "Authorization: Bearer ota_live_sec_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"environmentId":"production","platform":"universal","targetAppVersion":"1.0.0","isMandatory":true,"rolloutPercentage":100}'`)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                      >
                        {copiedId === 'curl-push' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === 'curl-push' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X POST "https://airota-server-83921.web.app/api/v1/apps/app_hyperdrive_rider/releases" \\
  -H "Authorization: Bearer ota_live_sec_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environmentId": "production",
    "platform": "universal",
    "targetAppVersion": "1.0.0",
    "isMandatory": true,
    "rolloutPercentage": 100,
    "releaseNotes": "Deployed from GitHub Actions CI/CD"
  }'`}
                    </pre>
                  </div>
                </div>
              )}

              {activeApiTab === 'rollback' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Instant Automated Rollback</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Deactivate broken releases with a single POST call. Mobile clients will instantly fall back to the prior stable bundle.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">cURL Request</span>
                      <button
                        onClick={() => handleCopy('curl-rollback', `curl -X POST "https://airota-server-83921.web.app/api/v1/apps/app_hyperdrive_rider/releases/rel_app_e92a10/rollback" \\
  -H "Authorization: Bearer ota_live_sec_your_api_key_here"`)}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                      >
                        {copiedId === 'curl-rollback' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === 'curl-rollback' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X POST "https://airota-server-83921.web.app/api/v1/apps/app_hyperdrive_rider/releases/rel_app_e92a10/rollback" \\
  -H "Authorization: Bearer ota_live_sec_your_api_key_here"`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Action Buttons to Full Docs */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Need detailed parameter tables and error codes?
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    to="/docs?tab=api"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                    Full REST API Docs
                  </Link>
                  <Link
                    to="/docs?tab=sdk"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-sm shadow-emerald-600/20"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    React Native SDK Guide
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-emerald-700 font-bold">Capabilities</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Built specifically for modern React Native engineering teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <GitBranch className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Package Name Suffixes & Envs</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Configure Development, Staging, and Production environments with exact package name suffixes (e.g. <code className="text-emerald-700 font-mono bg-slate-100 px-1 py-0.5 rounded">com.example.development</code>).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Native Semver Protection</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prevent crashes by binding bundles to compatible native binary versions using semantic version ranges like <code className="text-teal-700 font-mono bg-slate-100 px-1 py-0.5 rounded">^1.2.0</code>.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Instant One-Click Rollback</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deactivate broken releases instantly. The server automatically falls back to the previous stable bundle with zero client app rebuilds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Full Programmatic REST API</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automate your CI/CD pipelines with User API Keys. Push updates, query releases, and manage rollouts directly from GitHub Actions or Fastlane.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Staged Rollouts (10% to 100%)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deploy safely to a percentage of devices using deterministic hashing. Monitor crash rates and promote to 100% when confident.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4">
                <Cloud className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Firebase Hosting & CDN</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Deploy with single command to Firebase Hosting, Cloud Functions v2, Firestore, and Cloud Storage for global low-latency CDN delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 bg-slate-50 text-center border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Ready to take control of your mobile release cycle?
          </h2>
          <p className="mt-4 text-slate-600 text-base max-w-xl mx-auto">
            Sign in to access your apps, push OTA bundles, and monitor deployments in real-time.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to={targetCta}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition-all shadow-xl shadow-emerald-600/20"
            >
              Launch AirOTA Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

function UploadCloud(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}
