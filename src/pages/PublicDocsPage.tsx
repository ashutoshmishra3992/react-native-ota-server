import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  Terminal,
  Code2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Server,
  Layers,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface PublicDocsPageProps {
  defaultTab?: 'sdk' | 'api';
}

export const PublicDocsPage: React.FC<PublicDocsPageProps> = ({ defaultTab = 'api' }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') as 'sdk' | 'api' | null;
  const [activeTab, setActiveTab] = useState<'sdk' | 'api'>(activeTabParam || defaultTab);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const setTab = (tab: 'sdk' | 'api') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // SDK Code Snippets
  const codeHook = `// useOtaUpdater.ts
import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import { Updates } from './nativeOtaBridge'; // native bridge reload

const OTA_API_URL = 'https://airota-server-83921.web.app/api/v1/updates/check';

interface OtaOptions {
  deploymentKey: string;
}

export function useOtaUpdater({ deploymentKey }: OtaOptions) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function checkForUpdate() {
      try {
        setStatus('checking');
        const appVersion = DeviceInfo.getVersion();
        const currentHash = (await RNFS.exists(RNFS.DocumentDirectoryPath + '/ota/hash.txt'))
          ? await RNFS.readFile(RNFS.DocumentDirectoryPath + '/ota/hash.txt')
          : '';
        const deviceId = await DeviceInfo.getUniqueId();

        const url = \`\${OTA_API_URL}?deploymentKey=\${deploymentKey}&appVersion=\${appVersion}&platform=\${Platform.OS}&currentHash=\${currentHash}&deviceId=\${deviceId}\`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.isAvailable && data.downloadUrl) {
          setStatus('downloading');
          const destination = RNFS.DocumentDirectoryPath + '/ota/bundle.zip';
          await RNFS.mkdir(RNFS.DocumentDirectoryPath + '/ota');

          const download = RNFS.downloadFile({
            fromUrl: data.downloadUrl,
            toFile: destination,
            progress: res => {
              const p = Math.round((res.bytesWritten / res.contentLength) * 100);
              setProgress(p);
            },
          });
          await download.promise;

          // Save active bundle hash
          await RNFS.writeFile(RNFS.DocumentDirectoryPath + '/ota/hash.txt', data.bundleHash, 'utf8');
          setStatus('ready');

          if (data.isMandatory) {
            Alert.alert('Update Ready', 'A required update has been downloaded. Restarting application...', [
              { text: 'OK', onPress: () => Updates.reload() },
            ]);
          }
        } else {
          setStatus('idle');
        }
      } catch (err) {
        console.warn('OTA update check failed:', err);
        setStatus('idle');
      }
    }

    checkForUpdate();
  }, [deploymentKey]);

  return { status, progress, reload: () => Updates.reload() };
}`;

  const codeAndroid = `// android/app/src/main/java/com/yourapp/MainApplication.kt
package com.yourapp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import java.io.File

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages

      // AirOTA Bundle Path Override
      override fun getJSBundleFile(): String? {
        val otaBundle = File(filesDir, "ota/index.android.bundle")
        return if (otaBundle.exists()) {
          otaBundle.absolutePath
        } else {
          super.getJSBundleFile()
        }
      }

      override fun getJSMainModuleName(): String = "index"
    }
}`;

  const codeIos = `// ios/YourApp/AppDelegate.mm
#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"YourApp";
  self.initialProps = @{};
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

// AirOTA Bundle URL Override
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *otaPath = [paths[0] stringByAppendingPathComponent:@"ota/main.jsbundle"];
  if ([[NSFileManager defaultManager] fileExistsAtPath:otaPath]) {
    return [NSURL fileURLWithPath:otaPath];
  }
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Docs Header */}
      <div className="border-b border-slate-200 bg-white py-10 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-200">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span>Developer Documentation & Integration Guides</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            AirOTA Developer Documentation
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
            Everything you need to integrate OTA updates into your React Native application or automate deployments via our REST API.
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 mt-8 border-b border-slate-200">
            <button
              onClick={() => setTab('api')}
              className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'api'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              REST API Reference
            </button>
            <button
              onClick={() => setTab('sdk')}
              className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'sdk'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-4 h-4" />
              React Native SDK Integration
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {activeTab === 'api' && (
          <div className="space-y-8 animate-fade-in">
            {/* Overview Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">REST API Overview</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                AirOTA provides a high-performance REST API running on Google Cloud Functions v2 and Firestore. The API is divided into two distinct authentication schemes:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Mobile Client Updates (<code className="text-emerald-700 font-mono">deploymentKey</code>)
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Public read-only queries from mobile devices passing environment-specific deployment keys (<code className="text-slate-700 font-mono">dep_...</code>).
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    CI/CD & Server Automation (<code className="text-cyan-700 font-mono">User API Key</code>)
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Authenticated writes via Bearer tokens (<code className="text-slate-700 font-mono">ota_live_sec_...</code>) for GitHub Actions, Bitrise, and custom deploy pipelines.
                  </p>
                </div>
              </div>

              {!user && (
                <div className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-emerald-800 font-medium">
                    Ready to generate CI/CD API Keys for your repositories?
                  </span>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shrink-0 transition-colors"
                  >
                    Sign In to Console
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Endpoint 1 */}
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

              <p className="text-xs text-slate-600 leading-relaxed">
                Called by the mobile app on startup to check for available OTA updates matching the device's native app version, platform, and staged rollout percentage.
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Query Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left divide-y divide-slate-200 font-mono">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Parameter</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Required</th>
                        <th className="py-2 px-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-700">deploymentKey</td>
                        <td className="py-2 px-3">string</td>
                        <td className="py-2 px-3 text-rose-600">Yes</td>
                        <td className="py-2 px-3 font-sans">The environment deployment key (e.g. <code className="font-mono">dep_prod_...</code>)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-700">appVersion</td>
                        <td className="py-2 px-3">string</td>
                        <td className="py-2 px-3 text-rose-600">Yes</td>
                        <td className="py-2 px-3 font-sans">The native binary semver (e.g. <code className="font-mono">1.0.0</code>)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-700">platform</td>
                        <td className="py-2 px-3">string</td>
                        <td className="py-2 px-3 text-rose-600">Yes</td>
                        <td className="py-2 px-3 font-sans"><code className="font-mono">android</code> or <code className="font-mono">ios</code></td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold">currentHash</td>
                        <td className="py-2 px-3">string</td>
                        <td className="py-2 px-3 text-slate-400">Optional</td>
                        <td className="py-2 px-3 font-sans">SHA-256 hash of currently running bundle to prevent redownloading</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold">deviceId</td>
                        <td className="py-2 px-3">string</td>
                        <td className="py-2 px-3 text-slate-400">Optional</td>
                        <td className="py-2 px-3 font-sans">Unique device UUID used for deterministic staged rollouts (e.g. 20%)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Example Request:</span>
                <div className="relative group">
                  <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
{`curl -X GET "https://airota-server-83921.web.app/api/v1/updates/check?deploymentKey=dep_prod_9934ea120d&appVersion=1.0.0&platform=android&currentHash=&deviceId=pixel8-uuid"`}
                  </pre>
                  <button
                    onClick={() => handleCopy('curl-check', `curl -X GET "https://airota-server-83921.web.app/api/v1/updates/check?deploymentKey=dep_prod_9934ea120d&appVersion=1.0.0&platform=android&currentHash=&deviceId=pixel8-uuid"`)}
                    className="absolute right-3 top-3 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                  >
                    {copiedSection === 'curl-check' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Response Sample (Update Available):</span>
                <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "isAvailable": true,
  "updateId": "rel_app_e92a10",
  "downloadUrl": "https://storage.googleapis.com/.../index.android.bundle",
  "bundleHash": "3f786850e387550fdab836ed7e6dc881de23001b70e87038c0136221456c21cf",
  "bundleSize": 1572864,
  "isMandatory": true,
  "targetAppVersion": "1.0.0",
  "releaseNotes": "Critical security patch and order flow update.",
  "fileName": "index.android.bundle"
}`}
                </pre>
              </div>
            </div>

            {/* Endpoint 2 */}
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

              <p className="text-xs text-slate-600 leading-relaxed">
                Publish a new OTA update directly from GitHub Actions, Fastlane, or CI/CD pipelines.
              </p>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Example cURL Request:</span>
                <div className="relative group">
                  <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
{`curl -X POST "https://airota-server-83921.web.app/api/v1/apps/app_shopsphere_101/releases" \\
  -H "Authorization: Bearer ota_live_sec_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environmentId": "production",
    "platform": "universal",
    "targetAppVersion": "1.0.0",
    "isMandatory": true,
    "rolloutPercentage": 100,
    "releaseNotes": "Fix checkout bug and update styles"
  }'`}
                  </pre>
                  <button
                    onClick={() => handleCopy('curl-post', `curl -X POST "https://airota-server-83921.web.app/api/v1/apps/app_shopsphere_101/releases" -H "Authorization: Bearer ota_live_sec_your_api_key_here" -H "Content-Type: application/json" -d '{"environmentId":"production","platform":"universal","targetAppVersion":"1.0.0","isMandatory":true,"rolloutPercentage":100}'`)}
                    className="absolute right-3 top-3 p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-opacity"
                  >
                    {copiedSection === 'curl-post' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Endpoint 3 */}
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

              <p className="text-xs text-slate-600 leading-relaxed">
                Instantly deactivates the specified release and reactivates the previous stable release. Mobile clients querying the server will immediately fall back to the safe bundle.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'sdk' && (
          <div className="space-y-8 animate-fade-in">
            {/* Step 1: React Native Hook */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono">
                    1
                  </span>
                  <h3 className="text-base font-bold text-slate-900">React Native Update Hook</h3>
                </div>
                <button
                  onClick={() => handleCopy('sdk-hook', codeHook)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                >
                  {copiedSection === 'sdk-hook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Code
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Add this TypeScript hook to your React Native app. It queries the AirOTA check endpoint on app mount, downloads bundle archives with progress callbacks, and reloads the runtime.
              </p>
              <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto max-h-96">
                {codeHook}
              </pre>
            </div>

            {/* Step 2: Android Native Setup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono">
                    2
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Android Native Integration (<code className="font-mono text-sm">MainApplication.kt</code>)</h3>
                </div>
                <button
                  onClick={() => handleCopy('sdk-android', codeAndroid)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                >
                  {copiedSection === 'sdk-android' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Code
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Override <code className="text-emerald-700 font-mono font-semibold">getJSBundleFile()</code> in your <code className="font-mono">ReactNativeHost</code> to load downloaded OTA bundles before falling back to asset assets.
              </p>
              <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto max-h-96">
                {codeAndroid}
              </pre>
            </div>

            {/* Step 3: iOS Native Setup */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono">
                    3
                  </span>
                  <h3 className="text-base font-bold text-slate-900">iOS Native Integration (<code className="font-mono text-sm">AppDelegate.mm</code>)</h3>
                </div>
                <button
                  onClick={() => handleCopy('sdk-ios', codeIos)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
                >
                  {copiedSection === 'sdk-ios' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Code
                </button>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Override <code className="text-emerald-700 font-mono font-semibold">bundleURL</code> in your AppDelegate to inspect the document directory sandbox for an OTA bundle.
              </p>
              <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto max-h-96">
                {codeIos}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
