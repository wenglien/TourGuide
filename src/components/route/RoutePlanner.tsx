import React, { useState } from 'react';
import './RoutePlanner.css';
import { AddressAutocomplete } from '../map/AddressAutocomplete';
import { generateRouteWithGemini, type RoutePreferences, type AIGeneratedRoute } from '../../services/geminiRouteService';
import { useLanguage } from '../../services/i18n';

const CATEGORY_OPTIONS = [
    { value: 'food', icon: '' },
    { value: 'culture', icon: '' },
    { value: 'shopping', icon: '' },
    { value: 'nature', icon: '' },
    { value: 'nightlife', icon: '' },
    { value: 'photography', icon: '' },
];

const DURATION_OPTIONS = [
    { value: 'quick', icon: '' },
    { value: 'half_day', icon: '' },
    { value: 'full_day', icon: '' },
];

const WALKING_OPTIONS = [
    { value: 'low' },
    { value: 'medium' },
    { value: 'high' },
];

export const RoutePlanner: React.FC = () => {
    const { t } = useLanguage();
    // Form state
    const [destination, setDestination] = useState('');
    const [categories, setCategories] = useState<string[]>(['food', 'culture']);
    const [duration, setDuration] = useState<'quick' | 'half_day' | 'full_day'>('half_day');
    const [walkingLevel, setWalkingLevel] = useState<'low' | 'medium' | 'high'>('medium');

    // Result state
    const [generatedRoute, setGeneratedRoute] = useState<AIGeneratedRoute | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'input' | 'preferences' | 'result'>('input');

    // Toggle category selection
    const toggleCategory = (category: string) => {
        setCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Handle destination change
    const handleDestinationChange = (address: string) => {
        setDestination(address);
    };

    // Generate route - simple flow: destination -> prompt -> Gemini -> result
    const handleGenerateRoute = async () => {
        if (!destination.trim()) {
            setError(t('route.planner.error.destination'));
            return;
        }

        if (categories.length === 0) {
            setError(t('route.planner.error.categories'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Build preferences and call Gemini directly
            const preferences: RoutePreferences = {
                destination: destination.trim(),
                categories,
                duration,
                walkingLevel,
            };

            console.log('Generating route with preferences:', preferences);

            // Call Gemini AI to generate route
            const route = await generateRouteWithGemini(preferences);

            if (route && route.places.length > 0) {
                setGeneratedRoute(route);
                setStep('result');
            } else {
                throw new Error(t('route.planner.error.ai'));
            }
        } catch (err) {
            console.error('Route generation error:', err);
            setError(err instanceof Error ? err.message : t('route.planner.error.generic'));
        } finally {
            setIsLoading(false);
        }
    };

    // Reset to start
    const handleReset = () => {
        setDestination('');
        setCategories(['food', 'culture']);
        setDuration('half_day');
        setWalkingLevel('medium');
        setGeneratedRoute(null);
        setStep('input');
        setError(null);
    };

    return (
        <div className="route-planner">
            <div className="route-planner__header">
                <h1 className="route-planner__title">
                    {t('route.title')}
                </h1>
                <p className="route-planner__subtitle">
                    {t('route.subtitle')}
                </p>
            </div>

            {/* Progress indicator */}
            <div className="route-planner__progress">
                <div className={`route-planner__progress-step ${step === 'input' || step === 'preferences' || step === 'result' ? 'active' : ''}`}>
                    <span className="step-number">1</span>
                    <span className="step-label">{t('route.step.destination')}</span>
                </div>
                <div className="route-planner__progress-line" />
                <div className={`route-planner__progress-step ${step === 'preferences' || step === 'result' ? 'active' : ''}`}>
                    <span className="step-number">2</span>
                    <span className="step-label">{t('route.step.preferences')}</span>
                </div>
                <div className="route-planner__progress-line" />
                <div className={`route-planner__progress-step ${step === 'result' ? 'active' : ''}`}>
                    <span className="step-number">3</span>
                    <span className="step-label">{t('route.step.result')}</span>
                </div>
            </div>

            {/* Step 1: Destination Input */}
            {step === 'input' && (
                <div className="route-planner__step animate-fadeIn">
                    <div className="route-planner__section">
                        <h3 className="route-planner__section-title">
                            {t('route.planner.whereToGo')}
                        </h3>
                        <AddressAutocomplete
                            value={destination}
                            onChange={handleDestinationChange}
                            placeholder={t('route.planner.placeholder')}
                            className="route-planner__destination-input"
                        />
                        <p className="route-planner__hint">
                            {t('route.planner.hint')}
                        </p>
                    </div>

                    <button
                        className="btn btn-primary route-planner__next-btn"
                        onClick={() => setStep('preferences')}
                        disabled={!destination.trim()}
                    >
                        {t('route.planner.next')}
                    </button>
                </div>
            )}

            {/* Step 2: Preferences */}
            {step === 'preferences' && (
                <div className="route-planner__step animate-fadeIn">
                    <div className="route-planner__destination-preview">
                        <span className="route-planner__destination-label">{t('route.planner.destination')}：</span>
                        <span className="route-planner__destination-value">{destination}</span>
                        <button
                            className="route-planner__destination-edit"
                            onClick={() => setStep('input')}
                        >
                            {t('route.planner.modify')}
                        </button>
                    </div>

                    <div className="route-planner__section">
                        <h3 className="route-planner__section-title">
                            {t('route.planner.experience')}
                            <span className="route-planner__section-hint">（{t('generator.multiSelect')}）</span>
                        </h3>
                        <div className="route-planner__category-grid">
                            {CATEGORY_OPTIONS.map(({ value, icon }) => (
                                <button
                                    key={value}
                                    className={`route-planner__category-btn ${categories.includes(value) ? 'selected' : ''}`}
                                    onClick={() => toggleCategory(value)}
                                >
                                    <span className="route-planner__category-icon">{icon}</span>
                                    <span className="route-planner__category-label">{t(`category.${value}`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="route-planner__section">
                        <h3 className="route-planner__section-title">
                            {t('route.planner.time')}
                        </h3>
                        <div className="route-planner__duration-options">
                            {DURATION_OPTIONS.map(({ value, icon }) => (
                                <button
                                    key={value}
                                    className={`route-planner__duration-btn ${duration === value ? 'selected' : ''}`}
                                    onClick={() => setDuration(value as typeof duration)}
                                >
                                    <span className="route-planner__duration-icon">{icon}</span>
                                    <span className="route-planner__duration-label">{t(`duration.${value}`)}</span>
                                    <span className="route-planner__duration-desc">{t(`duration.${value}.desc`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="route-planner__section">
                        <h3 className="route-planner__section-title">
                            {t('route.planner.walking')}
                        </h3>
                        <div className="route-planner__walking-options">
                            {WALKING_OPTIONS.map(({ value }) => (
                                <button
                                    key={value}
                                    className={`route-planner__walking-btn ${walkingLevel === value ? 'selected' : ''}`}
                                    onClick={() => setWalkingLevel(value as typeof walkingLevel)}
                                >
                                    <span className="route-planner__walking-label">{t(`walking.${value}`)}</span>
                                    <span className="route-planner__walking-desc">{t(`walking.${value}.desc`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="route-planner__actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setStep('input')}
                        >
                            Back {t('common.previous')}
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleGenerateRoute}
                            disabled={isLoading || categories.length === 0}
                        >
                            {isLoading ? (
                                <>
                                    <span className="route-planner__loading-spinner" />
                                    {t('route.planner.generating')}
                                </>
                            ) : (
                                t('route.planner.generate')
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="route-planner__error">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Result */}
            {step === 'result' && generatedRoute && (
                <div className="route-planner__step animate-fadeIn">
                    <div className="route-planner__result-header">
                        <div className="route-planner__result-title-group">
                            <h2 className="route-planner__result-title">{generatedRoute.title}</h2>
                            <p className="route-planner__result-description">{generatedRoute.description}</p>
                            {generatedRoute.theme && (
                                <span className="route-planner__result-theme">#{generatedRoute.theme}</span>
                            )}
                        </div>
                        <button className="btn btn-secondary" onClick={handleReset}>
                            {t('route.planner.replanning')}
                        </button>
                    </div>

                    {/* AI Tips */}
                    {generatedRoute.tips && generatedRoute.tips.length > 0 && (
                        <div className="route-planner__ai-tip">
                            <span className="route-planner__ai-tip-text">
                                {generatedRoute.tips.join(' | ')}
                            </span>
                        </div>
                    )}

                    {/* Route timeline */}
                    <div className="route-planner__timeline">
                        <h3 className="route-planner__timeline-title">{t('route.planner.recommended')}</h3>
                        {generatedRoute.places.map((place, index) => (
                            <div key={index} className="route-planner__timeline-item">
                                <div className="route-planner__timeline-marker">
                                    <span>{index + 1}</span>
                                </div>
                                <div className="route-planner__timeline-content">
                                    <div className="route-planner__timeline-header">
                                        <h4>{place.name}</h4>
                                    </div>
                                    {place.category && (
                                        <span className="route-planner__timeline-category">{place.category}</span>
                                    )}
                                    {place.address && (
                                        <p className="route-planner__timeline-address">{place.address}</p>
                                    )}
                                    {place.reason && (
                                        <p className="route-planner__timeline-reason">"{place.reason}"</p>
                                    )}
                                    <div className="route-planner__timeline-meta">
                                        {place.estimatedStayTime && place.estimatedStayTime > 0 && (
                                            <span className="route-planner__timeline-time">
                                                {t('route.planner.stayTime', { n: place.estimatedStayTime })}
                                            </span>
                                        )}
                                        {place.tips && (
                                            <span className="route-planner__timeline-tip">
                                                {place.tips}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Route Summary */}
                    <div className="route-planner__summary">
                        <div className="route-planner__summary-item">
                            <span className="route-planner__summary-label">{t('route.planner.spotsCount')}</span>
                            <span className="route-planner__summary-value">
                                {generatedRoute.places.length} {t('common.unit.count')}
                            </span>
                        </div>
                        <div className="route-planner__summary-item">
                            <span className="route-planner__summary-label">{t('generator.summary.time')}</span>
                            <span className="route-planner__summary-value">
                                約 {generatedRoute.totalEstimatedTime > 0
                                    ? (generatedRoute.totalEstimatedTime >= 60
                                        ? `${Math.round(generatedRoute.totalEstimatedTime / 60)} ${t('common.unit.hours')}`
                                        : `${generatedRoute.totalEstimatedTime} ${t('common.unit.minutes')}`)
                                    : (generatedRoute.places.reduce((sum, p) => sum + (p.estimatedStayTime || 45), 0) >= 60
                                        ? `${Math.round(generatedRoute.places.reduce((sum, p) => sum + (p.estimatedStayTime || 45), 0) / 60)} ${t('common.unit.hours')}`
                                        : `${generatedRoute.places.reduce((sum, p) => sum + (p.estimatedStayTime || 45), 0)} ${t('common.unit.minutes')}`)}
                            </span>
                        </div>
                        <div className="route-planner__summary-item">
                            <span className="route-planner__summary-label">{t('route.planner.walkingLevel')}</span>
                            <span className="route-planner__summary-value">
                                {t(`route.planner.walking.${generatedRoute.walkingLevel}`)}
                            </span>
                        </div>
                        {generatedRoute.budgetRange && generatedRoute.budgetRange.min > 0 && (
                            <div className="route-planner__summary-item">
                                <span className="route-planner__summary-label">{t('route.planner.budget')}</span>
                                <span className="route-planner__summary-value">
                                    {generatedRoute.budgetRange.currency || 'NT$'}{generatedRoute.budgetRange.min} - {generatedRoute.budgetRange.currency || 'NT$'}{generatedRoute.budgetRange.max}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Highlights */}
                    {generatedRoute.highlights && generatedRoute.highlights.length > 0 && (
                        <div className="route-planner__highlights">
                            <h4>{t('route.planner.highlights')}</h4>
                            <div className="route-planner__highlights-list">
                                {generatedRoute.highlights.map((highlight, index) => (
                                    <span key={index} className="route-planner__highlight-tag">
                                        {highlight}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="route-planner__result-actions">
                        <button className="btn btn-primary btn-lg" onClick={() => {
                            // Copy route to clipboard
                            const routeText = generatedRoute.places.map((p, i) =>
                                t('route.planner.copy.format', { n: i + 1, name: p.name, address: p.address, time: p.estimatedStayTime })
                            ).join('\n\n');
                            navigator.clipboard.writeText(routeText);
                            alert(t('route.planner.copied'));
                        }}>
                            {t('route.planner.copy')}
                        </button>
                        <button className="btn btn-secondary btn-lg" onClick={handleReset}>
                            {t('route.planner.replanning')}
                        </button>
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
                <div className="route-planner__loading-overlay">
                    <div className="route-planner__loading-content">
                        <div className="route-planner__loading-animation">
                            <div className="route-planner__loading-dot" />
                            <div className="route-planner__loading-dot" />
                            <div className="route-planner__loading-dot" />
                        </div>
                        <p>{t('route.planner.loading', { city: destination })}</p>
                        <p className="route-planner__loading-sub">{t('route.planner.loadingSub')}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoutePlanner;
