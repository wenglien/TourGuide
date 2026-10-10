import React, { useState } from 'react';
import {
    Camera, ChevronDown, Footprints, Landmark, MoonStar, Palette, ShoppingBag, Sparkles, Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PreferenceCategory, TravelPace, WalkingLevel } from '../../types';
import { AddressAutocomplete } from '../../components/map/AddressAutocomplete';
import { Segmented } from '../../ui/Segmented';
import { useLanguage } from '../../services/i18n';
import { DayShape } from '../plan/DayShape';
import { QuickStart } from './QuickStart';
import { SPANS, type Planner, type Span } from '../plan/usePlanner';

const CATEGORIES: { value: PreferenceCategory; Icon: LucideIcon }[] = [
    { value: 'food', Icon: Utensils },
    { value: 'culture', Icon: Landmark },
    { value: 'walking', Icon: Footprints },
    { value: 'exhibition', Icon: Palette },
    { value: 'photography', Icon: Camera },
    { value: 'shopping', Icon: ShoppingBag },
    { value: 'nightlife', Icon: MoonStar },
];

/** The one form for every kind of outing; how long it is decides walk vs. trip. */
export const Composer: React.FC<{ planner: Planner }> = ({ planner: p }) => {
    const { t } = useLanguage();
    const [moreOpen, setMoreOpen] = useState(false);
    const prefs = p.preferences;
    const days = parseInt(p.tripDuration, 10);

    const spanLabel = (s: Span) => (s === 'quick' ? t('trip.span.quick') : s === 'half_day' ? t('trip.span.half') : t('plan2.days.n', { n: s }));

    const noCity = !prefs.city.trim();
    const status = noCity
        ? t('trip.status.needCity')
        : prefs.categories.length === 0
            ? t('trip.status.mix', { city: prefs.city })
            : p.isWalk ? t('walk2.ready', { city: prefs.city }) : t('plan2.ready', { city: prefs.city, n: days });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (noCity) {
            p.setError(t('trip.error.destination'));
            document.getElementById('trip-destination')?.focus();
            return;
        }
        p.generate();
    };

    return (
        <form className="composer" onSubmit={submit} noValidate>
            <header className="composer__head">
                <h1 className="composer__title">{t('home2.title')}</h1>
                <p className="composer__lede">{t('home2.lede')}</p>
            </header>

            {p.personalizedRec && p.personalizedRec.confidence > 0.5 && (
                <aside className="plan-hint">
                    <Sparkles size={18} aria-hidden="true" />
                    <p>{p.personalizedRec.reasoning}</p>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={p.applyRecommendation}>{t('plan2.hint.apply')}</button>
                </aside>
            )}

            <div className="field">
                <label className="field__label" htmlFor="trip-destination">{t('home2.destination')}</label>
                <AddressAutocomplete
                    inputId="trip-destination"
                    value={prefs.city}
                    onChange={p.setDestination}
                    placeholder={t('home2.destination.placeholder')}
                    className="composer__destination"
                />
                {p.error && noCity && <p className="field__error" role="alert">{p.error}</p>}
                {noCity && <QuickStart planner={p} />}
                {p.nearbyPlaces.length > 0 && (
                    <p className="subtle">{t('plan2.nearby')}{p.nearbyPlaces.map((n) => n.name).join('、')}</p>
                )}
            </div>

            <div className="field">
                <span className="field__label">{t('trip.span.label')}</span>
                <div className="span-picker">
                    <Segmented<Span>
                        label={t('trip.span.label')}
                        value={p.span}
                        onChange={p.setSpan}
                        options={SPANS.map((s) => ({ value: s, label: spanLabel(s) }))}
                    />
                </div>
                <p className="span-picker__mode" aria-live="polite">
                    <strong>{p.isWalk ? t('trip.mode.walk') : t('trip.mode.plan')}</strong>
                    {p.isWalk ? t('trip.mode.walk.desc') : t('trip.mode.plan.desc')}
                </p>
            </div>

            <fieldset className="field composer__group">
                <legend className="field__label">{t('plan2.what')} <span className="field__optional">{t('trip.optional')}</span></legend>
                <div className="chips">
                    {CATEGORIES.map(({ value, Icon }) => (
                        <button
                            key={value}
                            type="button"
                            className="chip"
                            aria-pressed={prefs.categories.includes(value)}
                            onClick={() => p.toggleCategory(value)}
                        >
                            <Icon size={16} aria-hidden="true" />
                            {t(`category.${value}`)}
                        </button>
                    ))}
                </div>
            </fieldset>

            {!p.isWalk && (
                <div className="composer__plan">
                    <div className="plan-group__grid">
                        <label className="field">
                            <span className="field__label">{days > 1 ? t('generator.departureDate') : t('generator.singleDate')}</span>
                            <input
                                type="date"
                                className="input num"
                                value={prefs.date}
                                onChange={(e) => p.setPreferences((prev) => ({ ...prev, date: e.target.value }))}
                            />
                        </label>
                        <label className="field">
                            <span className="field__label">{t('generator.startTime')}</span>
                            <input
                                type="time"
                                className="input num"
                                value={prefs.startTime || '09:00'}
                                onChange={(e) => p.setPreferences((prev) => ({ ...prev, startTime: e.target.value }))}
                            />
                        </label>
                    </div>
                    <div className="field">
                        <span className="field__label">{t('generator.pace')}</span>
                        <Segmented<TravelPace>
                            label={t('generator.pace')}
                            value={prefs.pace}
                            onChange={(v) => p.setPreferences((prev) => ({ ...prev, pace: v }))}
                            options={(['relaxed', 'moderate', 'packed'] as TravelPace[]).map((v) => ({ value: v, label: t(`pace.${v}`) }))}
                        />
                        <span className="field__hint">{t(`pace.${prefs.pace}.desc`)}</span>
                        <DayShape pace={prefs.pace} startTime={prefs.startTime} days={days} />
                    </div>
                </div>
            )}

            <div className="composer__more">
                <button
                    type="button"
                    className="composer__more-toggle"
                    aria-expanded={moreOpen}
                    aria-controls="composer-more"
                    onClick={() => setMoreOpen(!moreOpen)}
                >
                    <span>{t('trip.more')}</span>
                    <small>
                        {t(`walking.${prefs.maxWalkingLevel || 'medium'}`)}
                        {!p.isWalk && <>，{t(`proximity.${prefs.proximity || 'close'}`)}{p.isRainy && <>，{t('plan2.rain')}</>}</>}
                    </small>
                    <ChevronDown size={18} aria-hidden="true" />
                </button>
                {moreOpen && (
                    <div id="composer-more" className="composer__more-body">
                        <div className="field">
                            <span className="field__label">{t('generator.walking')}</span>
                            <Segmented<WalkingLevel>
                                label={t('generator.walking')}
                                value={prefs.maxWalkingLevel || 'medium'}
                                onChange={(v) => p.setPreferences((prev) => ({ ...prev, maxWalkingLevel: v }))}
                                options={(['low', 'medium', 'high'] as WalkingLevel[]).map((v) => ({ value: v, label: t(`walking.${v}`) }))}
                            />
                        </div>
                        {!p.isWalk && (
                            <>
                                <div className="field">
                                    <span className="field__label">{t('generator.proximity')}</span>
                                    <Segmented<'close' | 'far'>
                                        label={t('generator.proximity')}
                                        value={prefs.proximity || 'close'}
                                        onChange={(v) => p.setPreferences((prev) => ({ ...prev, proximity: v }))}
                                        options={(['close', 'far'] as const).map((v) => ({ value: v, label: t(`proximity.${v}`) }))}
                                    />
                                </div>
                                <div className="plan-toggle">
                                    <span>
                                        <strong id="rain-label">{t('plan2.rain')}</strong>
                                        <small>{t('plan2.rain.desc')}</small>
                                    </span>
                                    <button type="button" className="switch" role="switch" aria-checked={p.isRainy} aria-labelledby="rain-label" onClick={() => p.setIsRainy(!p.isRainy)} />
                                </div>
                                {days === 1 && (
                                    <div className="plan-toggle">
                                        <span>
                                            <strong id="ai-label">{t('plan2.ai')}</strong>
                                            <small>{t('plan2.ai.desc')}</small>
                                        </span>
                                        <button type="button" className="switch" role="switch" aria-checked={p.useAI} aria-labelledby="ai-label" onClick={() => p.setUseAI(!p.useAI)} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {p.error && !noCity && <p className="notice notice--error" role="alert">{p.error}</p>}

            <div className="plan-submit">
                <p className="plan-submit__status">{status}</p>
                <button type="submit" className="btn btn-primary btn-lg">
                    {p.isWalk ? t('walk2.generate') : t('plan2.generate')}
                </button>
            </div>
        </form>
    );
};

export default Composer;
