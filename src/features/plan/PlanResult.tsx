import React, { useMemo, useRef, useState } from 'react';
import {
    ArrowUpDown, CalendarPlus, CloudRain, FileText, ListOrdered, Navigation, Pencil, RefreshCw,
    Save, Share2, Sparkles, Stamp as StampIcon, Sun, Wand2, MoreHorizontal, Star, Radio,
} from 'lucide-react';
import { RouteLine, type Segment } from '../route-line/RouteLine';
import { DayScrubber } from '../route-line/DayScrubber';
import { clockAt, focusIndex, linePosition, minutesNow, type Stop } from '../route-line/dayClock';
import { ItineraryMap } from '../../components/itinerary/ItineraryMap';
import { DraggablePlaceList } from '../../components/itinerary/DraggablePlaceList';
import { BudgetTracker } from '../../components/itinerary/BudgetTracker';
import { Segmented } from '../../ui/Segmented';
import { Sheet } from '../../ui/Sheet';
import { useLanguage } from '../../services/i18n';
import { useAuth } from '../../context/AuthContext';
import { useLogin } from '../../app/useLogin';
import { buildGoogleMapsDirectionsUrl, summarizeRoute } from '../../services/routeOptimization';
import { legLabel, localToday, mapsDirectionsUrl, placeAddress, stationTimes, stayMinutes, toMinutes, type TrailPlace } from '../../lib/itinerary';
import { PlaceSheet } from './PlaceSheet';
import { ResultHeader } from '../trip/ResultHeader';
import { CheckInSheet } from './CheckInSheet';
import type { Planner } from './usePlanner';

