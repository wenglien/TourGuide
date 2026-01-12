import type { Place } from '../types';

// Place data will be fetched from Google Maps API
export const places: Place[] = [];

// Helper function to get place by ID
export function getPlaceById(id: string): Place | undefined {
    return places.find(p => p.id === id);
}

// Helper function to get places by IDs
export function getPlacesByIds(ids: string[]): Place[] {
    return ids.map(id => getPlaceById(id)).filter((p): p is Place => p !== undefined);
}

// Helper function to filter places by tags
export function filterPlacesByTags(tags: string[]): Place[] {
    return places.filter(place =>
        tags.some(tag => place.tags.includes(tag))
    );
}
