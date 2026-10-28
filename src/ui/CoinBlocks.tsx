import React, { useState } from 'react';
import { popCoin } from './fxStore';

// How many coins each block holds; the middle one is a multi-coin block.
const HOLDS = [1, 5, 1];

/** Three ? blocks floating by the headline. Hit one and it pays out coins, then it's used up.
    Pure play: hidden from assistive tech and out of the tab order. */
export const CoinBlocks: React.FC = () => {
    const [hits, setHits] = useState(() => HOLDS.map(() => 0));

    const hit = (i: number, el: HTMLElement) => {
        if (hits[i] >= HOLDS[i]) return;
        const r = el.getBoundingClientRect();
        popCoin(r.left + r.width / 2, r.top);
        setHits((h) => h.map((n, j) => (j === i ? n + 1 : n)));
    };

    return (
        <div className="coin-blocks" aria-hidden="true">
            {HOLDS.map((holds, i) => (
                <button
                    // re-keying on every hit restarts the bump animation
                    key={`${i}-${hits[i]}`}
                    type="button"
                    tabIndex={-1}
                    className={`coin-block ${hits[i] > 0 ? 'is-hit' : ''} ${hits[i] >= holds ? 'is-used' : ''}`}
                    onPointerDown={(e) => hit(i, e.currentTarget)}
                />
            ))}
        </div>
    );
};

export default CoinBlocks;
