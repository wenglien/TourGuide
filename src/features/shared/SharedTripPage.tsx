import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navigation, Share2 } from 'lucide-react';
import { subscribeToItinerary } from '../../services/dbService';
import { ItineraryMap } from '../../components/itinerary/ItineraryMap';
import { RouteLine, type Segment } from '../route-line/RouteLine';
import { useLanguage } from '../../services/i18n';
import { useFeedback } from '../../ui/feedbackContext';
import { hydrateTrailCache, mapsDirectionsUrl, placeAddress, resolveSlots, stationTimes } from '../../lib/itinerary';
import type { GeneratedItinerary } from '../../types';
import '../plan/plan.css';

export const SharedTripPage: React.FC = () => {
    const { t } = useLanguage();
    const { toast } = useFeedback();
    const { id } = useParams<{ id: string }>();
    const [trip, setTrip] = useState<any | null>(null);
    const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
    const [selected, setSelected] = useState(-1);

    useEffect(() => {
        if (!id) return;
        const unsubscribe = subscribeToItinerary(id, (data) => {
            if (data) {
                hydrateTrailCache(data.trailData);
                setTrip(data);
                setState('ready');
            } else {
                setState('missing');
            }
        });
        return () => unsubscribe();
    }, [id]);

    const slots = useMemo(
        () => resolveSlots(trip?.trail as GeneratedItinerary | undefined, trip?.preferences?.pace, trip?.preferences?.startTime),
        [trip],
    );
    const places = useMemo(
        () => slots.flatMap(({ slot, trail }) => trail.places
            .filter((p) => p.location && Number.isFinite(p.location.lat))
            .map((p) => ({ name: p.name, address: placeAddress(p), location: p.location!, timeSlot: slot }))),
        [slots],
    );

    if (state === 'loading') return <div className="loading-screen"><span className="spinner" aria-label={t('common.loading')} /></div>;
    if (state === 'missing') {
        return (
            <div className="page">
                <div className="empty">
                    <h1 className="page-title">{t('shared.missing.title')}</h1>
                    <p>{t('shared.missing.desc')}</p>
                    <Link to="/" className="btn btn-primary">{t('shared.cta')}</Link>
                </div>
            </div>
        );
    }

    let flat = 0;
    const segments: Segment[] = slots.map(({ slot, trail, startTime }) => {
        const times = stationTimes(startTime, trail, () => undefined);
        return {
            key: `${slot}-${trail.id}`,
            slot,
            slotLabel: t(`slot.${slot}`),
            startTime,
            title: trail.title,
            description: trail.description,
            stations: trail.places.map((p, i) => {
                const index = p.location ? flat++ : -1;
                return {
                    key: p.place_id || `${trail.id}-${i}`,
                    name: p.name,
                    time: times[i],
                    address: placeAddress(p),
                    active: index >= 0 && index === selected,
                    onSelect: index >= 0 ? () => setSelected(index) : undefined,
                    actions: (
                        <a className="btn btn-ghost btn-sm" href={mapsDirectionsUrl(p)} target="_blank" rel="noopener noreferrer">
                            <Navigation size={14} aria-hidden="true" /> {t('plan2.place.navigate')}
                        </a>
                    ),
                };
            }),
        };
    });

    const share = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title: t('public.tripTitle', { city: trip.city }), url }); return; } catch (e: any) {
                if (e?.name === 'AbortError') return;
            }
        }
        try { await navigator.clipboard.writeText(url); toast(t('plan2.toast.linkCopied')); } catch { toast(url); }
    };

    return (
        <div className="page">
            <div className="plan-result">
                <header className="result-head">
                    <div>
                        <h1 className="result-head__city">{trip.city}</h1>
                        <p className="result-head__date num">{trip.date}</p>
                    </div>
                    <div className="result-map__actions">
                        <button className="btn btn-secondary" onClick={share}><Share2 size={16} aria-hidden="true" /> {t('public.share')}</button>
                        <Link to="/" className="btn btn-primary">{t('shared.cta')}</Link>
                    </div>
                </header>
                <div className="result-body result-body--line">
                    <section className="result-line"><RouteLine segments={segments} selectLabel={t('walk2.showOnMap')} /></section>
                    <aside className="result-side">
                        <div className="result-map">
                            <ItineraryMap places={places} selectedIndex={selected} onSelectPlace={setSelected} />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default SharedTripPage;
