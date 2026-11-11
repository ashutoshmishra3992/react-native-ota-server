# AirOTA — React Native Over-The-Air (OTA) Updates Server & Dashboard

AirOTA is a production-grade, developer-friendly Over-The-Air (OTA) update platform designed specifically for **React Native 0.76+** and built with **React 19**, **Vite 6**, **Tailwind CSS**, and **Firebase (Hosting, Functions v2, Firestore, Storage)**.

Deploy critical bug fixes and features directly to your users' devices in seconds — without waiting for App Store or Google Play reviews.

---

## 🚀 Key Features

- **Product Landing Page & Authentication**:
  - Marketing homepage explaining architecture, metrics, and capabilities.
  - Secure authentication via Firebase Auth (Email/Password, Google OAuth) with protected dashboard routes.
- **Application & Environment Management**:
  - Target Platforms: `Android`, `iOS`, `Universal`.
  - Base Package Names (e.g. `com.example.app`).
  - Configurable Environments with live computed package name suffixes:
    - Development: `.development` -> `com.example.app.development`
    - Staging: `.staging` -> `com.example.app.staging`
    - Production: `""` -> `com.example.app`
  - Auto-generated cryptographically secure `deploymentKey`s per environment.
- **Release Push & Rollout Controls**:
  - Upload raw JS bundles (`index.android.bundle`, `main.jsbundle`) or `.zip` archives containing code + assets.
  - Automatic in-browser **SHA-256 integrity checksum** calculation.
  - **Native Binary Semver Protection**: Target version constraints (e.g. `1.0.0`, `^1.0.0`) so JS updates never break native dependencies.
  - **Mandatory Updates**: Force instant app reload vs. background loading on next cold start.
  - **Staged Rollouts**: Deploy to 10% – 100% of devices via deterministic client hash bucketing.
  - **1-Click Rollback**: Instantly disable buggy releases and reactivate the previous stable bundle.
- **Full Programmatic REST API**:
  - Comprehensive endpoints for Apps, Releases, Rollbacks, and Telemetry.
  - Authenticated via User API Keys (`ota_live_sec_...`) for CI/CD pipelines (GitHub Actions, Bitrise, Fastlane).
- **Interactive Live Update Tester**:
  - In-browser mobile device simulator to test update check queries and bundle downloads in real-time.
- **Client SDK Integration Guides**:
  - Ready-to-use snippets for Android (`MainApplication.kt`), iOS (`AppDelegate.mm`), and React Native TypeScript hooks (`useOtaUpdater.ts`).

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
├── tailwind.config.js           # Tailwind CSS theme configuration
├── firebase.json                # Firebase Hosting rewrites & Cloud Functions config
├── firestore.rules              # Firestore Security Rules
├── storage.rules                # Storage Security Rules
├── src/
│   ├── main.tsx                 # React DOM root
│   ├── App.tsx                  # React Router 7 setup
│   ├── config/
│   │   └── firebase.ts          # Firebase SDK initialization with mock fallback
│   ├── types/                   # TypeScript interfaces (App, Release, Env, API Key)
│   ├── services/
│   │   ├── appsService.ts       # App CRUD & environment management
│   │   ├── releasesService.ts   # Release deployment & rollback service
│   │   ├── apiKeysService.ts    # CI/CD API Key management
│   │   └── mockData.ts          # Local storage caching layer
│   ├── context/
│   │   └── AuthContext.tsx      # Firebase Auth provider & session management
│   ├── components/
│   │   ├── layout/              # Navbar, Sidebar, DashboardLayout
│   │   └── ui/                  # Modal, Badges, etc.
│   ├── pages/
│   │   ├── LandingPage.tsx      # Marketing & Product homepage
│   │   ├── LoginPage.tsx        # Authentication page
│   │   ├── DashboardOverview.tsx# Main dashboard with metrics & recent releases
│   │   ├── AppsListPage.tsx     # Apps list & environment cards
│   │   ├── CreateAppModal.tsx   # Add app with name, base package, envs, suffixes
│   │   ├── AppDetailsPage.tsx   # App details, deployment keys, release history
│   │   ├── NewReleaseModal.tsx  # Push update modal with SHA-256 & rollout %
│   │   ├── ReleasesListPage.tsx # Releases table with instant rollback
│   │   ├── RestApiDocsPage.tsx  # Interactive REST API explorer & API keys
│   │   ├── SdkGuidePage.tsx     # React Native native bridge & hook instructions
│   │   └── SimulatorPage.tsx    # Live in-browser phone update tester
│   └── utils/
│       ├── hash.ts              # Web Crypto API SHA-256 checksum calculator
│       └── formatters.ts        # Byte sizes, timestamps, relative dates
└── functions/                   # Firebase Cloud Functions (Node.js REST API)
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts             # Express REST API & Mobile update check
```

---

## ⚡ Quick Start (Local Development)

### 1. Install Dependencies
```bash
# Install root frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

