import React, { useState } from 'react';
import { LocateFixed } from 'lucide-react';
import { useLanguage } from '../../services/i18n';
import { useFeedback } from '../../ui/feedbackContext';
import { POPULAR_PLACES } from '../../data/popularPlaces';
import type { Planner } from '../plan/usePlanner';

type LatLng = { lat: number; lng: number };

/** Short name for a coordinate: neighbourhood or district rather than a street address. */
function reverseGeocode(loc: LatLng, language: string): Promise<string | null> {
    return new Promise((resolve) => {
        const g = (window as any).google?.maps;
        if (!g?.Geocoder) { resolve(null); return; }
        new g.Geocoder().geocode({ location: loc, language }, (results: any[], status: string) => {
            if (status !== 'OK' || !results?.length) { resolve(null); return; }
            const prefer = ['neighborhood', 'sublocality_level_1', 'sublocality', 'administrative_area_level_3', 'locality', 'administrative_area_level_2'];
            for (const type of prefer) {
                for (const r of results) {
                    const comp = r.address_components?.find((c: any) => c.types.includes(type));
                    if (comp) { resolve(comp.long_name); return; }
                }
            }
            resolve(results[0].formatted_address || null);
        });
    });
}

/** Ways to fill the destination in one tap, shown while it's still empty. */
export const QuickStart: React.FC<{ planner: Planner }> = ({ planner: p }) => {
    const { t, language } = useLanguage();
    const { toast } = useFeedback();
    const [locating, setLocating] = useState(false);
    const li = language === 'en' ? 1 : 0;

    const useMyLocation = () => {
        if (!navigator.geolocation) { toast(t('quick.locate.unsupported'), 'error'); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                const name = await reverseGeocode(loc, language === 'en' ? 'en' : 'zh-TW');
                p.setDestination(name || t('quick.locate.here'), loc);
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                toast(err.code === err.PERMISSION_DENIED ? t('quick.locate.denied') : t('quick.locate.failed'), 'error');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
        );
    };

    const pick = (id: string) => {
        const place = POPULAR_PLACES.find((x) => x.id === id);
        if (!place) return;
        p.setDestination(place.name[li]);
        if (p.preferences.categories.length === 0) {
            p.setPreferences((prev) => ({ ...prev, categories: place.interests }));
        }
    };

    return (
        <div className="quick" aria-label={t('quick.label')} role="group">
            <button type="button" className="quick__locate" onClick={useMyLocation} disabled={locating}>
                {locating ? <span className="spinner" aria-hidden="true" /> : <LocateFixed size={16} aria-hidden="true" />}
                {locating ? t('quick.locate.busy') : t('quick.locate')}
            </button>
            <ul className="quick__places">
                {POPULAR_PLACES.map((place) => (
                    <li key={place.id}>
                        <button type="button" className="quick__place" onClick={() => pick(place.id)}>
                            {place.name[li]}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QuickStart;
