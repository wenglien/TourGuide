interface RoutablePlace {
    place_id?: string;
    id?: string;
    name: string;
    address?: string;
    formatted_address?: string;
    location?: {
        lat: number;
        lng: number;
    };
}

export interface RouteSummary {
    totalDistanceKm: number;
    estimatedTravelMinutes: number;
    walkingLevel: 'low' | 'medium' | 'high';
}

const WALKING_SPEED_KM_PER_HOUR = 4.6;
const MAX_EXHAUSTIVE_PLACES = 8;

function hasLocation(place: RoutablePlace): place is RoutablePlace & { location: { lat: number; lng: number } } {
    return Boolean(
        place.location &&
        Number.isFinite(place.location.lat) &&
        Number.isFinite(place.location.lng)
    );
}

function distanceKm(a: RoutablePlace, b: RoutablePlace): number {
    if (!hasLocation(a) || !hasLocation(b)) return Number.POSITIVE_INFINITY;

    const earthRadiusKm = 6371;
    const toRadians = (degree: number) => degree * Math.PI / 180;
    const dLat = toRadians(b.location.lat - a.location.lat);
    const dLng = toRadians(b.location.lng - a.location.lng);
    const lat1 = toRadians(a.location.lat);
    const lat2 = toRadians(b.location.lat);

    const h =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function routeDistance(places: RoutablePlace[]): number {
    return places.reduce((total, place, index) => {
        if (index === 0) return total;
        return total + distanceKm(places[index - 1], place);
    }, 0);
}

function nearestNeighborRoute(places: RoutablePlace[], startIndex: number): RoutablePlace[] {
    const remaining = places.filter((_, index) => index !== startIndex);
    const ordered = [places[startIndex]];

    while (remaining.length > 0) {
        const current = ordered[ordered.length - 1];
        let nextIndex = 0;
        let bestDistance = distanceKm(current, remaining[0]);

        for (let index = 1; index < remaining.length; index += 1) {
            const candidateDistance = distanceKm(current, remaining[index]);
            if (candidateDistance < bestDistance) {
                nextIndex = index;
                bestDistance = candidateDistance;
            }
        }

        ordered.push(remaining[nextIndex]);
        remaining.splice(nextIndex, 1);
    }

    return ordered;
}

function improveWithTwoOpt(route: RoutablePlace[]): RoutablePlace[] {
    let improved = [...route];
    let foundBetter = true;

    while (foundBetter) {
        foundBetter = false;

        for (let i = 1; i < improved.length - 2; i += 1) {
            for (let j = i + 1; j < improved.length - 1; j += 1) {
                const candidate = [
                    ...improved.slice(0, i),
                    ...improved.slice(i, j + 1).reverse(),
                    ...improved.slice(j + 1),
                ];

                if (routeDistance(candidate) + 0.01 < routeDistance(improved)) {
                    improved = candidate;
                    foundBetter = true;
                }
            }
        }
    }

    return improved;
}

export function optimizePlacesOrder<T extends RoutablePlace>(places: T[]): T[] {
    const routable = places.filter(hasLocation);
    const unroutable = places.filter(place => !hasLocation(place));

    if (routable.length < 3) {
        return places;
    }

    const startCandidates = routable.length <= MAX_EXHAUSTIVE_PLACES
        ? routable.map((_, index) => index)
        : [0];

    const best = startCandidates
        .map(startIndex => improveWithTwoOpt(nearestNeighborRoute(routable, startIndex)))
        .reduce((bestRoute, candidateRoute) => (
            routeDistance(candidateRoute) < routeDistance(bestRoute) ? candidateRoute : bestRoute
        ));

    return [...best, ...unroutable] as T[];
}

export function summarizeRoute(places: RoutablePlace[]): RouteSummary {
    const validPlaces = places.filter(hasLocation);
    const totalDistanceKm = routeDistance(validPlaces);
    const estimatedTravelMinutes = Math.round((totalDistanceKm / WALKING_SPEED_KM_PER_HOUR) * 60);
    const walkingLevel = totalDistanceKm < 2 ? 'low' : totalDistanceKm < 5 ? 'medium' : 'high';

    return {
        totalDistanceKm: Number.isFinite(totalDistanceKm) ? totalDistanceKm : 0,
        estimatedTravelMinutes: Number.isFinite(estimatedTravelMinutes) ? estimatedTravelMinutes : 0,
        walkingLevel,
    };
}

export function isSameRouteOrder(a: RoutablePlace[], b: RoutablePlace[]): boolean {
    if (a.length !== b.length) return false;

    return a.every((place, index) => {
        const aId = place.place_id || place.id || place.name;
        const bId = b[index]?.place_id || b[index]?.id || b[index]?.name;
        return aId === bId;
    });
}

export function buildGoogleMapsDirectionsUrl(places: RoutablePlace[]): string {
    const validPlaces = places.filter(hasLocation);

    if (validPlaces.length === 0) {
        return 'https://www.google.com/maps';
    }

    if (validPlaces.length === 1) {
        const place = validPlaces[0];
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name || place.address || '')}`;
    }

    const origin = validPlaces[0];
    const destination = validPlaces[validPlaces.length - 1];
    const waypoints = validPlaces.slice(1, -1);
    const params = new URLSearchParams({
        api: '1',
        origin: `${origin.location.lat},${origin.location.lng}`,
        destination: `${destination.location.lat},${destination.location.lng}`,
        travelmode: 'walking',
    });

    if (waypoints.length > 0) {
        params.set('waypoints', waypoints.map(place => `${place.location.lat},${place.location.lng}`).join('|'));
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`;
}
