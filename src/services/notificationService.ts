// Push Notification Service
import { getMessagingInstance } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { saveNotificationToken } from './dbService';

// Web Push public key from Firebase Console → Project settings → Cloud Messaging.
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
    try {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return null;
        }

        if (!VAPID_KEY) {
            console.log('VITE_FIREBASE_VAPID_KEY is not set; push notifications are disabled');
            return null;
        }

        const messaging = await getMessagingInstance();
        if (!messaging) {
            console.log('Firebase Messaging is not available');
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
            try {
                await saveNotificationToken(userId, token);
            } catch (saveError) {
                console.error('Error saving notification token:', saveError);
            }
            return token;
        } else {
            console.log('No registration token available');
            return null;
        }
    } catch (error) {
        console.error('Error getting notification token:', error);
        return null;
    }
}

/**
 * Listen for foreground messages
 */
export async function setupForegroundMessageHandler() {
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    onMessage(messaging, (payload) => {
        console.log('Message received:', payload);

        if (payload.notification) {
            const notificationTitle = payload.notification.title || 'TourGuide';
            const notificationOptions: NotificationOptions = {
                body: payload.notification.body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: (payload as any).notification?.tag,
                requireInteraction: false,
            };

            if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
                navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(notificationTitle, notificationOptions);
                });
            } else {
                new Notification(notificationTitle, notificationOptions);
            }
        }
    });
}

/**
 * Schedule itinerary reminder notification
 */
export async function scheduleItineraryReminder(
    _userId: string,
    itineraryId: string,
    city: string,
    date: string,
    reminderTime: Date
): Promise<void> {
    try {
        const now = new Date();
        const delay = reminderTime.getTime() - now.getTime();

        if (delay > 0) {
            setTimeout(() => {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('行程提醒', {
                        body: `您的 ${city} 行程將於 ${date} 開始，記得準備出發！`,
                        icon: '/icon-192.png',
                        tag: `itinerary-${itineraryId}`,
                    });
                }
            }, delay);
        }
    } catch (error) {
        console.error('Error scheduling reminder:', error);
    }
}

export function isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}
