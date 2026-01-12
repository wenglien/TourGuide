import type {
    UserPreferences,
    TimeOfDay,
    GeneratedItinerary,
    TrailScore,
    TravelPace,
} from '../types';
import { trails } from '../data/trails';
import { places } from '../data/places';
import { rankTrails, getRainAlternative, isRainFriendly } from './scoringEngine';

// Pace configuration: how many time slots to fill
const PACE_CONFIG: Record<TravelPace, TimeOfDay[]> = {
    relaxed: ['afternoon'],
    moderate: ['afternoon', 'evening'],
    packed: ['morning', 'afternoon', 'evening', 'night'],
};

/**
 * Generate itinerary based on user preferences
 */
export function generateItinerary(
    preferences: UserPreferences,
    isRainyDay: boolean = false
): GeneratedItinerary {
    const timeSlots = PACE_CONFIG[preferences.pace];
    const result: GeneratedItinerary = { alternatives: [] };

    // Filter trails by weather if needed
    // Note: trails array will be empty if using AI generation
    let availableTrails = [...trails];
    if (isRainyDay && availableTrails.length > 0) {
        availableTrails = trails.filter((trail) => {
            if (trail.theme === '雨天備案') return true;
            return isRainFriendly(trail, places);
        });
    }
    
    // If no trails available, return empty result
    if (availableTrails.length === 0) {
        return { alternatives: [] };
    }

    // Generate recommendations for each time slot
    timeSlots.forEach((timeSlot) => {
        const rankedTrails = rankTrails(availableTrails, preferences, timeSlot, places);

        if (rankedTrails.length > 0) {
            const bestTrail = rankedTrails[0];

            // Get rain alternative if available and it's a rainy day
            if (isRainyDay) {
                const originalTrail = trails.find((t) => t.id === bestTrail.trailId);
                if (originalTrail) {
                    const rainAlt = getRainAlternative(originalTrail, trails);
                    if (rainAlt) {
                        const rainScore: TrailScore = {
                            trailId: rainAlt.id,
                            totalScore: bestTrail.totalScore * 0.9, // Slightly lower score for alternative
                            breakdown: bestTrail.breakdown,
                        };
                        result[timeSlot] = rainScore;
                    } else {
                        result[timeSlot] = bestTrail;
                    }
                }
            } else {
                result[timeSlot] = bestTrail;
            }

            // Store alternatives (next 2 best options)
            rankedTrails.slice(1, 3).forEach((alt) => {
                if (!result.alternatives.find((a) => a.trailId === alt.trailId)) {
                    result.alternatives.push(alt);
                }
            });

            // Remove used trail from pool to avoid duplicates
            availableTrails = availableTrails.filter(
                (t) => t.id !== bestTrail.trailId
            );
        }
    });

    return result;
}

/**
 * Adjust itinerary based on user modifications
 */
export function adjustItinerary(
    itinerary: GeneratedItinerary,
    adjustments: {
        swapTimeSlot?: { from: TimeOfDay; to: TimeOfDay };
        replaceWithAlternative?: { timeSlot: TimeOfDay; alternativeId: string };
        toggleRainMode?: boolean;
    },
    preferences: UserPreferences
): GeneratedItinerary {
    const newItinerary = { ...itinerary };

    // Swap time slots
    if (adjustments.swapTimeSlot) {
        const { from, to } = adjustments.swapTimeSlot;
        const temp = newItinerary[from];
        newItinerary[from] = newItinerary[to];
        newItinerary[to] = temp;
    }

    // Replace with alternative
    if (adjustments.replaceWithAlternative) {
        const { timeSlot, alternativeId } = adjustments.replaceWithAlternative;
        const alternative = newItinerary.alternatives.find(
            (a) => a.trailId === alternativeId
        );
        if (alternative) {
            const currentTrail = newItinerary[timeSlot];
            newItinerary[timeSlot] = alternative;
            if (currentTrail) {
                newItinerary.alternatives = [
                    currentTrail,
                    ...newItinerary.alternatives.filter((a) => a.trailId !== alternativeId),
                ];
            }
        }
    }

    // Toggle rain mode - regenerate with rain consideration
    if (adjustments.toggleRainMode) {
        return generateItinerary(preferences, true);
    }

    return newItinerary;
}

/**
 * Get recommended start times for each time slot
 */
export function getRecommendedStartTimes(pace: TravelPace): Record<TimeOfDay, string> {
    const startTimes: Record<TravelPace, Record<TimeOfDay, string>> = {
        relaxed: {
            morning: '10:00',
            afternoon: '14:00',
            evening: '17:00',
            night: '19:00',
        },
        moderate: {
            morning: '09:30',
            afternoon: '13:30',
            evening: '17:00',
            night: '19:30',
        },
        packed: {
            morning: '08:30',
            afternoon: '12:30',
            evening: '16:30',
            night: '19:00',
        },
    };

    return startTimes[pace];
}

/**
 * Estimate total itinerary duration
 */
export function estimateTotalDuration(itinerary: GeneratedItinerary): number {
    let totalMinutes = 0;
    const timeSlots: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

    timeSlots.forEach((slot) => {
        const trailScore = itinerary[slot];
        if (trailScore) {
            const trail = trails.find((t) => t.id === trailScore.trailId);
            if (trail) {
                totalMinutes += trail.totalTime;
            }
        }
    });

    return totalMinutes;
}

/**
 * Calculate total budget range for itinerary
 */
export function calculateBudgetRange(
    itinerary: GeneratedItinerary
): { min: number; max: number } {
    let minBudget = 0;
    let maxBudget = 0;
    const timeSlots: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

    timeSlots.forEach((slot) => {
        const trailScore = itinerary[slot];
        if (trailScore) {
            const trail = trails.find((t) => t.id === trailScore.trailId);
            if (trail) {
                minBudget += trail.budgetRange.min;
                maxBudget += trail.budgetRange.max;
            }
        }
    });

    return { min: minBudget, max: maxBudget };
}
