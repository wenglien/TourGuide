import React from 'react';
import './Stamp.css';

interface StampProps {
    name: string;
    /** Second line, e.g. a date. */
    caption?: string;
    /** Any stable string; decides the ink. */
    seed?: string;
    size?: number;
}

const INKS = ['var(--stamp)', 'var(--line-night)', 'var(--line-evening)', 'var(--line-morning)'];

function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

/** A circle traced on a pixel grid: a staircase outline, so the ring reads as a sprite. */
function pixelCircle(r: number, cell: number, c = 60): string {
    const right: string[] = [];
    const left: string[] = [];
    for (let y = -r; y < r; y += cell) {
        const mid = y + cell / 2;
        const w = Math.max(cell, Math.round(Math.sqrt(Math.max(0, r * r - mid * mid)) / cell) * cell);
        right.push(`${c + w},${c + y}`, `${c + w},${c + y + cell}`);
        left.unshift(`${c - w},${c + y + cell}`, `${c - w},${c + y}`);
    }
    return `M${[...right, ...left].join(' L')} Z`;
}

// the badge's fixed geometry, traced once
const OUTER_RING = pixelCircle(54, 6);
const INNER_RING = pixelCircle(44, 4);

// a 5×5 pixel star at the top of the badge
const STAR = 'M59 22h2v2h-2zM57 24h2v2h-2zM59 24h2v2h-2zM61 24h2v2h-2zM55 26h2v2h-2zM57 26h2v2h-2zM59 26h2v2h-2zM61 26h2v2h-2zM63 26h2v2h-2zM57 28h2v2h-2zM59 28h2v2h-2zM61 28h2v2h-2zM57 30h2v2h-2zM61 30h2v2h-2z';

/** Split a place name into at most two short lines for the stamp face. */
function stampLines(name: string): string[] {
    const clean = name.replace(/[（(].*?[)）]/g, '').trim() || name;
    const isCjk = /[㐀-鿿]/.test(clean);
    if (isCjk) {
        const chars = Array.from(clean.replace(/\s+/g, ''));
        if (chars.length <= 5) return [chars.join('')];
        const cut = Math.ceil(Math.min(chars.length, 10) / 2);
        return [chars.slice(0, cut).join(''), chars.slice(cut, 10).join('')];
    }
    const words = clean.split(/\s+/);
    if (clean.length <= 10) return [clean];
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' ').slice(0, 12), words.slice(mid).join(' ').slice(0, 12)].filter(Boolean);
}

export const Stamp: React.FC<StampProps> = ({ name, caption, seed, size = 132 }) => {
    const h = hash(seed || name);
    const ink = INKS[h % INKS.length];
    const lines = stampLines(name);
    const longest = Math.max(...lines.map((l) => Array.from(l).length));
    const isLatin = !/[\u3400-\u9fff]/.test(name);
    const fontSize = lines.length > 1 || isLatin
        ? (isLatin ? 13 : 15)
        : longest <= 3 ? 22 : longest === 4 ? 19 : 16;

    return (
        <svg
            className="stamp"
            width={size}
            height={size}
            viewBox="0 0 120 120"
            role="img"
            aria-label={caption ? `${name}, ${caption}` : name}
            style={{ color: ink }}
            shapeRendering="crispEdges"
        >
            <g fill="none" stroke="currentColor" strokeLinejoin="miter">
                <path d={OUTER_RING} strokeWidth="6" />
                <path d={INNER_RING} strokeWidth="2" strokeDasharray="4 4" />
                <line x1="24" y1="78" x2="96" y2="78" strokeWidth="2" strokeDasharray="4 2" />
                <g fill="currentColor" stroke="none">
                    {lines.map((line, i) => (
                        <text
                            key={i}
                            x="60"
                            y={lines.length === 1 ? 64 : 52 + i * (fontSize + 3)}
                            textAnchor="middle"
                            className="stamp__name"
                            style={{ fontSize }}
                        >
                            {line}
                        </text>
                    ))}
                    {caption && (
                        <text x="60" y="92" textAnchor="middle" className="stamp__caption">{caption}</text>
                    )}
                    <path d={STAR} />
                </g>
            </g>
        </svg>
    );
};

export default Stamp;
