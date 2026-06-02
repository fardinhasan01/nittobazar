export interface AdminNotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
}

const STORAGE_KEY = 'ab-admin-notification-settings';

export const DEFAULT_NOTIFICATION_SETTINGS: AdminNotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
};

export function loadNotificationSettings(): AdminNotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export function saveNotificationSettings(settings: AdminNotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function getDeviceId(): string {
  const key = 'ab-admin-device-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}`;
    localStorage.setItem(key, id);
  }
  return id;
}
