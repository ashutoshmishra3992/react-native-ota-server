# AirOTA — React Native Over-The-Air (OTA) Updates Server & Dashboard

<div align="center">

[![Live Web App](https://img.shields.io/badge/Live%20Demo-airota--server--83921.web.app-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://airota-server-83921.web.app)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Functions_v2_%7C_Firestore_%7C_Storage-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Playwright](https://img.shields.io/badge/E2E%20Tests-46%20Passed-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](tests/e2e.mjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

> 🌐 **Live Web Application & Management Dashboard:**  
> ### **[https://airota-server-83921.web.app](https://airota-server-83921.web.app)**

*Deploy critical bug fixes and features directly to your users' devices in seconds — without waiting days for Apple App Store or Google Play Store reviews.*

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Quick Start (Local Development)](#-quick-start-local-development)
- [Deploying to Firebase](#-deploying-to-firebase)
- [Automated Testing](#-automated-testing)
- [REST API Reference](#-rest-api-reference)
- [React Native Client Integration](#-react-native-client-integration)
- [Security Architecture](#-security-architecture)
- [License](#-license)

---

## 🌟 Overview

**AirOTA** is an open-source, production-grade Over-The-Air (OTA) update platform designed specifically for **React Native 0.76+ (New Architecture compatible)**. Built on a modern serverless stack (**Firebase Hosting, Cloud Functions v2, Cloud Firestore, and Cloud Storage**), AirOTA provides:

1. **Instant Updates**: Push JavaScript and asset updates to iOS and Android devices dynamically.
2. **Semver Protection**: Target specific native binary versions (e.g. `^1.0.0`, `1.2.0`) to prevent incompatible JS from breaking native bridges.
3. **Phased Rollouts**: Mitigate risk by rolling out updates gradually (10% to 100%) using deterministic client device bucketing.
4. **Instant 1-Click Rollback**: Immediately revert problematic releases and reactivate the previous stable bundle.
5. **CI/CD Programmatic API**: Full REST API authenticated with hashed User API keys for GitHub Actions, Bitrise, or Fastlane.
6. **Built-in Mobile Simulator**: Test update check logic, payload responses, and downloads directly in the browser before deploying.

---

## 🚀 Key Features

| Capability | Description |
| :--- | :--- |
| **Clean Light Theme UI** | Modern, responsive dashboard with mobile drawer navigation and fluid animations. |
| **Secure Authentication** | Firebase Auth (Email/Password & Google OAuth) with protected dashboard routes. |
| **Multi-App & Environments** | Organize apps with `Development`, `Staging`, and `Production` environments and live package suffixes (e.g., `com.company.app.staging`). |
| **In-Browser SHA-256** | Automatic cryptographic checksum generation using the Web Crypto API on bundle upload. |
| **Semver Targeting** | Strict binary version gating (`1.0.0`, `^1.2.0`, `>=2.0.0`) powered by `semver`. |
| **Mandatory vs. Silent** | Force immediate reload on open or download in background for next cold start. |
| **Deterministic Rollouts** | MD5 hash-based client device bucketing (`0-99`) for consistent percentage rollouts. |
| **1-Click Rollback** | Disable an active release instantly and fallback to the last valid bundle. |
| **Interactive Simulator** | Test update queries, query parameter inspection, and bundle downloading in-browser. |
| **Interactive API Docs** | Live cURL generator with active origin and user API key injection. |

---

## 🏗️ Architecture

```
                                  +---------------------------+
                                  |   Developer / CI/CD       |
                                  |   (GitHub Actions/CLI)    |
                                  +-------------+-------------+
                                                |
                            Push Release        |  User API Key
                            (cURL / Dashboard)  v
                                  +-------------+-------------+
                                  |    AirOTA REST API        |
                                  |  (Firebase Functions v2)  |
                                  +------+-------------+------+
                                         |             |
                         Save Metadata   |             | Upload Bundle
                                         v             v
                              +----------+----+   +----+-------------+
                              | Cloud         |   | Cloud Storage    |
                              | Firestore DB  |   | (Global CDN)     |
                              +---------------+   +----+-------------+
                                                       ^
                         Check for Updates             | Download Bundle
                         (?deploymentKey=...)          |
                                         |             |
                                  +------+-------------+------+
                                  | React Native Mobile App   |
                                  |   (iOS & Android)         |
                                  +---------------------------+
```

---

## 📦 Project Structure

```
react-native-ota-server/
├── index.html                   # HTML Entry Point
├── package.json                 # Web App dependencies (React 19, Vite 6, Tailwind CSS)
├── vite.config.ts               # Vite configuration with path aliases
├── tailwind.config.js           # Tailwind CSS design system configuration
├── firebase.json                # Firebase Hosting rewrites & Cloud Functions configuration
├── firestore.rules              # Multi-tenant Firestore Security Rules
├── storage.rules                # Cloud Storage Security Rules
├── src/
│   ├── main.tsx                 # React DOM mount
│   ├── App.tsx                  # React Router 7 routes & protected layouts
│   ├── config/
│   │   └── firebase.ts          # Firebase Client SDK initialization
│   ├── types/
│   │   └── index.ts             # TypeScript domain definitions (App, Release, Env, API Key)
│   ├── services/
│   │   ├── appsService.ts       # Application CRUD & environment key generation
│   │   ├── releasesService.ts   # Release deployment, bundle uploads & rollback
│   │   ├── apiKeysService.ts    # User API Key generation & deletion
│   │   └── mockData.ts          # Local storage fallback layer
│   ├── context/
│   │   └── AuthContext.tsx      # Firebase Auth provider & session persistence
│   ├── components/
│   │   ├── layout/              # Responsive Navbar, Sidebar, DashboardLayout
│   │   └── ui/                  # Accessible Modals, Badges, Loaders
│   ├── pages/
│   │   ├── LandingPage.tsx      # Public landing page with features & architecture
│   │   ├── LoginPage.tsx        # Sign-in & Sign-up with password visibility toggle
│   │   ├── DashboardOverview.tsx# Analytics metrics, active apps, recent releases
│   │   ├── AppsListPage.tsx     # App management & environment cards
│   │   ├── CreateAppModal.tsx   # Modal for new apps with platform & suffix rules
│   │   ├── AppDetailsPage.tsx   # Deep app inspection, deployment keys & history
│   │   ├── NewReleaseModal.tsx  # Update upload modal with live SHA-256 verification
│   │   ├── ReleasesListPage.tsx # Releases table with 1-click rollback & downloads
│   │   ├── RestApiDocsPage.tsx  # Dynamic REST API documentation with live cURL builder
│   │   ├── SdkGuidePage.tsx     # React Native native bridge & TypeScript integration
│   │   └── SimulatorPage.tsx    # In-browser mobile device update simulator
│   └── utils/
│       ├── hash.ts              # Web Crypto API SHA-256 calculation
│       └── formatters.ts        # Bytes, relative timestamps, date formatters
├── functions/                   # Firebase Cloud Functions (Node.js REST API)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts             # Express REST API (Update checks, rollouts, rollbacks)
└── tests/
    └── e2e.mjs                  # Playwright E2E test suite (46 comprehensive assertions)
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ (Node 22 recommended)
- **npm** or **yarn**
- **Firebase CLI**: `npm install -g firebase-tools`

### 2. Clone and Install
```bash
git clone https://github.com/ashutoshmishra3992/react-native-ota-server.git
cd react-native-ota-server

# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Firebase project credentials in `.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔥 Deploying to Firebase

### 1. Select Firebase Project
```bash
firebase login
firebase use --add <your-project-id>
```

### 2. Build and Deploy
```bash
# Build the React frontend
npm run build

# Build the Cloud Functions backend
cd functions && npm run build && cd ..

# Deploy Hosting, Functions, Firestore rules, and Storage rules
firebase deploy
```

Once deployment finishes, your endpoints are live:
- **Web App**: `https://<your-project-id>.web.app`
- **Mobile Update Endpoint**: `https://<your-project-id>.web.app/api/v1/updates/check`

---

## 🧪 Automated Testing

AirOTA includes a comprehensive end-to-end test suite built with **Playwright**, testing real workflows against the live or local deployment:

- Authentication flows (Sign-up, Sign-in, Route Guards)
- App creation with platform constraints and lowercase package rules
- Bundle uploading with live in-browser SHA-256 calculation
- Semver validation and staged rollout verification
- Mobile simulator query resolution and bundle downloads
- 1-Click Rollback behavior

Run the test suite:
```bash
npm run test:e2e
```

---

## 📡 REST API Reference

Authenticate requests using `Authorization: Bearer <OTA_API_KEY>` or `X-API-Key: <OTA_API_KEY>`.

### 1. Mobile Client Update Check (Public)
Mobile apps query this endpoint on cold start or app resume:
```bash
curl -X GET "https://<your-project-id>.web.app/api/v1/updates/check?deploymentKey=dep_prod_abc123&appVersion=1.0.0&platform=android&currentHash=&deviceId=device-uuid-99"
```

**Response (Update Available):**
```json
{
  "isAvailable": true,
  "updateId": "rel_abc123456",
  "downloadUrl": "https://storage.googleapis.com/.../index.android.bundle",
  "bundleHash": "9f83c605d84a8ec9d01f8da7a762d050c97d...",
  "bundleSize": 1420100,
  "isMandatory": true,
  "targetAppVersion": "1.0.0",
  "releaseNotes": "Critical hotfix for payment crash",
  "createdAt": 1715423000000
}
```

### 2. Push Release (CI/CD Pipeline)
```bash
curl -X POST "https://<your-project-id>.web.app/api/v1/apps/<APP_ID>/releases" \
  -H "Authorization: Bearer <OTA_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "environmentId": "production",
    "platform": "android",
    "targetAppVersion": "1.0.0",
    "isMandatory": true,
    "rolloutPercentage": 100,
    "releaseNotes": "Performance improvements and crash fixes",
    "bundleUrl": "https://storage.googleapis.com/.../bundle.zip",
    "bundleHash": "9f83c605d84a8ec9d01f8da7a762d050c97d...",
    "bundleSize": 1420100,
    "bundleFileName": "index.android.bundle"
  }'
```

### 3. Instant Rollback
```bash
curl -X POST "https://<your-project-id>.web.app/api/v1/apps/<APP_ID>/releases/<RELEASE_ID>/rollback" \
  -H "Authorization: Bearer <OTA_API_KEY>"
```

---

## 📱 React Native Client Integration

### 1. Android (`MainApplication.kt`)
In `android/app/src/main/java/.../MainApplication.kt`, override `getJSBundleFile()` to load the downloaded bundle if present:
```kotlin
override fun getJSBundleFile(): String? {
  val otaBundle = File(applicationContext.filesDir, "ota/latest.bundle")
  return if (otaBundle.exists()) {
    otaBundle.absolutePath
  } else {
    super.getJSBundleFile() // Fallback to assets://index.android.bundle
  }
}
```

### 2. iOS (`AppDelegate.mm`)
In `ios/YourApp/AppDelegate.mm`, override `sourceURLForBridge:`:
```objc
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *otaPath = [[paths firstObject] stringByAppendingPathComponent:@"ota/latest.bundle"];

  if ([[NSFileManager defaultManager] fileExistsAtPath:otaPath]) {
    return [NSURL fileURLWithPath:otaPath];
  }
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
}
```

### 3. React Native Hook (`useOtaUpdater.ts`)
```typescript
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system'; // or react-native-fs

const OTA_ENDPOINT = 'https://<your-project-id>.web.app/api/v1/updates/check';
const DEPLOYMENT_KEY = 'dep_prod_...';

export function useOtaUpdater(appVersion: string, deviceId: string) {
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const url = `${OTA_ENDPOINT}?deploymentKey=${DEPLOYMENT_KEY}&appVersion=${appVersion}&platform=${Platform.OS}&deviceId=${deviceId}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.isAvailable && data.downloadUrl) {
          const downloadDest = `${FileSystem.documentDirectory}ota/latest.bundle`;
          await FileSystem.downloadAsync(data.downloadUrl, downloadDest);
          
          if (data.isMandatory) {
            // Reload app immediately (e.g. using react-native-restart)
          }
        }
      } catch (err) {
        console.warn('OTA update check failed:', err);
      }
    }

    checkForUpdates();
  }, [appVersion, deviceId]);
}
```

---

## 🔒 Security Architecture

1. **Multi-Tenant Firestore Isolation**:
   - Every application, release, and environment belongs to an owner (`ownerId`).
   - `firestore.rules` enforces `request.auth.uid == resource.data.ownerId` on all write and read operations.
2. **Application Default Credentials (ADC)**:
   - Backend Cloud Functions run on Google Cloud IAM without hardcoding service account private keys or credentials.
3. **Encrypted Client Integrity**:
   - All uploaded release bundles are hashed with SHA-256 before deployment. Clients verify the hash upon download before swapping the bundle file.
4. **CI/CD API Key Scoping**:
   - Management endpoints require API keys generated from the authenticated dashboard. Keys are validated and matched to user tenant IDs.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for modern React Native developers.
