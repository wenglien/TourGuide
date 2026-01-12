// AI-Powered Itinerary Service combining Google Maps and Gemini AI
import type { UserPreferences, GeneratedItinerary, TrailScore, TimeOfDay, MultiDayItinerary, DayItinerary } from '../types';
import { searchPlaces, getPlaceDetails, geocodeCity, type PlaceDetails } from './googleMaps';
import { generateTrailRecommendations, analyzePlacesForRoute, type GeminiTrailRecommendation } from './geminiAI';

// Default location for Taipei (fallback)
const DEFAULT_LOCATION = { lat: 25.0330, lng: 121.5654 };

/**
 * Convert Gemini recommendation to Trail format
 */
function convertGeminiToTrail(
  recommendation: GeminiTrailRecommendation,
  placeDetails: PlaceDetails[]
): any {
  return {
    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: recommendation.title,
    theme: recommendation.theme,
    orderedPlaces: placeDetails.map(p => p.place_id),
    totalTime: recommendation.totalTime,
    walkingLevel: recommendation.walkingLevel,
    seasonTags: ['spring', 'summer', 'autumn', 'winter'],
    timeTags: recommendation.timeTags,
    budgetRange: {
      min: recommendation.budgetRange.min,
      max: recommendation.budgetRange.max,
      currency: 'TWD',
    },
    coverImage: placeDetails[0]?.photos?.[0] || '',
    description: recommendation.description,
    highlights: recommendation.highlights,
    places: placeDetails,
  };
}

/**
 * Generate AI-powered itinerary using Google Maps and Gemini AI
 */
