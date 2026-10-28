import { useSyncExternalStore } from 'react';

/* 8-bit particles and the coin purse. Particles are plain DOM nodes in one fixed layer,
   so they never re-render React; they remove themselves when their animation ends. */

const COIN_KEY = 'tg.coins';

function readCoins(): number {
    try {
        return Number(localStorage.getItem(COIN_KEY)) || 0;
    } catch {
        return 0;
    }
}

let coins = readCoins();
const listeners = new Set<() => void>();

export function addCoins(n = 1) {
    coins += n;
    try {
        localStorage.setItem(COIN_KEY, String(coins));
    } catch {
        // private mode: the purse just won't survive a reload
    }
    listeners.forEach((l) => l());
}

/** How many coins this viewer has popped so far. */
export function useCoins(): number {
    return useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => coins,
        () => 0,
    );
}

export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let layer: HTMLDivElement | null = null;

function fxLayer(): HTMLDivElement {
    if (!layer || !layer.isConnected) {
        layer = document.createElement('div');
        layer.className = 'fx-layer';
        layer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(layer);
    }
    return layer;
}

function spawn(kind: 'coin' | 'sparkle', x: number, y: number, vars?: Record<string, string>) {
    const el = document.createElement('span');
    el.className = `fx fx--${kind}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    if (vars) for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    const remove = () => el.remove();
    el.addEventListener('animationend', remove);
    window.setTimeout(remove, 1500);
    fxLayer().appendChild(el);
}

/** A coin jumps out of (x, y) and goes in the purse. */
export function popCoin(x: number, y: number) {
    addCoins(1);
    if (prefersReducedMotion()) return;
    spawn('coin', x, y);
}

/** Four sparkles burst diagonally from (x, y). */
export function sparkle(x: number, y: number) {
    if (prefersReducedMotion()) return;
    for (const [dx, dy] of [[-18, -18], [18, -18], [-14, 14], [14, 14]]) {
        spawn('sparkle', x, y, { '--dx': `${dx}px`, '--dy': `${dy}px` });
    }
}
