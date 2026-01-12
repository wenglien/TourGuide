import type {
    Trail,
    Place,
    UserPreferences,
    TrailScore,
    ScoringWeights,
    TimeOfDay,
    WalkingLevel,
    PreferenceCategory,
} from '../types';
import { getPlacesByIds } from '../data/places';

// Default scoring weights
const DEFAULT_WEIGHTS: ScoringWeights = {
    preferenceMatch: 0.4,
    timeMatch: 0.25,
    walkingPenalty: 0.2,
    popularityPenalty: 0.15,
};

// Tag mapping for preference categories
const PREFERENCE_TAG_MAP: Record<PreferenceCategory, string[]> = {
    food: ['美食', '小吃', '咖啡', '餐廳', '夜市'],
    walking: ['散步', '巷弄', '老街', '綠蔭'],
    exhibition: ['展覽', '文創', '當代藝術', '設計'],
    photography: ['拍照', '攝影', '夜景', '建築'],
    nightlife: ['夜晚', '夜景', '夜市', '酒吧'],
    shopping: ['購物', '市集', '文創', '選品店'],
    culture: ['歷史', '寺廟', '文化', '老街'],
};

// Time of day mapping
const TIME_OF_DAY_MAP: Record<TimeOfDay, number> = {
    morning: 0,
    afternoon: 1,
    evening: 2,
    night: 3,
};

// Walking level penalties
const WALKING_PENALTY_MAP: Record<WalkingLevel, number> = {
    low: 0,
    medium: 20,
    high: 40,
};

/**
 * Calculate preference match score
 * Returns a score from 0-100 based on how well trail places match user preferences
 */
export function calculatePreferenceMatch(
    trail: Trail,
    preferences: UserPreferences,
    _places: Place[]
): number {
    if (preferences.categories.length === 0) return 50; // Neutral score if no preferences

    const trailPlaces = getPlacesByIds(trail.orderedPlaces);
    const preferredTags = preferences.categories.flatMap(
        (cat) => PREFERENCE_TAG_MAP[cat] || []
    );

    let totalMatches = 0;
    let totalPossible = 0;

    trailPlaces.forEach((place) => {
        const matchingTags = place.tags.filter((tag) =>
            preferredTags.some((prefTag) => tag.includes(prefTag) || prefTag.includes(tag))
        );
        totalMatches += matchingTags.length;
        totalPossible += preferredTags.length;
    });

    if (totalPossible === 0) return 50;
    return Math.min(100, (totalMatches / totalPossible) * 100 * 2);
}

/**
 * Calculate time match score
 * Returns a score from 0-100 based on how well trail matches target time
 */
export function calculateTimeMatch(
    trail: Trail,
    targetTime: TimeOfDay
): number {
    if (trail.timeTags.includes(targetTime)) {
        return 100;
    }

    // Partial match for adjacent time slots
    const targetIndex = TIME_OF_DAY_MAP[targetTime];
    const trailTimes = trail.timeTags.map((t) => TIME_OF_DAY_MAP[t]);

    const minDistance = Math.min(
        ...trailTimes.map((t) => Math.abs(t - targetIndex))
    );

    if (minDistance === 1) return 60;
    if (minDistance === 2) return 30;
    return 10;
}

/**
 * Calculate walking penalty score
 * Returns a penalty value based on trail walking level vs user preference
 */
export function calculateWalkingScore(
    trail: Trail,
    maxWalkingLevel?: WalkingLevel
): number {
    if (!maxWalkingLevel) return 100; // No preference

    const walkingOrder: WalkingLevel[] = ['low', 'medium', 'high'];
    const trailIndex = walkingOrder.indexOf(trail.walkingLevel);
    const maxIndex = walkingOrder.indexOf(maxWalkingLevel);

    if (trailIndex <= maxIndex) {
        return 100;
    }

    // Apply penalty for exceeding walking preference
    return 100 - WALKING_PENALTY_MAP[trail.walkingLevel];
}

/**
 * Calculate popularity penalty
 * Penalizes overly popular trails to encourage diverse recommendations
 */
export function calculatePopularityScore(
    trail: Trail,
    _places: Place[]
): number {
    const trailPlaces = getPlacesByIds(trail.orderedPlaces);
    const avgPopularity =
        trailPlaces.reduce((sum, p) => sum + (p.popularityScore || 50), 0) /
        trailPlaces.length;

    // Penalize very popular trails (>80)
    if (avgPopularity > 80) {
        return 100 - (avgPopularity - 80);
    }
    return 100;
}

/**
 * Calculate total score for a trail
 */
export function scoreTrail(
    trail: Trail,
    preferences: UserPreferences,
    targetTime: TimeOfDay,
    places: Place[],
    weights: ScoringWeights = DEFAULT_WEIGHTS
): TrailScore {
    const preferenceMatch = calculatePreferenceMatch(trail, preferences, places);
    const timeMatch = calculateTimeMatch(trail, targetTime);
    const walkingScore = calculateWalkingScore(trail, preferences.maxWalkingLevel);
    const popularityScore = calculatePopularityScore(trail, places);

    const totalScore =
        preferenceMatch * weights.preferenceMatch +
        timeMatch * weights.timeMatch +
        walkingScore * weights.walkingPenalty +
        popularityScore * weights.popularityPenalty;

    return {
        trailId: trail.id,
        totalScore,
        breakdown: {
            preferenceMatch,
            timeMatch,
            walkingScore,
            popularityScore,
        },
    };
}

/**
 * Score multiple trails and return sorted by score
 */
export function rankTrails(
    trails: Trail[],
    preferences: UserPreferences,
    targetTime: TimeOfDay,
    places: Place[]
): TrailScore[] {
    return trails
        .map((trail) => scoreTrail(trail, preferences, targetTime, places))
        .sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Check if a trail is suitable for rain
 */
export function isRainFriendly(trail: Trail, _places: Place[]): boolean {
    const trailPlaces = getPlacesByIds(trail.orderedPlaces);
    return trailPlaces.every((place) => place.tags.includes('雨天可'));
}

/**
 * Get rain alternative for a trail
 */
export function getRainAlternative(
    trail: Trail,
    allTrails: Trail[]
): Trail | undefined {
    if (trail.rainAlternative) {
        return allTrails.find((t) => t.id === trail.rainAlternative);
    }
    return undefined;
}
