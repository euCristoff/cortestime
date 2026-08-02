// Cortestime Notification Management Service
import { Appointment, Service } from '../types';

export const notificationService = {
  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  // Register Service Worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  },

  // Request browser permission for notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Notifications or Service Workers are not supported in this browser.');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.registerServiceWorker();
      }
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  },

  // Trigger a direct push notification via the Service Worker
  async triggerNotification(title: string, body: string, tag: string = 'cortestime-alert') {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      // Fallback to standard web notification if SW not ready
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192x192.png', badge: '/badge.png', tag });
      }
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/badge.png',
          tag,
          renotify: true
        } as NotificationOptions);
      } else if (registration && registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload: {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge.png',
            tag
          }
        });
      } else {
        // Fallback
        new Notification(title, { body, icon: '/icon-192x192.png', badge: '/badge.png', tag });
      }
    } catch (e) {
      console.error('Error sending notification via Service Worker:', e);
      new Notification(title, { body, icon: '/icon-192x192.png', badge: '/badge.png', tag });
    }
  },

  // Scan appointments and send alerts based on timing rules
  scanAndNotify(appointments: Appointment[], services: Service[]) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Get tomorrow's date string
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    appointments.forEach((app) => {
      // Only notify for scheduled/pending/completed/active appointments, skip cancelled
      if (app.status === 'cancelled') return;

      // Ensure the appointment date matches today
      if (app.date === todayStr) {
        const [hours, minutes] = app.time.split(':').map(Number);
        const appDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
        
        const diffMs = appDateTime.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        const s = services.find(serv => serv.id === app.serviceId);
        const serviceName = s ? s.name : 'Atendimento';

        // RULE 1: 30 minutes before appointment (Notify if 28 to 32 minutes away)
        if (diffMins >= 28 && diffMins <= 32) {
          const key30 = `notified-30min-${app.id}`;
          if (!localStorage.getItem(key30)) {
            this.triggerNotification(
              '⏰ Atendimento em breve',
              `${app.clientName} chega em 30 minutos para ${serviceName}.`,
              `30m-${app.id}`
            );
            localStorage.setItem(key30, 'true');
          }
        }

        // RULE 2: 5 minutes before appointment (Notify if 3 to 7 minutes away)
        if (diffMins >= 3 && diffMins <= 7) {
          const key5 = `notified-5min-${app.id}`;
          if (!localStorage.getItem(key5)) {
            this.triggerNotification(
              '✂️ Próximo cliente',
              `Prepare-se! ${app.clientName} chega às ${app.time} para ${serviceName}.`,
              `5m-${app.id}`
            );
            localStorage.setItem(key5, 'true');
          }
        }
      }
    });

    // RULE 3: Agenda for tomorrow (trigger once per day, e.g., after 18:00 or when loaded)
    const keyTomorrow = `notified-tomorrow-${todayStr}`;
    if (!localStorage.getItem(keyTomorrow)) {
      // Find tomorrow's appointments
      const tomorrowApps = appointments.filter(app => app.date === tomorrowStr && app.status !== 'cancelled');
      
      if (tomorrowApps.length > 0) {
        // Trigger notification
        this.triggerNotification(
          '📅 Agenda de amanhã',
          `Você tem ${tomorrowApps.length} ${tomorrowApps.length === 1 ? 'atendimento agendado' : 'atendimentos agendados'} para amanhã.`,
          `tomorrow-${todayStr}`
        );
        localStorage.setItem(keyTomorrow, 'true');
      }
    }
  },

  // Force trigger test simulations instantly
  simulateNotification(type: '30min' | '5min' | 'tomorrow', clientName: string = 'João Silva', time: string = '14:00', serviceName: string = 'Cabelo & Barba') {
    if (type === '30min') {
      this.triggerNotification(
        '⏰ Atendimento em breve',
        `${clientName} chega em 30 minutos para ${serviceName}.`,
        'test-30m'
      );
    } else if (type === '5min') {
      this.triggerNotification(
        '✂️ Próximo cliente',
        `Prepare-se! ${clientName} chega às ${time} para ${serviceName}.`,
        'test-5m'
      );
    } else if (type === 'tomorrow') {
      this.triggerNotification(
        '📅 Agenda de amanhã',
        `Você tem 6 atendimentos agendados para amanhã.`,
        'test-tomorrow'
      );
    }
  }
};
