import React, { useEffect, useState } from 'react';
import { ImagePlus, Star } from 'lucide-react';
import { Sheet } from '../../ui/Sheet';
import { Stamp } from '../stamps/Stamp';
import { useLanguage } from '../../services/i18n';
import { useFeedback } from '../../ui/feedbackContext';
import type { TrailPlace } from '../../lib/itinerary';

interface CheckInSheetProps {
    place: TrailPlace | null;
    onClose: () => void;
    onSubmit: (
        place: TrailPlace,
        data: { note: string; rating: number; photo: File | null },
        onProgress: (n: number) => void,
    ) => Promise<boolean>;
}

export const CheckInSheet: React.FC<CheckInSheetProps> = ({ place, onClose, onSubmit }) => {
    const { t } = useLanguage();
    const { toast } = useFeedback();
    const [note, setNote] = useState('');
    const [rating, setRating] = useState(5);
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    if (!place) return null;

    const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast(t('common.error.imageOnly'), 'error'); return; }
        if (file.size > 10 * 1024 * 1024) { toast(t('common.error.imageSize'), 'error'); return; }
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = async () => {
        setBusy(true);
        const ok = await onSubmit(place, { note, rating, photo }, setProgress);
        setBusy(false);
        if (!ok) return;
        // Let the stamp land before the sheet goes away.
        setDone(true);
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        window.setTimeout(onClose, reduce ? 500 : 1100);
    };

    const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

    return (
        <Sheet
            open
            onClose={onClose}
            title={t('plan2.stamp.title')}
            closeLabel={t('common.close')}
            footer={(
                <div className="sheet__actions">
                    <button className="btn btn-primary" onClick={submit} disabled={busy || done}>
                        {busy && <span className="spinner" aria-hidden="true" />}
                        {done ? t('plan2.stamp.done') : busy
                            ? (progress > 0 && progress < 100 ? t('plan2.stamp.uploading', { n: Math.round(progress) }) : t('checkin.submitting'))
                            : t('plan2.stamp.submit')}
                    </button>
                </div>
            )}
        >
            <div className="checkin">
                <div className="checkin__preview">
                    <span className={`checkin__stamp ${done ? 'is-pressed' : ''}`}>
                        <Stamp name={place.name} caption={today} seed={place.place_id} size={140} />
                    </span>
                    <p className="muted">{t('plan2.stamp.desc')}</p>
                </div>

                <fieldset className="field">
                    <legend className="field__label">{t('checkin.rating.label')}</legend>
                    <div className="stars" role="radiogroup" aria-label={t('checkin.rating.label')}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                role="radio"
                                aria-checked={rating === n}
                                aria-label={t('plan2.stamp.stars', { n })}
                                className={n <= rating ? 'is-on' : ''}
                                onClick={() => setRating(n)}
                            >
                                <Star size={26} aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                </fieldset>

                <div className="field">
                    <span className="field__label">{t('checkin.photo.optional')}</span>
                    <label className="photo-pick">
                        <input type="file" accept="image/*" onChange={pickPhoto} className="sr-only" />
                        {preview ? (
                            <img src={preview} alt={t('common.preview')} />
                        ) : (
                            <span><ImagePlus size={20} aria-hidden="true" /> {t('checkin.photo.select')}</span>
                        )}
                    </label>
                    {photo && (
                        <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => { setPhoto(null); setPreview(null); }}>
                            {t('checkin.photo.remove')}
                        </button>
                    )}
                </div>

                <label className="field">
                    <span className="field__label">{t('checkin.note.label')}</span>
                    <textarea
                        className="input"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('checkin.note.placeholder2')}
                    />
                </label>
            </div>
        </Sheet>
    );
};

export default CheckInSheet;
