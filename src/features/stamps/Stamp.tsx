import React, { useId } from 'react';
import './Stamp.css';

interface StampProps {
    name: string;
    /** Second line, e.g. a date. */
    caption?: string;
    /** Any stable string; decides tilt and ink. */
    seed?: string;
    size?: number;
}

const INKS = ['var(--stamp)', 'var(--line-night)', 'var(--line-evening)', 'var(--line-morning)'];

function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

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
    const id = useId().replace(/:/g, '');
    const h = hash(seed || name);
    const tilt = (h % 17) - 8;
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
            style={{ color: ink, transform: `rotate(${tilt}deg)` }}
        >
            <defs>
                <filter id={`ink-${id}`} x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={h % 50} result="noise" />
                    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.15 1.55" result="speckle" />
                    <feComposite in="SourceGraphic" in2="speckle" operator="in" />
                </filter>
            </defs>
            <g filter={`url(#ink-${id})`} fill="none" stroke="currentColor">
                <circle cx="60" cy="60" r="55" strokeWidth="4" />
                <circle cx="60" cy="60" r="47" strokeWidth="1.5" />
                <line x1="24" y1="78" x2="96" y2="78" strokeWidth="1.5" />
                <g fill="currentColor" stroke="none">
                    {lines.map((line, i) => (
                        <text
                            key={i}
                            x="60"
                            y={lines.length === 1 ? 64 : 52 + i * (fontSize + 3)}
                            textAnchor="middle"
                            className="stamp__name"
                            style={{ fontSize }}
                            stroke="currentColor"
                            strokeWidth={0.5}
                        >
                            {line}
                        </text>
                    ))}
                    {caption && (
                        <text x="60" y="92" textAnchor="middle" className="stamp__caption">{caption}</text>
                    )}
                    <circle cx="60" cy="26" r="2.5" />
                </g>
            </g>
        </svg>
    );
};

export default Stamp;
