import { playAlertTone, playCashRegisterSound, playSuccessChime } from '../utils/sound';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'transaction' | 'balance' | 'security' | 'backup' | 'system';
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'telekhatta_notifications';

export class NotificationService {
  static getNotifications(): AppNotification[] {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        return perm;
      } catch {
        return 'denied';
      }
    }
    return 'denied';
  }

  static getPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  static notify(
    title: string,
    body: string,
    type: AppNotification['type'] = 'transaction',
    playSound = true
  ): AppNotification {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title,
      body,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    notifications.unshift(newNotif);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));

    // Audio chime
    if (playSound) {
      if (type === 'transaction') {
        playCashRegisterSound();
      } else if (type === 'balance' || type === 'security') {
        playAlertTone();
      } else {
        playSuccessChime();
      }
    }

    // Native browser push notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg'
        });
      } catch {
        // In iframe or sandboxed environment
      }
    }

    return newNotif;
  }

  static markAllAsRead(): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
  }

  static clearAll(): void {
    localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
  }
}
