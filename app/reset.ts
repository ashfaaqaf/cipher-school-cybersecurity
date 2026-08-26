/** Every device-local Cipher School record. Keep this list beside its test. */
export const CIPHER_STORAGE_KEYS = [
  'cipher-school-progress',
  'cipher-school-srs',
  'cipher-school-theme',
  'cipher-school-voice',
  'cipher-school-plan',
  'cipher-school-practised',
  'cipher-school-academy',
  'cipher-school-accessibility',
] as const;

export type RemovableStorage = Pick<Storage, 'removeItem'>;

/** Clear only this app's records: never unrelated data belonging to the browser. */
export function clearCipherSchoolStorage(storage: RemovableStorage): void {
  for (const key of CIPHER_STORAGE_KEYS) storage.removeItem(key);
}