export const PlanResult: React.FC<{ planner: Planner }> = ({ planner: p }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const login = useLogin();
    const [view, setView] = useState<'line' | 'map'>('line');
    const [editingTrail, setEditingTrail] = useState<string | null>(null);
    const [moreOpen, setMoreOpen] = useState(false);
    const [checkInPlace, setCheckInPlace] = useState<TrailPlace | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [mapIndex, setMapIndex] = useState(-1);
    const [clock, setClock] = useState<{ day: number; minute: number } | null>(null);
    const lastFocus = useRef(-1);

    const dateLabel = p.multiDayResult
        ? `${p.multiDayResult.startDate} – ${p.multiDayResult.endDate}`
        : p.rp.date;

    const mapPlaces = useMemo(
        () => p.dayPlaces.map((pl) => ({
            name: pl.name,
            location: pl.location!,
            address: placeAddress(pl),
            timeSlot: pl.timeSlot,
        })),
        [p.dayPlaces],
    );
    const summary = summarizeRoute(mapPlaces);
    const directionsUrl = buildGoogleMapsDirectionsUrl(mapPlaces);
    const stationCount = p.slots.reduce((n, s) => n + s.trail.places.length, 0);

    // Flat index of each place so the line and the map share one selection.
    const flatIndex = new Map<string, number>();
    p.dayPlaces.forEach((pl, i) => flatIndex.set(pl.place_id, i));

    const stops = useMemo<(Stop & { placeId: string })[]>(
        () => p.slots.flatMap(({ slot, trail, startTime }) => {
            const times = stationTimes(startTime, trail, p.travelMinutes);
            const stay = stayMinutes(trail);
            return trail.places.map((pl, i) => {
                const arrive = toMinutes(times[i]);
                return { name: pl.name, arrive, depart: arrive + stay, slot, placeId: pl.place_id };
            });
        }),
        [p.slots, p.travelMinutes],
    );

    const dayDate = p.multiDayResult?.days[p.activeDay - 1]?.date || p.rp.date;
    const isToday = dayDate === localToday();
    const defaultMinute = isToday ? minutesNow() : (stops[0]?.arrive ?? 540);
    const minute = clock && clock.day === p.activeDay ? clock.minute : defaultMinute;
    // The line only dims what's behind/ahead once there's a "now": today, or after the user scrubs.
    const tracking = isToday || (clock !== null && clock.day === p.activeDay);
    const clockState = clockAt(stops, minute);
    const position = tracking ? linePosition(stops, clockState) : null;

    const onScrub = (m: number, source: 'user' | 'play') => {
        setClock({ day: p.activeDay, minute: m });
        const focus = focusIndex(stops, clockAt(stops, m));
        const placeId = stops[focus]?.placeId;
        setSelectedIndex(-1);
        setMapIndex(placeId ? (flatIndex.get(placeId) ?? -1) : -1);
        if (focus === lastFocus.current) return;
        lastFocus.current = focus;
        const row = document.querySelector<HTMLElement>(`.result-line [data-flat="${focus}"]`);
        if (!row) return;
        const r = row.getBoundingClientRect();
        const safeTop = 260;
        const safeBottom = window.innerHeight - 140;
        if (r.top < safeTop || r.bottom > safeBottom) {
            const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            row.scrollIntoView({ block: 'center', behavior: reduce || source === 'user' ? 'auto' : 'smooth' });
        }
    };

    const segments: Segment[] = p.slots.map(({ slot, trail, startTime }) => {
        const times = stationTimes(startTime, trail, p.travelMinutes);
        const editing = editingTrail === trail.id;
        return {
            key: `${slot}-${trail.id}`,
            slot,
            slotLabel: t(`slot.${slot}`),
            startTime,
            title: trail.title,
            description: trail.description,
            actions: (
                <>
                    <button className="btn btn-ghost btn-sm" onClick={() => p.refreshSlot(slot)} disabled={p.busySlot !== null}>
                        {p.busySlot === slot ? <span className="spinner" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
                        {p.busySlot === slot ? t('plan2.slot.refreshing') : t('plan2.slot.refresh')}
                    </button>
                    <button
                        className="btn btn-ghost btn-sm"
                        aria-pressed={editing}
                        onClick={() => setEditingTrail(editing ? null : trail.id)}
                    >
                        {editing ? <ListOrdered size={15} aria-hidden="true" /> : <ArrowUpDown size={15} aria-hidden="true" />}
                        {editing ? t('plan2.slot.doneEditing') : t('plan2.slot.edit')}
                    </button>
                </>
            ),
            body: editing ? (
                <DraggablePlaceList
                    places={trail.places}
                    onReorder={(next) => p.writeTrailPlaces(trail.id, next as TrailPlace[])}
                    onRemove={(id) => p.removePlace(trail.id, id)}
                />
            ) : undefined,
            stations: trail.places.map((place, i) => ({
                key: place.place_id || `${trail.id}-${i}`,
                name: place.name,
                time: times[i],
                address: placeAddress(place),
                legBefore: i > 0 ? legLabel(p.transportOptions[place.place_id], t) : undefined,
                active: flatIndex.get(place.place_id) === selectedIndex,
                stamped: p.stampedNames.has(place.name),
                onSelect: () => {
                    const i = flatIndex.get(place.place_id) ?? -1;
                    setSelectedIndex(i);
                    setMapIndex(i);
                    p.openPlace(place);
                },
                meta: place.rating ? (
                    <span className="meta-rating">
                        <Star size={12} aria-hidden="true" /> {place.rating}
                        {place.totalRatings ? <span className="subtle">（{place.totalRatings.toLocaleString()}）</span> : null}
                    </span>
                ) : undefined,
                actions: (
                    <>
                        {p.busyPlaceId === place.place_id && (
                            <span className="btn btn-ghost btn-sm" role="status"><span className="spinner" aria-hidden="true" /> {t('plan2.place.replacing')}</span>
                        )}
                        <a className="btn btn-ghost btn-sm" href={mapsDirectionsUrl(place)} target="_blank" rel="noopener noreferrer">
                            <Navigation size={14} aria-hidden="true" /> {t('plan2.place.navigate')}
                        </a>
                        {user && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setCheckInPlace(place)}>
                                <StampIcon size={14} aria-hidden="true" /> {t('plan2.place.stamp')}
                            </button>
                        )}
                    </>
                ),
            })),
        };
    });

    return (
        <div className="plan-result">
            <ResultHeader
                title={p.rp.city}
                onEdit={p.editPreferences}
                meta={[
                    dateLabel,
                    p.request && !['quick', 'half_day'].includes(p.request.span) ? t('plan2.days.n', { n: p.request.span }) : undefined,
                    p.rp.categories.map((c) => t(`category.${c}`)).join('、'),
                ]}
                facts={[
                    { key: 'stops', value: stationCount, unit: t('trip.facts.stops') },
                    { key: 'km', value: summary.totalDistanceKm.toFixed(1), unit: 'km' },
                    { key: 'move', value: summary.estimatedTravelMinutes, unit: t('trip.facts.moveMin') },
                    ...(p.budget.min > 0 || p.budget.max > 0
                        ? [{ key: 'budget', value: `NT$ ${p.budget.min.toLocaleString()}–${p.budget.max.toLocaleString()}`, unit: '' }]
                        : []),
                ]}
            />

            <div className={`result-toolbar ${p.multiDayResult && p.multiDayResult.days.length > 1 ? '' : 'result-toolbar--toggle-only'}`}>
                {p.multiDayResult && p.multiDayResult.days.length > 1 ? (
                    <div className="day-tabs" role="tablist" aria-label={t('plan2.days')}>
                        {p.multiDayResult.days.map((day) => (
                            <button
                                key={day.dayNumber}
                                role="tab"
                                aria-selected={p.activeDay === day.dayNumber}
                                className="day-tab"
                                onClick={() => p.switchDay(day.dayNumber)}
                            >
                                <strong>{t('generator.day', { n: day.dayNumber })}</strong>
                                <small className="num">{day.date.slice(5)}</small>
                            </button>
                        ))}
                    </div>
                ) : <span />}
                <div className="result-view-toggle">
                    <Segmented
                        label={t('plan2.view')}
                        value={view}
                        onChange={setView}
                        options={[
                            { value: 'line', label: t('plan2.view.line') },
                            { value: 'map', label: t('plan2.view.map') },
                        ]}
                    />
                </div>
            </div>

            {p.isRainy && <p className="notice result-rain"><CloudRain size={16} aria-hidden="true" /> {t('plan2.rain.active')}</p>}

            {p.isCompanionMode && (
                <section className="companion" aria-live="polite">
                    <div className="companion__head">
                        <Radio size={16} aria-hidden="true" />
                        <strong>{t('generator.companion.active')}</strong>
                        <button className="btn btn-ghost btn-sm" onClick={p.stopCompanion}>{t('plan2.companion.stop')}</button>
                    </div>
                    {p.notifications.map((n) => (
                        <div key={n.id} className="companion__note">
                            <p><strong>{n.title}</strong> {n.message}</p>
                            <div className="companion__actions">
                                <button className="btn btn-primary btn-sm" onClick={() => p.actOnNotification(n)}>{n.actionLabel}</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => p.dismissNotification(n.id)}>{t('common.ignore')}</button>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            <div className="result-sticky">
                {stops.length > 0 && (
                    <DayScrubber stops={stops} value={minute} onChange={onScrub} showNow={isToday} className="result-scrub" />
                )}
            </div>

            <div className={`result-body result-body--${view}`} aria-busy={p.isRefreshing}>
                <section className="result-line" aria-label={t('plan2.view.line')}>
                    {segments.length > 0 ? (
                        <RouteLine segments={segments} now={position} animate={p.freshResult} selectLabel={t('plan2.place.details')} />
                    ) : (
                        <div className="empty">
                            <p>{t('plan2.empty')}</p>
                            <button className="btn btn-primary" onClick={p.editPreferences}>{t('plan2.editPrefs')}</button>
                        </div>
                    )}
                </section>

                <aside className="result-side">
                    <div className="result-map">
                        <ItineraryMap
                            places={mapPlaces}
                            center={p.resultLoc || undefined}
                            selectedIndex={mapIndex}
                            onSelectPlace={(i) => {
                                setSelectedIndex(i);
                                setMapIndex(i);
                                const place = p.dayPlaces[i];
                                if (place) p.openPlace(place);
                            }}
                        />
                    </div>
                    <div className="result-map__actions">
                        <button className="btn btn-secondary btn-sm" onClick={p.optimizeDay}>
                            <Wand2 size={15} aria-hidden="true" /> {t('plan2.day.optimize')}
                        </button>
                        <a className="btn btn-secondary btn-sm" href={directionsUrl} target="_blank" rel="noopener noreferrer">
                            <Navigation size={15} aria-hidden="true" /> {t('plan2.day.openMaps')}
                        </a>
                    </div>

                    {user && (p.budget.min > 0 || p.budget.max > 0) && (
                        <section className="result-budget">
                            <h2 className="section-heading">{t('generator.budgetTracker')}</h2>
                            {p.savedItineraryId ? (
                                <BudgetTracker
                                    itineraryId={p.savedItineraryId}
                                    estimatedBudget={{ min: p.budget.min, max: p.budget.max, currency: 'TWD' }}
                                />
                            ) : (
                                <p className="subtle">{t('plan2.budget.saveFirst')}</p>
                            )}
                        </section>
                    )}
                </aside>
            </div>

            <div className="action-bar">
                {user ? (
                    <>
                        <button className="btn btn-primary" onClick={() => p.save()} disabled={p.isSaving}>
                            {p.isSaving ? <span className="spinner" aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
                            {p.savedItineraryId ? t('plan2.saveAgain') : t('plan2.save')}
                        </button>
                        <button className="btn btn-secondary" onClick={p.share} disabled={p.isSaving}>
                            <Share2 size={17} aria-hidden="true" /> {t('plan2.share')}
                        </button>
                    </>
                ) : (
                    <>
                        <a className="btn btn-primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">
                            <Navigation size={17} aria-hidden="true" /> {t('trip.navigateDay')}
                        </a>
                        <button className="btn btn-secondary" onClick={login}>{t('trip.loginToSave')}</button>
                    </>
                )}
                <button className="btn btn-secondary action-bar__more" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-label={t('common.more')}>
                    <MoreHorizontal size={18} aria-hidden="true" />
                </button>
            </div>

            <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title={t('plan2.more.title')} closeLabel={t('common.close')}>
                <ul className="menu">
                    {user && (
                        <li>
                            <a className="menu__item" href={directionsUrl} target="_blank" rel="noopener noreferrer" onClick={() => setMoreOpen(false)}>
                                <Navigation size={18} aria-hidden="true" />
                                <span><strong>{t('plan2.day.openMaps')}</strong></span>
                            </a>
                        </li>
                    )}
                    <li>
                        <button className="menu__item" onClick={() => { setMoreOpen(false); p.optimizeDay(); }}>
                            <Wand2 size={18} aria-hidden="true" />
                            <span><strong>{t('plan2.day.optimize')}</strong><small>{t('trip.more.optimize.desc')}</small></span>
                        </button>
                    </li>
                    {p.multiDayResult && p.multiDayResult.days.length > 1 && (
                        <li>
                            <button className="menu__item" disabled={p.busyDay !== null} onClick={() => { setMoreOpen(false); p.refreshDay(p.activeDay); }}>
                                <RefreshCw size={18} aria-hidden="true" />
                                <span><strong>{t('plan2.day.refresh', { n: p.activeDay })}</strong></span>
                            </button>
                        </li>
                    )}
                    <li>
                        <button className="menu__item" disabled={p.isRefreshing} onClick={() => { setMoreOpen(false); p.toggleRain(); }}>
                            {p.isRainy ? <Sun size={18} aria-hidden="true" /> : <CloudRain size={18} aria-hidden="true" />}
                            <span><strong>{p.isRainy ? t('plan2.more.sunny') : t('plan2.more.rainy')}</strong><small>{t('plan2.more.rainy.desc')}</small></span>
                        </button>
                    </li>
                    {!p.isCompanionMode && (
                        <li>
                            <button className="menu__item" onClick={() => { setMoreOpen(false); p.startCompanion(); }}>
                                <Sparkles size={18} aria-hidden="true" />
                                <span><strong>{t('plan2.more.companion')}</strong><small>{t('plan2.more.companion.desc')}</small></span>
                            </button>
                        </li>
                    )}
                    <li>
                        <button className="menu__item" onClick={() => { setMoreOpen(false); p.exportPdf(); }}>
                            <FileText size={18} aria-hidden="true" />
                            <span><strong>{t('plan2.more.pdf')}</strong></span>
                        </button>
                    </li>
                    <li>
                        <button className="menu__item" onClick={() => { setMoreOpen(false); p.exportCalendar(); }}>
                            <CalendarPlus size={18} aria-hidden="true" />
                            <span><strong>{t('plan2.more.calendar')}</strong></span>
                        </button>
                    </li>
                    <li>
                        <button className="menu__item" onClick={() => { setMoreOpen(false); p.editPreferences(); }}>
                            <Pencil size={18} aria-hidden="true" />
                            <span><strong>{t('plan2.editPrefs')}</strong></span>
                        </button>
                    </li>
                </ul>
            </Sheet>

            <PlaceSheet planner={p} onCheckIn={user ? setCheckInPlace : undefined} />
            <CheckInSheet key={checkInPlace?.place_id || 'none'} place={checkInPlace} onClose={() => setCheckInPlace(null)} onSubmit={p.checkIn} />
        </div>
    );
};

export default PlanResult;