export async function generateAIItinerary(
  preferences: UserPreferences,
  _isRainyDay: boolean = false,
  providedLocation?: { lat: number; lng: number },
  excludedPlaceIds: Set<string> = new Set()
): Promise<GeneratedItinerary> {
  try {
    // Step 1: Use provided location or geocode the city/address name to get coordinates
    let location = DEFAULT_LOCATION;
    if (providedLocation) {
      location = providedLocation;
    } else if (preferences.city && preferences.city.trim() !== '') {
      const geocodedLocation = await geocodeCity(preferences.city);
      if (geocodedLocation) {
        location = geocodedLocation;
      } else {
        console.warn(`Could not geocode city: ${preferences.city}, using default location`);
      }
    }

    // Step 2: Search for places based on user preferences
    const placeQueries = preferences.categories.map(category => {
      const categoryMap: Record<string, string> = {
        food: '餐廳 美食',
        walking: '公園 步道',
        exhibition: '展覽 美術館',
        photography: '觀景台 夜景',
        nightlife: '酒吧 夜生活',
        shopping: '購物 商店',
        culture: '古蹟 文化',
      };
      // Add city name to search query for better results
      const baseQuery = categoryMap[category] || category;
      return preferences.city ? `${preferences.city} ${baseQuery}` : baseQuery;
    });

    // Search for places with increased radius and more results
    const baseRadius = preferences.proximity === 'far' ? 15000 : 3000;
    const radius = excludedPlaceIds.size > 0 ? baseRadius * 1.5 : baseRadius; // Increase radius if we need to exclude places
    const allPlaces: PlaceDetails[] = [];
    const minPlacesNeeded = 10; // Minimum places needed for AI to generate good recommendations
    
    // Try to get more places per category
    for (const query of placeQueries) {
      const places = await searchPlaces(query, location, radius);
      const placesToCheck = excludedPlaceIds.size > 0 ? Math.min(places.length, 15) : 10; // Get more if we need to filter
      
      for (const place of places.slice(0, placesToCheck)) {
        // Skip if this place is already used
        if (excludedPlaceIds.has(place.place_id)) {
          continue;
        }
        
        const details = await getPlaceDetails(place.place_id);
        if (details) {
          // Double check: exclude if already in excluded list
          if (excludedPlaceIds.has(details.place_id)) {
            continue;
          }
          
          // Filter out places with rating < 4.0, but be more lenient if we don't have enough places
          const minRating = allPlaces.length < minPlacesNeeded ? 3.5 : 4.0;
          if (details.rating && details.rating < minRating) {
            continue;
          }
          
          allPlaces.push(details);
        }
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // If we still don't have enough places, try with relaxed criteria
    if (allPlaces.length < minPlacesNeeded && excludedPlaceIds.size > 0) {
      console.log(`Only found ${allPlaces.length} places, trying with relaxed criteria...`);
      
      // Try again with larger radius and lower rating threshold
      const relaxedRadius = baseRadius * 2;
      for (const query of placeQueries) {
        const places = await searchPlaces(query, location, relaxedRadius);
        for (const place of places.slice(0, 20)) {
          if (excludedPlaceIds.has(place.place_id)) {
            continue;
          }
          
          // Skip if already in our list
          if (allPlaces.some(p => p.place_id === place.place_id)) {
            continue;
          }
          
          const details = await getPlaceDetails(place.place_id);
          if (details && !excludedPlaceIds.has(details.place_id)) {
            // Accept places with rating >= 3.5
            if (!details.rating || details.rating >= 3.5) {
              allPlaces.push(details);
            }
          }
          
          if (allPlaces.length >= minPlacesNeeded * 2) {
            break;
          }
        }
        if (allPlaces.length >= minPlacesNeeded * 2) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Final check: if still not enough, allow some duplicates or lower rating
    if (allPlaces.length === 0) {
      // Last resort: try without excluding places (for single day itineraries)
      if (excludedPlaceIds.size > 0 && excludedPlaceIds.size < 20) {
        console.log('Trying without exclusion as last resort...');
        for (const query of placeQueries) {
          const places = await searchPlaces(query, location, baseRadius * 2);
          for (const place of places.slice(0, 10)) {
            const details = await getPlaceDetails(place.place_id);
            if (details && (!details.rating || details.rating >= 3.5)) {
              allPlaces.push(details);
              if (allPlaces.length >= 5) break;
            }
          }
          if (allPlaces.length >= 5) break;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      if (allPlaces.length === 0) {
        throw new Error('找不到符合條件的地點，請嘗試調整搜尋條件或選擇其他目的地');
      }
    }

    // Step 2: Use Gemini AI to generate trail recommendations
    const geminiPlaces = allPlaces.map(p => ({
      name: p.name,
      address: p.address,
      type: p.types[0] || 'unknown',
      rating: p.rating,
      location: p.location,
    }));

    const recommendations = await generateTrailRecommendations(
      preferences,
      geminiPlaces
    );

    if (recommendations.length === 0) {
      throw new Error('無法生成路線推薦');
    }

    // Step 3: Convert recommendations to trail format
    const result: GeneratedItinerary = { alternatives: [] };
    const timeSlots: TimeOfDay[] =
      preferences.pace === 'relaxed' ? ['afternoon'] :
        preferences.pace === 'moderate' ? ['afternoon', 'evening'] :
          ['morning', 'afternoon', 'evening', 'night'];

    // Track places used in this day to avoid duplicates within the same day
    const dayUsedPlaceIds = new Set<string>(excludedPlaceIds);

    // Match recommendations to time slots
    recommendations.slice(0, timeSlots.length).forEach((rec, index) => {
      if (index < timeSlots.length) {
        const timeSlot = timeSlots[index];

        // Find places for this recommendation, excluding already used ones
        const recPlaces = rec.places
          .map(p => {
            return allPlaces.find(ap =>
              (ap.name.includes(p.name) || p.name.includes(ap.name)) &&
              !dayUsedPlaceIds.has(ap.place_id)
            );
          })
          .filter(Boolean) as PlaceDetails[];

        if (recPlaces.length > 0) {
          const trail = convertGeminiToTrail(rec, recPlaces);

          // Mark these places as used
          recPlaces.forEach(p => {
            dayUsedPlaceIds.add(p.place_id);
          });

          const trailScore: TrailScore = {
            trailId: trail.id,
            totalScore: 85,
            breakdown: {
              preferenceMatch: 80,
              timeMatch: 90,
              walkingScore: 75,
              popularityScore: 85,
            },
          };

          // Store trail data temporarily (in a real app, you'd save this to a database)
          (window as any).__aiTrails = (window as any).__aiTrails || {};
          (window as any).__aiTrails[trail.id] = trail;

          result[timeSlot] = trailScore;
        }
      }
    });

    // Add alternatives
    recommendations.slice(timeSlots.length).forEach(rec => {
      const recPlaces = rec.places.map(p => {
        return allPlaces.find(ap =>
          ap.name.includes(p.name) || p.name.includes(ap.name)
        );
      }).filter(Boolean) as PlaceDetails[];

      if (recPlaces.length > 0) {
        const trail = convertGeminiToTrail(rec, recPlaces);
        (window as any).__aiTrails = (window as any).__aiTrails || {};
        (window as any).__aiTrails[trail.id] = trail;

        result.alternatives.push({
          trailId: trail.id,
          totalScore: 75,
          breakdown: {
            preferenceMatch: 70,
            timeMatch: 80,
            walkingScore: 70,
            popularityScore: 75,
          },
        });
      }
    });

    return result;
  } catch (error) {
    console.error('Error generating AI itinerary:', error);
    throw error;
  }
}

/**
 * Get AI trail by ID
 */
export function getAITrail(trailId: string): any | null {
  return (window as any).__aiTrails?.[trailId] || null;
}

/**
 * Analyze and optimize route order
 */
export async function optimizeRouteOrder(
  places: PlaceDetails[],
  preferences: {
    timeOfDay: string;
    walkingLevel: string;
    budget?: string;
  }
): Promise<{
  orderedPlaces: PlaceDetails[];
  estimatedTime: number;
  walkingDistance: number;
  recommendations: string;
}> {
  const geminiPlaces = places.map(p => ({
    name: p.name,
    address: p.address,
    type: p.types[0] || 'unknown',
    rating: p.rating,
    location: p.location,
  }));

  const analysis = await analyzePlacesForRoute(geminiPlaces, preferences);

  const orderedPlaces = analysis.suggestedOrder.map(index => places[index]).filter(Boolean);

  return {
    orderedPlaces,
    estimatedTime: analysis.estimatedTime,
    walkingDistance: analysis.walkingDistance,
    recommendations: analysis.recommendations,
  };
}

/**
 * Regenerate a specific slot in the itinerary
 */
export async function regenerateSlot(
  currentItinerary: GeneratedItinerary,
  timeSlot: TimeOfDay,
  preferences: UserPreferences,
  location: { lat: number; lng: number }
): Promise<GeneratedItinerary> {
  try {
    // Collect places already used in other time slots
    const usedPlaceIds = new Set<string>();
    const timeSlots: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
    timeSlots.forEach(slot => {
      if (slot !== timeSlot) {
        const trailScore = currentItinerary[slot];
        if (trailScore) {
          const trail = getAITrail(trailScore.trailId);
          if (trail?.places) {
            trail.places.forEach((p: any) => {
              if (p.place_id) {
                usedPlaceIds.add(p.place_id);
              }
            });
          }
        }
      }
    });

    // Step 1: Search for new places specifically for this slot's categories
    const categoryMap: Record<string, string> = {
      food: '餐廳 美食',
      walking: '公園 步道',
      exhibition: '展覽 美術館',
      photography: '觀景台 夜景',
      nightlife: '酒吧 夜生活',
      shopping: '購物 商店',
      culture: '古蹟 文化',
    };

    const query = preferences.categories.map(c => categoryMap[c] || c).join(' ');
    const searchQuery = preferences.city ? `${preferences.city} ${query}` : query;

    const baseRadius = preferences.proximity === 'far' ? 15000 : 3000;
    const radius = usedPlaceIds.size > 0 ? baseRadius * 1.5 : baseRadius;
    const places = await searchPlaces(searchQuery, location, radius);
    const allPlaces: PlaceDetails[] = [];

    // Get details for places from the search results
    const shuffled = places.sort(() => 0.5 - Math.random());
    const placesToCheck = usedPlaceIds.size > 0 ? 20 : 15;
    
    for (const place of shuffled.slice(0, placesToCheck)) {
      // Skip if already used
      if (usedPlaceIds.has(place.place_id)) {
        continue;
      }
      
      const details = await getPlaceDetails(place.place_id);
      if (details) {
        // More lenient rating if we don't have enough places
        const minRating = allPlaces.length < 5 ? 3.5 : 4.0;
        if (!details.rating || details.rating >= minRating) {
          allPlaces.push(details);
        }
      }
      if (allPlaces.length >= 8) break; // Get enough for variety
    }

    // If still not enough, try with relaxed criteria
    if (allPlaces.length < 5) {
      console.log(`Only found ${allPlaces.length} places for slot regeneration, trying with relaxed criteria...`);
      const relaxedRadius = baseRadius * 2;
      const morePlaces = await searchPlaces(searchQuery, location, relaxedRadius);
      const moreShuffled = morePlaces.sort(() => 0.5 - Math.random());
      
      for (const place of moreShuffled.slice(0, 25)) {
        if (usedPlaceIds.has(place.place_id)) {
          continue;
        }
        if (allPlaces.some(p => p.place_id === place.place_id)) {
          continue;
        }
        
        const details = await getPlaceDetails(place.place_id);
        if (details && (!details.rating || details.rating >= 3.5)) {
          allPlaces.push(details);
        }
        if (allPlaces.length >= 8) break;
      }
    }

    if (allPlaces.length === 0) {
      throw new Error('找不到更多符合條件的地點，請嘗試調整搜尋條件');
    }

    // Step 2: Use AI to generate a new recommendation
    const geminiPlaces = allPlaces.map(p => ({
      name: p.name,
      address: p.address,
      type: p.types[0] || 'unknown',
      rating: p.rating,
      location: p.location,
    }));

    const recommendations = await generateTrailRecommendations(
      { ...preferences, pace: 'relaxed' }, // Use relaxed to get a single focused trail
      geminiPlaces
    );

    if (recommendations.length === 0) {
      throw new Error('無法生成新的推薦');
    }

    const rec = recommendations[0];
    const recPlaces = rec.places.map(p => {
      return allPlaces.find(ap =>
        ap.name.includes(p.name) || p.name.includes(ap.name)
      );
    }).filter(Boolean) as PlaceDetails[];

    if (recPlaces.length === 0) {
      throw new Error('無法匹配推薦的地點');
    }

    const trail = convertGeminiToTrail(rec, recPlaces);

    // Store trail data
    (window as any).__aiTrails = (window as any).__aiTrails || {};
    (window as any).__aiTrails[trail.id] = trail;

    const newItinerary = { ...currentItinerary };
    newItinerary[timeSlot] = {
      trailId: trail.id,
      totalScore: 90,
      breakdown: {
        preferenceMatch: 90,
        timeMatch: 90,
        walkingScore: 85,
        popularityScore: 90,
      },
    };

    return newItinerary;
  } catch (error) {
    console.error('Error regenerating slot:', error);
    throw error;
  }
}

/**
 * Replace a specific place in a trail with a new one
 */
export async function replacePlaceInTrail(
  trailId: string,
  placeIdToReplace: string,
  preferences: UserPreferences,
  location: { lat: number; lng: number }
): Promise<any> {
  try {
    const trail = getAITrail(trailId);
    if (!trail) throw new Error('找不到該行程資料');

    // Step 1: Search for new places
    const categoryMap: Record<string, string> = {
      food: '餐廳 美食',
      walking: '公園 步道',
      exhibition: '展覽 美術館',
      photography: '觀景台 夜景',
      nightlife: '酒吧 夜生活',
      shopping: '購物 商店',
      culture: '古蹟 文化',
    };

    const query = preferences.categories.map(c => categoryMap[c] || c).join(' ');
    const searchQuery = preferences.city ? `${preferences.city} ${query}` : query;

    const radius = preferences.proximity === 'far' ? 15000 : 3000;
    const places = await searchPlaces(searchQuery, location, radius);

    // Filter out places already in the trail
    const existingPlaceIds = trail.places.map((p: any) => p.place_id);
    const availablePlaces = places.filter(p => !existingPlaceIds.includes(p.place_id));

    if (availablePlaces.length === 0) {
      throw new Error('找不到更多替代地點');
    }

    // Step 2: Get details for a new place
    let newPlaceDetails: PlaceDetails | null = null;
    const shuffled = availablePlaces.sort(() => 0.5 - Math.random());

    for (const p of shuffled.slice(0, 10)) {
      const details = await getPlaceDetails(p.place_id);
      if (details && (!details.rating || details.rating >= 4.0)) {
        newPlaceDetails = details;
        break;
      }
    }

    if (!newPlaceDetails) {
      throw new Error('找不到符合評分要求的替代地點');
    }

    // Step 3: Update the trail
    const updatedPlaces = trail.places.map((p: any) =>
      p.place_id === placeIdToReplace ? newPlaceDetails : p
    );

    const updatedTrail = {
      ...trail,
      places: updatedPlaces,
      orderedPlaces: updatedPlaces.map((p: any) => p.place_id),
    };

    // Update the stored trail
    (window as any).__aiTrails[trailId] = updatedTrail;

    return updatedTrail;
  } catch (error) {
    console.error('Error replacing place in trail:', error);
    throw error;
  }
}

/**
 * Generate multi-day itinerary
 */
export async function generateMultiDayItinerary(
  preferences: UserPreferences,
  numberOfDays: number,
  isRainyDay: boolean = false,
  providedLocation?: { lat: number; lng: number }
): Promise<MultiDayItinerary> {
  try {
    // Calculate dates
    const startDate = new Date(preferences.date);
    const days: DayItinerary[] = [];
    
    // Get location once
    let location = providedLocation;
    if (!location && preferences.city) {
      const geocodedLocation = await geocodeCity(preferences.city);
      if (geocodedLocation) {
        location = geocodedLocation;
      }
    }
    if (!location) {
      location = { lat: 25.0330, lng: 121.5654 }; // Default Taipei
    }

    // Collect all places for all days to avoid duplicates
    const usedPlaceIds = new Set<string>();
    
    // Generate itinerary for each day
    for (let i = 0; i < numberOfDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Rotate categories for variety across days
      const rotatedCategories = [...preferences.categories];
      // Shift categories by day index for variety
      for (let j = 0; j < i % rotatedCategories.length; j++) {
        rotatedCategories.push(rotatedCategories.shift()!);
      }

      const dayPreferences: UserPreferences = {
        ...preferences,
        date: dateStr,
        categories: rotatedCategories,
      };

      // Generate itinerary for this day, excluding already used places
      const dayItinerary = await generateAIItinerary(
        dayPreferences,
        isRainyDay,
        location,
        usedPlaceIds // Pass excluded places
      );

      // Track used places from this day's itinerary
      const timeSlots: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
      timeSlots.forEach(slot => {
        const trailScore = dayItinerary[slot];
        if (trailScore) {
          const trail = getAITrail(trailScore.trailId);
          if (trail?.places) {
            trail.places.forEach((p: any) => {
              if (p.place_id) {
                usedPlaceIds.add(p.place_id);
              }
            });
          }
        }
      });

      days.push({
        dayNumber: i + 1,
        date: dateStr,
        itinerary: dayItinerary,
      });

      // Add delay between days to avoid rate limiting
      if (i < numberOfDays - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + numberOfDays - 1);

    return {
      city: preferences.city,
      startDate: preferences.date,
      endDate: endDate.toISOString().split('T')[0],
      days,
      preferences,
    };
  } catch (error) {
    console.error('Error generating multi-day itinerary:', error);
    throw error;
  }
}

/**
 * Regenerate a specific day in multi-day itinerary
 */
export async function regenerateDay(
  multiDayItinerary: MultiDayItinerary,
  dayNumber: number,
  isRainyDay: boolean = false,
  location: { lat: number; lng: number }
): Promise<MultiDayItinerary> {
  try {
    const dayIndex = dayNumber - 1;
    if (dayIndex < 0 || dayIndex >= multiDayItinerary.days.length) {
      throw new Error('無效的天數');
    }

    // Collect places already used in other days
    const usedPlaceIds = new Set<string>();
    multiDayItinerary.days.forEach((day, index) => {
      if (index !== dayIndex) {
        const timeSlots: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
        timeSlots.forEach(slot => {
          const trailScore = day.itinerary[slot];
          if (trailScore) {
            const trail = getAITrail(trailScore.trailId);
            if (trail?.places) {
              trail.places.forEach((p: any) => {
                if (p.place_id) {
                  usedPlaceIds.add(p.place_id);
                }
              });
            }
          }
        });
      }
    });

    const targetDay = multiDayItinerary.days[dayIndex];
    const dayPreferences: UserPreferences = {
      ...multiDayItinerary.preferences,
      date: targetDay.date,
    };

    // Generate new itinerary excluding places from other days
    const newDayItinerary = await generateAIItinerary(
      dayPreferences,
      isRainyDay,
      location,
      usedPlaceIds
    );

    const updatedDays = [...multiDayItinerary.days];
    updatedDays[dayIndex] = {
      ...targetDay,
      itinerary: newDayItinerary,
    };

    return {
      ...multiDayItinerary,
      days: updatedDays,
    };
  } catch (error) {
    console.error('Error regenerating day:', error);
    throw error;
  }
}

