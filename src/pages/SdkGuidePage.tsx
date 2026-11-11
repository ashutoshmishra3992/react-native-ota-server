import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

export const SdkGuidePage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

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
          const targetDir = RNFS.DocumentDirectoryPath + '/ota';
          await RNFS.mkdir(targetDir);
          const downloadDest = targetDir + '/latest.bundle';

          const downloadRes = RNFS.downloadFile({
            fromUrl: data.downloadUrl,
            toFile: downloadDest,
            progress: res => {
              setProgress(Math.round((res.bytesWritten / res.contentLength) * 100));
            },
          });

          await downloadRes.promise;
          await RNFS.writeFile(targetDir + '/hash.txt', data.bundleHash, 'utf8');
          setStatus('ready');

          if (data.isMandatory) {
            Alert.alert(
              'Update Ready',
              'A critical update was downloaded and will be applied now.',
              [{ text: 'Restart', onPress: () => Updates.reload() }]
            );
          }
        } else {
          setStatus('idle');
        }
      } catch (err) {
        console.warn('OTA Update Check Failed:', err);
        setStatus('idle');
      }
    }

    checkForUpdate();
  }, [deploymentKey]);

  return { status, progress };
}`;

  const codeAndroid = `// android/app/src/main/java/com/yourcompany/app/MainApplication.kt
package com.yourcompany.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactNativeHost
import java.io.File

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages

      // Point JS bundle loader to the downloaded OTA bundle if present!
      override fun getJSBundleFile(): String? {
        val otaBundle = File(applicationContext.filesDir, "ota/latest.bundle")
        return if (otaBundle.exists()) {
          otaBundle.absolutePath
        } else {
          super.getJSBundleFile() // Fallback to assets://index.android.bundle
        }
      }
    }
}`;

  const codeIos = `// ios/YourApp/AppDelegate.mm
#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  // Check if OTA bundle exists in Application Support directory
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *otaPath = [[paths firstObject] stringByAppendingPathComponent:@"ota/latest.bundle"];

  if ([[NSFileManager defaultManager] fileExistsAtPath:otaPath]) {
    return [NSURL fileURLWithPath:otaPath];
  }

  // Fallback to embedded main.jsbundle
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
}

@end`;

  const codeCli = `# 1. Generate JavaScript bundle and visual assets
npx react-native bundle \\
  --platform android \\
  --dev false \\
  --entry-file index.js \\
  --bundle-output ./dist/index.android.bundle \\
  --assets-dest ./dist

# 2. Push directly to AirOTA REST API
curl -X POST "https://airota-server-83921.web.app/api/v1/apps/app_shopsphere_101/releases" \\
  -H "Authorization: Bearer ota_live_sec_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "environmentId": "production",
    "platform": "android",
    "targetAppVersion": "1.0.0",
    "isMandatory": true,
    "rolloutPercentage": 100,
    "releaseNotes": "Hotfix v1.0.1",
    "bundleUrl": "https://storage.googleapis.com/.../index.android.bundle",
    "bundleHash": "9f83c605d84a8ec9d01f8da7a762d050c97d...",
    "bundleSize": 1420100
  }'`;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200">
          <Code2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Integration Guide</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          React Native Client Integration
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          How to wire your React Native Android and iOS app to receive over-the-air updates from AirOTA.
        </p>
      </div>

      {/* Conceptual Explanation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          The Core Concept
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          In React Native, JavaScript code is not compiled into native machine code. It runs inside a JavaScript virtual machine (Hermes or JSC). The native host app loads this JavaScript from a file path:
        </p>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
          <li>
            <strong className="text-slate-900">Default behavior:</strong> The native app loads <code className="text-emerald-800 font-mono font-semibold bg-slate-100 px-1 rounded">assets://index.android.bundle</code> (Android) or <code className="text-emerald-800 font-mono font-semibold bg-slate-100 px-1 rounded">main.jsbundle</code> (iOS) packaged inside the APK/IPA.
          </li>
          <li>
            <strong className="text-slate-900">OTA behavior:</strong> The native app checks if an updated bundle exists in internal app storage (<code className="text-emerald-800 font-mono font-semibold bg-slate-100 px-1 rounded">filesDir/ota/latest.bundle</code>). If so, it points the JS engine to that file!
          </li>
        </ul>
      </div>

      {/* Step 1: Hook */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
              1
            </span>
            <h4 className="text-sm font-bold text-slate-900">React Native Hook (TypeScript)</h4>
          </div>
          <button
            onClick={() => handleCopy('hook', codeHook)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition-colors font-medium"
          >
            {copiedSection === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Hook
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Add this hook to your root component (<code className="text-emerald-800 font-mono font-semibold bg-slate-100 px-1 rounded">App.tsx</code>) with your environment's deployment key.
        </p>
        <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
          {codeHook}
        </pre>
      </div>

      {/* Step 2: Android Native Setup */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
              2
            </span>
            <h4 className="text-sm font-bold text-slate-900">Android Bundle Override (<code className="text-emerald-700 font-mono">MainApplication.kt</code>)</h4>
          </div>
          <button
            onClick={() => handleCopy('android', codeAndroid)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition-colors font-medium"
          >
            {copiedSection === 'android' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Kotlin
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
          {codeAndroid}
        </pre>
      </div>

      {/* Step 3: iOS Native Setup */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
              3
            </span>
            <h4 className="text-sm font-bold text-slate-900">iOS Bundle Override (<code className="text-emerald-700 font-mono">AppDelegate.mm</code>)</h4>
          </div>
          <button
            onClick={() => handleCopy('ios', codeIos)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition-colors font-medium"
          >
            {copiedSection === 'ios' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Objective-C++
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
          {codeIos}
        </pre>
      </div>

      {/* Step 4: CLI & CI/CD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
              4
            </span>
            <h4 className="text-sm font-bold text-slate-900">CI/CD Bundling & Deployment Script</h4>
          </div>
          <button
            onClick={() => handleCopy('cli', codeCli)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition-colors font-medium"
          >
            {copiedSection === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Script
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto">
          {codeCli}
        </pre>
      </div>
    </div>
  );
};
