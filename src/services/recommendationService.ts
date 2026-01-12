// Personalization and Recommendation Service
import { getUserItineraries, getUserCheckIns, type CheckIn } from './dbService';
import type { UserPreferences, PreferenceCategory } from '../types';

export interface UserProfile {
    userId: string;
    preferredCategories: Map<PreferenceCategory, number>; // Category -> frequency
    preferredCities: Map<string, number>; // City -> visit count
    preferredPace: Map<'relaxed' | 'moderate' | 'packed', number>;
    preferredWalkingLevel: Map<'low' | 'medium' | 'high', number>;
    averageBudget: { min: number; max: number };
    favoritePlaceTypes: Map<string, number>; // Place type -> rating sum
    visitedPlaces: Set<string>; // place_ids
    totalTrips: number;
}

export interface PersonalizedRecommendation {
    categories: PreferenceCategory[];
    suggestedPace: 'relaxed' | 'moderate' | 'packed';
    suggestedWalkingLevel: 'low' | 'medium' | 'high';
    suggestedCity?: string;
    confidence: number; // 0-1
    reasoning: string;
}

/**
 * Build user profile from historical data
 */
export async function buildUserProfile(userId: string): Promise<UserProfile> {
    const [itineraries, checkIns] = await Promise.all([
        getUserItineraries(userId),
        getUserCheckIns(userId),
    ]);

    const profile: UserProfile = {
        userId,
        preferredCategories: new Map(),
        preferredCities: new Map(),
        preferredPace: new Map(),
        preferredWalkingLevel: new Map(),
        averageBudget: { min: 0, max: 0 },
        favoritePlaceTypes: new Map(),
        visitedPlaces: new Set(),
        totalTrips: itineraries.length,
    };

    // Analyze itineraries
    let totalBudgetMin = 0;
    let totalBudgetMax = 0;
    let budgetCount = 0;

    itineraries.forEach((itinerary: any) => {
        // Categories
        if (itinerary.preferences?.categories) {
            itinerary.preferences.categories.forEach((cat: PreferenceCategory) => {
                profile.preferredCategories.set(
                    cat,
                    (profile.preferredCategories.get(cat) || 0) + 1
                );
            });
        }

        // Cities
        if (itinerary.city) {
            profile.preferredCities.set(
                itinerary.city,
                (profile.preferredCities.get(itinerary.city) || 0) + 1
            );
        }

        // Pace
        if (itinerary.preferences?.pace) {
            profile.preferredPace.set(
                itinerary.preferences.pace,
                (profile.preferredPace.get(itinerary.preferences.pace) || 0) + 1
            );
        }

        // Walking level
        if (itinerary.preferences?.maxWalkingLevel) {
            profile.preferredWalkingLevel.set(
                itinerary.preferences.maxWalkingLevel,
                (profile.preferredWalkingLevel.get(itinerary.preferences.maxWalkingLevel) || 0) + 1
            );
        }

        // Budget (if available)
        if (itinerary.trail) {
            const timeSlots = ['morning', 'afternoon', 'evening', 'night'];
            timeSlots.forEach(slot => {
                const trailScore = itinerary.trail[slot];
                if (trailScore) {
                    // Estimate budget from trail data if available
                    const trail = (window as any).__aiTrails?.[trailScore.trailId];
                    if (trail?.budgetRange) {
                        totalBudgetMin += trail.budgetRange.min || 0;
                        totalBudgetMax += trail.budgetRange.max || 0;
                        budgetCount++;
                    }
                }
            });
        }
    });

    // Analyze check-ins
    checkIns.forEach((checkInData: any) => {
        const checkIn = checkInData as CheckIn;
        if (checkIn.placeName) {
            profile.visitedPlaces.add(checkIn.placeName);
        }

        // Track favorite place types by rating
        // This would need place type info from the check-in
    });

    // Calculate average budget
    if (budgetCount > 0) {
        profile.averageBudget = {
            min: Math.round(totalBudgetMin / budgetCount),
            max: Math.round(totalBudgetMax / budgetCount),
        };
    }

    return profile;
}

/**
 * Get personalized recommendations based on user profile
 */
