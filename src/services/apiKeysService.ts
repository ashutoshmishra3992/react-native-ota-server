import { UserApiKey } from '../types';
import { db, isFirebaseConfigured } from '../config/firebase';
import { getStoredApiKeys, saveStoredApiKeys } from './mockData';
import { generateRandomKey } from '../utils/hash';
import { collection, doc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';

export async function fetchApiKeys(userId: string): Promise<UserApiKey[]> {
  const localKeys = getStoredApiKeys().filter(k => k.userId === userId);
  if (isFirebaseConfigured && db && userId && !userId.startsWith('usr_')) {
    try {
      const q = query(collection(db, 'api_keys'), where('userId', '==', userId));
      const snap = await Promise.race([
        getDocs(q),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 3000)),
      ]);
      if (snap && 'docs' in snap) {
        const remoteKeys = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as UserApiKey));
        const mergedMap = new Map<string, UserApiKey>();
        localKeys.forEach(k => mergedMap.set(k.id, k));
        remoteKeys.forEach((k: UserApiKey) => mergedMap.set(k.id, k));
        const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
        saveStoredApiKeys(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Firestore fetchApiKeys failed, checking local storage:', err);
    }
  }
  return localKeys;
}

export async function createApiKey(name: string, userId: string): Promise<UserApiKey> {
  if (!userId) throw new Error('Authentication required to create API keys.');

  const keySecret = generateRandomKey('ota_live_sec');
  const keyRecord: UserApiKey = {
    id: keySecret,
    name: name || 'API Deployment Key',
    key: keySecret,
    userId,
    status: 'active',
    createdAt: Date.now(),
  };

  const existing = getStoredApiKeys();
  const updated = [keyRecord, ...existing.filter(k => k.id !== keySecret)];
  saveStoredApiKeys(updated);

  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await Promise.race([
        setDoc(doc(db, 'api_keys', keySecret), keyRecord),
        new Promise<void>(resolve => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('Firestore createApiKey failed, saved to local cache:', err);
    }
  }

  return keyRecord;
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const existing = getStoredApiKeys();
  const updated = existing.map(k => (k.id === keyId ? { ...k, status: 'revoked' as const } : k));
  saveStoredApiKeys(updated);

  if (isFirebaseConfigured && db) {
    try {
      await Promise.race([
        updateDoc(doc(db, 'api_keys', keyId), { status: 'revoked' }),
        new Promise<void>(resolve => setTimeout(resolve, 2500)),
      ]);
    } catch (err) {
      console.warn('Firestore revokeApiKey failed:', err);
    }
  }
}
