import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../services/i18n';
import './AddressAutocomplete.css';

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, location?: { lat: number; lng: number }) => void;
    placeholder?: string;
    className?: string;
    inputId?: string;
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
    inputId,
}) => {
    const { t, language } = useLanguage();
    const defaultPlaceholder = t('generator.destination.placeholder');
    const finalPlaceholder = placeholder || defaultPlaceholder;
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<any[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const listId = `${inputId || 'address'}-options`;

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

    const handleSelectPrediction = (e: React.SyntheticEvent | null, prediction: any) => {
        // Prevent the event from bubbling up
        e?.preventDefault();
        e?.stopPropagation();
        setActiveIndex(-1);

        // Update input with the main text or description
        // Keep the short, recognisable name ("台北101", "大稻埕"), not the full postal address.
        const address = prediction.structured_formatting?.main_text || prediction.description;
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
                    onChange(address || place.name || place.formatted_address, location);
                }
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showPredictions || predictions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % predictions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? predictions.length - 1 : i - 1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            handleSelectPrediction(e, predictions[activeIndex]);
        } else if (e.key === 'Escape') {
            setShowPredictions(false);
        }
    };

    return (
        <div className={`address-autocomplete ${className}`} ref={containerRef}>
            <input
                id={inputId}
                type="text"
                className="input address-autocomplete__input"
                placeholder={finalPlaceholder}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (value.trim() && predictions.length > 0) {
                        setShowPredictions(true);
                    }
                }}
                role="combobox"
                aria-expanded={showPredictions}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                autoComplete="off"
            />

            {showPredictions && (
                <div className="address-autocomplete__dropdown">
                    <ul id={listId} role="listbox">
                        {predictions.map((prediction, i) => (
                            <li
                                id={`${listId}-${i}`}
                                key={prediction.place_id}
                                role="option"
                                aria-selected={i === activeIndex}
                                className={`address-autocomplete__item ${i === activeIndex ? 'is-active' : ''}`}
                                onMouseDown={(e) => handleSelectPrediction(e, prediction)}
                                onMouseEnter={() => setActiveIndex(i)}
                            >
                                <span className="address-autocomplete__main-text">
                                    {prediction.structured_formatting?.main_text || prediction.description}
                                </span>
                                <span className="address-autocomplete__secondary-text">
                                    {prediction.structured_formatting?.secondary_text || ''}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {predictions.length === 0 && (
                        <p className="address-autocomplete__empty">{t('map.noResults')}</p>
                    )}
                    <div className="address-autocomplete__attribution">
                        <img
                            src="https://developers.google.com/maps/documentation/images/powered_by_google_on_white.png"
                            alt="Powered by Google"
                        />
                    </div>
                </div>
            )}

            {error && <p className="address-autocomplete__status is-error">{error}</p>}
            {!isReady && !error && <p className="address-autocomplete__status">{t('map.loading')}</p>}
        </div>
    );
};
