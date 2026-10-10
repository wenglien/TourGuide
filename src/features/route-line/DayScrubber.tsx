import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed, Pause, Play } from 'lucide-react';
import { useLanguage } from '../../services/i18n';
import { fromMinutes } from '../../lib/itinerary';
import { clockAt, focusIndex, minutesNow, type Stop } from './dayClock';
import './DayScrubber.css';

/*
 * DayScrubber, styled after the dynamic route display above MRT doors:
 * one strip where thick bars are stays, thin lines are travel, dashed lines are free time.
 * Drag anywhere on it, tap a stop to glide there, or press play.
 */

const PLAY_MS = 9000;
const SNAP_MIN = 12;

interface DayScrubberProps {
    stops: Stop[];
    value: number;
    onChange: (minute: number, source: 'user' | 'play') => void;
    /** Show the "now" button (the trip is today). */
    showNow?: boolean;
    className?: string;
}

function prefersReducedMotion() {
    return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

export const DayScrubber: React.FC<DayScrubberProps> = ({ stops, value, onChange, showNow, className = '' }) => {
    const { t } = useLanguage();
    const [playing, setPlaying] = useState(false);
    const [dragging, setDragging] = useState(false);
    const raf = useRef<number | null>(null);
    const timer = useRef<number | null>(null);
    const stripRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef(value);
    const lastFocus = useRef(-1);
    useEffect(() => { valueRef.current = value; }, [value]);

    const min = stops.length ? Math.floor((stops[0].arrive - 20) / 5) * 5 : 0;
    const max = stops.length ? Math.ceil((stops[stops.length - 1].depart + 10) / 5) * 5 : 1440;
    const span = Math.max(1, max - min);
    const clamp = (m: number) => Math.min(max, Math.max(min, m));
    const pct = (m: number) => ((clamp(m) - min) / span) * 100;

    // ---------- motion ----------
    const halt = () => {
        if (raf.current != null) cancelAnimationFrame(raf.current);
        if (timer.current != null) clearTimeout(timer.current);
        raf.current = null;
        timer.current = null;
        setPlaying(false);
    };
    useEffect(() => halt, []);
    // A new route invalidates any running motion.
    useEffect(() => halt, [stops]);

    /** Tween the clock to a minute; the line and map follow because every frame goes through onChange. */
    const glideTo = (target: number, ms = 420, source: 'user' | 'play' = 'user') => {
        halt();
        const from = valueRef.current;
        const to = clamp(target);
        if (prefersReducedMotion() || Math.abs(to - from) < 1) { onChange(to, source); return; }
        const t0 = performance.now();
        const frame = (now: number) => {
            const k = Math.min(1, (now - t0) / ms);
            onChange(Math.round(from + (to - from) * easeOut(k)), source);
            raf.current = k < 1 ? requestAnimationFrame(frame) : null;
        };
        raf.current = requestAnimationFrame(frame);
    };

    const play = () => {
        if (playing) { halt(); return; }
        halt();
        setPlaying(true);
        const start = valueRef.current >= max - 5 ? min : valueRef.current;
        if (prefersReducedMotion()) {
            const targets = stops.map((s) => s.arrive).filter((a) => a > start);
            let i = 0;
            const step = () => {
                if (i >= targets.length) { onChange(max, 'play'); setPlaying(false); return; }
                onChange(targets[i++], 'play');
                timer.current = window.setTimeout(step, 900);
            };
            step();
            return;
        }
        const t0 = performance.now();
        const duration = PLAY_MS * ((max - start) / span);
        const frame = (now: number) => {
            const k = Math.min(1, (now - t0) / Math.max(1, duration));
            onChange(Math.round(start + (max - start) * k), 'play');
            if (k < 1) raf.current = requestAnimationFrame(frame);
            else { raf.current = null; setPlaying(false); }
        };
        raf.current = requestAnimationFrame(frame);
    };

    // ---------- dragging ----------
    const minuteAt = (clientX: number) => {
        const rect = stripRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return valueRef.current;
        const k = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        return Math.round((min + k * span) / 5) * 5;
    };

    const tick = (m: number) => {
        // A light buzz when the train reaches a new stop, on devices that support it.
        const f = focusIndex(stops, clockAt(stops, m));
        if (f !== lastFocus.current) {
            if (lastFocus.current !== -1) navigator.vibrate?.(6);
            lastFocus.current = f;
        }
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        halt();
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        lastFocus.current = focusIndex(stops, clockAt(stops, valueRef.current));
        const m = minuteAt(e.clientX);
        tick(m);
        onChange(m, 'user');
    };
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        const m = minuteAt(e.clientX);
        tick(m);
        onChange(m, 'user');
    };
    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        setDragging(false);
        e.currentTarget.releasePointerCapture?.(e.pointerId);
        // Magnetic snap: settle on a stop when released close to one.
        const m = valueRef.current;
        const near = stops.reduce<{ a: number; d: number } | null>((best, s) => {
            const d = Math.abs(s.arrive - m);
            return d <= SNAP_MIN && (!best || d < best.d) ? { a: s.arrive, d } : best;
        }, null);
        if (near && near.a !== m) glideTo(near.a, 180);
    };

    const stepStop = (dir: 1 | -1) => {
        const arrivals = stops.map((s) => s.arrive);
        const target = dir === 1
            ? arrivals.find((a) => a > value)
            : [...arrivals].reverse().find((a) => a < value - 1);
        glideTo(target ?? (dir === 1 ? max : min));
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        const big = e.shiftKey ? 30 : 5;
        switch (e.key) {
            case 'ArrowRight': halt(); onChange(clamp(value + big), 'user'); break;
            case 'ArrowLeft': halt(); onChange(clamp(value - big), 'user'); break;
            case 'ArrowUp': case 'PageDown': stepStop(1); break;
            case 'ArrowDown': case 'PageUp': stepStop(-1); break;
            case 'Home': glideTo(min); break;
            case 'End': glideTo(max); break;
            case ' ': case 'Enter': play(); break;
            default: return;
        }
        e.preventDefault();
    };

    // ---------- what the strip draws ----------
    const pieces = useMemo(() => {
        const out: { key: string; kind: 'stay' | 'move' | 'gap'; slot: Stop['slot']; left: number; width: number }[] = [];
        stops.forEach((s, i) => {
            out.push({ key: `s${i}`, kind: 'stay', slot: s.slot, left: pct(s.arrive), width: Math.max(0.6, pct(s.depart) - pct(s.arrive)) });
            const next = stops[i + 1];
            if (next) {
                out.push({
                    key: `m${i}`,
                    kind: next.slot === s.slot ? 'move' : 'gap',
                    slot: next.slot,
                    left: pct(s.depart),
                    width: Math.max(0, pct(next.arrive) - pct(s.depart)),
                });
            }
        });
        return out;
        // pct derives from stops only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stops]);

    if (stops.length === 0) return null;

    const state = clockAt(stops, value);
    const focus = focusIndex(stops, state);
    const focusStop = stops[Math.max(0, Math.min(stops.length - 1, focus))];
    const readout = (() => {
        switch (state.kind) {
            case 'before': return { label: t('scrub.state.before'), detail: t('scrub.detail.arrive', { time: fromMinutes(focusStop.arrive) }) };
            case 'at': return { label: t('scrub.state.at'), detail: t('scrub.detail.until', { time: fromMinutes(focusStop.depart) }) };
            case 'moving': return { label: t('scrub.state.moving'), detail: t('scrub.detail.arrive', { time: fromMinutes(focusStop.arrive) }) };
            case 'after': return { label: t('scrub.state.after'), detail: t('scrub.detail.left', { time: fromMinutes(focusStop.depart) }) };
        }
    })();
    const pos = pct(value);
    const valueText = `${fromMinutes(value)}，${readout.label}${focusStop.name}，${readout.detail}`;

    return (
        <div className={`scrub ${dragging ? 'is-dragging' : ''} ${playing ? 'is-playing' : ''} ${className}`} data-slot={focusStop.slot}>
            <div className="scrub__head">
                <span className="scrub__time num" aria-hidden="true">{fromMinutes(value)}</span>
                <div className="scrub__now" aria-live="polite">
                    <span className="scrub__state">{readout.label}</span>
                    <strong className="scrub__place" title={focusStop.name}>{focusStop.name}</strong>
                    <span className="scrub__detail num">{readout.detail}</span>
                </div>
                <div className="scrub__btns">
                    {showNow && (
                        <button type="button" className="scrub__btn" onClick={() => glideTo(minutesNow())} aria-label={t('scrub.now')}>
                            <LocateFixed size={17} aria-hidden="true" />
                        </button>
                    )}
                    <button
                        type="button"
                        className="scrub__btn scrub__btn--play"
                        onClick={play}
                        aria-label={playing ? t('scrub.pause') : t('scrub.play')}
                        aria-pressed={playing}
                    >
                        {playing ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
                    </button>
                </div>
            </div>

            <div
                ref={stripRef}
                className="scrub__strip"
                role="slider"
                tabIndex={0}
                aria-label={t('scrub.label')}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={valueText}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                style={{ '--pos': `${pos}%` } as React.CSSProperties}
            >
                {/* faded copy underneath, full-colour copy clipped to where the train has been */}
                {(['ahead', 'done'] as const).map((layer) => (
                    <div key={layer} className={`scrub__layer scrub__layer--${layer}`} aria-hidden="true">
                        {pieces.map((pc) => (
                            <span
                                key={pc.key}
                                className={`scrub__piece scrub__piece--${pc.kind}`}
                                data-slot={pc.slot}
                                style={{ left: `${pc.left}%`, width: `${pc.width}%` }}
                            />
                        ))}
                    </div>
                ))}
                {stops.map((s, i) => (
                    <button
                        key={i}
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        className={`scrub__stop ${s.arrive <= value ? 'is-passed' : ''} ${i === focus ? 'is-focus' : ''}`}
                        data-slot={s.slot}
                        style={{ left: `${pct(s.arrive)}%` }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => glideTo(s.arrive)}
                    />
                ))}
                <span className="scrub__train" aria-hidden="true" />
            </div>

            <div className="scrub__ends num" aria-hidden="true">
                <span>{fromMinutes(min)}</span>
                <span>{fromMinutes(max)}</span>
            </div>
        </div>
    );
};

export default DayScrubber;
