/**
 * Cross-tab live synchronization using BroadcastChannel with storage event fallback.
 * Allows instant live updates between admin dashboard and open customer tabs.
 */

type SyncEventType = 'settings' | 'menu' | 'tables' | 'reviews';

const CHANNEL_NAME = 'euroshub_live_sync';

let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  channel = null;
}

export const broadcastSync = (type: SyncEventType) => {
  try {
    if (channel) {
      channel.postMessage({ type, timestamp: Date.now() });
    } else if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('euroshub_sync_trigger', `${type}_${Date.now()}`);
    }
  } catch (err) {
    console.debug('[Sync] Broadcast failed:', err);
  }
};

export const subscribeToSync = (callback: (type: SyncEventType) => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleMessage = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      callback(e.data.type as SyncEventType);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'euroshub_sync_trigger' && e.newValue) {
      const type = e.newValue.split('_')[0] as SyncEventType;
      callback(type);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
  };
};
