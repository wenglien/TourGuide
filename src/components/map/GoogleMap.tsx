import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../../services/i18n';
import './GoogleMap.css';

interface GoogleMapProps {
    center: { lat: number; lng: number };
    zoom?: number;
    places?: Array<{
        name: string;
        location: { lat: number; lng: number };
        placeId?: string;
    }>;
    height?: string;
}

declare global {
    interface Window {
        google: any;
    }
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
    center,
    zoom = 13,
    places = [],
    height = '400px',
}) => {
    const { t } = useLanguage();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        if (!mapRef.current || !window.google) {
            return;
        }

        // Initialize map
        const map = new window.google.maps.Map(mapRef.current, {
            center,
            zoom,
            styles: [
                { featureType: "poi", stylers: [{ visibility: "off" }] },
                { featureType: "transit", stylers: [{ visibility: "off" }] },
                { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#e3f2fd" }] },
                { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#f5f5f5" }] },
                { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
                { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] }
            ],
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add markers for places
        places.forEach((place, index) => {
            const isMainDestination = index === 0;

            // Custom SVG Marker
            const color = isMainDestination ? '#ef4444' : '#3b82f6'; // Red for destination, Blue for nearby
            const scale = isMainDestination ? 1.2 : 1.0;

            const marker = new window.google.maps.Marker({
                position: place.location,
                map,
                title: place.name,
                animation: isMainDestination ? window.google.maps.Animation.DROP : null,
                icon: {
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: color,
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                    scale: 1.5 * scale,
                    anchor: new window.google.maps.Point(12, 24),
                },
                zIndex: isMainDestination ? 1000 : 100,
            });

            // Add info window
            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding: 10px; font-family: sans-serif; min-width: 150px;">
                        <div style="font-weight: bold; color: ${color}; margin-bottom: 4px;">
                            ${isMainDestination ? t('map.destination') : t('map.recommended')}
                        </div>
                        <div style="font-weight: 600; font-size: 14px; color: #1f2937;">${place.name}</div>
                    </div>
                `,
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });

            markersRef.current.push(marker);
        });

        // Fit bounds if there are places
        if (places.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            places.forEach(place => {
                bounds.extend(place.location);
            });
            map.fitBounds(bounds);
        }
    }, [center, zoom, places]);

    return (
        <div
            ref={mapRef}
            className="google-map"
            style={{ height, width: '100%' }}
        />
    );
};

