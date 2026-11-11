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
      const snapshot = await Promise.race([
        getDocs(q),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000)),
      ]);
      if (snapshot && 'docs' in snapshot) {
        const remoteApps = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppModel));
        const mergedMap = new Map<string, AppModel>();
        localApps.forEach(a => mergedMap.set(a.id, a));
        remoteApps.forEach((a: AppModel) => mergedMap.set(a.id, a));
        const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
        saveStoredApps(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Firestore fetch failed, checking local storage:', err);
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
      const docSnap = await Promise.race([
        getDoc(docRef),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000)),
      ]);
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

  // Update local storage immediately for responsive UI
  const existing = getStoredApps();
  const updated = [newApp, ...existing.filter(a => a.id !== appId)];
  saveStoredApps(updated);

  // Sync to Firestore if configured
  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await Promise.race([
        setDoc(doc(db, 'apps', appId), newApp),
        new Promise<void>(resolve => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('Firestore createApp failed, using local cache:', err);
    }
  }

  return newApp;
}

export async function deleteApp(appId: string, userId: string): Promise<void> {
  const existing = getStoredApps();
  const updated = existing.filter(a => a.id !== appId);
  saveStoredApps(updated);

  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await Promise.race([
        deleteDoc(doc(db, 'apps', appId)),
        new Promise<void>(resolve => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('Firestore deleteApp failed:', err);
    }
  }
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

  const apps = getStoredApps();
  const index = apps.findIndex(a => a.id === appId);
  if (index !== -1) {
    apps[index].environments = updatedEnvironments;
    apps[index].updatedAt = Date.now();
    saveStoredApps(apps);
  }

  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await Promise.race([
        updateDoc(doc(db, 'apps', appId), {
          environments: updatedEnvironments,
          updatedAt: Date.now(),
        }),
        new Promise<void>(resolve => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('Firestore addEnvironment failed, updated local cache:', err);
    }
  }

  return newEnv;
}
