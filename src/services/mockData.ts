import { AppModel, ReleaseModel, UserApiKey } from '../types';

export function getStoredApps(): AppModel[] {
  const data = localStorage.getItem('airota_apps');
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStoredApps(apps: AppModel[]): void {
  localStorage.setItem('airota_apps', JSON.stringify(apps));
}

export function getStoredReleases(): ReleaseModel[] {
  const data = localStorage.getItem('airota_releases');
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStoredReleases(releases: ReleaseModel[]): void {
  localStorage.setItem('airota_releases', JSON.stringify(releases));
}

export function getStoredApiKeys(): UserApiKey[] {
  const data = localStorage.getItem('airota_api_keys');
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveStoredApiKeys(keys: UserApiKey[]): void {
  localStorage.setItem('airota_api_keys', JSON.stringify(keys));
}
