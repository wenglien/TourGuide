// AI-Powered Route Recommendation Service
import type { RoutePlace, GeneratedRoute } from './routeService';
import { calculateOptimizedRoute } from './routeService';
import { searchNearbyPlaces, getPlaceDetails, geocodeCity, searchNearbyWithPlacesLibrary, type PlaceDetails } from './googleMaps';

const GEMINI_API_KEY = 'AIzaSyAH_VkzFOUT2NXEj05ZSoqK-nG8xebWOJg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface RoutePreferences {
    destination: string;
    destinationLocation?: { lat: number; lng: number };
    categories: string[]; // 'food' | 'culture' | 'shopping' | 'nature' | 'nightlife' | 'photography'
    duration: 'half_day' | 'full_day' | 'quick'; // 半天 | 一天 | 快速瀏覽
    walkingLevel: 'low' | 'medium' | 'high';
    startLocation?: { lat: number; lng: number };
}

interface AIPlaceRecommendation {
    name: string;
    category: string;
    reason: string;
    estimatedStayTime: number;
    bestVisitOrder: number;
}

interface AIRouteRecommendation {
    title: string;
    description: string;
    theme: string;
    places: AIPlaceRecommendation[];
    highlights: string[];
    tips: string[];
}

/**
 * Generate AI-powered route recommendations based on destination
 */
