import React from 'react';
import type { TimeOfDay, TravelPace } from '../../types';
import { getRecommendedStartTimes } from '../../services/ruleEngine';
import { useLanguage } from '../../services/i18n';
import { SLOTS } from '../../lib/itinerary';

// Same rule the planners use (ruleEngine + aiItineraryService).
const SLOTS_BY_PACE: Record<TravelPace, TimeOfDay[]> = {
    relaxed: ['afternoon'],
    moderate: ['afternoon', 'evening'],
    packed: ['morning', 'afternoon', 'evening', 'night'],
};

/** Live preview of which time slots a pace produces, redrawn as the pace changes. */
export const DayShape: React.FC<{ pace: TravelPace; startTime?: string; days: number }> = ({ pace, startTime, days }) => {
    const { t } = useLanguage();
    const on = SLOTS_BY_PACE[pace];
    const times = getRecommendedStartTimes(pace);

    return (
        <figure className="day-shape" aria-label={t('plan2.shape.title')}>
            <figcaption className="field__hint">
                {t('plan2.shape.title')}
                {days > 1 && <span className="num"> {t('plan2.shape.days', { n: days })}</span>}
            </figcaption>
            <ol className="day-shape__slots">
                {SLOTS.map((slot) => {
                    const active = on.includes(slot);
                    const time = active && slot === on[0] && startTime ? startTime : times[slot];
                    return (
                        <li key={slot} data-slot={slot} className={active ? 'is-on' : ''}>
                            <span className="day-shape__bar" aria-hidden="true" />
                            <span className="day-shape__label">{t(`slot.${slot}`)}</span>
                            <span className="day-shape__time num">{active ? time : t('plan2.shape.off')}</span>
                        </li>
                    );
                })}
            </ol>
        </figure>
    );
};

export default DayShape;
