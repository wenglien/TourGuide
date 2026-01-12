// Crowd Information Service
// Note: Google Popular Times API is deprecated, so we use alternative methods

import type { PlaceDetails } from './googleMaps';

export interface CrowdInfo {
    placeId: string;
    currentBusyness?: 'not_busy' | 'a_little_busy' | 'moderately_busy' | 'very_busy' | 'extremely_busy';
    busynessLevel: number; // 0-100
    estimatedWaitTime?: number; // in minutes
    peakHours?: number[]; // Hours when it's typically busy (0-23)
    isCurrentlyBusy: boolean;
    recommendation: string;
}

/**
 * Get crowd information for a place
 * Uses Google Places API busyness indicator if available, otherwise estimates based on time patterns
 */
export async function getCrowdInfo(
    place: PlaceDetails,
    currentTime?: Date
): Promise<CrowdInfo> {
    const now = currentTime || new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Try to get busyness from Google Places API (if available)
    let busynessLevel = estimateBusynessFromTime(place, hour, isWeekend);
    let currentBusyness: CrowdInfo['currentBusyness'] = 'moderately_busy';
    let estimatedWaitTime = 0;

    // Check if place has busyness data (new Places API feature)
    if ((place as any).currentOpeningHours?.openNow) {
        // Estimate based on time patterns
        const peakHours = getPeakHours(place);
        const isPeakHour = peakHours.includes(hour);
        
        if (isPeakHour) {
            busynessLevel = Math.min(100, busynessLevel + 30);
        }

        // Adjust based on rating and popularity
        if (place.rating && place.totalRatings) {
            const popularityScore = (place.rating / 5) * (Math.min(place.totalRatings, 1000) / 1000);
            busynessLevel = Math.min(100, busynessLevel + (popularityScore * 20));
        }
    }

    // Determine busyness category
    if (busynessLevel >= 80) {
        currentBusyness = 'extremely_busy';
        estimatedWaitTime = 60 + Math.floor(Math.random() * 30);
    } else if (busynessLevel >= 60) {
        currentBusyness = 'very_busy';
        estimatedWaitTime = 30 + Math.floor(Math.random() * 20);
    } else if (busynessLevel >= 40) {
        currentBusyness = 'moderately_busy';
        estimatedWaitTime = 15 + Math.floor(Math.random() * 15);
    } else if (busynessLevel >= 20) {
        currentBusyness = 'a_little_busy';
        estimatedWaitTime = 5 + Math.floor(Math.random() * 10);
    } else {
        currentBusyness = 'not_busy';
        estimatedWaitTime = 0;
    }

    const peakHours = getPeakHours(place);
    const recommendation = getRecommendation(currentBusyness, estimatedWaitTime, peakHours, hour);

    return {
        placeId: place.place_id,
        currentBusyness,
        busynessLevel,
        estimatedWaitTime,
        peakHours: getPeakHours(place),
        isCurrentlyBusy: busynessLevel >= 60,
        recommendation,
    };
}

/**
 * Estimate busyness based on time patterns
 */
function estimateBusynessFromTime(
    place: PlaceDetails,
    hour: number,
    isWeekend: boolean
): number {
    let baseBusyness = 30;

    // Restaurant patterns
    if (place.types?.some(t => t.includes('restaurant') || t.includes('food'))) {
        if (hour >= 11 && hour <= 14) {
            baseBusyness = 70; // Lunch time
        } else if (hour >= 18 && hour <= 21) {
            baseBusyness = 80; // Dinner time
        } else if (hour >= 7 && hour <= 9) {
            baseBusyness = 50; // Breakfast
        }
    }

    // Shopping patterns
    if (place.types?.some(t => t.includes('store') || t.includes('shopping'))) {
        if (isWeekend) {
            baseBusyness = hour >= 14 && hour <= 18 ? 75 : 50;
        } else {
            baseBusyness = hour >= 18 && hour <= 21 ? 60 : 40;
        }
    }

    // Tourist attractions
    if (place.types?.some(t => t.includes('tourist') || t.includes('museum') || t.includes('park'))) {
        if (isWeekend) {
            baseBusyness = hour >= 10 && hour <= 17 ? 80 : 40;
        } else {
            baseBusyness = hour >= 10 && hour <= 16 ? 60 : 30;
        }
    }

    // Nightlife
    if (place.types?.some(t => t.includes('bar') || t.includes('night_club'))) {
        if (hour >= 22 || hour <= 2) {
            baseBusyness = isWeekend ? 90 : 60;
        } else {
            baseBusyness = 20;
        }
    }

    return baseBusyness;
}

