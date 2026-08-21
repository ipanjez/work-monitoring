/**
 * Global Real-Time Sync Version Tracker
 * Keeps ultra-fast in-memory and database timestamps for seamless, zero-lag cross-device sync.
 */

// Global in-memory cache
let globalTaskVersion = Date.now();
let globalSettingsVersion = Date.now();

export function getSyncState() {
  return {
    taskVersion: globalTaskVersion,
    settingsVersion: globalSettingsVersion,
    timestamp: Date.now(),
  };
}

export function bumpTaskSyncVersion() {
  globalTaskVersion = Date.now();
  return globalTaskVersion;
}

export function bumpSettingsSyncVersion() {
  globalSettingsVersion = Date.now();
  return globalSettingsVersion;
}
