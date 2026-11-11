import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import * as semver from "semver";
import * as crypto from "crypto";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper to generate secure random keys
function generateKey(prefix: string = "key"): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

// Simple deterministic string hash into number 0-99
function getRolloutBucket(deviceId: string, releaseId: string): number {
  const hash = crypto.createHash("md5").update(`${deviceId}:${releaseId}`).digest("hex");
  const num = parseInt(hash.substring(0, 8), 16);
  return num % 100;
}

// Interface extensions
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Middleware: API Key or Firebase Token Auth for management endpoints
async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization || (req.headers["x-api-key"] as string);

  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header or X-API-Key" });
    return;
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  try {
    // 1. First check if it's an API Key stored in 'api_keys' collection
    const apiKeyDoc = await db.collection("api_keys").doc(token).get();
    if (apiKeyDoc.exists) {
      const data = apiKeyDoc.data();
      if (data?.status === "active") {
        req.userId = data.userId;
        next();
        return;
      }
    }

    // 2. Otherwise verify as Firebase Auth ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (err: any) {
    res.status(401).json({ error: "Invalid or expired authentication credentials", details: err.message });
  }
}

// ==========================================
// 1. MOBILE CLIENT OTA UPDATE CHECK ENDPOINTS
// ==========================================

/**
 * Mobile Client Update Check Endpoint
 * Query:
 *   - deploymentKey: Client environment deployment key (e.g. dep_dev_...)
 *   - appVersion: Binary semver version of native app (e.g. 1.0.0)
 *   - platform: android | ios | universal
 *   - currentHash: (optional) SHA-256 hash of currently installed bundle
 *   - deviceId: (optional) Unique device identifier for staged rollout bucketing
 */