export async function generateAIRoute(
    preferences: RoutePreferences
): Promise<GeneratedRoute | null> {
    try {
        // Step 1: Get destination coordinates
        let destinationLocation = preferences.destinationLocation;
        if (!destinationLocation && preferences.destination) {
            const geocoded = await geocodeCity(preferences.destination);
            if (geocoded) {
                destinationLocation = geocoded;
            } else {
                throw new Error('無法解析目的地地址');
            }
        }

        if (!destinationLocation) {
            throw new Error('請輸入有效的目的地');
        }

        // Step 2: Search for nearby places based on categories
        const categoryMap: Record<string, string[]> = {
            food: ['restaurant', 'cafe', 'bakery'],
            culture: ['museum', 'art_gallery', 'point_of_interest'],
            shopping: ['shopping_mall', 'store'],
            nature: ['park'],
            nightlife: ['bar', 'night_club'],
            photography: ['tourist_attraction'],
        };

        const allPlaces: PlaceDetails[] = [];

        for (const category of preferences.categories) {
            const types = categoryMap[category] || [category];
            for (const type of types) {
                // Try using Places Library first (no CORS issues)
                let places = await searchNearbyWithPlacesLibrary(destinationLocation, type, 3000);

                // Fallback to REST API if Places Library failed
                if (places.length === 0) {
                    const restPlaces = await searchNearbyPlaces(destinationLocation, type, 3000);
                    for (const place of restPlaces.slice(0, 3)) {
                        const details = await getPlaceDetails(place.place_id);
                        if (details) {
                            places.push(details);
                        }
                    }
                }

                // Add unique places to collection
                for (const place of places) {
                    if (!allPlaces.some(p => p.place_id === place.place_id)) {
                        allPlaces.push(place);
                    }
                }

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }

        if (allPlaces.length === 0) {
            throw new Error('找不到附近的推薦地點');
        }

        // Step 3: Use Gemini AI to analyze and recommend route
        const aiRecommendation = await getAIRouteRecommendation(
            preferences.destination,
            allPlaces,
            preferences
        );

        // Step 4: Convert AI recommendations to route places
        const routePlaces: RoutePlace[] = [];

        // Add start location if provided
        if (preferences.startLocation) {
            routePlaces.push({
                id: 'start',
                name: '起點',
                address: '您的位置',
                location: preferences.startLocation,
                estimatedStayTime: 0,
                category: 'start',
            });
        }

        // Match AI recommendations with actual places
        for (const rec of aiRecommendation.places) {
            const matchedPlace = allPlaces.find(p =>
                p.name.includes(rec.name) || rec.name.includes(p.name)
            ) || allPlaces.find(p =>
                p.types.some(t => rec.category.toLowerCase().includes(t))
            );

            if (matchedPlace) {
                routePlaces.push({
                    id: matchedPlace.place_id,
                    name: matchedPlace.name,
                    address: matchedPlace.address,
                    location: matchedPlace.location,
                    placeId: matchedPlace.place_id,
                    estimatedStayTime: rec.estimatedStayTime,
                    category: rec.category,
                    rating: matchedPlace.rating,
                    photos: matchedPlace.photos,
                    reason: rec.reason,
                });
            }
        }

        // If AI matching didn't work well, use all places
        if (routePlaces.length < 3) {
            const maxPlaces = preferences.duration === 'quick' ? 3 :
                preferences.duration === 'half_day' ? 5 : 8;

            for (const place of allPlaces.slice(0, maxPlaces)) {
                if (!routePlaces.some(rp => rp.id === place.place_id)) {
                    routePlaces.push({
                        id: place.place_id,
                        name: place.name,
                        address: place.address,
                        location: place.location,
                        placeId: place.place_id,
                        estimatedStayTime: 45,
                        category: place.types[0] || 'attraction',
                        rating: place.rating,
                        photos: place.photos,
                    });
                }
            }
        }

        // Add destination as final stop if it's an actual place
        const destinationAsPlace = allPlaces.find(p =>
            p.address.includes(preferences.destination) ||
            p.name.includes(preferences.destination)
        );

        if (destinationAsPlace && !routePlaces.some(rp => rp.id === destinationAsPlace.place_id)) {
            routePlaces.push({
                id: destinationAsPlace.place_id,
                name: destinationAsPlace.name,
                address: destinationAsPlace.address,
                location: destinationAsPlace.location,
                placeId: destinationAsPlace.place_id,
                estimatedStayTime: 60,
                category: 'destination',
                rating: destinationAsPlace.rating,
                photos: destinationAsPlace.photos,
            });
        }

        // Step 5: Calculate optimized route with directions
        const generatedRoute = await calculateOptimizedRoute(
            routePlaces,
            preferences.walkingLevel === 'high' ? 'walking' : 'walking'
        );

        if (generatedRoute) {
            generatedRoute.title = aiRecommendation.title;
            generatedRoute.description = aiRecommendation.description;
            generatedRoute.highlights = aiRecommendation.highlights;
            generatedRoute.aiRecommendation = aiRecommendation.tips.join(' | ');
        }

        return generatedRoute;
    } catch (error) {
        console.error('Error generating AI route:', error);
        throw error;
    }
}

/**
 * Get AI route recommendation from Gemini
 */
async function getAIRouteRecommendation(
    destination: string,
    places: PlaceDetails[],
    preferences: RoutePreferences
): Promise<AIRouteRecommendation> {
    try {
        const durationDesc = preferences.duration === 'quick' ? '1-2小時快速瀏覽' :
            preferences.duration === 'half_day' ? '半天行程（約4小時）' :
                '一天行程（約8小時）';

        const prompt = `你是一位專業的在地導遊。請根據以下資訊，為遊客規劃一條從目的地「${destination}」出發的推薦路線。

可用地點：
${places.map(p => `- ${p.name} (${p.types[0] || '景點'}) - 評分：${p.rating || 'N/A'}星 - 地址：${p.address}`).join('\n')}

遊客偏好：
- 興趣：${preferences.categories.join('、')}
- 時長：${durationDesc}
- 步行量：${preferences.walkingLevel === 'low' ? '少走路' : preferences.walkingLevel === 'medium' ? '適中' : '願意多走'}

請以 JSON 格式回覆，包含以下欄位：
{
  "title": "路線標題（簡潔有特色）",
  "description": "路線描述（50-80字）",
  "theme": "路線主題",
  "places": [
    {
      "name": "地點名稱（必須是上面列表中的地點）",
      "category": "地點類別",
      "reason": "推薦原因（15-25字）",
      "estimatedStayTime": 45,
      "bestVisitOrder": 1
    }
  ],
  "highlights": ["亮點1", "亮點2", "亮點3"],
  "tips": ["實用建議1", "實用建議2"]
}

請注意：
1. 只能選擇上面列表中的地點
2. 根據時長選擇適當數量的地點
3. 考慮地點之間的地理位置，規劃合理的參觀順序
4. 提供每個地點的推薦停留時間`;

        const response = await fetch(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from Gemini API');
        }

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Could not parse Gemini response');
    } catch (error) {
        console.error('Error getting AI route recommendation:', error);
        // Return default recommendation if AI fails
        return {
            title: `探索${destination}`,
            description: `精選${destination}周邊的熱門景點`,
            theme: '在地探索',
            places: places.slice(0, 5).map((p, i) => ({
                name: p.name,
                category: p.types[0] || 'attraction',
                reason: '當地熱門景點',
                estimatedStayTime: 45,
                bestVisitOrder: i + 1,
            })),
            highlights: places.slice(0, 3).map(p => p.name),
            tips: ['建議穿著舒適的鞋子', '記得帶水和防曬'],
        };
    }
}

/**
 * Get quick route suggestions for a destination
 */
export async function getQuickSuggestions(
    destination: string,
    location?: { lat: number; lng: number }
): Promise<RoutePlace[]> {
    try {
        let searchLocation = location;
        if (!searchLocation) {
            const geocoded = await geocodeCity(destination);
            if (geocoded) {
                searchLocation = geocoded;
            }
        }

        if (!searchLocation) {
            return [];
        }

        const places = await searchNearbyPlaces(searchLocation, 'tourist_attraction', 2000);
        const results: RoutePlace[] = [];

        for (const place of places.slice(0, 5)) {
            const details = await getPlaceDetails(place.place_id);
            if (details) {
                results.push({
                    id: details.place_id,
                    name: details.name,
                    address: details.address,
                    location: details.location,
                    placeId: details.place_id,
                    estimatedStayTime: 30,
                    category: details.types[0] || 'attraction',
                    rating: details.rating,
                    photos: details.photos,
                });
            }
        }

        return results;
    } catch (error) {
        console.error('Error getting quick suggestions:', error);
        return [];
    }
}
