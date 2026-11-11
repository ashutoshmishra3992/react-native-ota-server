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
      
      const querySnap = await Promise.race([
        getDocs(query(q, ...constraints)),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000)),
      ]);
      if (querySnap && 'docs' in querySnap) {
        const remoteReleases = querySnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as ReleaseModel));
        const mergedMap = new Map<string, ReleaseModel>();
        localList.forEach(r => mergedMap.set(r.id, r));
        remoteReleases.forEach((r: ReleaseModel) => mergedMap.set(r.id, r));
        const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
        saveStoredReleases(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Firestore fetchReleases failed, using local storage:', err);
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
      } catch (err) {
        console.warn('Firebase Storage upload failed, using simulated storage URL:', err);
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

  const existing = getStoredReleases();
  const updated = [newRelease, ...existing.filter(r => r.id !== releaseId)];
  saveStoredReleases(updated);
  onProgress?.(100);

  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await Promise.race([
        setDoc(doc(db, 'releases', releaseId), newRelease),
        new Promise<void>(resolve => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('Firestore createRelease failed, saved to local cache:', err);
    }
  }

  return newRelease;
}

export async function updateRelease(
  releaseId: string,
  updates: Partial<ReleaseModel>
): Promise<void> {
  const releases = getStoredReleases();
  const index = releases.findIndex(r => r.id === releaseId);
  if (index !== -1) {
    releases[index] = { ...releases[index], ...updates, updatedAt: Date.now() };
    saveStoredReleases(releases);
  }

  if (isFirebaseConfigured && db) {
    try {
      await Promise.race([
        updateDoc(doc(db, 'releases', releaseId), {
          ...updates,
          updatedAt: Date.now(),
        }),
        new Promise<void>(resolve => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('Firestore updateRelease failed, updated local cache:', err);
    }
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
