import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://airota-server-83921.web.app';
const SCREENSHOT_DIR = path.resolve('./tests/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTestSuite() {
  console.log(`\n======================================================`);
  console.log(`🚀 AirOTA Comprehensive E2E Test Suite on Live Server`);
  console.log(`🔗 Target URL: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Firebase') || msg.text().includes('Firestore')) {
      console.log(`    [Browser Console ${msg.type()}]:`, msg.text());
    }
  });
  page.on('pageerror', err => {
    console.error('    [Browser Uncaught Error]:', err.message);
  });

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  try {
    // ==========================================
    // TEST 1: Landing Page (Homepage)
    // ==========================================
    console.log('--- 1. Testing Landing Page (Homepage) ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-landing-page.png') });

    const title = await page.title();
    assert(title.includes('AirOTA'), `Page title contains "AirOTA" (Actual: "${title}")`);

    const heroHeading = await page.textContent('h1');
    assert(heroHeading.includes('Deploy React Native updates in'), `Hero headline renders correctly`);

    const navBrand = await page.textContent('header a');
    assert(navBrand.includes('AirOTA'), `Navbar contains AirOTA branding`);

    const hasNoDemoPill = (await page.$('text=Instant Demo Sign In')) === null;
    assert(hasNoDemoPill, `Homepage has NO guest demo buttons`);

    // Verify REST API section on Landing Page
    const restApiSection = await page.$('section#rest-api');
    assert(restApiSection !== null, `Landing page contains dedicated <section id="rest-api">`);

    const restApiNav = await page.$('header a[href="/#rest-api"]');
    assert(restApiNav !== null, `Navbar has functioning link to "/#rest-api"`);

    const restApiContent = await page.textContent('section#rest-api');
    assert(restApiContent.includes('/api/v1/updates/check') && restApiContent.includes('Built for Automation & CI/CD Pipelines'), `REST API section renders live endpoints and cURL examples`);

    // Verify Public Docs Page (/docs)
    console.log('  Testing Public Developer Docs (/docs)...');
    await page.click('a:has-text("SDK & REST API Docs")');
    await page.waitForSelector('h1:has-text("AirOTA Developer Documentation")', { timeout: 8000 });
    const docsUrl = page.url();
    assert(docsUrl.includes('/docs'), `Clicking "SDK & REST API Docs" navigates to public /docs (Current URL: ${docsUrl})`);

    const docsHeading = await page.textContent('h1');
    assert(docsHeading.includes('AirOTA Developer Documentation'), `Public Docs page renders title "AirOTA Developer Documentation"`);

    const hasApiTab = (await page.$('button:has-text("REST API Reference")')) !== null;
    const hasSdkTab = (await page.$('button:has-text("React Native SDK Integration")')) !== null;
    assert(hasApiTab && hasSdkTab, `Public Docs page includes both REST API and SDK Integration tabs`);

    // Return to Homepage
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // ==========================================
    // TEST 2: Route Protection on /dashboard
    // ==========================================
    console.log('\n--- 2. Testing Route Guard Protection ---');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    assert(currentUrl.includes('/login'), `Unauthenticated visit to /dashboard redirects to /login (Current URL: ${currentUrl})`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-protected-route-redirect.png') });

    // ==========================================
    // TEST 3: Login Page UI & Form Validation
    // ==========================================
    console.log('\n--- 3. Testing Login Page UI ---');
    const loginHeader = await page.textContent('h2');
    assert(loginHeader.includes('Sign in to AirOTA Dashboard'), `Login header displays "Sign in to AirOTA Dashboard"`);

    const hasDemoButton = (await page.$('text=Instant Demo')) !== null;
    assert(!hasDemoButton, `Login page has NO guest demo button`);

    const hasGoogleButton = (await page.$('text=Sign In with Google')) !== null;
    assert(hasGoogleButton, `Login page has "Sign In with Google" button`);

    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    assert(emailInput !== null && passwordInput !== null, `Email and Password input fields exist`);

    // Toggle between Sign In and Sign Up views
    await page.click('button:has-text("Create one")');
    await page.waitForTimeout(300);
    const signUpHeader = await page.textContent('h2');
    assert(signUpHeader.includes('Create your AirOTA account'), `Clicking "Create one" switches to Account Creation view`);

    // Click the toggle back to Sign In
    const switchBackBtn = await page.$('button.text-emerald-700:has-text("Sign In")');
    if (switchBackBtn) {
      await switchBackBtn.click();
      await page.waitForTimeout(300);
      const backHeader = await page.textContent('h2');
      assert(backHeader.includes('Sign in to AirOTA Dashboard'), `Switches back to Sign In view`);
    }

    // ==========================================
    // TEST 4: Live Authentication & Dashboard Entry
    // ==========================================
    console.log('\n--- 4. Testing Authentication & Dashboard Entry ---');
    const testPassword = process.env.TEST_PASSWORD || 'AirOtaSecureTest2026!';
    await page.fill('input[type="email"]', 'marcus.vance@company.com');
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    const dashUrl = page.url();
    assert(dashUrl.includes('/dashboard'), `User successfully authenticated and entered /dashboard (URL: ${dashUrl})`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-dashboard-overview.png') });

    const sidebarText = await page.textContent('aside');
    assert(sidebarText.includes('AirOTA') && sidebarText.includes('marcus.vance@company.com'), `Sidebar renders authenticated user email`);

    const hasSidebarDemoBanner = (await page.$('text=Interactive Demo')) !== null;
    assert(!hasSidebarDemoBanner, `Sidebar has NO demo banner`);

    const metricApps = await page.textContent('text=Registered Apps');
    assert(metricApps !== null, `Overview displays "Registered Apps" card`);

    // ==========================================
    // TEST 5: Applications Management Page (/dashboard/apps)
    // ==========================================
    console.log('\n--- 5. Testing Applications Page & Create Modal ---');
    await page.goto(`${BASE_URL}/dashboard/apps`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const appsHeading = await page.textContent('h2');
    assert(appsHeading.includes('Applications'), `Applications page renders with "Applications" title`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-apps-page.png') });

    // Open "Register New App" modal
    await page.click('button:has-text("Register New App")');
    await page.waitForSelector('text=Create New Application');
    const modalTitle = await page.textContent('text=Create New Application');
    assert(modalTitle !== null, `"Create New Application" modal opens properly`);

    // Verify fields in modal: Name, Base Package, Targets, Environments
    const hasBasePackage = (await page.$('text=Base Package Name')) !== null;
    const hasTargets = (await page.$('text=Update Targets')) !== null;
    const hasEnvs = (await page.$('text=Environments & Package Name Suffixes')) !== null;
    assert(hasBasePackage && hasTargets && hasEnvs, `Create App modal contains Base Package, Targets, and Environments`);

    // Test package name lowercase enforcement on input: type mixed/uppercase
    await page.fill('input[placeholder="e.g. ShopSphere Driver"]', 'HyperDrive Rider');
    await page.fill('input[placeholder="e.g. com.example.app"]', 'COM.HyperDrive.Rider');
    const basePkgValue = await page.inputValue('input[placeholder="e.g. com.example.app"]');
    assert(basePkgValue === 'com.hyperdrive.rider', `Base package name input automatically converted to lowercase (Actual: "${basePkgValue}")`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-create-app-modal.png') });

    await page.click('button[type="submit"]:has-text("Create Application")');
    await page.waitForSelector('text=Create New Application', { state: 'hidden', timeout: 10000 });
    await page.waitForSelector('main a:has-text("HyperDrive Rider")', { timeout: 10000 });

    const createdAppCard = await page.textContent('main');
    assert(createdAppCard.includes('HyperDrive Rider'), `App "HyperDrive Rider" created and displayed in dashboard`);
    assert(createdAppCard.includes('com.hyperdrive.rider.development'), `Development package name suffix computed correctly and in lowercase (.development)`);
    assert(createdAppCard.includes('dep_'), `Deployment keys generated automatically`);

    // Create a second app with iOS Only target platform
    console.log('  Creating iOS-only application...');
    await page.click('button:has-text("Register New App")');
    await page.waitForSelector('text=Create New Application', { state: 'visible', timeout: 10000 });
    await page.fill('input[placeholder="e.g. ShopSphere Driver"]', 'Swift iOS Fleet');
    await page.fill('input[placeholder="e.g. com.example.app"]', 'COM.SWIFT.FLEET');
    // Deselect Android, keep iOS only
    await page.click('div[role="dialog"] button:has-text("Android"), div.fixed button:has-text("Android")');
    await page.waitForTimeout(300);
    await page.click('button[type="submit"]:has-text("Create Application")');
    await page.waitForSelector('text=Create New Application', { state: 'hidden', timeout: 10000 });
    await page.waitForSelector('main a:has-text("Swift iOS Fleet")', { timeout: 10000 });
    const swiftCard = await page.textContent('main');
    assert(swiftCard.includes('com.swift.fleet'), `iOS app base package name rendered in strictly lowercase (com.swift.fleet)`);

    // ==========================================
    // TEST 6: Releases & OTA Push Workflow (/dashboard/releases)
    // ==========================================
    console.log('\n--- 6. Testing Releases & Platform-Specific OTA Push Flow ---');
    await page.goto(`${BASE_URL}/dashboard/releases`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const releasesHeading = await page.textContent('h2');
    assert(releasesHeading.includes('Releases & OTA Deployments'), `Releases page renders correctly`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-releases-page.png') });

    // Open Push Release modal
    await page.click('button:has-text("Push New Release")');
    await page.waitForSelector('text=Push React Native OTA Release');
    assert(true, `"Push React Native OTA Release" modal opened`);

    // Select the iOS-only app and verify ONLY iOS option is available
    const appSelect = page.locator('select[name="appId"]');
    await appSelect.selectOption({ label: 'Swift iOS Fleet (com.swift.fleet)' });
    await page.waitForTimeout(400);

    const platformSelect = page.locator('select[name="platform"]');
    const iosOptions = await platformSelect.locator('option').evaluateAll(opts => opts.map(o => o.value));
    assert(iosOptions.length === 1 && iosOptions[0] === 'ios', `For iOS-only app, platform options ONLY contain iOS (Actual: ${JSON.stringify(iosOptions)})`);

    // Switch back to HyperDrive Rider (which supports Android & iOS)
    await appSelect.selectOption({ label: 'HyperDrive Rider (com.hyperdrive.rider)' });
    await page.waitForTimeout(400);

    const dualOptions = await platformSelect.locator('option').evaluateAll(opts => opts.map(o => o.value));
    assert(dualOptions.includes('universal') && dualOptions.includes('android') && dualOptions.includes('ios'), `For dual-platform app, Universal, Android, and iOS options are available (Actual: ${JSON.stringify(dualOptions)})`);

    // Verify semver input, mandatory toggle, staged rollout slider
    const hasSemver = (await page.$('text=Target Binary Version')) !== null;
    const hasMandatory = (await page.$('text=Mandatory Update')) !== null;
    const hasSlider = (await page.$('input[type="range"]')) !== null;
    assert(hasSemver && hasMandatory && hasSlider, `Release modal has Semver version input, Mandatory toggle, and Staged Rollout slider`);

    // Attach real JavaScript bundle file for Firebase Storage upload
    const bundleFixturePath = path.resolve('tests/fixtures/index.android.bundle');
    await page.setInputFiles('input[type="file"]', bundleFixturePath);
    await page.waitForTimeout(800);

    // Fill and submit a release
    await page.fill('input[placeholder="e.g. 1.0.0 or ^1.0.0"]', '1.0.1');
    await page.fill('textarea', 'Critical fix for checkout animation and offline order sync.');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-new-release-modal.png') });

    await page.click('button[type="submit"]:has-text("Deploy Release")');
    await page.waitForSelector('main:has-text("1.0.1")', { timeout: 15000 });
    await page.waitForSelector('main button:has-text("Rollback Release")', { timeout: 15000 });

    const releasesPageContent = await page.textContent('main');
    assert(releasesPageContent.includes('1.0.1'), `Release with target version 1.0.1 deployed successfully`);
    assert(releasesPageContent.includes('Rollback Release'), `Rollback Release button rendered for deployed release`);

    // ==========================================
    // TEST 7: REST API & CI/CD Access Keys (/dashboard/api-keys)
    // ==========================================
    console.log('\n--- 7. Testing REST API & Keys Page ---');
    await page.goto(`${BASE_URL}/dashboard/api-keys`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const apiKeyHeading = await page.textContent('h2');
    assert(apiKeyHeading.includes('REST API & Access Keys'), `REST API Docs page rendered`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-rest-api-page.png') });

    // Create a new User API Key
    await page.fill('input[placeholder="e.g. GitHub Actions CI/CD"]', 'GitHub CI/CD Automation Token');
    await page.click('button:has-text("Create Key")');
    await page.waitForSelector('main:has-text("GitHub CI/CD Automation Token")', { timeout: 10000 });

    const keysListText = await page.textContent('main');
    assert(keysListText.includes('GitHub CI/CD Automation Token') && keysListText.includes('ota_live_sec_'), `New User API key generated starting with "ota_live_sec_"`);

    // Verify documentation endpoints
    assert(keysListText.includes('/api/v1/updates/check'), `API Docs describe GET /api/v1/updates/check`);
    assert(keysListText.includes('/api/v1/apps/:appId/releases'), `API Docs describe POST /api/v1/apps/:appId/releases`);
    assert(keysListText.includes('curl -X GET'), `Ready-to-copy cURL requests rendered with syntax highlighting`);

    // ==========================================
    // TEST 8: Live Mobile Simulator (/dashboard/simulator)
    // ==========================================
    console.log('\n--- 8. Testing Live Mobile Update Simulator ---');
    await page.goto(`${BASE_URL}/dashboard/simulator`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const simHeading = await page.textContent('h2');
    assert(simHeading.includes('Live Update Tester'), `Mobile simulator page loaded`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-simulator-page.png') });

    // Click "Execute OTA Check Request"
    await page.click('button:has-text("Execute OTA Check Request")');
    await page.waitForTimeout(2000);

    const simResult = await page.textContent('body');
    assert(simResult.includes('New OTA Update Available!') || simResult.includes('Target Version: 1.0.0') || simResult.includes('1.0.0'), `Update check executed against deployed releases successfully`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-simulator-update-found.png') });

    // Click download & apply
    const downloadBtn = await page.$('button:has-text("Download & Apply to Phone")');
    if (downloadBtn) {
      await downloadBtn.click();
      await page.waitForTimeout(2000);
      const afterApplyText = await page.textContent('body');
      assert(afterApplyText.includes('Active OTA Bundle'), `Bundle applied to simulated phone and reloaded runtime`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-simulator-applied.png') });
    }

    // ==========================================
    // TEST 9: React Native SDK Integration Docs (/dashboard/sdk-guide)
    // ==========================================
    console.log('\n--- 9. Testing SDK Integration Guide ---');
    await page.goto(`${BASE_URL}/dashboard/sdk-guide`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const sdkContent = await page.textContent('body');
    assert(sdkContent.includes('MainApplication.kt') && sdkContent.includes('AppDelegate.mm'), `SDK Guide provides Android and iOS native bundle loader overrides`);
    assert(sdkContent.includes('useOtaUpdater.ts'), `SDK Guide provides React Native custom TypeScript hook`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-sdk-guide.png') });

    // ==========================================
    // TEST 10: Sign Out & Route Re-lock
    // ==========================================
    console.log('\n--- 10. Testing Sign Out & Route Re-lock ---');
    await page.click('button[title="Sign Out"]');
    await page.waitForTimeout(1000);

    // Verify navigating to dashboard now re-locks
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const reLockedUrl = page.url();
    assert(reLockedUrl.includes('/login'), `After logout, /dashboard is immediately re-locked and redirects to /login`);

  } catch (err) {
    console.error(`💥 Unhandled Exception during testing:`, err);
  } finally {
    await browser.close();
  }

  console.log(`\n======================================================`);
  console.log(`🎯 Test Run Completed: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log(`======================================================\n`);
}

runTestSuite();
