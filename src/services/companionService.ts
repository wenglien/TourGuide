import type { GeneratedItinerary, UserPreferences } from '../types';
import { regenerateSlot, replacePlaceInTrail, getAITrail } from './aiItineraryService';
import { checkMultiplePlacesCrowd } from './crowdService';
import type { PlaceDetails } from './googleMaps';

export interface CompanionNotification {
    id: string;
    type: 'weather' | 'crowd' | 'closure';
    title: string;
    message: string;
    actionLabel: string;
    onAction: () => Promise<void>;
}

export class CompanionService {
    private static instance: CompanionService;
    private listeners: ((notification: CompanionNotification) => void)[] = [];

    private constructor() { }

    static getInstance() {
        if (!CompanionService.instance) {
            CompanionService.instance = new CompanionService();
        }
        return CompanionService.instance;
    }

    subscribe(callback: (notification: CompanionNotification) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private notify(notification: CompanionNotification) {
        this.listeners.forEach(l => l(notification));
    }

    // Simulate a weather change (Rain)
    simulateRain(
        itinerary: GeneratedItinerary,
        preferences: UserPreferences,
        location: { lat: number; lng: number },
        onUpdate: (newItinerary: GeneratedItinerary) => void
    ) {
        const notification: CompanionNotification = {
            id: `weather_${Date.now()}`,
            type: 'weather',
            title: '天氣警報：即將下雨',
            message: '偵測到未來一小時內將有降雨。建議將下午的戶外行程更換為室內活動。',
            actionLabel: '更換為室內行程',
            onAction: async () => {
                const newItinerary = await regenerateSlot(itinerary, 'afternoon', preferences, location);
                onUpdate(newItinerary);
            }
        };
        this.notify(notification);
    }

    // Check real-time crowd information
    async checkCrowdLevels(
        itinerary: GeneratedItinerary,
        preferences: UserPreferences,
        location: { lat: number; lng: number },
        onUpdate: () => void
    ) {
        const timeSlots: Array<'morning' | 'afternoon' | 'evening' | 'night'> = ['morning', 'afternoon', 'evening', 'night'];
        const allPlaces: PlaceDetails[] = [];

        // Collect all places from itinerary
        timeSlots.forEach(slot => {
            const trailScore = itinerary[slot];
            if (trailScore) {
                const trail = getAITrail(trailScore.trailId);
                if (trail?.places) {
                    allPlaces.push(...trail.places);
                }
            }
        });

        if (allPlaces.length === 0) return;

        // Check crowd levels for all places
        const crowdMap = await checkMultiplePlacesCrowd(allPlaces);

        // Notify about busy places
        crowdMap.forEach((crowdInfo, placeId) => {
            if (crowdInfo.isCurrentlyBusy) {
                const place = allPlaces.find(p => p.place_id === placeId);
                if (place) {
                    const trail = allPlaces.find(p => p.place_id === placeId) 
                        ? (() => {
                            for (const slot of timeSlots) {
                                const trailScore = itinerary[slot];
                                if (trailScore) {
                                    const t = getAITrail(trailScore.trailId);
                                    if (t?.places?.some((p: any) => p.place_id === placeId)) {
                                        return t;
                                    }
                                }
                            }
                            return null;
                        })() : null;

                    if (trail) {
                        const notification: CompanionNotification = {
                            id: `crowd_${placeId}_${Date.now()}`,
                            type: 'crowd',
                            title: `人潮預警：${place.name}`,
                            message: crowdInfo.recommendation,
                            actionLabel: '尋找替代地點',
                            onAction: async () => {
                                await replacePlaceInTrail(trail.id, placeId, preferences, location);
                                onUpdate();
                            }
                        };
                        this.notify(notification);
                    }
                }
            }
        });
    }

    // Start monitoring crowd levels periodically
    startCrowdMonitoring(
        itinerary: GeneratedItinerary,
        preferences: UserPreferences,
        location: { lat: number; lng: number },
        onUpdate: () => void,
        intervalMinutes: number = 15
    ): () => void {
        // Check immediately
        this.checkCrowdLevels(itinerary, preferences, location, onUpdate);

        // Then check periodically
        const interval = setInterval(() => {
            this.checkCrowdLevels(itinerary, preferences, location, onUpdate);
        }, intervalMinutes * 60 * 1000);

        // Return cleanup function
        return () => clearInterval(interval);
    }

    // Simulate a crowd alert (kept for backward compatibility)
    simulateCrowd(
        trailId: string,
        placeId: string,
        placeName: string,
        preferences: UserPreferences,
        location: { lat: number; lng: number },
        onUpdate: () => void
    ) {
        const notification: CompanionNotification = {
            id: `crowd_${Date.now()}`,
            type: 'crowd',
            title: '人潮擁擠預警',
            message: `${placeName} 目前人潮異常擁擠，預計排隊時間超過 1 小時。建議現在更換地點或稍後再訪。`,
            actionLabel: '尋找替代地點',
            onAction: async () => {
                await replacePlaceInTrail(trailId, placeId, preferences, location);
                onUpdate();
            }
        };
        this.notify(notification);
    }
}
