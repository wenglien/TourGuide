import React from 'react';
import type { TimeOfDay } from '../../types';
import './RouteLine.css';

export interface Station {
    key: string;
    name: string;
    time?: string;
    address?: string;
    /** Short facts under the name (rating, category, stay time). */
    meta?: React.ReactNode;
    /** Longer note, e.g. why the AI picked it. */
    note?: React.ReactNode;
    /** Travel from the previous station, drawn on the line. */
    legBefore?: string;
    actions?: React.ReactNode;
    onSelect?: () => void;
    active?: boolean;
    stamped?: boolean;
}

export interface Segment {
    key: string;
    slot: TimeOfDay;
    slotLabel: string;
    /** Start of the slot; the first station carries the visible time. */
    startTime?: string;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    /** Replaces the station list (e.g. the reorder editor). */
    body?: React.ReactNode;
    stations: Station[];
}

/** Where the train is: at station `index`, or moving towards it. */
export interface LinePosition {
    index: number;
    moving: boolean;
    /** 0–1 along the leg into `index`, when moving. */
    progress?: number;
}

interface RouteLineProps {
    segments: Segment[];
    now?: LinePosition | null;
    /** Draw the line in on mount. Use once per freshly generated route. */
    animate?: boolean;
    selectLabel?: string;
}

const Train: React.FC<{ progress: number }> = ({ progress }) => (
    <span className="rl-train" style={{ top: `${Math.round(progress * 100)}%` }} />
);

/** Rail state for a row the train is passing through, given how far along it is. */
function railStyle(progress: number): React.CSSProperties {
    return { '--rail-cut': `${Math.round(progress * 100)}%` } as React.CSSProperties;
}

export const RouteLine: React.FC<RouteLineProps> = ({ segments, now, animate, selectLabel }) => {
    const offsets: number[] = [];
    segments.reduce((n, seg, i) => { offsets[i] = n; return n + seg.stations.length; }, 0);
    return (
    <ol className={`rl ${animate ? 'rl--animate' : ''} ${now ? 'rl--tracking' : ''}`}>
        {segments.map((seg, segIndex) => {
            const firstFlat = offsets[segIndex];
            const trainInHead = Boolean(now?.moving && now.index === firstFlat && segIndex > 0 && !seg.stations[0]?.legBefore);
            const headState = !now ? '' : trainInHead ? 'is-through' : firstFlat <= now.index ? 'is-passed' : 'is-ahead';
            return (
            <li
                key={seg.key}
                className="rl-seg"
                data-slot={seg.slot}
                style={{ '--seg': segIndex } as React.CSSProperties}
            >
                <div
                    className={`rl-row rl-row--head ${segIndex === 0 ? 'is-first' : ''} ${headState}`}
                    style={trainInHead ? railStyle(now!.progress ?? 0.5) : undefined}
                >
                    <span className="rl-time" />
                    <span className="rl-rail" aria-hidden="true">
                        <span className="rl-node rl-node--transfer" />
                        {trainInHead && <Train progress={now!.progress ?? 0.5} />}
                    </span>
                    <div className="rl-head">
                        <p className="rl-slot">{seg.slotLabel}</p>
                        {seg.title && <h3 className="rl-title">{seg.title}</h3>}
                        {seg.description && <p className="rl-desc">{seg.description}</p>}
                        {seg.actions && <div className="rl-head-actions">{seg.actions}</div>}
                    </div>
                </div>

                {seg.body ? (
                    <div className="rl-row rl-row--body">
                        <span className="rl-time" />
                        <span className="rl-rail" aria-hidden="true" />
                        <div>{seg.body}</div>
                    </div>
                ) : (
                    seg.stations.map((st, i) => {
                        const idx = offsets[segIndex] + i;
                        const isEnd = segIndex === segments.length - 1 && i === seg.stations.length - 1;
                        const movingHere = Boolean(now?.moving && now.index === idx);
                        const trainOnLeg = movingHere && Boolean(st.legBefore);
                        const trainAtTop = movingHere && !st.legBefore && !(i === 0 && segIndex > 0);
                        const legState = !now ? '' : trainOnLeg ? 'is-through' : idx <= now.index ? 'is-passed' : 'is-ahead';
                        const stationState = !now ? ''
                            : trainAtTop ? 'is-arriving'
                                : idx < now.index ? 'is-passed'
                                    : idx === now.index ? (now.moving ? 'is-ahead is-next' : 'is-now')
                                        : 'is-ahead';
                        return (
                            <React.Fragment key={st.key}>
                                {st.legBefore && (
                                    <div
                                        className={`rl-row rl-row--leg ${legState}`}
                                        style={trainOnLeg ? railStyle(now!.progress ?? 0.5) : undefined}
                                    >
                                        <span className="rl-time" />
                                        <span className="rl-rail" aria-hidden="true">
                                            {trainOnLeg && <Train progress={now!.progress ?? 0.5} />}
                                        </span>
                                        <span className="rl-leg">{st.legBefore}</span>
                                    </div>
                                )}
                                <div
                                    className={`rl-row rl-row--station ${isEnd ? 'is-end' : ''} ${st.active ? 'is-active' : ''} ${stationState}`}
                                    data-flat={idx}
                                >
                                    <span className="rl-time num">{st.time}</span>
                                    <span className="rl-rail" aria-hidden="true">
                                        <span className={`rl-node ${st.stamped ? 'rl-node--stamped' : ''}`} />
                                        {trainAtTop && <span className="rl-train rl-train--arriving" />}
                                    </span>
                                    <div className="rl-station">
                                        {st.onSelect ? (
                                            <button
                                                type="button"
                                                className="rl-name rl-name--button"
                                                onClick={st.onSelect}
                                                aria-label={selectLabel ? `${st.name}, ${selectLabel}` : st.name}
                                            >
                                                {st.name}
                                            </button>
                                        ) : (
                                            <p className="rl-name">{st.name}</p>
                                        )}
                                        {st.address && <p className="rl-address">{st.address}</p>}
                                        {st.meta && <div className="rl-meta">{st.meta}</div>}
                                        {st.note && <div className="rl-note">{st.note}</div>}
                                        {st.actions && <div className="rl-actions">{st.actions}</div>}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
            </li>
            );
        })}
    </ol>
    );
};

export default RouteLine;
