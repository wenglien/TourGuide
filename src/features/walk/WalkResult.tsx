import React, { useMemo, useState } from 'react';
import { Copy, Navigation } from 'lucide-react';
import { ItineraryMap } from '../../components/itinerary/ItineraryMap';
import { RouteLine, type Segment } from '../route-line/RouteLine';
import { DayScrubber } from '../route-line/DayScrubber';
import { clockAt, linePosition, type Stop } from '../route-line/dayClock';
import { Segmented } from '../../ui/Segmented';
import { useFeedback } from '../../ui/feedbackContext';
import { useLanguage } from '../../services/i18n';
import type { AIGeneratedRoute } from '../../services/geminiRouteService';
import { buildGoogleMapsDirectionsUrl } from '../../services/routeOptimization';
import { fromMinutes, toMinutes, formatDuration } from '../../lib/itinerary';
import type { TimeOfDay } from '../../types';
import { ResultHeader } from '../trip/ResultHeader';
import '../plan/plan.css';
import './walk.css';

/** Flat allowance between stops; the AI doesn't return travel times. */
const TRANSFER_MIN = 12;

function slotFor(minutes: number): TimeOfDay {
    const h = Math.floor(minutes / 60) % 24;
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 20) return 'evening';
    return 'night';
}

/** Next quarter hour from now: "if you leave now". */
function nextStart(): number {
    const now = new Date();
    return Math.ceil((now.getHours() * 60 + now.getMinutes() + 10) / 15) * 15;
}

interface WalkResultProps {
    route: AIGeneratedRoute;
    destination: string;
    /** Request facts for the header, e.g. ["半天", "美食、文化"]. */
    meta?: string[];
    animate?: boolean;
    onEdit: () => void;
}

