import { AppModel, AppEnvironment, TargetPlatform } from '../types';
import { db, isFirebaseConfigured } from '../config/firebase';
import { getStoredApps, saveStoredApps } from './mockData';
import { generateRandomKey } from '../utils/hash';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

export async function fetchApps(userId: string): Promise<AppModel[]> {
  const localApps = getStoredApps().filter(a => a.ownerId === userId);
  if (isFirebaseConfigured && db && userId && !userId.startsWith('usr_')) {
    try {
      const q = query(collection(db, 'apps'), where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      const remoteApps = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppModel));
      const sorted = remoteApps.sort((a, b) => b.createdAt - a.createdAt);
      // Authoritative update of local storage cache
      saveStoredApps(sorted);
      return sorted;
    } catch (err) {
      console.warn('Firestore fetchApps failed, falling back to local storage cache:', err);
    }
  }
  return localApps;
}

export async function fetchAppById(appId: string, userId: string): Promise<AppModel | null> {
  const localApps = getStoredApps();
  const foundLocal = localApps.find(a => a.id === appId && a.ownerId === userId) || null;
  if (isFirebaseConfigured && db && userId && !userId.startsWith('usr_')) {
    try {
      const docRef = doc(db, 'apps', appId);
      const docSnap = await getDoc(docRef);
      if (docSnap && docSnap.exists()) {
        const app = { id: docSnap.id, ...docSnap.data() } as AppModel;
        return app.ownerId === userId ? app : null;
      }
    } catch (err) {
      console.warn('Firestore fetchAppById failed, checking local storage:', err);
    }
  }
  return foundLocal;
}

export interface CreateAppInput {
  name: string;
  basePackageName: string;
  platforms: TargetPlatform[];
  environments?: {
    name: string;
    suffix: string;
  }[];
}

export async function createApp(input: CreateAppInput, userId: string): Promise<AppModel> {
  if (!userId) throw new Error('Authentication required to create applications.');

  const appId = `app_${input.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
  
  const cleanBase = input.basePackageName.trim().toLowerCase();
  const environments: AppEnvironment[] = (input.environments && input.environments.length > 0)
    ? input.environments.map(e => {
        const envId = e.name.toLowerCase().replace(/\s+/g, '-');
        const cleanSuffix = (e.suffix || '').trim().toLowerCase();
        return {
          id: envId,
          name: e.name,
          suffix: cleanSuffix,
          computedPackageName: `${cleanBase}${cleanSuffix}`.toLowerCase(),
          deploymentKey: generateRandomKey(`dep_${envId}`),
        };
      })
    : [
        {
          id: 'development',
          name: 'Development',
          suffix: '.development',
          computedPackageName: `${cleanBase}.development`,
          deploymentKey: generateRandomKey('dep_dev'),
        },
        {
          id: 'staging',
          name: 'Staging',
          suffix: '.staging',
          computedPackageName: `${cleanBase}.staging`,
          deploymentKey: generateRandomKey('dep_stage'),
        },
        {
          id: 'production',
          name: 'Production',
          suffix: '',
          computedPackageName: cleanBase,
          deploymentKey: generateRandomKey('dep_prod'),
        },
      ];

  const newApp: AppModel = {
    id: appId,
    name: input.name.trim(),
    basePackageName: cleanBase,
    platforms: input.platforms.length > 0 ? input.platforms : ['android', 'ios'],
    environments,
    ownerId: userId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Persist to Firestore first if configured for authenticated user
  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await setDoc(doc(db, 'apps', appId), newApp);
    } catch (err: any) {
      console.error('Firestore createApp error:', err);
      throw new Error(`Failed to save application to Firestore: ${err.message}`);
    }
  }

  // Update local storage cache
  const existing = getStoredApps();
  const updated = [newApp, ...existing.filter(a => a.id !== appId)];
  saveStoredApps(updated);

  return newApp;
}

export async function deleteApp(appId: string, userId: string): Promise<void> {
  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await deleteDoc(doc(db, 'apps', appId));
    } catch (err: any) {
      console.error('Firestore deleteApp error:', err);
      throw new Error(`Failed to delete application from Firestore: ${err.message}`);
    }
  }

  const existing = getStoredApps();
  const updated = existing.filter(a => a.id !== appId);
  saveStoredApps(updated);
}

export async function addEnvironment(
  appId: string,
  name: string,
  suffix: string,
  userId: string
): Promise<AppEnvironment> {
  const envId = name.toLowerCase().replace(/\s+/g, '-');
  const app = await fetchAppById(appId, userId);
  if (!app) throw new Error('App not found');

  const cleanBase = app.basePackageName.trim().toLowerCase();
  const cleanSuffix = (suffix || '').trim().toLowerCase();
  const newEnv: AppEnvironment = {
    id: envId,
    name,
    suffix: cleanSuffix,
    computedPackageName: `${cleanBase}${cleanSuffix}`.toLowerCase(),
    deploymentKey: generateRandomKey(`dep_${envId}`),
  };

  const updatedEnvironments = [...app.environments.filter(e => e.id !== envId), newEnv];

  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await updateDoc(doc(db, 'apps', appId), {
        environments: updatedEnvironments,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Firestore addEnvironment error:', err);
      throw new Error(`Failed to update environment in Firestore: ${err.message}`);
    }
  }

  const apps = getStoredApps();
  const index = apps.findIndex(a => a.id === appId);
  if (index !== -1) {
    apps[index].environments = updatedEnvironments;
    apps[index].updatedAt = Date.now();
    saveStoredApps(apps);
  }

  return newEnv;
}
