import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type {
    GeneratedItinerary, MultiDayItinerary, TimeOfDay, TripDuration, UserPreferences,
} from '../../types';
import { generateItinerary, calculateBudgetRange } from '../../services/ruleEngine';
import {
    generateAIItinerary, getAITrail, regenerateSlot, replacePlaceInTrail,
    generateMultiDayItinerary, regenerateDay,
} from '../../services/aiItineraryService';
import { CompanionService, type CompanionNotification } from '../../services/companionService';
import { BudgetService, type TransportOption } from '../../services/budgetService';
import { useAuth } from '../../context/AuthContext';
import { saveItinerary, logActivity, saveCheckIn } from '../../services/dbService';
import { getWeather } from '../../services/weatherService';
import { getPersonalizedRecommendations } from '../../services/recommendationService';
import { getCrowdInfo } from '../../services/crowdService';
import { uploadPhoto, compressImage } from '../../services/storageService';
import { exportToPDF, exportToGoogleCalendar } from '../../services/exportService';
import { isSameRouteOrder, optimizePlacesOrder } from '../../services/routeOptimization';
import { itineraryTemplates, templateToPreferences } from '../../data/itineraryTemplates';
import { useLanguage } from '../../services/i18n';
import { generateRouteWithGemini, type AIGeneratedRoute } from '../../services/geminiRouteService';
import { useFeedback } from '../../ui/feedbackContext';
import {
    collectTrailData, hydrateTrailCache, resolveSlots, getTrailForScore, SLOTS, type TrailPlace,
} from '../../lib/itinerary';

export type PlanPhase = 'compose' | 'generating' | 'result';

/** How long the outing is. Hours → one AI walk; days → a slotted itinerary. */
export type Span = 'quick' | 'half_day' | TripDuration;
export const SPANS: Span[] = ['quick', 'half_day', '1', '2', '3', '4', '5', '7'];
export const isWalkSpan = (s: Span): s is 'quick' | 'half_day' => s === 'quick' || s === 'half_day';

const today = () => new Date().toISOString().split('T')[0];

