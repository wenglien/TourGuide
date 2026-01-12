import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ItineraryGenerator.css';
import type { UserPreferences, PreferenceCategory, TravelPace, WalkingLevel, GeneratedItinerary, TimeOfDay, TrailScore, MultiDayItinerary, TripDuration } from '../../types';
import { generateItinerary, getRecommendedStartTimes, calculateBudgetRange, estimateTotalDuration } from '../../services/ruleEngine';
import { generateAIItinerary, getAITrail, regenerateSlot, replacePlaceInTrail, generateMultiDayItinerary, regenerateDay } from '../../services/aiItineraryService';
import { getTrailById } from '../../data/trails';
import { AddressAutocomplete } from '../map/AddressAutocomplete';
import { GoogleMap } from '../map/GoogleMap';
import { CompanionService, type CompanionNotification } from '../../services/companionService';
import { BudgetService, type TransportOption } from '../../services/budgetService';
import { useAuth } from '../../context/AuthContext';
import { saveItinerary, logActivity, saveCheckIn } from '../../services/dbService';
import { ItineraryMap } from './ItineraryMap';
import { DraggablePlaceList } from './DraggablePlaceList';
import { TemplateSelector } from './TemplateSelector';
import { BudgetTracker } from './BudgetTracker';
import { getWeather } from '../../services/weatherService';
import { getPersonalizedRecommendations } from '../../services/recommendationService';
import { getCrowdInfo } from '../../services/crowdService';
import { uploadPhoto, compressImage } from '../../services/storageService';
import { exportToPDF, exportToGoogleCalendar } from '../../services/exportService';
import { useLanguage } from '../../services/i18n';



