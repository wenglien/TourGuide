import { getDistanceMatrix } from './googleMaps';
import type { PlaceDetails } from './googleMaps';

export interface TransportOption {
    mode: 'Uber' | 'Public' | 'Walking';
    cost: number;
    duration: number;
    distance: number;
}

export interface BudgetBreakdown {
    transport: TransportOption[];
    activities: {
        name: string;
        cost: number;
        bookingUrl?: string;
        hasCoupon: boolean;
        couponCode?: string;
    }[];
    totalMin: number;
    totalMax: number;
}

export class BudgetService {
    private static instance: BudgetService;

    private constructor() { }

    static getInstance() {
        if (!BudgetService.instance) {
            BudgetService.instance = new BudgetService();
        }
        return BudgetService.instance;
    }

    async calculateTransportCosts(
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number }
    ): Promise<TransportOption[]> {
        const results: TransportOption[] = [];

        // 1. Uber (Driving)
        const driving = await getDistanceMatrix(origin, destination, 'DRIVING');
        if (driving) {
            // Estimate Uber cost: Base 80 + 25 per km
            const km = driving.distance / 1000;
            const cost = Math.round(80 + (km * 25));
            results.push({
                mode: 'Uber',
                cost,
                duration: Math.round(driving.duration / 60),
                distance: km
            });
        }

        // 2. Public Transit
        const transit = await getDistanceMatrix(origin, destination, 'TRANSIT');
        if (transit) {
            // Estimate Public cost: Flat 20-40
            results.push({
                mode: 'Public',
                cost: 25,
                duration: Math.round(transit.duration / 60),
                distance: transit.distance / 1000
            });
        }

        // 3. Walking
        const walking = await getDistanceMatrix(origin, destination, 'WALKING');
        if (walking) {
            results.push({
                mode: 'Walking',
                cost: 0,
                duration: Math.round(walking.duration / 60),
                distance: walking.distance / 1000
            });
        }

        // Fallback if API fails
        if (results.length === 0) {
            const dx = (destination.lng - origin.lng) * 111000 * Math.cos(origin.lat * Math.PI / 180);
            const dy = (destination.lat - origin.lat) * 111000;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const km = distance / 1000;

            results.push({
                mode: 'Uber',
                cost: Math.round(80 + (km * 25)),
                duration: Math.round(km * 3 + 5), // 20km/h average
                distance: km
            });
            results.push({
                mode: 'Public',
                cost: 25,
                duration: Math.round(km * 5 + 10),
                distance: km
            });
        }

        return results;
    }

    getBookingInfo(place: PlaceDetails) {
        // Simulate booking URLs and coupons based on place type
        const isRestaurant = place.types.includes('restaurant') || place.types.includes('food');
        const isExhibition = place.types.includes('museum') || place.types.includes('art_gallery');

        let bookingUrl: string | undefined;
        let hasCoupon = false;
        let couponCode: string | undefined;

        if (isRestaurant) {
            // Priority 1: Use official website if it's already an inline link
            if (place.website && (place.website.includes('inline.app') || place.website.includes('inline.me'))) {
                bookingUrl = place.website;
            } else {
                // Priority 2: Use a search-based fallback that's more likely to find the correct booking page
                // Direct guessing like inline.app/booking/Name often fails (404)
                bookingUrl = `https://www.google.com/search?q=${encodeURIComponent(place.name + ' inline 訂位')}`;
            }
            hasCoupon = Math.random() > 0.5;
            if (hasCoupon) couponCode = 'FOODIE10';
        } else if (isExhibition) {
            bookingUrl = place.website || `https://www.klook.com/zh-TW/search?query=${encodeURIComponent(place.name)}`;
            hasCoupon = Math.random() > 0.7;
            if (hasCoupon) couponCode = 'KLOOKNEW';
        }

        return { bookingUrl, hasCoupon, couponCode };
    }

    getUberDeepLink(destination: { lat: number; lng: number }, name: string) {
        const baseUrl = 'https://m.uber.com/ul/';
        const params = new URLSearchParams({
            action: 'setPickup',
            pickup: 'my_location',
            'dropoff[latitude]': destination.lat.toString(),
            'dropoff[longitude]': destination.lng.toString(),
            'dropoff[nickname]': name
        });
        return `${baseUrl}?${params.toString()}`;
    }
}
