/**
 * Real-Time Cross-Tab & Cross-Component Settings Synchronization Utility
 * Allows instant synchronization of settings (max upload size, app name, master data, etc.)
 * across all open browser tabs and active components without requiring page refreshes.
 */

const CHANNEL_NAME = 'dept_monitor_settings_channel';

export interface SettingsChangeEvent {
  key: string;
  value: any;
  timestamp: number;
}

let channel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!channel && 'BroadcastChannel' in window) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {
      console.warn('BroadcastChannel not supported or failed to initialize:', e);
    }
  }
  return channel;
}

/**
 * Broadcast a setting change to all open tabs and the current window
 */
export function broadcastSettingsChange(key: string, value: any) {
  if (typeof window === 'undefined') return;

  const payload: SettingsChangeEvent = {
    key,
    value,
    timestamp: Date.now()
  };

  // 1. Send to other tabs via BroadcastChannel
  const ch = getBroadcastChannel();
  if (ch) {
    try {
      ch.postMessage(payload);
    } catch (e) {
      console.warn('Failed to postMessage on BroadcastChannel:', e);
    }
  }

  // 2. Dispatch local custom event for current tab components
  try {
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: payload }));
    window.dispatchEvent(new Event('masterUpdated'));
  } catch (e) {
    // fallback
  }
}

/**
 * Subscribe to settings changes from other tabs and current window
 */
export function subscribeToSettingsChanges(
  onChanged: (event: SettingsChangeEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // 1. BroadcastChannel message handler
  const ch = getBroadcastChannel();
  const handleChannelMessage = (event: MessageEvent) => {
    if (event.data && typeof event.data === 'object' && event.data.key) {
      onChanged(event.data as SettingsChangeEvent);
    }
  };

  if (ch) {
    ch.addEventListener('message', handleChannelMessage);
  }

  // 2. Local custom event handler
  const handleLocalEvent = (e: Event) => {
    const customEvent = e as CustomEvent<SettingsChangeEvent>;
    if (customEvent.detail && customEvent.detail.key) {
      onChanged(customEvent.detail);
    }
  };

  window.addEventListener('settingsChanged', handleLocalEvent);

  // Return cleanup function
  return () => {
    if (ch) {
      ch.removeEventListener('message', handleChannelMessage);
    }
    window.removeEventListener('settingsChanged', handleLocalEvent);
  };
}
