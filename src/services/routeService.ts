// Route Planning Service - combines Google Maps Directions API with AI recommendations


export interface RouteStep {
    duration: string;
    distance: string;
    instructions: string;
    travelMode: 'WALKING' | 'DRIVING' | 'TRANSIT';
}

export interface RouteLeg {
    startAddress: string;
    endAddress: string;
    duration: string;
    distance: string;
    steps: RouteStep[];
}

export interface RouteResult {
    legs: RouteLeg[];
    totalDuration: string;
    totalDistance: string;
    polylinePath: Array<{ lat: number; lng: number }>;
    warnings: string[];
}

export interface RoutePlace {
    id: string;
    name: string;
    address: string;
    location: { lat: number; lng: number };
    placeId?: string;
    estimatedStayTime?: number; // in minutes
    category?: string;
    rating?: number;
    photos?: string[];
    reason?: string; // AI-generated reason for recommendation
}

export interface GeneratedRoute {
    id: string;
    title: string;
    description: string;
    places: RoutePlace[];
    route?: RouteResult;
    totalEstimatedTime: number; // in minutes, including stay time
    walkingLevel: 'low' | 'medium' | 'high';
    highlights: string[];
    aiRecommendation?: string;
}

/**
 * Get directions between waypoints using Google Maps Directions API
 */
export async function getDirections(
    origin: { lat: number; lng: number } | string,
    destination: { lat: number; lng: number } | string,
    waypoints?: Array<{ lat: number; lng: number } | string>,
    mode: 'walking' | 'driving' | 'transit' = 'walking'
): Promise<RouteResult | null> {
    try {
        // Wait for Google Maps API to be available
        if (!window.google?.maps?.DirectionsService) {
            console.log('Waiting for Google Maps Directions Service...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!window.google?.maps?.DirectionsService) {
                throw new Error('Google Maps Directions Service not available');
            }
        }

        const directionsService = new window.google.maps.DirectionsService();

        const originLocation = typeof origin === 'string'
            ? origin
            : new window.google.maps.LatLng(origin.lat, origin.lng);

        const destinationLocation = typeof destination === 'string'
            ? destination
            : new window.google.maps.LatLng(destination.lat, destination.lng);

        const waypointsForRequest = waypoints?.map(wp => ({
            location: typeof wp === 'string'
                ? wp
                : new window.google.maps.LatLng(wp.lat, wp.lng),
            stopover: true,
        }));

        const travelMode = mode === 'walking'
            ? window.google.maps.TravelMode.WALKING
            : mode === 'driving'
                ? window.google.maps.TravelMode.DRIVING
                : window.google.maps.TravelMode.TRANSIT;

        return new Promise((resolve, reject) => {
            directionsService.route(
                {
                    origin: originLocation,
                    destination: destinationLocation,
                    waypoints: waypointsForRequest,
                    optimizeWaypoints: true,
                    travelMode,
                    language: 'zh-TW',
                },
                (result: any, status: any) => {
                    if (status === 'OK' && result) {
                        const route = result.routes[0];
                        const legs: RouteLeg[] = route.legs.map((leg: any) => ({
                            startAddress: leg.start_address,
                            endAddress: leg.end_address,
                            duration: leg.duration.text,
                            distance: leg.distance.text,
                            steps: leg.steps.map((step: any) => ({
                                duration: step.duration.text,
                                distance: step.distance.text,
                                instructions: step.instructions.replace(/<[^>]*>/g, ''),
                                travelMode: step.travel_mode,
                            })),
                        }));

                        // Calculate totals
                        let totalDurationSeconds = 0;
                        let totalDistanceMeters = 0;
                        route.legs.forEach((leg: any) => {
                            totalDurationSeconds += leg.duration.value;
                            totalDistanceMeters += leg.distance.value;
                        });

                        // Extract polyline path
                        const polylinePath = route.overview_path.map((point: any) => ({
                            lat: point.lat(),
                            lng: point.lng(),
                        }));

                        resolve({
                            legs,
                            totalDuration: formatDuration(totalDurationSeconds),
                            totalDistance: formatDistance(totalDistanceMeters),
                            polylinePath,
                            warnings: route.warnings || [],
                        });
                    } else {
                        console.error('Directions request failed:', status);
                        reject(new Error(`Directions request failed: ${status}`));
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error getting directions:', error);
        return null;
    }
}

/**
 * Format duration in seconds to readable string
 */
function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours} 小時 ${minutes} 分鐘`;
    }
    return `${minutes} 分鐘`;
}

/**
 * Format distance in meters to readable string
 */
function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} 公里`;
    }
    return `${meters} 公尺`;
}

/**
 * Calculate route with multiple stops and get optimized order
 */
export async function calculateOptimizedRoute(
    places: RoutePlace[],
    mode: 'walking' | 'driving' | 'transit' = 'walking'
): Promise<GeneratedRoute | null> {
    if (places.length < 2) {
        return null;
    }

    try {
        const origin = places[0].location;
        const destination = places[places.length - 1].location;
        const waypoints = places.slice(1, -1).map(p => p.location);

        const route = await getDirections(origin, destination, waypoints, mode);

        if (!route) {
            return null;
        }

        // Calculate total time including stay times
        const travelTimeMinutes = route.legs.reduce((acc, leg) => {
            const match = leg.duration.match(/(\d+)/);
            return acc + (match ? parseInt(match[1]) : 0);
        }, 0);

        const stayTimeMinutes = places.reduce((acc, place) =>
            acc + (place.estimatedStayTime || 30), 0
        );

        return {
            id: `route_${Date.now()}`,
            title: `前往 ${places[places.length - 1].name} 的路線`,
            description: `途經 ${places.length} 個地點`,
            places,
            route,
            totalEstimatedTime: travelTimeMinutes + stayTimeMinutes,
            walkingLevel: getWalkingLevel(route.totalDistance),
            highlights: places.map(p => p.name),
            aiRecommendation: undefined,
        };
    } catch (error) {
        console.error('Error calculating optimized route:', error);
        return null;
    }
}

/**
 * Determine walking level based on distance
 */
function getWalkingLevel(distance: string): 'low' | 'medium' | 'high' {
    const km = parseFloat(distance.replace(/[^0-9.]/g, ''));
    if (km < 2) return 'low';
    if (km < 5) return 'medium';
    return 'high';
}

// Global type declaration
declare global {
    interface Window {
        google: any;
    }
}