export const WalkResult: React.FC<WalkResultProps> = ({ route, destination, meta = [], animate, onEdit }) => {
    const { t } = useLanguage();
    const { toast } = useFeedback();
    const [selected, setSelected] = useState(-1);
    const [startMinutes, setStartMinutes] = useState(nextStart);
    const [view, setView] = useState<'line' | 'map'>('line');
    const [minute, setMinute] = useState<number | null>(null);

    const mapPlaces = useMemo(
        () => route.places
            .map((p) => ({ name: p.name, address: p.address, location: p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : undefined }))
            .filter((p): p is { name: string; address: string; location: { lat: number; lng: number } } => Boolean(p.location)),
        [route],
    );

    const slot = slotFor(startMinutes);

    const { segments, stops } = useMemo(() => {
        const arrivals: number[] = [];
        route.places.forEach((_, i) => {
            arrivals.push(i === 0 ? startMinutes : arrivals[i - 1] + (route.places[i - 1].estimatedStayTime || 45) + TRANSFER_MIN);
        });
        const stops: Stop[] = route.places.map((p, i) => ({
            name: p.name, arrive: arrivals[i], depart: arrivals[i] + (p.estimatedStayTime || 45), slot,
        }));
        const stations = route.places.map((p, i) => {
            const clock = arrivals[i];
            return {
                key: `${p.name}-${i}`,
                name: p.name,
                time: fromMinutes(clock),
                address: p.address,
                active: selected === i,
                onSelect: () => { setSelected(i); setView('map'); },
                meta: (
                    <>
                        {p.category && <span>{p.category}</span>}
                        {p.estimatedStayTime > 0 && <span>{t('walk2.stay', { d: formatDuration(p.estimatedStayTime, t) })}</span>}
                    </>
                ),
                note: (p.reason || p.tips) ? (
                    <>
                        {p.reason && <p>{p.reason}</p>}
                        {p.tips && <p className="walk-tip">{p.tips}</p>}
                    </>
                ) : undefined,
            };
        });
        const segments: Segment[] = [{
            key: route.id || 'walk',
            slot,
            slotLabel: t(`slot.${slot}`),
            startTime: fromMinutes(startMinutes),
            title: route.title,
            description: route.description,
            stations,
        }];
        return { segments, stops };
    }, [route, startMinutes, selected, slot, t]);

    const scrubValue = minute ?? startMinutes;
    const position = minute === null ? null : linePosition(stops, clockAt(stops, scrubValue));

    const copyRoute = async () => {
        const text = route.places
            .map((p, i) => t('route.planner.copy.format', { n: i + 1, name: p.name, address: p.address, time: p.estimatedStayTime }))
            .join('\n\n');
        try {
            await navigator.clipboard.writeText(`${route.title}\n\n${text}`);
            toast(t('walk2.copied'));
        } catch {
            toast(t('walk2.copyFailed'), 'error');
        }
    };

    const total = route.totalEstimatedTime || route.places.reduce((n, p) => n + (p.estimatedStayTime || 45), 0);

    return (
        <div className="plan-result">
            <ResultHeader
                title={route.title}
                onEdit={onEdit}
                meta={[destination, ...meta]}
                facts={[
                    { key: 'stops', value: route.places.length, unit: t('trip.facts.stops') },
                    { key: 'total', value: formatDuration(total, t), unit: '' },
                    ...(route.budgetRange && route.budgetRange.min > 0
                        ? [{ key: 'budget', value: `NT$ ${route.budgetRange.min}–${route.budgetRange.max}`, unit: '' }]
                        : []),
                ]}
            />

            <div className="result-toolbar">
                <div className="walk-start">
                    <label htmlFor="walk-start">{t('walk2.leaveAt')}</label>
                    <input
                        id="walk-start"
                        type="time"
                        className="input num"
                        value={fromMinutes(startMinutes)}
                        onChange={(e) => { if (e.target.value) { setStartMinutes(toMinutes(e.target.value)); setMinute(null); } }}
                    />
                </div>
                {mapPlaces.length > 0 && (
                    <div className="result-view-toggle">
                        <Segmented
                            label={t('plan2.view')}
                            value={view}
                            onChange={setView}
                            options={[{ value: 'line', label: t('plan2.view.line') }, { value: 'map', label: t('plan2.view.map') }]}
                        />
                    </div>
                )}
            </div>

            <div className="result-sticky">
                <DayScrubber stops={stops} value={scrubValue} onChange={(m) => setMinute(m)} className="result-scrub" />
            </div>

            <div className={`result-body result-body--${mapPlaces.length > 0 ? view : 'line'}`}>
                <section className="result-line">
                    <RouteLine segments={segments} now={position} animate={animate} selectLabel={t('walk2.showOnMap')} />
                    {route.tips?.length > 0 && (
                        <section className="walk-notes">
                            <h3 className="section-heading">{t('walk2.tips')}</h3>
                            <ul>{route.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                        </section>
                    )}
                    <section className="walk-notes">
                        <h3 className="section-heading">{t('route.planner.backupPlan')}</h3>
                        <ul>
                            <li><strong>{t('route.planner.rainBackup')}</strong>{t('route.planner.rainBackup.desc')}</li>
                            <li><strong>{t('route.planner.crowdBackup')}</strong>{t('route.planner.crowdBackup.desc')}</li>
                        </ul>
                    </section>
                </section>
                {mapPlaces.length > 0 && (
                    <aside className="result-side">
                        <div className="result-map">
                            <ItineraryMap
                                places={mapPlaces.map((p) => ({ ...p, timeSlot: slot }))}
                                selectedIndex={selected}
                                onSelectPlace={setSelected}
                            />
                        </div>
                    </aside>
                )}
            </div>

            <div className="action-bar">
                {mapPlaces.length > 1 && (
                    <a className="btn btn-primary" href={buildGoogleMapsDirectionsUrl(mapPlaces)} target="_blank" rel="noopener noreferrer">
                        <Navigation size={17} aria-hidden="true" /> {t('plan2.day.openMaps')}
                    </a>
                )}
                <button className={`btn ${mapPlaces.length > 1 ? 'btn-secondary' : 'btn-primary'}`} onClick={copyRoute}>
                    <Copy size={17} aria-hidden="true" /> {t('route.planner.copy')}
                </button>
            </div>
        </div>
    );
};

export default WalkResult;
