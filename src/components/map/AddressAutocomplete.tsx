import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../services/i18n';
import './AddressAutocomplete.css';

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, location?: { lat: number; lng: number }) => void;
    placeholder?: string;
    className?: string;
}

declare global {
    interface Window {
        google: any;
    }
}

// Helper function to wait for Google Maps API to load
function waitForGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps && window.google.maps.places) {
            resolve();
            return;
        }

        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        const checkInterval = setInterval(() => {
            attempts++;
            if (window.google && window.google.maps && window.google.maps.places) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('Google Maps API failed to load'));
            }
        }, 100);
    });
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value,
    onChange,
    placeholder,
    className = '',
}) => {
    const { t, language } = useLanguage();
    const defaultPlaceholder = t('generator.destination.placeholder');
    const finalPlaceholder = placeholder || defaultPlaceholder;
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<any[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);

    const autocompleteService = useRef<any>(null);
    const placesService = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;

        // Wait for Google Maps API to load
        waitForGoogleMaps()
            .then(() => {
                if (!isMounted) return;

                try {
                    // Initialize services
                    autocompleteService.current = new window.google.maps.places.AutocompleteService();
                    // PlacesService requires a DOM element, we create a dummy one
                    placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));

                    setIsReady(true);
                    setError(null);
                } catch (err) {
                    console.error('Error initializing maps services:', err);
                    if (isMounted) {
                        setError(t('map.error.service'));
                        setIsReady(false);
                    }
                }
            })
            .catch((err) => {
                console.error('Google Maps API not loaded:', err);
                if (isMounted) {
                    setError(t('map.error.load'));
                    setIsReady(false);
                }
            });

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowPredictions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            isMounted = false;
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val); // Update parent state immediately

        if (!val.trim() || !autocompleteService.current) {
            setPredictions([]);
            setShowPredictions(false);
            return;
        }

        // Fetch predictions
        autocompleteService.current.getPlacePredictions({
            input: val,
            // types: ['geocode', 'establishment'], // Remove restriction to get more results
            language: language === 'en' ? 'en' : 'zh-TW',
        }, (results: any[], status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                setPredictions(results);
                setShowPredictions(true);
            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                setPredictions([]);
                setShowPredictions(true); // Show "No results" message
            } else {
                console.warn('Places prediction failed:', status);
                setPredictions([]);
                setShowPredictions(false);
            }
        });
    };

    const handleSelectPrediction = (prediction: any) => {
        // Update input with the main text or description
        const address = prediction.description;
        onChange(address);
        setShowPredictions(false);

        // Get place details to get coordinates
        if (placesService.current) {
            placesService.current.getDetails({
                placeId: prediction.place_id,
                fields: ['geometry', 'formatted_address', 'name']
            }, (place: any, status: any) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
                    const location = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                    };
                    // Update parent with full details
                    onChange(place.formatted_address || place.name || address, location);
                }
            });
        }
    };

    return (
        <div className={`address-autocomplete ${className}`} ref={containerRef}>
            <input
                type="text"
                className="input address-autocomplete__input"
                placeholder={finalPlaceholder}
                value={value}
                onChange={handleInputChange}
                onFocus={() => {
                    if (value.trim() && predictions.length > 0) {
                        setShowPredictions(true);
                    }
                }}
                disabled={false} // Always allow typing
            />

            {/* Custom Dropdown */}
            {showPredictions && (
                <div className="address-autocomplete__dropdown">
                    {predictions.length > 0 ? (
                        predictions.map((prediction) => (
                            <div
                                key={prediction.place_id}
                                className="address-autocomplete__item"
                                onClick={() => handleSelectPrediction(prediction)}
                            >

                                <div className="address-autocomplete__text">
                                    <span className="address-autocomplete__main-text">
                                        {prediction.structured_formatting?.main_text || prediction.description}
                                    </span>
                                    <span className="address-autocomplete__secondary-text">
                                        {prediction.structured_formatting?.secondary_text || ''}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="address-autocomplete__item" style={{ cursor: 'default', color: 'var(--text-tertiary)' }}>
                            {t('map.noResults')}
                        </div>
                    )}
                    <div className="address-autocomplete__item" style={{ cursor: 'default', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color-light)' }}>
                        <img
                            src="https://developers.google.com/maps/documentation/images/powered_by_google_on_white.png"
                            alt="Powered by Google"
                            style={{ height: '14px' }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div style={{
                    marginTop: 'var(--space-2)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--error)',
                }}>
                    {error}
                </div>
            )}
            {!isReady && !error && (
                <div style={{
                    marginTop: 'var(--space-2)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)',
                }}>
                    {t('map.loading')}
                </div>
            )}
        </div>
    );
};