app.get("/api/v1/updates/check", async (req: Request, res: Response): Promise<void> => {
  try {
    const deploymentKey = req.query.deploymentKey as string;
    const appVersion = req.query.appVersion as string;
    const platform = ((req.query.platform as string) || "universal").toLowerCase();
    const currentHash = (req.query.currentHash as string) || "";
    const deviceId = (req.query.deviceId as string) || "anonymous-device";

    if (!deploymentKey || !appVersion) {
      res.status(400).json({ error: "deploymentKey and appVersion are required query parameters" });
      return;
    }

    // Find the app containing this deployment key
    const appsSnapshot = await db.collection("apps").get();
    let targetApp: any = null;
    let targetEnv: any = null;

    for (const doc of appsSnapshot.docs) {
      const appData = doc.data();
      const env = (appData.environments || []).find((e: any) => e.deploymentKey === deploymentKey);
      if (env) {
        targetApp = { id: doc.id, ...appData };
        targetEnv = env;
        break;
      }
    }

    if (!targetApp || !targetEnv) {
      res.status(404).json({ error: "No matching application found for provided deploymentKey" });
      return;
    }

    // Query active releases for this app and environment
    const releasesSnapshot = await db
      .collection("releases")
      .where("appId", "==", targetApp.id)
      .where("environmentId", "==", targetEnv.id)
      .where("status", "==", "active")
      .get();

    if (releasesSnapshot.empty) {
      res.json({ isAvailable: false, message: "No active releases for this environment" });
      return;
    }

    // Filter releases matching platform and targetAppVersion semver
    const validReleases = releasesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .filter((rel) => {
        // Platform match
        const platformMatch = rel.platform === "universal" || rel.platform === platform;
        if (!platformMatch) return false;

        // Semver match
        try {
          return (
            rel.targetAppVersion === appVersion ||
            semver.satisfies(semver.coerce(appVersion)?.version || appVersion, rel.targetAppVersion)
          );
        } catch {
          return rel.targetAppVersion === appVersion;
        }
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (validReleases.length === 0) {
      res.json({ isAvailable: false, message: "No compatible updates for app version " + appVersion });
      return;
    }

    const latestRelease = validReleases[0];

    // Check rollout percentage bucketing
    const rolloutPercentage = latestRelease.rolloutPercentage ?? 100;
    if (rolloutPercentage < 100) {
      const userBucket = getRolloutBucket(deviceId, latestRelease.id);
      if (userBucket >= rolloutPercentage) {
        // User not in rollout cohort yet
        res.json({ isAvailable: false, message: "Update is in staged rollout; device not in cohort" });
        return;
      }
    }

    // Check if client already has this exact bundle hash
    if (currentHash && latestRelease.bundleHash === currentHash) {
      res.json({ isAvailable: false, message: "Client already has latest bundle installed" });
      return;
    }

    // Return the update payload
    res.json({
      isAvailable: true,
      updateId: latestRelease.id,
      downloadUrl: latestRelease.bundleUrl,
      bundleHash: latestRelease.bundleHash,
      bundleSize: latestRelease.bundleSize,
      isMandatory: latestRelease.isMandatory || false,
      targetAppVersion: latestRelease.targetAppVersion,
      releaseNotes: latestRelease.releaseNotes || "",
      fileName: latestRelease.bundleFileName || "bundle.zip",
      createdAt: latestRelease.createdAt,
    });
  } catch (err: any) {
    console.error("Update check error:", err);
    res.status(500).json({ error: "Failed to evaluate update check", details: err.message });
  }
});

/**
 * Client Telemetry Report Endpoint
 */
app.post("/api/v1/updates/report", async (req: Request, res: Response): Promise<void> => {
  try {
    const { releaseId, event, platform, deviceId } = req.body;
    if (!releaseId || !event) {
      res.status(400).json({ error: "releaseId and event are required" });
      return;
    }

    const reportRef = db.collection("analytics").doc();
    await reportRef.set({
      releaseId,
      event,
      platform: platform || "unknown",
      deviceId: deviceId || "anonymous",
      timestamp: Date.now(),
    });

    if (event === "download_success" || event === "applied") {
      const releaseRef = db.collection("releases").doc(releaseId);
      await releaseRef.update({
        downloadCount: admin.firestore.FieldValue.increment(1),
      });
    }

    res.json({ success: true, recordedAt: Date.now() });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to record telemetry", details: err.message });
  }
});

// ==========================================
// 2. APPS MANAGEMENT REST ENDPOINTS
// ==========================================

/**
 * List all apps for user
 */
app.get("/api/v1/apps", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const snapshot = await db.collection("apps").where("ownerId", "==", req.userId).get();
    const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ apps });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch apps", details: err.message });
  }
});

/**
 * Create a new app
 */
app.post("/api/v1/apps", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, basePackageName, platforms, environments } = req.body;

    if (!name || !basePackageName) {
      res.status(400).json({ error: "name and basePackageName are required" });
      return;
    }

    const cleanBase = basePackageName.trim().toLowerCase();
    const targetPlatforms = platforms && platforms.length > 0 ? platforms : ["android", "ios"];

    // Default environments if none provided
    const configuredEnvs = (environments && environments.length > 0)
      ? environments.map((e: any) => {
          const cleanSuffix = (e.suffix ?? "").trim().toLowerCase();
          return {
            id: e.id || e.name.toLowerCase().replace(/\s+/g, "-"),
            name: e.name,
            suffix: cleanSuffix,
            computedPackageName: `${cleanBase}${cleanSuffix}`.toLowerCase(),
            deploymentKey: generateKey(`dep_${e.id || "env"}`),
          };
        })
      : [
          {
            id: "development",
            name: "Development",
            suffix: ".development",
            computedPackageName: `${cleanBase}.development`,
            deploymentKey: generateKey("dep_dev"),
          },
          {
            id: "staging",
            name: "Staging",
            suffix: ".staging",
            computedPackageName: `${cleanBase}.staging`,
            deploymentKey: generateKey("dep_stage"),
          },
          {
            id: "production",
            name: "Production",
            suffix: "",
            computedPackageName: cleanBase,
            deploymentKey: generateKey("dep_prod"),
          },
        ];

    const appRef = db.collection("apps").doc();
    const newApp = {
      name: name.trim(),
      basePackageName: cleanBase,
      platforms: targetPlatforms,
      environments: configuredEnvs,
      ownerId: req.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await appRef.set(newApp);
    res.status(201).json({ id: appRef.id, ...newApp });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create app", details: err.message });
  }
});

