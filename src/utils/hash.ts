/**
 * Computes the SHA-256 checksum of a File or ArrayBuffer using the browser's Web Crypto API
 */
export async function computeFileHash(file: File | ArrayBuffer): Promise<string> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates random deployment key or API key
 */
export function generateRandomKey(prefix: string = 'key'): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const randomHex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${randomHex}`;
}
