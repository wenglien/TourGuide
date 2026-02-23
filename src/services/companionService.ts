import type { GeneratedItinerary, UserPreferences } from '../types';
import { regenerateSlot, replacePlaceInTrail, getAITrail } from './aiItineraryService';
import { checkMultiplePlacesCrowd } from './crowdService';
import { getCurrentWeatherByCoords, getWeatherByCoords } from './weatherService';
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

    /**
     * Check real weather using OpenWeatherMap API.
     * If it's currently raining or the forecast for the trip date shows rain,
     * triggers a notification so the user can switch to indoor alternatives.
     */
    async checkRealWeather(
        coordinates: { lat: number; lng: number },
        tripDate: string,
        itinerary: GeneratedItinerary,
        preferences: UserPreferences,
        onUpdate: (newItinerary: GeneratedItinerary) => void
    ): Promise<void> {
        try {
            // Check today's live weather first (for companion mode during the trip)
            const today = new Date().toISOString().split('T')[0];
            const isToday = tripDate === today;

            let weather = isToday
                ? await getCurrentWeatherByCoords(coordinates.lat, coordinates.lng)
                : await getWeatherByCoords(coordinates.lat, coordinates.lng, tripDate);

            if (!weather) return;

            if (weather.isRainy) {
                const notification: CompanionNotification = {
                    id: `weather_${Date.now()}`,
                    type: 'weather',
                    title: `天氣警報：${weather.description}`,
                    message: `目前氣溫 ${weather.temp}°C，${weather.description}（濕度 ${weather.humidity ?? '--'}%）。建議將下午的戶外行程更換為室內活動。`,
                    actionLabel: '更換為室內行程',
                    onAction: async () => {
                        const newItinerary = await regenerateSlot(itinerary, 'afternoon', preferences, coordinates);
                        onUpdate(newItinerary);
                    }
                };
                this.notify(notification);
            }
        } catch (error) {
            console.error('Failed to check real weather:', error);
        }
    }

    /**
     * Start periodic weather monitoring (every 30 minutes during a trip)
     */
    startWeatherMonitoring(
        coordinates: { lat: number; lng: number },
        tripDate: string,
        itinerary: GeneratedItinerary,
        preferences: UserPreferences,
        onUpdate: (newItinerary: GeneratedItinerary) => void,
        intervalMinutes: number = 30
    ): () => void {
        // Check immediately on start
        this.checkRealWeather(coordinates, tripDate, itinerary, preferences, onUpdate);

        const interval = setInterval(() => {
            this.checkRealWeather(coordinates, tripDate, itinerary, preferences, onUpdate);
        }, intervalMinutes * 60 * 1000);

        return () => clearInterval(interval);
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
                    const trail = (() => {
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
                    })();

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
        this.checkCrowdLevels(itinerary, preferences, location, onUpdate);

        const interval = setInterval(() => {
            this.checkCrowdLevels(itinerary, preferences, location, onUpdate);
        }, intervalMinutes * 60 * 1000);

        return () => clearInterval(interval);
    }

    // Kept for backward compatibility
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
