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
      const snap = await getDocs(q);
      const remoteKeys = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as UserApiKey));
      const sorted = remoteKeys.sort((a, b) => b.createdAt - a.createdAt);
      saveStoredApiKeys(sorted);
      return sorted;
    } catch (err) {
      console.warn('Firestore fetchApiKeys failed, checking local storage cache:', err);
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

  // Persist to Firestore first for authenticated users
  if (isFirebaseConfigured && db && !userId.startsWith('usr_')) {
    try {
      await setDoc(doc(db, 'api_keys', keySecret), keyRecord);
    } catch (err: any) {
      console.error('Firestore createApiKey failed:', err);
      throw new Error(`Failed to save API key to Firestore: ${err.message}`);
    }
  }

  const existing = getStoredApiKeys();
  const updated = [keyRecord, ...existing.filter(k => k.id !== keySecret)];
  saveStoredApiKeys(updated);

  return keyRecord;
}

export async function revokeApiKey(keyId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'api_keys', keyId), { status: 'revoked' });
    } catch (err: any) {
      console.error('Firestore revokeApiKey failed:', err);
      throw new Error(`Failed to revoke API key in Firestore: ${err.message}`);
    }
  }

  const existing = getStoredApiKeys();
  const updated = existing.map(k => (k.id === keyId ? { ...k, status: 'revoked' as const } : k));
  saveStoredApiKeys(updated);
}
