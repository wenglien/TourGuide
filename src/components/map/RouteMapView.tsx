import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../services/i18n';
import './RouteMapView.css';
import type { RoutePlace, GeneratedRoute } from '../../services/routeService';

interface RouteMapViewProps {
    route: GeneratedRoute;
    height?: string;
    showDirections?: boolean;
    onPlaceClick?: (place: RoutePlace) => void;
}

declare global {
    interface Window {
        google: any;
    }
}

export const RouteMapView: React.FC<RouteMapViewProps> = ({
    route,
    height = '450px',
    showDirections = true,
    onPlaceClick,
}) => {
    const { t } = useLanguage();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);
    const [selectedPlace, setSelectedPlace] = useState<RoutePlace | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) {
            return;
        }

        // Calculate bounds and center
        const bounds = new window.google.maps.LatLngBounds();
        route.places.forEach(place => {
            bounds.extend(place.location);
        });

        const center = bounds.getCenter();

        // Initialize map
        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: center.lat(), lng: center.lng() },
            zoom: 14,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'on' }],
                },
                {
                    featureType: 'transit',
                    elementType: 'labels.icon',
                    stylers: [{ visibility: 'on' }],
                },
            ],
        });

        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Clear existing polyline
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
        }

        // Add markers for each place
        route.places.forEach((place, index) => {
            const isStart = index === 0;
            const isEnd = index === route.places.length - 1;

            // Create custom marker icon
            const markerIcon = {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: isStart || isEnd ? 12 : 10,
                fillColor: isStart ? '#10B981' : isEnd ? '#EF4444' : '#6366F1',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
            };

            const marker = new window.google.maps.Marker({
                position: place.location,
                map,
                title: place.name,
                icon: markerIcon,
                label: {
                    text: isStart ? 'S' : isEnd ? 'E' : `${index}`,
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                },
                animation: window.google.maps.Animation.DROP,
                zIndex: isStart || isEnd ? 100 : 50,
            });

            // Create rich info window content
            const infoContent = `
        <div style="padding: 12px; max-width: 280px; font-family: 'Noto Sans TC', sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937; font-weight: 600;">
            ${place.name}
          </h3>
          ${place.category ? `<span style="display: inline-block; padding: 2px 8px; background: #EEF2FF; color: #4F46E5; border-radius: 4px; font-size: 12px; margin-bottom: 8px;">${place.category}</span>` : ''}
          ${place.rating ? `<div style="color: #F59E0B; font-size: 14px; margin-bottom: 4px;">Rating ${place.rating}</div>` : ''}
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; line-height: 1.4;">
            ${place.address}
          </p>
          ${place.reason ? `<p style="margin: 0; font-size: 13px; color: #374151; font-style: italic; background: #F9FAFB; padding: 8px; border-radius: 6px;">"${place.reason}"</p>` : ''}
          ${place.estimatedStayTime ? `<div style="margin-top: 8px; font-size: 12px; color: #9CA3AF;">${t('route.planner.stayTime', { n: place.estimatedStayTime })}</div>` : ''}
        </div>
      `;

            const infoWindow = new window.google.maps.InfoWindow({
                content: infoContent,
            });

            marker.addListener('click', () => {
                // Close all other info windows
                markersRef.current.forEach(m => m._infoWindow?.close());
                infoWindow.open(map, marker);
                setSelectedPlace(place);
                onPlaceClick?.(place);
            });

            marker._infoWindow = infoWindow;
            markersRef.current.push(marker);
        });

        // Draw route polyline if available
        if (showDirections && route.route?.polylinePath && route.route.polylinePath.length > 0) {
            const polyline = new window.google.maps.Polyline({
                path: route.route.polylinePath,
                geodesic: true,
                strokeColor: '#6366F1',
                strokeOpacity: 0.8,
                strokeWeight: 4,
                icons: [
                    {
                        icon: {
                            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: 3,
                            fillColor: '#6366F1',
                            fillOpacity: 1,
                            strokeWeight: 0,
                        },
                        offset: '100%',
                        repeat: '150px',
                    },
                ],
            });

            polyline.setMap(map);
            polylineRef.current = polyline;
        }

        // Fit map to bounds
        map.fitBounds(bounds, { padding: 60 });

        setIsMapReady(true);

        // Cleanup
        return () => {
            markersRef.current.forEach(marker => marker.setMap(null));
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
            }
        };
    }, [route, showDirections, onPlaceClick]);

    return (
        <div className="route-map-view">
            <div
                ref={mapRef}
                className="route-map-view__map"
                style={{ height }}
            />

            {!isMapReady && (
                <div className="route-map-view__loading">
                    <div className="route-map-view__loading-spinner" />
                    <span>{t('map.loading.map')}</span>
                </div>
            )}

            {/* Route summary overlay */}
            {route.route && (
                <div className="route-map-view__summary">
                    <div className="route-map-view__summary-item">
                        <span className="route-map-view__summary-label">{t('map.distance')}</span>
                        <span className="route-map-view__summary-value">{route.route.totalDistance}</span>
                    </div>
                    <div className="route-map-view__summary-item">
                        <span className="route-map-view__summary-label">{t('map.time')}</span>
                        <span className="route-map-view__summary-value">{route.route.totalDuration}</span>
                    </div>
                    <div className="route-map-view__summary-item">
                        <span className="route-map-view__summary-label">{t('map.spots')}</span>
                        <span className="route-map-view__summary-value">{route.places.length}</span>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="route-map-view__legend">
                <div className="route-map-view__legend-item">
                    <span className="route-map-view__legend-marker route-map-view__legend-marker--start">S</span>
                    <span>{t('map.start')}</span>
                </div>
                <div className="route-map-view__legend-item">
                    <span className="route-map-view__legend-marker route-map-view__legend-marker--waypoint">1</span>
                    <span>{t('map.waypoint')}</span>
                </div>
                <div className="route-map-view__legend-item">
                    <span className="route-map-view__legend-marker route-map-view__legend-marker--end">E</span>
                    <span>{t('map.end')}</span>
                </div>
            </div>

            {/* Selected place detail card */}
            {selectedPlace && (
                <div className="route-map-view__place-card">
                    <button
                        className="route-map-view__place-card-close"
                        onClick={() => setSelectedPlace(null)}
                    >
                        Close
                    </button>
                    {selectedPlace.photos?.[0] && (
                        <div
                            className="route-map-view__place-card-image"
                            style={{ backgroundImage: `url(${selectedPlace.photos[0]})` }}
                        />
                    )}
                    <div className="route-map-view__place-card-content">
                        <h4>{selectedPlace.name}</h4>
                        {selectedPlace.rating && (
                            <div className="route-map-view__place-card-rating">
                                Rating {selectedPlace.rating}
                            </div>
                        )}
                        <p>{selectedPlace.address}</p>
                        {selectedPlace.reason && (
                            <p className="route-map-view__place-card-reason">"{selectedPlace.reason}"</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteMapView;