### 2. Run the Web Dashboard
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser. Sign in or create an account to access the dashboard, register your React Native applications, push OTA releases, and test update delivery with the live mobile simulator!

---

## 🔥 Deploying to Firebase

### 1. Connect Your Firebase Project
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Firebase web app config values in `.env`.

Login to Firebase and set your active project:
```bash
firebase login
firebase use --add <your-project-id>
```

### 2. Build and Deploy
```bash
# Build the React 19 web app and Cloud Functions
npm run build
cd functions && npm run build && cd ..

# Deploy Hosting, Functions, Firestore, and Storage with one command
firebase deploy
```

Your app will be live at:
- Web Dashboard: `https://<your-project-id>.web.app`
- Client Update API: `https://<your-project-id>.web.app/api/v1/updates/check`

---

## 📡 REST API Reference

Pass your User API Key in the `Authorization: Bearer <API_KEY>` or `X-API-Key: <API_KEY>` header.

### 1. Mobile Client Update Check (Public)
```bash
curl -X GET "https://your-domain.web.app/api/v1/updates/check?deploymentKey=dep_prod_shop_9934ea120d&appVersion=1.0.0&platform=android&currentHash=&deviceId=device-uuid-99"
```

**Response (Update Available):**
```json
{
  "isAvailable": true,
  "updateId": "rel_shopsphere_v1_2_1",
  "downloadUrl": "https://storage.googleapis.com/.../bundle.zip",
  "bundleHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "bundleSize": 1845200,
  "isMandatory": true,
  "targetAppVersion": "1.0.0",
  "releaseNotes": "Emergency fix for payment crash",
  "createdAt": 1715423000000
}
```

### 2. Push Release (CI/CD Pipeline)
```bash
curl -X POST "https://your-domain.web.app/api/v1/apps/<APP_ID>/releases" \
  -H "Authorization: Bearer <OTA_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "environmentId": "production",
    "platform": "universal",
    "targetAppVersion": "1.0.0",
    "isMandatory": true,
    "rolloutPercentage": 100,
    "releaseNotes": "Performance improvements and crash fixes",
    "bundleUrl": "https://storage.googleapis.com/.../bundle.zip",
    "bundleHash": "9f83c605d84a8ec9d01f8da7a762d050c97d...",
    "bundleSize": 1420100,
    "bundleFileName": "bundle.zip"
  }'
```

### 3. Instant Rollback
```bash
curl -X POST "https://your-domain.web.app/api/v1/apps/<APP_ID>/releases/<RELEASE_ID>/rollback" \
  -H "Authorization: Bearer <OTA_API_KEY>"
```

---

## 📱 React Native Integration Guide

### 1. Android (`MainApplication.kt`)
In `android/app/src/main/java/.../MainApplication.kt`, override `getJSBundleFile()`:
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

---

## 📄 License
MIT License. Built for modern React Native developers.
