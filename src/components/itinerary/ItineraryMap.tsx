import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLanguage } from '../../services/i18n';
import type { TimeOfDay } from '../../types';
import './ItineraryMap.css';

declare global {
    interface Window {
        google: any;
    }
}

interface Location {
    lat: number;
    lng: number;
}

interface Place {
    name: string;
    location: Location;
    address?: string;
    timeSlot?: TimeOfDay;
}

interface ItineraryMapProps {
    places: Place[];
    center?: Location;
    selectedIndex?: number;
    onSelectPlace?: (index: number) => void;
}

// Light-theme line colours; Google Maps needs literal values.
const SLOT_COLOR: Record<TimeOfDay, string> = {
    morning: '#0B8A7E',
    afternoon: '#C98A00',
    evening: '#CC3F67',
    night: '#3A47B5',
};
const INK = '#18213D';

const MAP_STYLE = [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#CBD8DF' }] },
    { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#F1F3EE' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#D3D8CF' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4E5770' }] },
];

function stationIcon(label: string, color: string, active: boolean) {
    const r = active ? 15 : 12;
    const size = r * 2 + 6;
    const c = size / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${c}" cy="${c}" r="${r}" fill="${active ? color : '#FFFFFF'}" stroke="${color}" stroke-width="4"/>
        <text x="${c}" y="${c + 4.5}" text-anchor="middle" font-family="Overpass, Arial, sans-serif" font-size="${active ? 14 : 12}" font-weight="800" fill="${active ? '#FFFFFF' : INK}">${label}</text>
    </svg>`;
    return { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg), size };
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({ places, center, selectedIndex = -1, onSelectPlace }) => {
    const { t } = useLanguage();
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const overlaysRef = useRef<any[]>([]);
    const fittedKey = useRef('');
    const [visibleTick, setVisibleTick] = useState(0);
    const selectRef = useRef(onSelectPlace);
    useLayoutEffect(() => { selectRef.current = onSelectPlace; });

    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) return;
        const initial = center || places.find((p) => p.location?.lat)?.location || { lat: 25.033, lng: 121.5654 };
        setMap(new window.google.maps.Map(mapRef.current, {
            center: initial,
            zoom: 14,
            styles: MAP_STYLE,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'cooperative',
        }));
        // the map is created once; later centre/places changes are handled below
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Maps created while hidden (display: none) fit to a 0×0 box; refit once it becomes visible.
    useEffect(() => {
        const el = mapRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        let wasHidden = el.offsetWidth === 0;
        const ro = new ResizeObserver(() => {
            const hidden = el.offsetWidth === 0;
            if (wasHidden && !hidden) {
                fittedKey.current = '';
                setVisibleTick((n) => n + 1);
            }
            wasHidden = hidden;
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [map]);

    useEffect(() => {
        if (!map || !window.google?.maps) return;
        const g = window.google.maps;
        if (mapRef.current && mapRef.current.offsetWidth === 0) return;
        overlaysRef.current.forEach((o) => o.setMap(null));
        overlaysRef.current = [];

        const valid = places
            .map((p, index) => ({ ...p, index }))
            .filter((p) => p.location && Number.isFinite(p.location.lat) && Number.isFinite(p.location.lng));
        if (valid.length === 0) return;

        const bounds = new g.LatLngBounds();

        // One polyline per consecutive run of the same slot, so the map matches the line diagram.
        for (let i = 1; i < valid.length; i++) {
            const a = valid[i - 1];
            const b = valid[i];
            overlaysRef.current.push(new g.Polyline({
                map,
                path: [a.location, b.location],
                strokeColor: b.timeSlot ? SLOT_COLOR[b.timeSlot] : INK,
                strokeOpacity: 0.9,
                strokeWeight: 5,
            }));
        }

        valid.forEach((p) => {
            const active = p.index === selectedIndex;
            const icon = stationIcon(String(p.index + 1), p.timeSlot ? SLOT_COLOR[p.timeSlot] : INK, active);
            const marker = new g.Marker({
                map,
                position: p.location,
                title: p.name,
                icon: {
                    url: icon.url,
                    scaledSize: new g.Size(icon.size, icon.size),
                    anchor: new g.Point(icon.size / 2, icon.size / 2),
                },
                zIndex: active ? 200 : 100 + p.index,
            });
            marker.addListener('click', () => selectRef.current?.(p.index));
            overlaysRef.current.push(marker);
            bounds.extend(p.location);
        });

        // Only refit when the set of places changes, not on selection.
        const key = valid.map((p) => `${p.location.lat},${p.location.lng}`).join('|');
        if (key !== fittedKey.current) {
            fittedKey.current = key;
            map.fitBounds(bounds, 48);
            const once = g.event.addListenerOnce(map, 'idle', () => {
                if (map.getZoom() > 16) map.setZoom(16);
            });
            overlaysRef.current.push({ setMap: () => g.event.removeListener(once) });
        } else if (selectedIndex >= 0 && places[selectedIndex]?.location) {
            map.panTo(places[selectedIndex].location);
        }
    }, [map, places, selectedIndex, visibleTick]);

    if (!window.google?.maps) {
        return <div className="itinerary-map itinerary-map--empty"><p>{t('map.error.load')}</p></div>;
    }

    if (places.length === 0) {
        return <div className="itinerary-map itinerary-map--empty"><p>{t('map.noData')}</p></div>;
    }

    return <div ref={mapRef} className="itinerary-map" role="region" aria-label={t('plan2.map')} />;
};

export default ItineraryMap;
