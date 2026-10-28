import React, { useEffect } from 'react';
import { popCoin, sparkle } from './fxStore';

// Pressing the primary action pays a coin; picking something throws sparkles.
const COIN_TARGETS = '.btn-primary';
const SPARKLE_TARGETS = '.chip, .quick__place, .quick__locate, .day-tab, .segmented button, .lang-btn, .scrub__stop, .trips-tab';

/** One document listener for the whole app's press effects. Renders nothing. */
export const PixelFx: React.FC = () => {
    useEffect(() => {
        const onDown = (e: PointerEvent) => {
            if (!(e.target instanceof Element)) return;
            const coinEl = e.target.closest<HTMLButtonElement>(COIN_TARGETS);
            if (coinEl) {
                if (coinEl.disabled) return;
                const r = coinEl.getBoundingClientRect();
                popCoin(r.left + r.width / 2, r.top);
                return;
            }
            if (e.target.closest(SPARKLE_TARGETS)) sparkle(e.clientX, e.clientY);
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, []);
    return null;
};

export default PixelFx;
