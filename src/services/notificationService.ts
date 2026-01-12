// Push Notification Service
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { saveNotificationToken } from './dbService';

// VAPID key from Firebase Console > Project Settings > Cloud Messaging
const VAPID_KEY = 'TYpodGrXmOO5520lhyPnb-3RkZ3YVNCk_lAcGPXmjIk';

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
    try {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return null;
        }

        if (!messaging) {
            console.log('Firebase Messaging is not available');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Get FCM token
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        
        if (token) {
            // Save token to database
            try {
                await saveNotificationToken(userId, token);
                console.log('FCM token saved:', token);
            } catch (saveError) {
                console.error('Error saving notification token:', saveError);
                // Continue even if save fails
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
export function setupForegroundMessageHandler() {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
        console.log('Message received:', payload);
        
        // Show notification
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
        // This would typically be done on the backend
        // For now, we'll use a client-side approach with setTimeout (not ideal for production)
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

/**
 * Check if notifications are supported and enabled
 */
export function isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Check current notification permission
 */
export function getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}
