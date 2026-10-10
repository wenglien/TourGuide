// Helpers shared by the plan, trips and shared-trip views.
import type { GeneratedItinerary, TimeOfDay, TrailScore } from '../types';
import { getAITrail } from '../services/aiItineraryService';
import { getTrailById } from '../data/trails';
import { getRecommendedStartTimes } from '../services/ruleEngine';
import type { TravelPace } from '../types';
import type { TransportOption } from '../services/budgetService';

export const SLOTS: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

export interface TrailPlace {
    place_id: string;
    name: string;
    address?: string;
    formatted_address?: string;
    location?: { lat: number; lng: number };
    rating?: number;
    totalRatings?: number;
    types?: string[];
    photos?: string[];
    [key: string]: any;
}

export interface ResolvedTrail {
    id: string;
    title: string;
    description: string;
    totalTime: number;
    places: TrailPlace[];
    [key: string]: any;
}

export function getTrailForScore(score?: TrailScore): ResolvedTrail | null {
    if (!score) return null;
    return (getAITrail(score.trailId) || getTrailById(score.trailId) || null) as ResolvedTrail | null;
}

export interface ResolvedSlot {
    slot: TimeOfDay;
    score: TrailScore;
    trail: ResolvedTrail;
    startTime: string;
}

/** Ordered slots that have a trail, with their start time resolved. */
export function resolveSlots(
    result: GeneratedItinerary | null | undefined,
    pace: TravelPace = 'moderate',
    firstStartTime?: string,
): ResolvedSlot[] {
    if (!result) return [];
    const defaults = getRecommendedStartTimes(pace);
    const out: ResolvedSlot[] = [];
    SLOTS.forEach((slot) => {
        const score = result[slot];
        const trail = getTrailForScore(score);
        if (!score || !trail || !Array.isArray(trail.places)) return;
        const startTime = out.length === 0 && firstStartTime ? firstStartTime : defaults[slot];
        out.push({ slot, score, trail, startTime });
    });
    return out;
}

export function toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

export function fromMinutes(total: number): string {
    const t = ((Math.round(total) % 1440) + 1440) % 1440;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/**
 * Approximate arrival time for each station in a slot.
 * Stay time is spread evenly across the trail's total time; travel uses the
 * transport estimate when we have one.
 */
/** Minutes spent at each stop: the trail's total time spread evenly, at least 30. */
export function stayMinutes(trail: ResolvedTrail): number {
    const count = trail.places.length || 1;
    return trail.totalTime > 0 ? Math.max(30, Math.round(trail.totalTime / count / 5) * 5) : 60;
}

export function stationTimes(
    startTime: string,
    trail: ResolvedTrail,
    travelMinutes: (placeId: string) => number | undefined,
): string[] {
    const stay = stayMinutes(trail);
    let clock = toMinutes(startTime);
    return trail.places.map((place, i) => {
        if (i > 0) clock += stay + (travelMinutes(place.place_id) ?? 15);
        return fromMinutes(clock);
    });
}

export function placeAddress(p: TrailPlace): string {
    return p.address || p.formatted_address || '';
}

export function mapsDirectionsUrl(p: TrailPlace): string {
    const dest = encodeURIComponent(p.name || placeAddress(p));
    const id = p.place_id ? `&destination_place_id=${encodeURIComponent(p.place_id)}` : '';
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}${id}`;
}

export function formatDuration(minutes: number, t: (k: string) => string): string {
    if (minutes <= 0) return '';
    if (minutes < 60) return `${minutes} ${t('common.unit.minutes')}`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} ${t('common.unit.hours')} ${m} ${t('common.unit.minutes')}` : `${h} ${t('common.unit.hours')}`;
}

/** Cache trail payloads that were saved alongside an itinerary. */
export function hydrateTrailCache(trailData?: Record<string, any>) {
    if (!trailData) return;
    const w = window as any;
    w.__aiTrails = w.__aiTrails || {};
    Object.entries(trailData).forEach(([id, trail]) => { w.__aiTrails[id] = trail; });
}

export function collectTrailData(result: GeneratedItinerary, slim = false): Record<string, any> {
    const data: Record<string, any> = {};
    SLOTS.forEach((slot) => {
        const score = result[slot];
        const trail = getTrailForScore(score);
        if (!score || !trail) return;
        data[score.trailId] = slim
            ? {
                id: trail.id,
                title: trail.title,
                description: trail.description,
                totalTime: trail.totalTime,
                orderedPlaces: trail.orderedPlaces,
                places: trail.places?.map((p) => ({
                    place_id: p.place_id,
                    name: p.name,
                    address: placeAddress(p),
                    location: p.location,
                    rating: p.rating ?? null,
                })),
            }
            : trail;
    });
    return data;
}

/** Pick the sensible way to get to a stop: walk if short, else transit. */
export function legLabel(options: TransportOption[] | undefined, t: (k: string, p?: any) => string): string | undefined {
    if (!options?.length) return undefined;
    const walk = options.find((o) => o.mode === 'Walking');
    const pick = walk && walk.duration <= 20 ? walk : options.find((o) => o.mode === 'Public') || options[0];
    const mode = t(`plan2.leg.${pick.mode.toLowerCase()}`);
    return pick.cost > 0
        ? t('plan2.leg.withCost', { mode, n: pick.duration, cost: pick.cost })
        : t('plan2.leg.free', { mode, n: pick.duration });
}

/** Today's date as YYYY-MM-DD in local time. */
export function localToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Display form of a destination: drops the postcode and country prefix from full addresses. */
export function displayPlace(name: string): string {
    return name.replace(/^\s*\d{3,6}\s*/, '').replace(/^(台灣|臺灣|Taiwan,?\s*)/, '').trim() || name;
}
