import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../services/i18n';
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
    address: string;
}

interface ItineraryMapProps {
    places: Place[];
    center?: Location;
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({ places, center }) => {
    const { t } = useLanguage();
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);

    // Create custom numbered marker icon
    const createMarkerIcon = (index: number, total: number) => {
        const isStart = index === 0;
        const isEnd = index === total - 1;
        const color = isStart ? '#10b981' : isEnd ? '#ef4444' : '#ff6b4a'; // Coral for waypoints
        const label = isStart ? t('map.start') : isEnd ? t('map.end') : `${index + 1}`;

        // Use a simpler circle for intermediate points as per guidelines
        if (!isStart && !isEnd) {
            const svg = `
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="3"/>
                    <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="white" font-family="Arial">${label}</text>
                </svg>
            `;
            return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        }

        // Pin shape for Start and End
        const svg = `
            <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 28 20 28s20-13 20-28c0-11.05-8.95-20-20-20z" fill="${color}"/>
                <circle cx="20" cy="18" r="14" fill="white"/>
                <text x="20" y="22" text-anchor="middle" font-size="${isStart || isEnd ? '8' : '12'}" font-weight="bold" fill="${color}" font-family="Arial">${label}</text>
            </svg>
        `;
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };

    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        const initialCenter = center || (places.length > 0 ? places[0].location : { lat: 25.0330, lng: 121.5654 });

        const newMap = new window.google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 14,
            styles: [
                { featureType: "poi", stylers: [{ visibility: "off" }] },
                { featureType: "transit", stylers: [{ visibility: "off" }] },
                { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#e3f2fd" }] },
                { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#fafafa" }] },
                { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] }
            ],
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });

        setMap(newMap);
    }, []);

    useEffect(() => {
        if (!map || !window.google || places.length === 0) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Clear existing polyline
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
        }

        // Create bounds to fit all markers
        const bounds = new window.google.maps.LatLngBounds();

        // Add numbered markers
        places.forEach((place, index) => {
            if (!place.location || !place.location.lat || !place.location.lng) return;

            const isStart = index === 0;
            const isEnd = index === places.length - 1;

            // Simple visual offset for dense markers
            let position = { ...place.location };
            const minDistance = 0.0001; // Approx 10 meters
            markersRef.current.forEach(m => {
                const pos = m.getPosition();
                if (Math.abs(pos.lat() - position.lat) < minDistance && Math.abs(pos.lng() - position.lng) < minDistance) {
                    position.lat += (Math.random() - 0.5) * 0.0002;
                    position.lng += (Math.random() - 0.5) * 0.0002;
                }
            });

            const marker = new window.google.maps.Marker({
                position: position,
                map: map,
                title: place.name,
                icon: {
                    url: createMarkerIcon(index, places.length),
                    scaledSize: isStart || isEnd ? new window.google.maps.Size(40, 48) : new window.google.maps.Size(32, 32),
                    anchor: isStart || isEnd ? new window.google.maps.Point(20, 48) : new window.google.maps.Point(16, 16),
                },
                animation: window.google.maps.Animation.DROP,
                zIndex: isStart || isEnd ? 100 : 50,
            });

            // Add info window
            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 12px; max-width: 220px; font-family: sans-serif;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="background: ${isStart ? '#10b981' : isEnd ? '#ef4444' : '#ff6b4a'}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">
                                ${index + 1}
                            </span>
                            <strong style="font-size: 15px; color: #1f2937;">${place.name}</strong>
                        </div>
                        <p style="font-size: 13px; color: #6b7280; margin: 0; line-height: 1.4;">${place.address || ''}</p>
                        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af;">
                            ${t('map.viewDetails')}
                        </div>
                    </div>
                `,
            });

            marker.addListener('click', () => {
                // Close other info windows if needed (optional, Google Maps usually handles this)
                infoWindow.open(map, marker);
            });

            markersRef.current.push(marker);
            bounds.extend(position);
        });

        // Draw simple polyline connecting all points
        if (places.length >= 2) {
            const path = places
                .filter(p => p.location && p.location.lat && p.location.lng)
                .map(p => p.location);

            polylineRef.current = new window.google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: '#ff6b4a', // Coral
                strokeOpacity: 0.7,
                strokeWeight: 3,
                icons: [{
                    icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 3,
                        strokeColor: '#ff6b4a',
                        fillColor: '#ff6b4a',
                        fillOpacity: 1,
                        strokeWeight: 1,
                    },
                    offset: '5%', // Only at the start direction
                }]
            });
            polylineRef.current.setMap(map);
        }

        // Fit map to bounds with padding
        if (places.length > 0) {
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

            // Don't zoom in too much for single markers
            const listener = window.google.maps.event.addListener(map, 'idle', () => {
                if (map.getZoom() > 16) map.setZoom(16);
                window.google.maps.event.removeListener(listener);
            });
        }

    }, [map, places]);

    if (places.length === 0) {
        return (
            <div className="itinerary-map-container">
                <div className="itinerary-map-empty">
                    <p>{t('map.noData')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="itinerary-map-container">
            <div ref={mapRef} className="itinerary-map" />
            <div className="map-legend">
                {places.slice(0, 5).map((place, i) => (
                    <div key={i} className="legend-item">
                        <span className="legend-number">{i + 1}</span>
                        <span className="legend-name">{place.name}</span>
                    </div>
                ))}
                {places.length > 5 && (
                    <div className="legend-item legend-more">{t('map.morePlaces', { n: places.length - 5 })}</div>
                )}
            </div>
        </div>
    );
};