/**
 * Get App details
 */
app.get("/api/v1/apps/:appId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const appDoc = await db.collection("apps").doc(req.params.appId).get();
    if (!appDoc.exists) {
      res.status(404).json({ error: "App not found" });
      return;
    }
    const appData = appDoc.data();
    if (appData?.ownerId !== req.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    res.json({ id: appDoc.id, ...appData });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve app", details: err.message });
  }
});

/**
 * Delete App
 */
app.delete("/api/v1/apps/:appId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const appRef = db.collection("apps").doc(req.params.appId);
    const doc = await appRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: "App not found" });
      return;
    }
    if (doc.data()?.ownerId !== req.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    await appRef.delete();
    res.json({ success: true, message: "App deleted" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete app", details: err.message });
  }
});

/**
 * Add / Update Environment in an App
 */
app.post("/api/v1/apps/:appId/environments", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, suffix } = req.body;
    if (!name) {
      res.status(400).json({ error: "Environment name is required" });
      return;
    }

    const appRef = db.collection("apps").doc(req.params.appId);
    const appDoc = await appRef.get();
    if (!appDoc.exists) {
      res.status(404).json({ error: "App not found" });
      return;
    }
    const appData = appDoc.data();
    if (!appData || appData.ownerId !== req.userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const envId = name.toLowerCase().replace(/\s+/g, "-");
    const cleanSuffix = (suffix || "").trim().toLowerCase();
    const cleanBase = (appData.basePackageName || "").trim().toLowerCase();
    const newEnv = {
      id: envId,
      name: name.trim(),
      suffix: cleanSuffix,
      computedPackageName: `${cleanBase}${cleanSuffix}`.toLowerCase(),
      deploymentKey: generateKey(`dep_${envId}`),
    };

    const existingEnvs = (appData.environments || []).filter((e: any) => e.id !== envId);
    const updatedEnvs = [...existingEnvs, newEnv];

    await appRef.update({
      environments: updatedEnvs,
      updatedAt: Date.now(),
    });

    res.status(201).json({ environment: newEnv });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add environment", details: err.message });
  }
});

// ==========================================
// 3. RELEASES & OTA PUSH REST ENDPOINTS
// ==========================================

/**
 * List releases for an app
 */
app.get("/api/v1/apps/:appId/releases", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appId } = req.params;
    const { environmentId, platform } = req.query;

    let query: admin.firestore.Query = db.collection("releases").where("appId", "==", appId);

    if (environmentId) {
      query = query.where("environmentId", "==", environmentId);
    }
    if (platform) {
      query = query.where("platform", "==", platform);
    }

    const snapshot = await query.get();
    const releases = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    res.json({ releases });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch releases", details: err.message });
  }
});

/**
 * Push / Create a new Release (CI/CD / CLI / Dashboard)
 */
app.post("/api/v1/apps/:appId/releases", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appId } = req.params;
    const {
      environmentId,
      platform,
      targetAppVersion,
      isMandatory,
      rolloutPercentage,
      releaseNotes,
      bundleUrl,
      bundleHash,
      bundleSize,
      bundleFileName,
    } = req.body;

    if (!environmentId || !targetAppVersion || !bundleUrl || !bundleHash) {
      res.status(400).json({
        error: "environmentId, targetAppVersion, bundleUrl, and bundleHash are required",
      });
      return;
    }

    const releaseRef = db.collection("releases").doc();
    const releaseData = {
      appId,
      environmentId,
      platform: platform || "universal",
      targetAppVersion,
      isMandatory: Boolean(isMandatory),
      rolloutPercentage: Number(rolloutPercentage) || 100,
      releaseNotes: releaseNotes || "",
      bundleUrl,
      bundleHash,
      bundleSize: Number(bundleSize) || 0,
      bundleFileName: bundleFileName || "bundle.zip",
      status: "active",
      downloadCount: 0,
      createdBy: req.userId,
      createdAt: Date.now(),
    };

    await releaseRef.set(releaseData);
    res.status(201).json({ id: releaseRef.id, ...releaseData });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create release", details: err.message });
  }
});