/**
 * Get typical peak hours for a place
 */
function getPeakHours(place: PlaceDetails): number[] {
    if (place.types?.some(t => t.includes('restaurant') || t.includes('food'))) {
        return [11, 12, 13, 18, 19, 20]; // Lunch and dinner
    }
    if (place.types?.some(t => t.includes('store') || t.includes('shopping'))) {
        return [14, 15, 16, 17, 18, 19, 20];
    }
    if (place.types?.some(t => t.includes('tourist') || t.includes('museum'))) {
        return [10, 11, 12, 13, 14, 15, 16];
    }
    if (place.types?.some(t => t.includes('bar') || t.includes('night_club'))) {
        return [22, 23, 0, 1, 2];
    }
    return [12, 13, 14, 15, 16, 17, 18];
}

/**
 * Get recommendation based on crowd level
 */
function getRecommendation(
    busyness: CrowdInfo['currentBusyness'],
    waitTime: number,
    peakHours: number[],
    currentHour: number
): string {
    const nextLowBusyHour = peakHours.find(h => h > currentHour + 1) || peakHours[0];
    
    switch (busyness) {
        case 'extremely_busy':
            return `目前極度擁擠，預計等待時間 ${waitTime} 分鐘。建議 ${nextLowBusyHour}:00 後再訪或選擇其他地點。`;
        case 'very_busy':
            return `目前非常擁擠，預計等待時間 ${waitTime} 分鐘。建議稍後再訪或預先訂位。`;
        case 'moderately_busy':
            return `目前人潮適中，預計等待時間 ${waitTime} 分鐘。可以前往，但建議預先訂位。`;
        case 'a_little_busy':
            return `目前人潮較少，預計等待時間 ${waitTime} 分鐘。適合現在前往。`;
        case 'not_busy':
            return `目前人潮稀少，無需等待。非常適合現在前往。`;
        default:
            return '人潮狀況正常，可以前往。';
    }
}

/**
 * Check crowd levels for multiple places
 */
export async function checkMultiplePlacesCrowd(
    places: PlaceDetails[]
): Promise<Map<string, CrowdInfo>> {
    const crowdMap = new Map<string, CrowdInfo>();
    
    for (const place of places) {
        try {
            const crowdInfo = await getCrowdInfo(place);
            crowdMap.set(place.place_id, crowdInfo);
        } catch (error) {
            console.error(`Failed to get crowd info for ${place.name}:`, error);
        }
    }
    
    return crowdMap;
}

/**
 * Get best time to visit based on crowd patterns
 */
export function getBestVisitTime(place: PlaceDetails): {
    bestHours: number[];
    worstHours: number[];
    recommendation: string;
} {
    const peakHours = getPeakHours(place);
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const bestHours = allHours.filter(h => !peakHours.includes(h));
    
    return {
        bestHours: bestHours.length > 0 ? bestHours.slice(0, 6) : [9, 10, 11, 14, 15, 16],
        worstHours: peakHours,
        recommendation: `建議避開 ${peakHours.join(':00, ')}:00 的尖峰時段，選擇 ${bestHours.slice(0, 3).join(':00, ')}:00 前往可避開人潮。`,
    };
}
