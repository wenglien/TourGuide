import type { TimeOfDay } from '../../types';
import type { LinePosition } from './RouteLine';

export interface Stop {
    name: string;
    /** Minutes since midnight. */
    arrive: number;
    depart: number;
    slot: TimeOfDay;
}

export type ClockState =
    | { kind: 'before'; next: number }
    | { kind: 'at'; index: number }
    | { kind: 'moving'; next: number; progress: number }
    | { kind: 'after' };

export function clockAt(stops: Stop[], minute: number): ClockState {
    if (stops.length === 0) return { kind: 'after' };
    if (minute < stops[0].arrive) return { kind: 'before', next: 0 };
    for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        if (minute <= s.depart) {
            if (minute >= s.arrive) return { kind: 'at', index: i };
            const prev = stops[i - 1];
            const span = Math.max(1, s.arrive - prev.depart);
            return { kind: 'moving', next: i, progress: Math.min(1, Math.max(0, (minute - prev.depart) / span)) };
        }
    }
    return { kind: 'after' };
}

export function linePosition(stops: Stop[], state: ClockState): LinePosition {
    switch (state.kind) {
        case 'before': return { index: 0, moving: true, progress: 0 };
        case 'at': return { index: state.index, moving: false };
        case 'moving': return { index: state.next, moving: true, progress: state.progress };
        case 'after': return { index: stops.length, moving: false };
    }
}

/** Index to highlight on the map for a clock state, or -1. */
export function focusIndex(stops: Stop[], state: ClockState): number {
    if (state.kind === 'at') return state.index;
    if (state.kind === 'moving' || state.kind === 'before') return state.next;
    return stops.length - 1;
}

export function minutesNow(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
}