export const ItineraryGenerator: React.FC = () => {
    const location = useLocation();
    const { user } = useAuth();
    const { t } = useLanguage();

    const PREFERENCE_OPTIONS: { value: PreferenceCategory; label: string }[] = [
        { value: 'food', label: t('route.category.food') },
        { value: 'walking', label: t('route.category.walking') },
        { value: 'exhibition', label: t('route.category.exhibition') },
        { value: 'photography', label: t('route.category.photography') },
        { value: 'nightlife', label: t('route.category.nightlife') },
        { value: 'shopping', label: t('route.category.shopping') },
        { value: 'culture', label: t('route.category.culture') },
    ];

    const PACE_OPTIONS: { value: TravelPace; label: string; desc: string }[] = [
        { value: 'relaxed', label: t('pace.relaxed'), desc: t('pace.relaxed.desc') },
        { value: 'moderate', label: t('pace.moderate'), desc: t('pace.moderate.desc') },
        { value: 'packed', label: t('pace.packed'), desc: t('pace.packed.desc') },
    ];

    const WALKING_OPTIONS: { value: WalkingLevel; label: string }[] = [
        { value: 'low', label: t('walking.low') },
        { value: 'medium', label: t('walking.medium') },
        { value: 'high', label: t('walking.high') },
    ];

    const PROXIMITY_OPTIONS: { value: 'close' | 'far'; label: string; desc: string }[] = [
        { value: 'close', label: t('proximity.close'), desc: t('proximity.close.desc') },
        { value: 'far', label: t('proximity.far'), desc: t('proximity.far.desc') },
    ];

    const DURATION_OPTIONS: { value: TripDuration; label: string; desc: string }[] = [
        { value: '1', label: t('duration.1'), desc: t('duration.1.desc') },
        { value: '2', label: t('duration.2'), desc: t('duration.2.desc') },
        { value: '3', label: t('duration.3'), desc: t('duration.3.desc') },
        { value: '4', label: t('duration.4'), desc: t('duration.4.desc') },
        { value: '5', label: t('duration.5'), desc: t('duration.5.desc') },
        { value: '7', label: t('duration.7'), desc: t('duration.7.desc') },
    ];
    const [step, setStep] = useState(1);
    const [preferences, setPreferences] = useState<UserPreferences>({
        city: '',
        date: new Date().toISOString().split('T')[0],
        categories: [],
        pace: 'moderate',
        maxWalkingLevel: 'medium',
        proximity: 'close',
    });
    const [isRainy, setIsRainy] = useState(false);
    const [result, setResult] = useState<GeneratedItinerary | null>(null);
    const [multiDayResult, setMultiDayResult] = useState<MultiDayItinerary | null>(null);
    const [tripDuration, setTripDuration] = useState<TripDuration>('1');
    const [activeDay, setActiveDay] = useState(1);
    const [regeneratingDay, setRegeneratingDay] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [editingSlot, setEditingSlot] = useState<TimeOfDay | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [personalizedRec, setPersonalizedRec] = useState<any>(null);
    // Budget tracking (for future use)
    const [_budgetStatus, _setBudgetStatus] = useState<any>(null);
    const [_showBudgetTracker, _setShowBudgetTracker] = useState(false);
    const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
    const [placeCrowdInfo, setPlaceCrowdInfo] = useState<Record<string, any>>({});

    // Load saved itinerary if passed via state
    useEffect(() => {
        const savedData = location.state?.savedItinerary;
        if (savedData) {
            setPreferences(savedData.preferences || {
                city: savedData.city,
                date: savedData.date,
                categories: [],
                pace: 'moderate',
                maxWalkingLevel: 'medium',
                proximity: 'close',
            });

            // Restore trail data to cache if available
            if (savedData.trailData) {
                (window as any).__aiTrails = (window as any).__aiTrails || {};
                Object.entries(savedData.trailData).forEach(([trailId, trail]) => {
                    (window as any).__aiTrails[trailId] = trail;
                });
            }

            setResult(savedData.trail);
            setStep(3);
        }
    }, [location.state]);

    // Load personalized recommendations
    useEffect(() => {
        if (user && step === 1) {
            getPersonalizedRecommendations(user.uid, preferences).then(setPersonalizedRec);
        }
    }, [user, step]);

    // Load budget status when result is available (after saving)
    // This will be called after itinerary is saved
    const [useAI, setUseAI] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [regeneratingSlot, setRegeneratingSlot] = useState<TimeOfDay | null>(null);
    const [replacingPlaceId, setReplacingPlaceId] = useState<string | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
    const [isCompanionMode, setIsCompanionMode] = useState(false);
    const [notifications, setNotifications] = useState<CompanionNotification[]>([]);
    const [transportOptions, setTransportOptions] = useState<Record<string, TransportOption[]>>({});
    const [bookingInfo, setBookingInfo] = useState<any>(null);
    const [isCalculatingTransport, setIsCalculatingTransport] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // New: Check-in state
    const [checkInPlace, setCheckInPlace] = useState<any | null>(null);
    const [checkInNote, setCheckInNote] = useState('');
    const [checkInRating, setCheckInRating] = useState(5);
    const [checkInPhoto, setCheckInPhoto] = useState<File | null>(null);
    const [checkInPhotoPreview, setCheckInPhotoPreview] = useState<string | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);

    const toggleCategory = (category: PreferenceCategory) => {
        setPreferences(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category],
        }));
    };

    const handleGenerate = async () => {
        if (!preferences.city || preferences.city.trim() === '') {
            setError(t('generator.error.destination'));
            return;
        }
        if (preferences.categories.length === 0) {
            setError(t('generator.error.categories'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check weather first
            const weather = await getWeather(preferences.city, preferences.date);
            if (weather && weather.isRainy && !isRainy) {
                if (window.confirm(t('generator.rain.suggestion', { date: preferences.date, city: preferences.city, desc: weather.description }))) {
                    setIsRainy(true);
                }
            }

            const numberOfDays = parseInt(tripDuration);

            if (numberOfDays > 1) {
                // Multi-day itinerary
                const multiDay = await generateMultiDayItinerary(
                    preferences,
                    numberOfDays,
                    isRainy,
                    destinationLocation || undefined
                );
                setMultiDayResult(multiDay);
                setResult(multiDay.days[0].itinerary);
                setActiveDay(1);
            } else {
                // Single day itinerary
                let generated: GeneratedItinerary;
                if (useAI) {
                    generated = await generateAIItinerary(preferences, isRainy, destinationLocation || undefined);
                } else {
                    generated = generateItinerary(preferences, isRainy);
                }
                setResult(generated);
                setMultiDayResult(null);
            }

            setStep(3);

            // Log activity
            if (user) {
                logActivity(user.uid, {
                    type: 'generate',
                    title: t('generator.generate'),
                    message: t('generator.success.message', { city: preferences.city, days: numberOfDays })
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('generator.error.generic'));
            console.error('Error generating itinerary:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle day switch for multi-day itinerary
    const handleDaySwitch = (dayNumber: number) => {
        if (multiDayResult && dayNumber >= 1 && dayNumber <= multiDayResult.days.length) {
            setActiveDay(dayNumber);
            setResult(multiDayResult.days[dayNumber - 1].itinerary);
        }
    };

    // Regenerate a specific day
    const handleRegenerateDay = async (dayNumber: number) => {
        if (!multiDayResult || !destinationLocation) return;

        setRegeneratingDay(dayNumber);
        setError(null);

        try {
            const newMultiDay = await regenerateDay(
                multiDayResult,
                dayNumber,
                isRainy,
                destinationLocation
            );
            setMultiDayResult(newMultiDay);
            if (dayNumber === activeDay) {
                setResult(newMultiDay.days[dayNumber - 1].itinerary);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('generator.error.regenerate'));
        } finally {
            setRegeneratingDay(null);
        }
    };

    // Handle reorder places in a slot
    const handleReorderPlaces = (trailId: string, newPlaces: any[]) => {
        const trail = getAITrail(trailId);
        if (!trail) return;

        // Update the trail data
        const updatedTrail = {
            ...trail,
            places: newPlaces,
            orderedPlaces: newPlaces.map((p: any) => p.place_id),
        };

        // Update the stored trail
        (window as any).__aiTrails = (window as any).__aiTrails || {};
        (window as any).__aiTrails[trailId] = updatedTrail;

        // Force re-render
        setResult({ ...result! });
    };

    // Handle remove place from slot
    const handleRemovePlace = (trailId: string, placeId: string) => {
        const trail = getAITrail(trailId);
        if (!trail || trail.places.length <= 1) {
            alert(t('generator.error.minSpots'));
            return;
        }

        if (!window.confirm(t('generator.confirm.remove'))) {
            return;
        }

        const newPlaces = trail.places.filter((p: any) => p.place_id !== placeId);
        handleReorderPlaces(trailId, newPlaces);
    };

    const handleRegenerateSlot = async (timeSlot: TimeOfDay) => {
        if (!result || !destinationLocation) return;
        setRegeneratingSlot(timeSlot);
        setError(null);
        try {
            const newResult = await regenerateSlot(result, timeSlot, preferences, destinationLocation);
            setResult(newResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('generator.error.regenerate'));
        } finally {
            setRegeneratingSlot(null);
        }
    };

    const handleReplacePlace = async (trailId: string, placeId: string) => {
        if (!destinationLocation || !result) return;
        setReplacingPlaceId(placeId);
        setError(null);
        try {
            await replacePlaceInTrail(trailId, placeId, preferences, destinationLocation);
            setResult({ ...result });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('generator.error.replace'));
        } finally {
            setReplacingPlaceId(null);
        }
    };

    const handleSaveItinerary = async () => {
        if (!user || !result) return;

        setIsSaving(true);
        try {
            // Collect all trail data from cache to save with itinerary
            const trailData: Record<string, any> = {};
            const timeSlots: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
            timeSlots.forEach(slot => {
                const trailScore = result[slot];
                if (trailScore) {
                    const cachedTrail = (window as any).__aiTrails?.[trailScore.trailId];
                    if (cachedTrail) {
                        trailData[trailScore.trailId] = cachedTrail;
                    }
                }
            });

            const itineraryId = await saveItinerary(user.uid, {
                city: preferences.city,
                date: preferences.date,
                trail: result,
                preferences,
                trailData // Save full trail data
            });

            setSavedItineraryId(itineraryId);

            // Log activity
            await logActivity(user.uid, {
                type: 'save',
                title: t('generator.save'),
                message: t('generator.save.success.message', { city: preferences.city, date: preferences.date })
            });

            alert(t('generator.save.success'));
        } catch (error) {
            console.error('Save error:', error);
            alert(t('generator.save.failed', { error: error instanceof Error ? error.message : 'Unknown' }));
        } finally {
            setIsSaving(false);
        }
    };

    // Share itinerary and get link
    const handleShareItinerary = async () => {
        if (!user || !result) {
            alert(t('auth.loginRequired'));
            return;
        }

        setIsSaving(true);
        try {
            // Collect trail data from cache, but only essential fields to reduce size
            const trailData: Record<string, any> = {};
            const timeSlots: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];
            timeSlots.forEach(slot => {
                const trailScore = result[slot];
                if (trailScore) {
                    const cachedTrail = (window as any).__aiTrails?.[trailScore.trailId];
                    if (cachedTrail) {
                        // Only save essential trail data to reduce document size
                        trailData[trailScore.trailId] = {
                            id: cachedTrail.id,
                            title: cachedTrail.title,
                            description: cachedTrail.description,
                            places: cachedTrail.places?.map((p: any) => ({
                                place_id: p.place_id,
                                name: p.name,
                                address: p.address || p.formatted_address,
                                location: p.location,
                                rating: p.rating
                            }))
                        };
                    }
                }
            });

            const itineraryId = await saveItinerary(user.uid, {
                city: preferences.city,
                date: preferences.date,
                trail: result,
                preferences: {
                    city: preferences.city,
                    date: preferences.date,
                    categories: preferences.categories,
                    pace: preferences.pace,
                    maxWalkingLevel: preferences.maxWalkingLevel
                },
                trailData,
                isPublic: true
            });

            const shareLink = `${window.location.origin}/itinerary/${itineraryId}`;

            // Try to use Web Share API
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: t('share.title', { city: preferences.city }),
                        text: t('share.text', { city: preferences.city }),
                        url: shareLink
                    });
                    return; // Success
                } catch (shareError: any) {
                    // User cancelled sharing - not an error
                    if (shareError?.name === 'AbortError') {
                        return;
                    }
                    console.log('Web Share failed, falling back to clipboard:', shareError);
                    // Fall through to clipboard
                }
            }

            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(shareLink);
                alert(`${t('share.copied')}\n${shareLink}`);
            } catch (clipboardError) {
                // Clipboard API might fail in some contexts, show the link instead
                prompt(t('share.copyPrompt'), shareLink);
            }

        } catch (error: any) {
            console.error('Share error:', error);
            // More specific error messages
            if (error?.code === 'permission-denied') {
                alert(t('share.permissionDenied'));
            } else if (error?.code === 'resource-exhausted') {
                alert(t('share.tooLarge'));
            } else {
                alert(`${t('share.failed')} ${error?.message || ''}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Check-in to a place
    const handleCheckIn = async () => {
        if (!user || !checkInPlace) return;

        setIsCheckingIn(true);
        try {
            let photoURL: string | undefined;

            // Upload photo if provided
            if (checkInPhoto) {
                try {
                    setUploadProgress(10);
                    const compressedPhoto = await compressImage(checkInPhoto);
                    setUploadProgress(30);
                    photoURL = await uploadPhoto(
                        compressedPhoto,
                        user.uid,
                        'checkins',
                        (progress) => setUploadProgress(30 + progress * 0.7)
                    );
                    setUploadProgress(100);
                } catch (photoError) {
                    console.error('Photo upload error:', photoError);
                    setUploadProgress(0);
                    // Continue without photo if upload fails
                    alert(t('checkin.photo.failed'));
                }
            }

            await saveCheckIn({
                userId: user.uid,
                placeName: checkInPlace.name,
                placeAddress: checkInPlace.address,
                location: checkInPlace.location,
                note: checkInNote,
                rating: checkInRating,
                photo: photoURL
            });

            await logActivity(user.uid, {
                type: 'checkin',
                title: t('checkin.title'),
                message: t('checkin.success.message', { name: checkInPlace.name })
            });

            alert(t('checkin.success'));
            setCheckInPlace(null);
            setCheckInNote('');
            setCheckInRating(5);
            setCheckInPhoto(null);
            setCheckInPhotoPreview(null);
            setUploadProgress(0);
        } catch (error) {
            console.error('Check-in error:', error);
            alert(t('checkin.failed'));
        } finally {
            setIsCheckingIn(false);
        }
    };

    // Handle photo selection for check-in
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert(t('common.error.imageOnly'));
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(t('common.error.imageSize'));
                return;
            }

            setCheckInPhoto(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setCheckInPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectPlace = async (place: any, prevPlace?: any) => {
        setBookingInfo(null);
        setSelectedPlace(place);
        const budgetService = BudgetService.getInstance();

        // Fetch booking info
        const info = budgetService.getBookingInfo(place);
        setBookingInfo(info);

        // Fetch crowd information
        try {
            const crowdInfo = await getCrowdInfo(place);
            setPlaceCrowdInfo(prev => ({ ...prev, [place.place_id]: crowdInfo }));
        } catch (err) {
            console.warn('Failed to fetch crowd info:', err);
        }

        // If transport options already exist, don't fetch again
        if (transportOptions[place.place_id]) return;

        // Fetch transport options if there's a previous place
        if (prevPlace && prevPlace.location && place.location) {
            try {
                const options = await budgetService.calculateTransportCosts(prevPlace.location, place.location);
                if (options && options.length > 0) {
                    setTransportOptions(prev => ({ ...prev, [place.place_id]: options }));
                }
            } catch (err) {
                console.warn('Failed to fetch transport costs:', err);
            }
        }
    };

    // Pre-calculate transport costs for the entire itinerary
    useEffect(() => {
        const calculateAllTransport = async () => {
            if (!result || isCalculatingTransport) return;
            setIsCalculatingTransport(true);
            const budgetService = BudgetService.getInstance();
            const newOptions: Record<string, TransportOption[]> = {};

            const slots: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

            for (const slot of slots) {
                const trailScore = result[slot];
                if (!trailScore) continue;
                const trail = getAITrail(trailScore.trailId) || getTrailById(trailScore.trailId);
                if (!trail || !trail.places) continue;

                for (let i = 1; i < trail.places.length; i++) {
                    const prevPlace = trail.places[i - 1];
                    const currentPlace = trail.places[i];

                    if (prevPlace.location && currentPlace.location && !transportOptions[currentPlace.place_id]) {
                        try {
                            const options = await budgetService.calculateTransportCosts(prevPlace.location, currentPlace.location);
                            if (options && options.length > 0) {
                                newOptions[currentPlace.place_id] = options;
                            }
                        } catch (e) {
                            console.error('Transport calculation error:', e);
                        }
                    }
                }
            }

            if (Object.keys(newOptions).length > 0) {
                setTransportOptions(prev => ({ ...prev, ...newOptions }));
            }
            setIsCalculatingTransport(false);
        };

        calculateAllTransport();
    }, [result]);



    const toggleRainMode = async () => {
        const newRainyState = !isRainy;
        setIsRainy(newRainyState);
        if (result) {
            setIsLoading(true);
            try {
                let newResult: GeneratedItinerary;
                if (useAI) {
                    newResult = await generateAIItinerary(preferences, newRainyState, destinationLocation || undefined);
                } else {
                    newResult = generateItinerary(preferences, newRainyState);
                }
                setResult(newResult);
            } catch (err) {
                setError(err instanceof Error ? err.message : t('generator.error.update'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const startCompanionMode = () => {
        setIsCompanionMode(true);
        const service = CompanionService.getInstance();

        // Subscribe to notifications
        const unsubscribe = service.subscribe((notification) => {
            setNotifications(prev => [notification, ...prev]);
        });

        // Simulate a weather trigger after 5 seconds for demo
        setTimeout(() => {
            if (result && destinationLocation) {
                service.simulateRain(result, preferences, destinationLocation, (newItinerary) => {
                    setResult(newItinerary);
                });
            }
        }, 5000);

        // Check real-time crowd levels
        if (result && destinationLocation) {
            service.checkCrowdLevels(result, preferences, destinationLocation, () => {
                setResult({ ...result });
            });

            // Start periodic monitoring (every 15 minutes)
            const stopMonitoring = service.startCrowdMonitoring(
                result,
                preferences,
                destinationLocation,
                () => setResult({ ...result }),
                15
            );

            // Return cleanup function
            return () => {
                unsubscribe();
                stopMonitoring();
            };
        }

        return unsubscribe;
    };

    const handleNotificationAction = async (notification: CompanionNotification) => {
        setIsLoading(true);
        try {
            await notification.onAction();
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        } catch (err) {
            setError(t('generator.error.suggestionAction'));
        } finally {
            setIsLoading(false);
        }
    };

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="itinerary-generator">
            <div className="generator__header">
                <p className="generator__subtitle">{t('generator.subtitle')}</p>
                <div className="generator__progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">{t('generator.step1')}</span>
                    </div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">{t('generator.step2')}</span>
                    </div>
                    <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">{t('generator.step3')}</span>
                    </div>
                </div>
            </div>

            {step === 1 && (
                <div className="generator__step animate-fadeIn">
                    {/* Personalized Recommendations */}
                    {personalizedRec && personalizedRec.confidence > 0.5 && (
                        <div className="generator__personalized-banner">
                            <div className="personalized-banner__content">
                                <h4>{t('generator.personalized')}</h4>
                                <p>{personalizedRec.reasoning}</p>
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => {
                                        setPreferences(prev => ({
                                            ...prev,
                                            categories: personalizedRec.categories,
                                            pace: personalizedRec.suggestedPace,
                                            maxWalkingLevel: personalizedRec.suggestedWalkingLevel,
                                            city: personalizedRec.suggestedCity || prev.city,
                                        }));
                                    }}
                                >
                                    {t('generator.apply')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Template Selector */}
                    <div className="generator__section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                            <h3 className="generator__section-title">{t('generator.template')}</h3>
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setShowTemplates(!showTemplates)}
                            >
                                {showTemplates ? t('generator.hideTemplate') : t('generator.showTemplate')}
                            </button>
                        </div>
                        {showTemplates && (
                            <TemplateSelector
                                onSelectTemplate={(prefs) => {
                                    setPreferences(prefs);
                                    setShowTemplates(false);
                                }}
                                currentCity={preferences.city}
                                currentCategories={preferences.categories}
                            />
                        )}
                    </div>

                    <div className="generator__section">
                        <h3 className="generator__section-title">{t('generator.destination')}</h3>
                        <AddressAutocomplete
                            value={preferences.city}
                            onChange={async (address, location) => {
                                setPreferences(prev => ({ ...prev, city: address }));
                                if (location) {
                                    setDestinationLocation(location);
                                    // Fetch nearby interesting spots
                                    try {
                                        const { searchNearbyPlaces } = await import('../../services/googleMaps');
                                        const spots = await searchNearbyPlaces(location, 'tourist_attraction', 2000);
                                        setNearbyPlaces(spots.slice(0, 5));
                                    } catch (err) {
                                        console.warn('Failed to fetch nearby spots:', err);
                                    }
                                }
                            }}
                            placeholder={t('generator.destination.placeholder')}
                            className="generator__address-input"
                        />
                        {destinationLocation && (
                            <div style={{ marginTop: 'var(--space-4)' }}>
                                <GoogleMap
                                    center={destinationLocation}
                                    zoom={14}
                                    height="250px"
                                    places={[
                                        { name: preferences.city || t('common.destination'), location: destinationLocation },
                                        ...nearbyPlaces.map(p => ({
                                            name: p.name,
                                            location: { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
                                            placeId: p.place_id
                                        }))
                                    ]}
                                />
                            </div>
                        )}
                    </div>

                    <div className="generator__section">
                        <h3 className="generator__section-title">{t('generator.duration')}</h3>
                        <div className="generator__duration-grid">
                            {DURATION_OPTIONS.map(({ value }) => (
                                <button
                                    key={value}
                                    className={`generator__duration-btn ${tripDuration === value ? 'selected' : ''}`}
                                    onClick={() => setTripDuration(value)}
                                >
                                    <span className="duration-label">{t(`duration.${value}`)}</span>
                                    <span className="duration-desc">{t(`duration.${value}.desc`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="generator__section">
                        <h3 className="generator__section-title">{t('generator.selectDate')}</h3>
                        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
                                    {parseInt(tripDuration) > 1 ? t('generator.departureDate') : t('generator.singleDate')}
                                </label>
                                <input
                                    type="date"
                                    className="input"
                                    style={{ width: '100%' }}
                                    value={preferences.date}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>{t('generator.startTime')}</label>
                                <input
                                    type="time"
                                    className="input"
                                    style={{ width: '100%' }}
                                    value={preferences.startTime || '09:00'}
                                    onChange={(e) => setPreferences(prev => ({ ...prev, startTime: e.target.value }))}
                                />
                            </div>
                        </div>
                        {parseInt(tripDuration) > 1 && (
                            <p className="generator__date-range">
                                {t('generator.dateRange')}：{preferences.date} ~ {(() => {
                                    const endDate = new Date(preferences.date);
                                    endDate.setDate(endDate.getDate() + parseInt(tripDuration) - 1);
                                    return endDate.toISOString().split('T')[0];
                                })()}
                            </p>
                        )}
                    </div>

                    <div className="generator__section">
                        <h3 className="generator__section-title">{t('generator.categories')}</h3>
                        <div className="generator__category-grid">
                            {PREFERENCE_OPTIONS.map(({ value }) => (
                                <button
                                    key={value}
                                    className={`generator__category-btn ${preferences.categories.includes(value) ? 'selected' : ''}`}
                                    onClick={() => toggleCategory(value)}
                                >
                                    <span className="generator__category-label">{t(`category.${value}`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="generator__section">
                        <h3 className="generator__section-title">{t('generator.walking')}</h3>
                        <div className="generator__walking-options">
                            {WALKING_OPTIONS.map(({ value }) => (
                                <button
                                    key={value}
                                    className={`generator__walking-btn ${preferences.maxWalkingLevel === value ? 'selected' : ''}`}
                                    onClick={() => setPreferences(prev => ({ ...prev, maxWalkingLevel: value }))}
                                >
                                    {t(`walking.${value}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="generator__section">
                        <h3 className="generator__section-title">{t('generator.proximity')}</h3>
                        <div className="generator__proximity-grid">
                            {PROXIMITY_OPTIONS.map(({ value }) => (
                                <button
                                    key={value}
                                    className={`generator__proximity-btn ${preferences.proximity === value ? 'selected' : ''}`}
                                    onClick={() => setPreferences(prev => ({ ...prev, proximity: value }))}
                                >
                                    <div className="proximity-label">{t(`proximity.${value}`)}</div>
                                    <div className="proximity-desc">{t(`proximity.${value}.desc`)}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: 'var(--space-4)' }}
                        onClick={() => setStep(2)}
                        disabled={!preferences.city || preferences.categories.length === 0}
                    >
                        {t('common.next')}
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="generator__step animate-fadeIn">
                    <div className="generator__section">
                        <h3 className="generator__section-title">{t('generator.pace')}</h3>
                        <div className="generator__walking-options">
                            {PACE_OPTIONS.map(({ value }) => (
                                <button
                                    key={value}
                                    className={`generator__walking-btn ${preferences.pace === value ? 'selected' : ''}`}
                                    onClick={() => setPreferences(prev => ({ ...prev, pace: value }))}
                                >
                                    {t(`pace.${value}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="generator__section">
                        <h3 className="generator__section-title">{t('generator.rain.mode')}</h3>
                        <div className="generator__walking-options">
                            <button className={`generator__walking-btn ${!isRainy ? 'selected' : ''}`} onClick={() => setIsRainy(false)}>{t('common.no')}</button>
                            <button className={`generator__walking-btn ${isRainy ? 'selected' : ''}`} onClick={() => setIsRainy(true)}>{t('common.yes')}</button>
                        </div>
                    </div>

                    <div className="generator__ai-toggle">
                        <div className="ai-toggle__info">
                            <h4>{t('generator.ai.enable')}</h4>
                            <p>{t('generator.loading.tips')}</p>
                        </div>
                        <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>{t('common.previous')}</button>
                        <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleGenerate} disabled={isLoading}>
                            {isLoading ? t('generator.loading') : t('generator.generate')}
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && result && (
                <div className="generator__step animate-fadeIn">
                    {isLoading ? (
                        <div className="generator__loading">
                            <div className="loading-spinner"></div>
                            <p>{t('generator.optimizing')}</p>
                        </div>
                    ) : (
                        <>
                            {/* Multi-day tabs */}
                            {multiDayResult && multiDayResult.days.length > 1 && (
                                <div className="generator__day-tabs">
                                    {multiDayResult.days.map((day) => (
                                        <button
                                            key={day.dayNumber}
                                            className={`day-tab ${activeDay === day.dayNumber ? 'active' : ''}`}
                                            onClick={() => handleDaySwitch(day.dayNumber)}
                                        >
                                            <span className="day-tab-number">{t('generator.day', { n: day.dayNumber })}</span>
                                            <span className="day-tab-date">{day.date}</span>
                                            {regeneratingDay === day.dayNumber ? (
                                                <span className="day-tab-loading">...</span>
                                            ) : (
                                                <button
                                                    className="day-tab-refresh"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRegenerateDay(day.dayNumber);
                                                    }}
                                                    title={t('generator.regenerate.day')}
                                                >
                                                    Refresh
                                                </button>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="generator__summary">
                                <div className="summary-item">
                                    <span className="summary-text">
                                        {multiDayResult
                                            ? `${multiDayResult.startDate} ~ ${multiDayResult.endDate}`
                                            : preferences.date
                                        }
                                    </span>
                                    <span className="summary-label">{multiDayResult ? t('generator.dateRange') : t('generator.singleDate')}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-text" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preferences.city}</span>
                                    <span className="summary-label">{t('checkin.place')}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-text">
                                        {(() => {
                                            const duration = estimateTotalDuration(result);
                                            if (duration > 0) {
                                                return duration >= 60 ? `${Math.round(duration / 60)}h` : `${duration}m`;
                                            }
                                            // Fallback: estimate based on time slots
                                            const slots = ['morning', 'afternoon', 'evening', 'night'].filter(s => result[s as keyof typeof result]);
                                            return slots.length > 0 ? `~${slots.length * 2}h` : '~2h';
                                        })()}
                                    </span>
                                    <span className="summary-label">{t('generator.summary.time')}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-text">
                                        {(() => {
                                            const budget = calculateBudgetRange(result);
                                            if (budget.min > 0 || budget.max > 0) {
                                                return `${budget.min}-${budget.max}`;
                                            }
                                            // Fallback: estimate based on time slots
                                            const slots = ['morning', 'afternoon', 'evening', 'night'].filter(s => result[s as keyof typeof result]);
                                            const baseMin = 200, baseMax = 500;
                                            return slots.length > 0 ? `${slots.length * baseMin}-${slots.length * baseMax}` : `${baseMin}-${baseMax}`;
                                        })()}
                                    </span>
                                    <span className="summary-label">{t('generator.summary.budget')}</span>
                                </div>
                            </div>

                            <div className="generator__actions">
                                <button className={`btn ${isRainy ? 'btn-primary' : 'btn-secondary'} action-main`} onClick={toggleRainMode}>
                                    {isRainy ? t('common.sunny') : t('common.rainy')}
                                </button>

                                <div className={`action-dropdown ${isActionMenuOpen ? 'open' : ''}`}>
                                    {isActionMenuOpen && (
                                        <div className="action-menu-backdrop" onClick={() => setIsActionMenuOpen(false)} />
                                    )}
                                    <button className="btn btn-secondary action-toggle" onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}>
                                        {t('common.more')}
                                    </button>

                                    <div className="action-menu">
                                        <button className="menu-item" onClick={() => { setStep(1); setIsActionMenuOpen(false); }}>
                                            {t('common.modifyPrefs')}
                                        </button>

                                        {!isCompanionMode && (
                                            <button className="menu-item highlight" onClick={() => { startCompanionMode(); setIsActionMenuOpen(false); }}>
                                                <span>AI</span> {t('generator.enableCompanion')}
                                            </button>
                                        )}

                                        {user && (
                                            <button
                                                className={`menu-item ${isSaving ? 'loading' : ''}`}
                                                onClick={() => { handleSaveItinerary(); setIsActionMenuOpen(false); }}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? t('generator.saving') : t('generator.save')}
                                            </button>
                                        )}

                                        {user && result && (
                                            <button
                                                className="menu-item"
                                                onClick={async () => { await handleShareItinerary(); setIsActionMenuOpen(false); }}
                                                disabled={isSaving}
                                            >
                                                <span>Link</span> {isSaving ? t('generator.saving') : t('generator.share')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop View Buttons (Hidden on mobile via CSS) */}
                                <div className="desktop-actions">
                                    <button className="btn btn-secondary" onClick={() => setStep(1)}>{t('common.modifyPrefs')}</button>
                                    {!isCompanionMode && (
                                        <button className="btn btn-primary" style={{ background: 'var(--success)', borderColor: 'var(--success)' }} onClick={startCompanionMode}>
                                            {t('generator.companion.start')}
                                        </button>
                                    )}
                                    {user && (
                                        <button
                                            className={`btn btn-primary ${isSaving ? 'loading' : ''}`}
                                            style={{ background: 'var(--primary-600)' }}
                                            onClick={handleSaveItinerary}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? t('generator.saving') : t('generator.save')}
                                        </button>
                                    )}
                                    {user && result && (
                                        <button
                                            className="btn btn-secondary"
                                            onClick={handleShareItinerary}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? t('generator.saving') : t('generator.share')}
                                        </button>
                                    )}
                                    {result && (
                                        <>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    const itinerary = multiDayResult || result;
                                                    exportToPDF(itinerary, preferences.city, preferences.date);
                                                }}
                                            >
                                                PDF {t('generator.export.pdf')}
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    const itinerary = multiDayResult || result;
                                                    exportToGoogleCalendar(itinerary, preferences.city, preferences.date);
                                                }}
                                            >
                                                Calendar {t('generator.export.calendar')}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Budget Tracker */}
                            {user && result && (() => {
                                const budget = calculateBudgetRange(result);
                                if (budget.min > 0 || budget.max > 0) {
                                    return (
                                        <div className="generator__budget-section animate-fadeIn">
                                            {savedItineraryId ? (
                                                <BudgetTracker
                                                    itineraryId={savedItineraryId}
                                                    estimatedBudget={{
                                                        min: budget.min,
                                                        max: budget.max,
                                                        currency: 'TWD'
                                                    }}
                                                />
                                            ) : (
                                                <div className="budget-preview">
                                                    <h3 className="section-title">{t('generator.budgetTracker')}</h3>
                                                    <div className="budget-preview__info">
                                                        <span>{t('generator.estimated')}：NT$ {budget.min.toLocaleString()} - {budget.max.toLocaleString()}</span>
                                                        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>
                                                            {t('generator.saveToTrack')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Interactive Map View */}
                            <div className="generator__map-section animate-fadeIn">
                                <h3 className="section-title">{t('generator.routeMap')}</h3>
                                {(() => {
                                    const allPlaces = Object.values(result)
                                        .filter((slot): slot is TrailScore => typeof slot === 'object' && 'trailId' in slot)
                                        .flatMap(slot => {
                                            const trail = getAITrail(slot.trailId) || getTrailById(slot.trailId);
                                            return trail?.places || [];
                                        })
                                        .filter(p => p.location && p.location.lat && p.location.lng)
                                        .map(p => ({
                                            name: p.name,
                                            location: p.location,
                                            address: p.address || p.formatted_address || '',
                                            transport: 'Walking', // Default for now
                                            duration: '15m' // Placeholder
                                        }));

                                    return (
                                        <ItineraryMap
                                            places={allPlaces}
                                            center={destinationLocation || undefined}
                                        />
                                    );
                                })()}
                            </div>



                            {isCompanionMode && (
                                <div className="companion-status-bar animate-fadeIn">
                                    <div className="status-indicator">
                                        <span className="pulse-dot"></span>
                                        {t('generator.companion.active')}
                                    </div>
                                    {notifications.length > 0 && (
                                        <div className="companion-notifications">
                                            {notifications.map(notification => (
                                                <div key={notification.id} className={`notification-card ${notification.type} animate-slideUp`}>
                                                    <div className="notification-content">
                                                        <h4 className="notification-title">{notification.title}</h4>
                                                        <p className="notification-message">{notification.message}</p>
                                                    </div>
                                                    <div className="notification-actions">
                                                        <button className="notification-btn-primary" onClick={() => handleNotificationAction(notification)}>
                                                            {notification.actionLabel}
                                                        </button>
                                                        <button className="notification-btn-secondary" onClick={() => dismissNotification(notification.id)}>
                                                            {t('common.ignore')}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="generator__timeline">
                                {(['morning', 'afternoon', 'evening', 'night'] as TimeOfDay[]).map((timeSlot) => {
                                    const trailScore = result[timeSlot];
                                    if (!trailScore) return null;
                                    const trail = getAITrail(trailScore.trailId) || getTrailById(trailScore.trailId);
                                    if (!trail) return null;

                                    const defaultStartTimes = getRecommendedStartTimes(preferences.pace);
                                    const isFirstSlot = timeSlot === (result.morning ? 'morning' : result.afternoon ? 'afternoon' : result.evening ? 'evening' : 'night');
                                    const displayStartTime = (isFirstSlot && preferences.startTime) ? preferences.startTime : defaultStartTimes[timeSlot];

                                    return (
                                        <div key={timeSlot} className="generator__slot">
                                            <div className="generator__slot-time">
                                                <div className="slot-time-info">
                                                    <span className="slot-label">{t(`slot.${timeSlot}`)}</span>
                                                    <span className="slot-start">{displayStartTime}</span>
                                                    <button className="slot-regenerate-btn" onClick={() => handleRegenerateSlot(timeSlot)} disabled={regeneratingSlot !== null}>
                                                        {regeneratingSlot === timeSlot ? '...' : t('common.update')}
                                                    </button>
                                                    <button
                                                        className={`slot-edit-btn ${editingSlot === timeSlot ? 'active' : ''}`}
                                                        onClick={() => setEditingSlot(editingSlot === timeSlot ? null : timeSlot)}
                                                    >
                                                        {editingSlot === timeSlot ? t('common.done') : t('common.edit')}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="generator__slot-trail">
                                                <h4 className="slot-trail-title">{trail.title}</h4>
                                                <p className="slot-trail-desc">{trail.description}</p>
                                                <div className="slot-trail-meta">
                                                    <span>{Math.round(trail.totalTime / 60)}{t('common.unit.hours')}</span>
                                                    <span>{trail.orderedPlaces.length} {t('common.unit.places')}</span>
                                                    <span className="slot-match">{t('generator.match')} {Math.round(trailScore.totalScore)}%</span>
                                                </div>

                                                {editingSlot === timeSlot ? (
                                                    <DraggablePlaceList
                                                        places={trail.places}
                                                        onReorder={(newPlaces) => handleReorderPlaces(trail.id, newPlaces)}
                                                        onRemove={(placeId) => handleRemovePlace(trail.id, placeId)}
                                                        editable={true}
                                                    />
                                                ) : (
                                                    <div className="slot-trail-places">
                                                        {trail.places.map((place: any, idx: number) => (
                                                            <div key={place.place_id || idx} className="slot-place-item-container">
                                                                {idx > 0 && place?.place_id && transportOptions[place.place_id]?.length > 0 && (
                                                                    <div className="transport-divider">
                                                                        <span className="transport-info">
                                                                            {t('generator.transport.estimate')}：{transportOptions[place.place_id][0]?.duration}m ({transportOptions[place.place_id][0]?.cost}{t('common.unit.currency')})
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="slot-place-item clickable" onClick={() => handleSelectPlace(place, idx > 0 ? trail.places[idx - 1] : undefined)}>
                                                                    <div className="place-marker">
                                                                        <span className="place-index">{idx + 1}</span>
                                                                        {idx < trail.places.length - 1 && <div className="place-line" />}
                                                                    </div>
                                                                    <div className="place-content">
                                                                        <div className="place-header">
                                                                            <span className="place-name">{place.name}</span>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                                                {place.rating && <span className="place-rating">{place.rating}</span>}
                                                                                <button className="place-regenerate-btn" onClick={(e) => { e.stopPropagation(); handleReplacePlace(trail.id, place.place_id); }} disabled={replacingPlaceId !== null}>
                                                                                    {replacingPlaceId === place.place_id ? '...' : t('place.replace')}
                                                                                </button>
                                                                                <a
                                                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.place_id || place.id}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="place-regenerate-btn"
                                                                                    title={t('place.navigate')}
                                                                                    style={{ textDecoration: 'none', marginLeft: '4px' }}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    {t('place.navigate')}
                                                                                </a>
                                                                                {user && (
                                                                                    <button
                                                                                        className="place-regenerate-btn checkin-btn"
                                                                                        style={{ marginLeft: '4px', background: 'var(--success)', color: 'white' }}
                                                                                        title={t('place.checkin')}
                                                                                        onClick={(e) => { e.stopPropagation(); setCheckInPlace(place); }}
                                                                                    >
                                                                                        {t('place.checkin')}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <span className="place-address">{place.address}</span>
                                                                        <div className="place-tags">
                                                                            {place.types?.slice(0, 2).map((type: string) => (
                                                                                <span key={type} className="place-tag">{type}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {error && (
                <div className="generator__section" style={{ borderColor: 'var(--error)', background: 'var(--error-light)', color: 'var(--error)' }}>
                    {error}
                </div>
            )}

            {selectedPlace && (
                <div className="modal-overlay" onClick={() => setSelectedPlace(null)}>
                    <div className="place-modal animate-slideUp" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedPlace(null)}>Close</button>
                        {selectedPlace.photos && selectedPlace.photos.length > 0 ? (
                            <div className="modal-photos">
                                <img
                                    src={selectedPlace.photos[0]}
                                    alt={selectedPlace.name}
                                    className="modal-main-photo"
                                    loading="eager"
                                    decoding="async"
                                />
                                {selectedPlace.photos.length > 1 && (
                                    <div className="modal-photo-grid">
                                        {selectedPlace.photos.slice(1, 3).map((photo: string, i: number) => (
                                            <img
                                                key={i}
                                                src={photo}
                                                alt={`${selectedPlace.name} ${i + 2}`}
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="modal-photos" style={{ background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '14px', opacity: 0.5 }}>Location</span>
                            </div>
                        )}
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2 className="modal-title">{selectedPlace.name}</h2>
                                {selectedPlace.rating && (
                                    <div className="modal-rating">
                                        <span className="score">{selectedPlace.rating}</span>
                                        <span className="count">({selectedPlace.totalRatings || 0} {t('place.reviews')})</span>
                                    </div>
                                )}
                            </div>
                            <div className="modal-info-grid">
                                <div className="info-item">
                                    <span className="info-text">{selectedPlace.address}</span>
                                </div>
                                {selectedPlace.openingHours && (
                                    <div className="info-item">
                                        <div className="info-text">
                                            <div className={`status ${selectedPlace.openingHours.open_now ? 'open' : 'closed'}`}>
                                                {selectedPlace.openingHours.open_now ? t('place.openNow') : t('place.closed')}
                                            </div>
                                            {selectedPlace.openingHours.weekday_text && (
                                                <div className="weekday-text">
                                                    {selectedPlace.openingHours.weekday_text.map((text: string, i: number) => <div key={i}>{text}</div>)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {selectedPlace?.priceLevel !== undefined && selectedPlace?.priceLevel !== null && (
                                    <div className="info-item">
                                        <span className="info-text">{t('place.priceLevel')}：{'$'.repeat(Math.max(0, selectedPlace.priceLevel + 1))}</span>
                                    </div>
                                )}
                            </div>

                            {/* Crowd Information */}
                            {placeCrowdInfo[selectedPlace.place_id] && (
                                <div className="modal-crowd-info">
                                    <h3 className="optimizer-title">{t('place.crowdLevel')}</h3>
                                    <div className="crowd-info-content">
                                        <div className="crowd-level">
                                            <span className="crowd-label">{t('place.crowdLevel.current')}：</span>
                                            <span className={`crowd-status ${placeCrowdInfo[selectedPlace.place_id].currentBusyness}`}>
                                                {t(`place.crowdLevel.${placeCrowdInfo[selectedPlace.place_id].currentBusyness}`)}
                                            </span>
                                        </div>
                                        {placeCrowdInfo[selectedPlace.place_id].estimatedWaitTime > 0 && (
                                            <div className="crowd-wait">
                                                <span>{t('place.waitTime')}：{placeCrowdInfo[selectedPlace.place_id].estimatedWaitTime} {t('common.unit.minutes')}</span>
                                            </div>
                                        )}
                                        <div className="crowd-recommendation">
                                            <p>{placeCrowdInfo[selectedPlace.place_id].recommendation}</p>
                                        </div>
                                        {placeCrowdInfo[selectedPlace.place_id].peakHours && placeCrowdInfo[selectedPlace.place_id].peakHours.length > 0 && (
                                            <div className="crowd-peak-hours">
                                                <span className="crowd-label">{t('place.crowdLevel.peak')}：</span>
                                                <span>{placeCrowdInfo[selectedPlace.place_id].peakHours.join(':00, ')}:00</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {bookingInfo && (bookingInfo.bookingUrl || bookingInfo.hasCoupon) && (
                                <div className="modal-budget-optimizer">
                                    <h3 className="optimizer-title">{t('place.budget.title')}</h3>
                                    <div className="optimizer-content">
                                        {bookingInfo.hasCoupon && (
                                            <div className="coupon-badge">
                                                <span className="coupon-label">{t('place.budget.todayOffer')}</span>
                                                <span className="coupon-code">{t('place.budget.couponCode')}: {bookingInfo.couponCode}</span>
                                            </div>
                                        )}
                                        {bookingInfo.bookingUrl && (
                                            <a href={bookingInfo.bookingUrl} target="_blank" rel="noopener noreferrer" className="booking-link">
                                                {t('place.budget.bookNow')}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedPlace?.place_id && transportOptions[selectedPlace.place_id]?.length > 0 && (
                                <div className="modal-transport-options">
                                    <h3 className="optimizer-title">{t('place.transport.compare')}</h3>
                                    <div className="transport-grid">
                                        {transportOptions[selectedPlace.place_id].map((opt, i) => (
                                            <div key={opt.mode || i} className="transport-card">
                                                <span className="transport-mode">{opt.mode === 'Uber' ? t('place.transport.uber') : opt.mode === 'Public' ? t('place.transport.public') : t('place.transport.walking')}</span>
                                                <span className="transport-cost">{opt.cost > 0 ? `${opt.cost}${t('common.unit.currency')}` : t('place.transport.free')}</span>
                                                <span className="transport-time">{opt.duration}{t('common.unit.minutes')}</span>
                                                {opt.mode === 'Uber' && (
                                                    <a
                                                        href={BudgetService.getInstance().getUberDeepLink(selectedPlace.location, selectedPlace.name)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="uber-call-btn"
                                                    >
                                                        {t('place.transport.callUber')}
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedPlace.reviews && selectedPlace.reviews.length > 0 && (
                                <div className="modal-reviews">
                                    <h3 className="reviews-title">{t('place.reviews.title')}</h3>
                                    <div className="reviews-list">
                                        {selectedPlace.reviews.map((review: any, i: number) => (
                                            <div key={i} className="review-item">
                                                <div className="review-header">
                                                    {review.profile_photo_url && (
                                                        <img src={review.profile_photo_url} alt={review.author_name} className="review-avatar" />
                                                    )}
                                                    <div className="review-meta">
                                                        <span className="review-author">{review.author_name}</span>
                                                        <span className="review-time">{review.relative_time_description}</span>
                                                    </div>
                                                    <div className="review-rating">
                                                        {review.rating}
                                                    </div>
                                                </div>
                                                <p className="review-text">{review.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedPlace.address)}&destination_place_id=${selectedPlace.place_id}`} target="_blank" rel="noopener noreferrer" className="nav-btn">{t('place.navigate.start')}</a>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.name)}&query_place_id=${selectedPlace.place_id}`} target="_blank" rel="noopener noreferrer" className="search-btn">{t('place.viewOnGoogleMaps')}</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Check-in Modal */}
            {checkInPlace && (
                <div className="modal-overlay" onClick={() => setCheckInPlace(null)}>
                    <div className="place-modal animate-slideUp checkin-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setCheckInPlace(null)}>Close</button>
                        <div className="modal-content" style={{ padding: 'var(--space-6)' }}>
                            <h2 className="modal-title" style={{ marginBottom: 'var(--space-4)' }}>
                                {t('checkin.at')}{checkInPlace.name}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                                {checkInPlace.address}
                            </p>

                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)' }}>
                                    {t('checkin.rating.label')}
                                </label>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => setCheckInRating(star)}
                                            style={{
                                                fontSize: '24px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                opacity: star <= checkInRating ? 1 : 0.3
                                            }}
                                        >
                                            Rating
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)' }}>
                                    {t('checkin.photo.optional')}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    style={{ display: 'none' }}
                                    id="checkin-photo-input"
                                />
                                <label
                                    htmlFor="checkin-photo-input"
                                    style={{
                                        display: 'block',
                                        padding: 'var(--space-4)',
                                        border: '2px dashed var(--border-light)',
                                        borderRadius: 'var(--radius-lg)',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: checkInPhotoPreview ? 'transparent' : 'var(--bg-secondary)'
                                    }}
                                >
                                    {checkInPhotoPreview ? (
                                        <div>
                                            <img
                                                src={checkInPhotoPreview}
                                                alt={t('common.preview')}
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '200px',
                                                    borderRadius: 'var(--radius-md)',
                                                    marginBottom: 'var(--space-2)'
                                                }}
                                            />
                                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                {t('checkin.photo.change.hint')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                                                {t('checkin.photo.select')}
                                            </p>
                                        </div>
                                    )}
                                </label>
                                {checkInPhoto && (
                                    <button
                                        onClick={() => {
                                            setCheckInPhoto(null);
                                            setCheckInPhotoPreview(null);
                                        }}
                                        style={{
                                            marginTop: 'var(--space-2)',
                                            padding: 'var(--space-2) var(--space-3)',
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--error)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {t('checkin.photo.remove')}
                                    </button>
                                )}
                            </div>

                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-medium)' }}>
                                    {t('checkin.note.label')}
                                </label>
                                <textarea
                                    value={checkInNote}
                                    onChange={(e) => setCheckInNote(e.target.value)}
                                    placeholder={t('checkin.note.placeholder2')}
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-lg)',
                                        fontSize: 'var(--text-base)',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        marginBottom: 'var(--space-2)'
                                    }}>
                                        <div style={{
                                            width: `${uploadProgress}%`,
                                            height: '100%',
                                            backgroundColor: 'var(--primary-500)',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                        {t('common.uploading')} {Math.round(uploadProgress)}%
                                    </p>
                                </div>
                            )}
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', padding: 'var(--space-4)' }}
                                onClick={handleCheckIn}
                                disabled={isCheckingIn || uploadProgress > 0}
                            >
                                {isCheckingIn ? (uploadProgress > 0 ? t('common.uploading') : t('checkin.submitting')) : t('checkin.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItineraryGenerator;