/**
 * Update release rollout percentage or status
 */
app.patch("/api/v1/apps/:appId/releases/:releaseId", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { releaseId } = req.params;
    const { rolloutPercentage, status, isMandatory, releaseNotes } = req.body;

    const releaseRef = db.collection("releases").doc(releaseId);
    const releaseDoc = await releaseRef.get();
    if (!releaseDoc.exists) {
      res.status(404).json({ error: "Release not found" });
      return;
    }

    const updates: any = { updatedAt: Date.now() };
    if (rolloutPercentage !== undefined) updates.rolloutPercentage = Number(rolloutPercentage);
    if (status !== undefined) updates.status = status;
    if (isMandatory !== undefined) updates.isMandatory = Boolean(isMandatory);
    if (releaseNotes !== undefined) updates.releaseNotes = releaseNotes;

    await releaseRef.update(updates);
    res.json({ success: true, updated: updates });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update release", details: err.message });
  }
});

/**
 * Rollback release: Deactivates specified release and activates the previous one
 */
app.post("/api/v1/apps/:appId/releases/:releaseId/rollback", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { appId, releaseId } = req.params;

    const currentReleaseRef = db.collection("releases").doc(releaseId);
    const currentDoc = await currentReleaseRef.get();
    if (!currentDoc.exists) {
      res.status(404).json({ error: "Release not found" });
      return;
    }

    const currentData = currentDoc.data();
    await currentReleaseRef.update({
      status: "rolled_back",
      updatedAt: Date.now(),
    });

    // Find the immediately preceding release for the same environment & platform
    const prevSnapshot = await db
      .collection("releases")
      .where("appId", "==", appId)
      .where("environmentId", "==", currentData?.environmentId)
      .where("platform", "==", currentData?.platform)
      .get();

    const previousReleases = prevSnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((r) => r.id !== releaseId && (r.createdAt || 0) < (currentData?.createdAt || 0))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    let reactivatedId = null;
    if (previousReleases.length > 0) {
      const prevRelease = previousReleases[0];
      await db.collection("releases").doc(prevRelease.id).update({
        status: "active",
        updatedAt: Date.now(),
      });
      reactivatedId = prevRelease.id;
    }

    res.json({
      success: true,
      rolledBackReleaseId: releaseId,
      reactivatedReleaseId: reactivatedId,
      message: reactivatedId
        ? `Rolled back ${releaseId} and reactivated previous release ${reactivatedId}`
        : `Release ${releaseId} disabled; no prior release found to reactivate`,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to execute rollback", details: err.message });
  }
});

// ==========================================
// 4. API KEYS MANAGEMENT REST ENDPOINTS
// ==========================================

/**
 * Generate a new API Key for CI/CD automation
 */
app.post("/api/v1/api-keys", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const apiKey = generateKey("ota_live_sec");
    const keyRef = db.collection("api_keys").doc(apiKey);

    const keyRecord = {
      name: name || "CI/CD Deployment Key",
      userId: req.userId,
      key: apiKey,
      status: "active",
      createdAt: Date.now(),
    };

    await keyRef.set(keyRecord);
    res.status(201).json(keyRecord);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate API Key", details: err.message });
  }
});

/**
 * List API Keys
 */
app.get("/api/v1/api-keys", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const snapshot = await db.collection("api_keys").where("userId", "==", req.userId).get();
    const keys = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ keys });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch API keys", details: err.message });
  }
});

// Export Cloud Function v2
export const api = onRequest({ cors: true, maxInstances: 10 }, app);
