import React, { useEffect, useState } from 'react';
import { useLanguage } from '../services/i18n';
import { useParams } from 'react-router-dom';
import { subscribeToItinerary } from '../services/dbService';
import { ItineraryMap } from '../components/itinerary/ItineraryMap';
import { getTrailById } from '../data/trails';
import { getAITrail } from '../services/aiItineraryService';
import type { GeneratedItinerary, TrailScore, TimeOfDay } from '../types';
import '../components/itinerary/ItineraryGenerator.css';

export const PublicItinerary: React.FC = () => {
    const { t } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const [itinerary, setItinerary] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!id) return;

        const unsubscribe = subscribeToItinerary(id, (data) => {
            if (data) {
                // Restore trail data to cache if available
                if (data.trailData) {
                    (window as any).__aiTrails = (window as any).__aiTrails || {};
                    Object.entries(data.trailData).forEach(([trailId, trail]) => {
                        (window as any).__aiTrails[trailId] = trail;
                    });
                }
                setItinerary(data);
            } else {
                setError(t('public.notFound'));
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    const handleShare = async () => {
        const shareUrl = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('public.tripTitle', { city: itinerary.city }),
                    text: t('public.shareText', { city: itinerary.city }),
                    url: shareUrl
                });
            } catch (err) {
                // User cancelled or error
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openGoogleMaps = (place: any) => {
        const { location, name } = place;
        if (location?.lat && location?.lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}&destination_place_id=${encodeURIComponent(name)}`;
            window.open(url, '_blank');
        }
    };

    if (loading) return <div className="loading-screen"><div className="premium-loader"></div></div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!itinerary) return null;

    const result = itinerary.trail as GeneratedItinerary;

    return (
        <div className="itinerary-generator">
            <div className="generator__header">
                <h1 className="generator__title">{t('public.tripTitle', { city: itinerary.city })}</h1>
                <p className="generator__subtitle">
                    {t('public.sharedBy', {
                        date: itinerary.date,
                        user: itinerary.userId ? t('public.user') : t('public.guest')
                    })}
                </p>
                <button className="btn btn-primary share-btn" onClick={handleShare}>
                    {copied ? t('public.copied') : t('public.share')}
                </button>
            </div>

            <div className="generator__step animate-fadeIn">
                <div className="generator__map-section">
                    <h3 className="section-title">{t('public.mapTitle')}</h3>
                    <ItineraryMap
                        places={Object.values(result)
                            .filter((slot): slot is TrailScore => typeof slot === 'object' && 'trailId' in slot)
                            .flatMap(slot => {
                                const trail = getAITrail(slot.trailId) || getTrailById(slot.trailId);
                                return trail?.places || [];
                            })
                            .map(p => ({
                                name: p.name,
                                location: p.location,
                                address: p.address || p.formatted_address
                            }))
                        }
                    />
                </div>

                <div className="generator__timeline">
                    {(['morning', 'afternoon', 'evening', 'night'] as TimeOfDay[]).map((timeSlot) => {
                        const trailScore = result[timeSlot];
                        if (!trailScore) return null;
                        const trail = getAITrail(trailScore.trailId) || getTrailById(trailScore.trailId);
                        if (!trail) return null;

                        return (
                            <div key={timeSlot} className="generator__slot">
                                <div className="generator__slot-time">
                                    <span className="slot-label">
                                        {t(`slot.${timeSlot}`)}
                                    </span>
                                </div>
                                <div className="generator__slot-content">
                                    <div className="generator__slot-card">
                                        <div className="generator__slot-trail">
                                            <h4 className="slot-trail-title">{trail.title}</h4>
                                            <p className="slot-trail-desc">{trail.description}</p>
                                            <div className="slot-trail-places">
                                                {trail.places.map((place: any, idx: number) => (
                                                    <div key={idx} className="slot-place-item">
                                                        <div className="place-marker">
                                                            <span className="place-index">{idx + 1}</span>
                                                            {idx < trail.places.length - 1 && <div className="place-line" />}
                                                        </div>
                                                        <div className="place-content">
                                                            <span className="place-name">{place.name}</span>
                                                            <span className="place-address">{place.address}</span>
                                                            {place.location && (
                                                                <button
                                                                    className="navigate-btn"
                                                                    onClick={() => openGoogleMaps(place)}
                                                                >
                                                                    {t('public.navigate')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
