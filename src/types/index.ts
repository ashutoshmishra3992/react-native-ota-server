export type TargetPlatform = 'android' | 'ios' | 'universal';

export interface AppEnvironment {
  id: string;
  name: string;
  suffix: string;
  computedPackageName: string;
  deploymentKey: string;
}

export interface AppModel {
  id: string;
  name: string;
  basePackageName: string;
  platforms: TargetPlatform[];
  environments: AppEnvironment[];
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export type ReleaseStatus = 'active' | 'disabled' | 'rolled_back';

export interface ReleaseModel {
  id: string;
  appId: string;
  environmentId: string;
  platform: TargetPlatform;
  targetAppVersion: string; // e.g. "1.0.0" or "^1.0.0"
  releaseNotes: string;
  isMandatory: boolean;
  rolloutPercentage: number; // 1-100
  status: ReleaseStatus;
  
  bundleFileName: string;
  bundleUrl: string;
  bundleStoragePath?: string;
  bundleHash: string; // SHA-256
  bundleSize: number; // in bytes
  
  createdBy: string;
  createdAt: number;
  updatedAt?: number;
  downloadCount: number;
}

export interface UserApiKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  status: 'active' | 'revoked';
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface UpdateCheckResponse {
  isAvailable: boolean;
  updateId?: string;
  downloadUrl?: string;
  bundleHash?: string;
  bundleSize?: number;
  isMandatory?: boolean;
  targetAppVersion?: string;
  releaseNotes?: string;
  fileName?: string;
  createdAt?: number;
  message?: string;
}