export function usePlanner() {
    const location = useLocation();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { toast, confirm } = useFeedback();

    const [phase, setPhase] = useState<PlanPhase>('compose');
    const [preferences, setPreferences] = useState<UserPreferences>({
        city: '',
        date: today(),
        categories: [],
        pace: 'moderate',
        maxWalkingLevel: 'medium',
        proximity: 'close',
        startTime: '09:00',
    });
    const [span, setSpan] = useState<Span>('half_day');
    const isWalk = isWalkSpan(span);
    const tripDuration: TripDuration = isWalk ? '1' : (span as TripDuration);
    const [kind, setKind] = useState<'walk' | 'plan'>('plan');
    const [walkRoute, setWalkRoute] = useState<AIGeneratedRoute | null>(null);
    /** What the shown result was made from; the form may have moved on since. */
    const [request, setRequest] = useState<(UserPreferences & { span: Span; location: { lat: number; lng: number } | null }) | null>(null);
    const [isRainy, setIsRainy] = useState(false);
    const [useAI, setUseAI] = useState(true);
    const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
    const [personalizedRec, setPersonalizedRec] = useState<any>(null);

    const [result, setResult] = useState<GeneratedItinerary | null>(null);
    const [multiDayResult, setMultiDayResult] = useState<MultiDayItinerary | null>(null);
    const [activeDay, setActiveDay] = useState(1);
    const [freshResult, setFreshResult] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [busySlot, setBusySlot] = useState<TimeOfDay | null>(null);
    const [busyDay, setBusyDay] = useState<number | null>(null);
    const [busyPlaceId, setBusyPlaceId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);

    const [transportOptions, setTransportOptions] = useState<Record<string, TransportOption[]>>({});
    const [crowdInfo, setCrowdInfo] = useState<Record<string, any>>({});
    const [bookingInfo, setBookingInfo] = useState<any>(null);
    const [selectedPlace, setSelectedPlace] = useState<TrailPlace | null>(null);
    const [stampedNames, setStampedNames] = useState<Set<string>>(new Set());

    const [isCompanionMode, setIsCompanionMode] = useState(false);
    const [notifications, setNotifications] = useState<CompanionNotification[]>([]);
    const companionStop = useRef<(() => void) | null>(null);
    /** Bumped on every generate/cancel; a response only lands if its id is still current. */
    const genId = useRef(0);

    // ---------- incoming navigation state ----------
    useEffect(() => {
        const state = location.state as any;
        if (!state) return;
        if (state.savedItinerary) {
            const saved = state.savedItinerary;
            setPreferences((prev) => ({ ...prev, ...(saved.preferences || {}), city: saved.city, date: saved.date }));
            hydrateTrailCache(saved.trailData);
            setResult(saved.trail);
            setMultiDayResult(null);
            setSavedItineraryId(saved.id || null);
            setFreshResult(false);
            setKind('plan');
            setSpan('1');
            const sp = saved.preferences || {};
            setRequest({
                city: saved.city,
                date: saved.date,
                categories: sp.categories || [],
                pace: sp.pace || 'moderate',
                maxWalkingLevel: sp.maxWalkingLevel || 'medium',
                proximity: sp.proximity || 'close',
                startTime: sp.startTime,
                span: '1',
                location: null,
            });
            setPhase('result');
        } else if (state.templateId) {
            const tpl = itineraryTemplates.find((x) => x.id === state.templateId);
            if (tpl) {
                setPreferences((prev) => ({ ...prev, ...templateToPreferences(tpl), date: prev.date }));
                setSpan(String(tpl.duration) as TripDuration);
                setPhase('compose');
            }
        } else if (state.destination?.city) {
            setPreferences((prev) => ({ ...prev, city: state.destination.city }));
            if (state.destination.location) setDestinationLocation(state.destination.location);
        }
    }, [location.state]);

    useEffect(() => {
        if (user && phase === 'compose') {
            getPersonalizedRecommendations(user.uid, preferences).then(setPersonalizedRec).catch(() => undefined);
        }
        // only refresh when the user or phase changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, phase]);

    useEffect(() => {
        if (!destinationLocation) { setNearbyPlaces([]); return; }
        let cancelled = false;
        import('../../services/googleMaps')
            .then(({ searchNearbyPlaces }) => searchNearbyPlaces(destinationLocation, 'tourist_attraction', 2000))
            .then((spots) => { if (!cancelled) setNearbyPlaces(spots.slice(0, 5)); })
            .catch(() => undefined);
        return () => { cancelled = true; };
    }, [destinationLocation]);

    useEffect(() => () => companionStop.current?.(), []);

    // ---------- derived ----------
    // Result views and actions read the snapshot, so editing the form doesn't rewrite the shown result.
    const rp: UserPreferences = request ?? preferences;
    const resultLoc = request ? request.location : destinationLocation;
    const slots = useMemo(
        () => resolveSlots(result, rp.pace, rp.startTime),
        // result object identity changes on every edit, which is what we want
        [result, rp.pace, rp.startTime],
    );

    const dayPlaces = useMemo(
        () => slots.flatMap(({ slot, trail }) => trail.places
            .filter((p) => p.location && Number.isFinite(p.location.lat))
            .map((p) => ({ ...p, timeSlot: slot }))),
        [slots],
    );

    const budget = useMemo(() => (result ? calculateBudgetRange(result) : { min: 0, max: 0 }), [result]);

    const canGenerate = Boolean(preferences.city.trim());

    // ---------- transport estimates ----------
    useEffect(() => {
        if (!result) return;
        let cancelled = false;
        const service = BudgetService.getInstance();
        (async () => {
            const found: Record<string, TransportOption[]> = {};
            for (const { trail } of resolveSlots(result)) {
                for (let i = 1; i < trail.places.length; i++) {
                    const prev = trail.places[i - 1];
                    const cur = trail.places[i];
                    if (!prev.location || !cur.location || transportOptions[cur.place_id]) continue;
                    try {
                        const options = await service.calculateTransportCosts(prev.location, cur.location);
                        if (options?.length) found[cur.place_id] = options;
                    } catch { /* estimate is optional */ }
                }
            }
            if (!cancelled && Object.keys(found).length) setTransportOptions((p) => ({ ...p, ...found }));
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result]);

    const travelMinutes = useCallback(
        (placeId: string) => transportOptions[placeId]?.[0]?.duration,
        [transportOptions],
    );

    // ---------- actions ----------
    const toggleCategory = (category: UserPreferences['categories'][number]) => {
        setPreferences((prev) => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter((c) => c !== category)
                : [...prev.categories, category],
        }));
    };

    const setDestination = (address: string, loc?: { lat: number; lng: number }) => {
        setPreferences((prev) => ({ ...prev, city: address }));
        if (loc) setDestinationLocation(loc);
        setError(null);
    };

    const applyRecommendation = () => {
        if (!personalizedRec) return;
        setPreferences((prev) => ({
            ...prev,
            categories: personalizedRec.categories,
            pace: personalizedRec.suggestedPace,
            maxWalkingLevel: personalizedRec.suggestedWalkingLevel,
            city: personalizedRec.suggestedCity || prev.city,
        }));
    };

    const applyTemplate = (prefs: UserPreferences, days?: number) => {
        setPreferences((prev) => ({ ...prev, ...prefs, date: prev.date, startTime: prev.startTime }));
        if (days) setSpan(String(days) as TripDuration);
    };

    const generate = async () => {
        if (!preferences.city.trim()) { setError(t('trip.error.destination')); return false; }
        // No interests picked: plan a balanced mix instead of blocking.
        const categories: UserPreferences['categories'] = preferences.categories.length ? preferences.categories : ['food', 'culture', 'walking'];
        const prefs: UserPreferences = { ...preferences, categories };
        const id = ++genId.current;
        const current = () => id === genId.current;

        setError(null);
        setPhase('generating');
        setRequest({ ...prefs, span, location: destinationLocation });

        if (isWalk) {
            try {
                const route = await generateRouteWithGemini({
                    destination: prefs.city.trim(),
                    categories,
                    duration: span as 'quick' | 'half_day',
                    walkingLevel: preferences.maxWalkingLevel || 'medium',
                });
                if (!current()) return true;
                if (!route?.places?.length) throw new Error(t('route.planner.error.ai'));
                setWalkRoute(route);
                setKind('walk');
                setFreshResult(true);
                setPhase('result');
            } catch (err) {
                if (!current()) return true;
                setError(err instanceof Error ? err.message : t('route.planner.error.generic'));
                setPhase('compose');
            }
            return true;
        }

        try {
            let rainy = isRainy;
            const weather = await getWeather(preferences.city, preferences.date).catch(() => null);
            if (!current()) return true;
            if (weather?.isRainy && !rainy) {
                rainy = await confirm({
                    title: t('plan2.rain.title'),
                    message: t('generator.rain.suggestion', { date: preferences.date, city: preferences.city, desc: weather.description }),
                    confirmLabel: t('plan2.rain.use'),
                    cancelLabel: t('plan2.rain.keep'),
                });
                setIsRainy(rainy);
            }

            const days = parseInt(tripDuration, 10);
            if (days > 1) {
                const multi = await generateMultiDayItinerary(prefs, days, rainy, destinationLocation || undefined);
                if (!current()) return true;
                setMultiDayResult(multi);
                setResult(multi.days[0].itinerary);
                setActiveDay(1);
            } else {
                const generated = useAI
                    ? await generateAIItinerary(prefs, rainy, destinationLocation || undefined)
                    : generateItinerary(prefs, rainy);
                if (!current()) return true;
                setResult(generated);
                setMultiDayResult(null);
            }
            setSavedItineraryId(null);
            setFreshResult(true);
            setKind('plan');
            setPhase('result');

            if (user) {
                logActivity(user.uid, {
                    type: 'generate',
                    title: t('generator.generate'),
                    message: t('generator.success.message', { city: preferences.city, days }),
                });
            }
        } catch (err) {
            if (!current()) return true;
            setError(err instanceof Error ? err.message : t('generator.error.generic'));
            setPhase('compose');
        }
        return true;
    };

    const cancelGenerate = () => {
        genId.current += 1;
        setPhase('compose');
    };

    const switchDay = (day: number) => {
        if (!multiDayResult || day < 1 || day > multiDayResult.days.length) return;
        setActiveDay(day);
        setResult(multiDayResult.days[day - 1].itinerary);
        setFreshResult(false);
    };

    const refreshDay = async (day: number) => {
        if (!multiDayResult || !resultLoc) {
            toast(t('plan2.needLocation'), 'error');
            return;
        }
        setBusyDay(day);
        try {
            const next = await regenerateDay(multiDayResult, day, isRainy, resultLoc);
            setMultiDayResult(next);
            if (day === activeDay) setResult(next.days[day - 1].itinerary);
            toast(t('plan2.toast.dayRefreshed', { n: day }));
        } catch (err) {
            toast(err instanceof Error ? err.message : t('generator.error.regenerate'), 'error');
        } finally {
            setBusyDay(null);
        }
    };

    const writeTrailPlaces = (trailId: string, places: TrailPlace[]) => {
        const trail = getAITrail(trailId);
        if (!trail) return;
        const w = window as any;
        w.__aiTrails = w.__aiTrails || {};
        w.__aiTrails[trailId] = { ...trail, places, orderedPlaces: places.map((p) => p.place_id) };
        setResult((prev) => (prev ? { ...prev } : prev));
        setFreshResult(false);
    };

    const removePlace = async (trailId: string, placeId: string) => {
        const trail = getAITrail(trailId);
        if (!trail || trail.places.length <= 1) {
            toast(t('generator.error.minSpots'), 'error');
            return;
        }
        const place = trail.places.find((p: TrailPlace) => p.place_id === placeId);
        const ok = await confirm({
            title: t('plan2.remove.title', { name: place?.name || '' }),
            confirmLabel: t('plan2.remove.confirm'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (ok) writeTrailPlaces(trailId, trail.places.filter((p: TrailPlace) => p.place_id !== placeId));
    };

    const refreshSlot = async (slot: TimeOfDay) => {
        if (!result || !resultLoc) {
            toast(t('plan2.needLocation'), 'error');
            return;
        }
        setBusySlot(slot);
        try {
            setResult(await regenerateSlot(result, slot, rp, resultLoc));
            setFreshResult(false);
        } catch (err) {
            toast(err instanceof Error ? err.message : t('generator.error.regenerate'), 'error');
        } finally {
            setBusySlot(null);
        }
    };

    const replacePlace = async (trailId: string, placeId: string) => {
        if (!result || !resultLoc) {
            toast(t('plan2.needLocation'), 'error');
            return;
        }
        setBusyPlaceId(placeId);
        try {
            await replacePlaceInTrail(trailId, placeId, rp, resultLoc);
            setResult({ ...result });
            setFreshResult(false);
        } catch (err) {
            toast(err instanceof Error ? err.message : t('generator.error.replace'), 'error');
        } finally {
            setBusyPlaceId(null);
        }
    };

    const optimizeTrail = (trailId: string) => {
        const trail = getAITrail(trailId);
        if (!trail?.places || trail.places.length < 3) return;
        const optimized = optimizePlacesOrder(trail.places);
        if (isSameRouteOrder(trail.places, optimized)) {
            toast(t('generator.route.alreadyOptimized'));
            return;
        }
        writeTrailPlaces(trailId, optimized as TrailPlace[]);
        toast(t('plan2.toast.optimized'));
    };

    const optimizeDay = () => {
        if (!result) return;
        let changed = 0;
        SLOTS.forEach((slot) => {
            const trail = getTrailForScore(result[slot]);
            if (!trail?.places || trail.places.length < 3) return;
            const optimized = optimizePlacesOrder(trail.places);
            if (!isSameRouteOrder(trail.places, optimized)) {
                writeTrailPlaces(trail.id, optimized as TrailPlace[]);
                changed += 1;
            }
        });
        toast(changed ? t('plan2.toast.optimized') : t('generator.route.alreadyOptimized'));
    };

    const toggleRain = async () => {
        const next = !isRainy;
        setIsRainy(next);
        if (!result) return;
        setIsRefreshing(true);
        try {
            const regenerated = useAI
                ? await generateAIItinerary(rp, next, resultLoc || undefined)
                : generateItinerary(rp, next);
            setResult(regenerated);
            setFreshResult(true);
            toast(next ? t('plan2.toast.rainOn') : t('plan2.toast.rainOff'));
        } catch (err) {
            setIsRainy(!next);
            toast(err instanceof Error ? err.message : t('generator.error.update'), 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    const save = async (opts: { isPublic?: boolean } = {}) => {
        if (!user || !result) return null;
        setIsSaving(true);
        try {
            const id = await saveItinerary(user.uid, {
                city: rp.city,
                date: rp.date,
                trail: result,
                preferences: {
                    city: rp.city,
                    date: rp.date,
                    categories: rp.categories,
                    pace: rp.pace,
                    maxWalkingLevel: rp.maxWalkingLevel,
                    proximity: rp.proximity,
                    startTime: rp.startTime,
                },
                trailData: collectTrailData(result, Boolean(opts.isPublic)),
                ...(opts.isPublic ? { isPublic: true } : {}),
            });
            setSavedItineraryId(id);
            if (!opts.isPublic) {
                logActivity(user.uid, {
                    type: 'save',
                    title: t('generator.save'),
                    message: t('generator.save.success.message', { city: rp.city, date: rp.date }),
                });
                toast(t('plan2.toast.saved'));
            }
            return id;
        } catch (err: any) {
            if (err?.code === 'permission-denied') toast(t('share.permissionDenied'), 'error');
            else if (err?.code === 'resource-exhausted') toast(t('share.tooLarge'), 'error');
            else toast(t('generator.save.failed', { error: err?.message || '' }), 'error');
            return null;
        } finally {
            setIsSaving(false);
        }
    };

    const share = async () => {
        if (!user) { toast(t('auth.loginRequired'), 'error'); return; }
        const id = await save({ isPublic: true });
        if (!id) return;
        const link = `${window.location.origin}/trip/${id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('share.title', { city: rp.city }),
                    text: t('share.text', { city: rp.city }),
                    url: link,
                });
                return;
            } catch (e: any) {
                if (e?.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(link);
            toast(t('plan2.toast.linkCopied'));
        } catch {
            toast(link);
        }
    };

    const exportPdf = () => exportToPDF(multiDayResult || result!, rp.city, rp.date);
    const exportCalendar = () => exportToGoogleCalendar(multiDayResult || result!, rp.city, rp.date);

    const openPlace = async (place: TrailPlace) => {
        setSelectedPlace(place);
        const service = BudgetService.getInstance();
        setBookingInfo(service.getBookingInfo(place as any));
        if (!crowdInfo[place.place_id]) {
            try {
                const info = await getCrowdInfo(place as any);
                setCrowdInfo((prev) => ({ ...prev, [place.place_id]: info }));
            } catch { /* optional */ }
        }
    };

    const checkIn = async (
        place: TrailPlace,
        data: { note: string; rating: number; photo: File | null },
        onProgress: (n: number) => void,
    ) => {
        if (!user) return false;
        let photoURL: string | undefined;
        if (data.photo) {
            try {
                onProgress(10);
                const compressed = await compressImage(data.photo);
                onProgress(30);
                photoURL = await uploadPhoto(compressed, user.uid, 'checkins', (p) => onProgress(30 + p * 0.7));
                onProgress(100);
            } catch {
                onProgress(0);
                toast(t('checkin.photo.failed'), 'error');
            }
        }
        try {
            await saveCheckIn({
                userId: user.uid,
                placeName: place.name,
                placeAddress: place.address || '',
                location: place.location as any,
                note: data.note,
                rating: data.rating,
                photo: photoURL,
            });
            logActivity(user.uid, {
                type: 'checkin',
                title: t('checkin.title'),
                message: t('checkin.success.message', { name: place.name }),
            });
            setStampedNames((prev) => new Set(prev).add(place.name));
            toast(t('plan2.toast.stamped', { name: place.name }));
            return true;
        } catch {
            toast(t('checkin.failed'), 'error');
            return false;
        }
    };

    const startCompanion = () => {
        if (!result || !resultLoc) {
            toast(t('plan2.needLocation'), 'error');
            return;
        }
        setIsCompanionMode(true);
        const service = CompanionService.getInstance();
        const unsubscribe = service.subscribe((n) => setNotifications((prev) => [n, ...prev]));
        const stopWeather = service.startWeatherMonitoring(
            resultLoc, rp.date, result, rp, (next) => setResult(next), 30,
        );
        service.checkCrowdLevels(result, rp, resultLoc, () => setResult((r) => (r ? { ...r } : r)));
        const stopCrowd = service.startCrowdMonitoring(
            result, rp, resultLoc, () => setResult((r) => (r ? { ...r } : r)), 15,
        );
        companionStop.current = () => { unsubscribe(); stopWeather(); stopCrowd(); };
        toast(t('plan2.toast.companionOn'));
    };

    const stopCompanion = () => {
        companionStop.current?.();
        companionStop.current = null;
        setIsCompanionMode(false);
        setNotifications([]);
    };

    const actOnNotification = async (n: CompanionNotification) => {
        try {
            await n.onAction();
            setNotifications((prev) => prev.filter((x) => x.id !== n.id));
        } catch {
            toast(t('generator.error.suggestionAction'), 'error');
        }
    };

    const dismissNotification = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));

    const editPreferences = () => {
        stopCompanion();
        setPhase('compose');
    };

    const hasResult = kind === 'walk' ? Boolean(walkRoute) : Boolean(result);
    const showResult = () => { if (hasResult) { setFreshResult(false); setPhase('result'); } };

    return {
        // state
        phase, preferences, setPreferences, request, span, setSpan, isWalk, kind, walkRoute, hasResult, showResult, tripDuration, isRainy, setIsRainy, useAI, setUseAI,
        destinationLocation, resultLoc, rp, nearbyPlaces, personalizedRec, result, multiDayResult, activeDay, freshResult, error,
        setError, busySlot, busyDay, busyPlaceId, isRefreshing, isSaving, savedItineraryId, transportOptions,
        crowdInfo, bookingInfo, selectedPlace, setSelectedPlace, stampedNames, isCompanionMode, notifications,
        // derived
        slots, dayPlaces, budget, canGenerate, travelMinutes,
        // actions
        toggleCategory, setDestination, applyRecommendation, applyTemplate, generate, switchDay, refreshDay,
        writeTrailPlaces, removePlace, refreshSlot, replacePlace, optimizeTrail, optimizeDay, toggleRain, save,
        share, exportPdf, exportCalendar, openPlace, checkIn, startCompanion, stopCompanion, actOnNotification,
        dismissNotification, editPreferences, cancelGenerate,
    };
}

export type Planner = ReturnType<typeof usePlanner>;
