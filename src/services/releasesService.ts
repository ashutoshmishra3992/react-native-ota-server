import { ReleaseModel, TargetPlatform } from '../types';
import { db, storage, isFirebaseConfigured } from '../config/firebase';
import { getStoredReleases, saveStoredReleases } from './mockData';
import { computeFileHash } from '../utils/hash';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function fetchReleases(appId?: string, environmentId?: string): Promise<ReleaseModel[]> {
  let localList = getStoredReleases();
  if (appId) {
    localList = localList.filter(r => r.appId === appId);
  }
  if (environmentId) {
    localList = localList.filter(r => r.environmentId === environmentId);
  }

  if (isFirebaseConfigured && db) {
    try {
      let q = collection(db, 'releases');
      const constraints = [];
      if (appId) constraints.push(where('appId', '==', appId));
      if (environmentId) constraints.push(where('environmentId', '==', environmentId));
      
      const querySnap = await getDocs(query(q, ...constraints));
      const remoteReleases = querySnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ReleaseModel));
      const sorted = remoteReleases.sort((a, b) => b.createdAt - a.createdAt);

      if (!appId && !environmentId) {
        saveStoredReleases(sorted);
      }
      return sorted;
    } catch (err) {
      console.warn('Firestore fetchReleases failed, using local storage cache:', err);
    }
  }

  return localList.sort((a, b) => b.createdAt - a.createdAt);
}

export interface CreateReleaseInput {
  appId: string;
  environmentId: string;
  platform: TargetPlatform;
  targetAppVersion: string;
  releaseNotes: string;
  isMandatory: boolean;
  rolloutPercentage: number;
  file?: File;
  bundleFileName?: string;
  bundleUrl?: string;
  bundleHash?: string;
  bundleSize?: number;
}

export async function createRelease(
  input: CreateReleaseInput,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<ReleaseModel> {
  if (!userId) throw new Error('Authentication required to push releases.');

  const releaseId = `rel_${input.appId}_${Date.now().toString(36)}`;
  
  let fileName = input.bundleFileName || 'index.android.bundle';
  let bundleSize = input.bundleSize || 1024 * 1024 * 1.5;
  let bundleHash = input.bundleHash || 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0';
  let bundleUrl = input.bundleUrl || `https://storage.googleapis.com/airota-bundles/${input.appId}/${releaseId}/${fileName}`;
  let storagePath = `bundles/${input.appId}/${releaseId}/${fileName}`;

  if (input.file) {
    fileName = input.file.name;
    bundleSize = input.file.size;
    onProgress?.(20);
    bundleHash = await computeFileHash(input.file);
    onProgress?.(50);

    if (isFirebaseConfigured && storage) {
      try {
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, input.file);
        onProgress?.(85);
        bundleUrl = await getDownloadURL(fileRef);
      } catch (err: any) {
        console.error('Firebase Storage upload failed:', err);
        throw new Error(`Failed to upload bundle to Firebase Storage: ${err.message}`);
      }
    }
  }

  onProgress?.(95);

  const newRelease: ReleaseModel = {
    id: releaseId,
    appId: input.appId,
    environmentId: input.environmentId,
    platform: input.platform,
    targetAppVersion: input.targetAppVersion,
    releaseNotes: input.releaseNotes,
    isMandatory: input.isMandatory,
    rolloutPercentage: input.rolloutPercentage,
    status: 'active',
    bundleFileName: fileName,
    bundleUrl,
    bundleStoragePath: storagePath,
    bundleHash,
    bundleSize,
    downloadCount: 0,
    createdBy: userId,
    createdAt: Date.now(),
  };

  // Persist to Firestore first for authenticated users
  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await setDoc(doc(db, 'releases', releaseId), newRelease);
    } catch (err: any) {
      console.error('Firestore createRelease failed:', err);
      throw new Error(`Failed to save release to Firestore: ${err.message}`);
    }
  }

  const existing = getStoredReleases();
  const updated = [newRelease, ...existing.filter(r => r.id !== releaseId)];
  saveStoredReleases(updated);
  onProgress?.(100);

  return newRelease;
}

export async function updateRelease(
  releaseId: string,
  updates: Partial<ReleaseModel>
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'releases', releaseId), {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Firestore updateRelease error:', err);
      throw new Error(`Failed to update release in Firestore: ${err.message}`);
    }
  }

  const releases = getStoredReleases();
  const index = releases.findIndex(r => r.id === releaseId);
  if (index !== -1) {
    releases[index] = { ...releases[index], ...updates, updatedAt: Date.now() };
    saveStoredReleases(releases);
  }
}

export async function rollbackRelease(appId: string, releaseId: string): Promise<{
  rolledBackId: string;
  reactivatedId: string | null;
}> {
  const releases = await fetchReleases(appId);
  const target = releases.find(r => r.id === releaseId);
  if (!target) throw new Error('Release not found');

  await updateRelease(releaseId, { status: 'rolled_back' });

  const prevReleases = releases
    .filter(r => r.id !== releaseId && r.environmentId === target.environmentId && r.createdAt < target.createdAt)
    .sort((a, b) => b.createdAt - a.createdAt);

  let reactivatedId: string | null = null;
  if (prevReleases.length > 0) {
    const prev = prevReleases[0];
    await updateRelease(prev.id, { status: 'active' });
    reactivatedId = prev.id;
  }

  return { rolledBackId: releaseId, reactivatedId };
}