export async function getPersonalizedRecommendations(
    userId: string,
    currentPreferences?: Partial<UserPreferences>
): Promise<PersonalizedRecommendation> {
    const profile = await buildUserProfile(userId);

    // If user has no history, return default recommendations
    if (profile.totalTrips === 0) {
        return {
            categories: currentPreferences?.categories || ['food', 'culture'],
            suggestedPace: currentPreferences?.pace || 'moderate',
            suggestedWalkingLevel: currentPreferences?.maxWalkingLevel || 'medium',
            confidence: 0.3,
            reasoning: '您是新用戶，我們根據一般偏好為您推薦。使用越多，推薦會越準確！',
        };
    }

    // Get top 3 preferred categories
    const sortedCategories = Array.from(profile.preferredCategories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

    // Get most preferred pace
    const sortedPace = Array.from(profile.preferredPace.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'moderate';

    // Get most preferred walking level
    const sortedWalking = Array.from(profile.preferredWalkingLevel.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';

    // Get most visited city
    const sortedCities = Array.from(profile.preferredCities.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Calculate confidence based on data points
    const dataPoints = profile.totalTrips + profile.visitedPlaces.size;
    const confidence = Math.min(0.95, 0.3 + (dataPoints * 0.05));

    // Build reasoning
    const reasoningParts: string[] = [];
    if (sortedCategories.length > 0) {
        reasoningParts.push(`根據您的 ${profile.totalTrips} 次行程記錄，您最常選擇「${sortedCategories.join('、')}」類型的活動`);
    }
    if (sortedPace) {
        reasoningParts.push(`偏好「${sortedPace === 'relaxed' ? '悠閒' : sortedPace === 'moderate' ? '中等' : '緊湊'}」的行程步調`);
    }
    if (sortedCities) {
        reasoningParts.push(`最常前往「${sortedCities}」`);
    }

    const reasoning = reasoningParts.length > 0
        ? reasoningParts.join('，') + '。'
        : '根據您的使用習慣為您推薦。';

    return {
        categories: sortedCategories.length > 0 ? sortedCategories : (currentPreferences?.categories || ['food', 'culture']),
        suggestedPace: sortedPace as 'relaxed' | 'moderate' | 'packed',
        suggestedWalkingLevel: sortedWalking as 'low' | 'medium' | 'high',
        suggestedCity: sortedCities,
        confidence,
        reasoning,
    };
}

/**
 * Get recommended places based on user's favorite types
 */
export function getRecommendedPlaceTypes(profile: UserProfile): string[] {
    // This would need to analyze place types from check-ins and itineraries
    // For now, return common types based on preferred categories
    const categoryToTypes: Record<PreferenceCategory, string[]> = {
        food: ['restaurant', 'cafe', 'food'],
        walking: ['park', 'walking', 'hiking'],
        exhibition: ['museum', 'art_gallery', 'exhibition'],
        photography: ['viewpoint', 'park', 'landmark'],
        nightlife: ['bar', 'night_club', 'entertainment'],
        shopping: ['store', 'shopping_mall', 'market'],
        culture: ['temple', 'museum', 'historical_site'],
    };

    const topCategories = Array.from(profile.preferredCategories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

    const recommendedTypes: string[] = [];
    topCategories.forEach(cat => {
        recommendedTypes.push(...(categoryToTypes[cat] || []));
    });

    return [...new Set(recommendedTypes)];
}

/**
 * Check if user might like a place based on their profile
 */
export function predictUserPreference(
    profile: UserProfile,
    placeType: string,
    placeRating?: number
): { score: number; reasoning: string } {
    let score = 0.5; // Base score

    // Check if place type matches user's preferences
    const recommendedTypes = getRecommendedPlaceTypes(profile);
    if (recommendedTypes.some(type => placeType.includes(type))) {
        score += 0.3;
    }

    // Factor in rating
    if (placeRating) {
        score += (placeRating / 5) * 0.2;
    }

    // Check if user has visited similar places
    // (This would need more detailed place type tracking)

    const reasoning = score >= 0.7
        ? '這個地點符合您的偏好'
        : score >= 0.5
        ? '這個地點可能符合您的興趣'
        : '這個地點可能不太符合您的偏好';

    return { score, reasoning };
}
