import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../services/i18n';
import { displayPlace } from '../../lib/itinerary';
import { DropText } from '../../ui/DropText';

interface ResultHeaderProps {
    title: string;
    /** Short facts about the request: dates, length, interests. */
    meta: (string | undefined | false)[];
    /** Numbers about the route, already formatted (value bold, unit after). */
    facts: { value: React.ReactNode; unit: string; key: string }[];
    onEdit: () => void;
}

/** Top of every result: a way back to the form, then what this result is. */
export const ResultHeader: React.FC<ResultHeaderProps> = ({ title, meta, facts, onEdit }) => {
    const { t } = useLanguage();
    return (
        <header className="rh">
            <button type="button" className="rh__back" onClick={onEdit}>
                <ArrowLeft size={18} aria-hidden="true" /> {t('trip.edit')}
            </button>
            <h1 className="rh__title" title={title}><DropText key={title} text={displayPlace(title)} /></h1>
            <p className="rh__meta">
                {meta.filter(Boolean).map((m) => <span key={m as string}>{m}</span>)}
            </p>
            {facts.length > 0 && (
                <ul className="rh__facts">
                    {facts.map((f) => (
                        <li key={f.key}><strong className="num">{f.value}</strong> {f.unit}</li>
                    ))}
                </ul>
            )}
        </header>
    );
};

export default ResultHeader;
