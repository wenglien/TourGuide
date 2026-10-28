import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Trash2, Star, Award, Camera, CalendarDays, Globe2, Stamp as StampIcon, CalendarRange } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../services/i18n';
import { useFeedback } from '../../ui/feedbackContext';
import { Sheet } from '../../ui/Sheet';
import { Stamp } from '../stamps/Stamp';
import { logout } from '../../services/authService';
import {
    getUserItineraries, getUserActivities, deleteItinerary, logActivity, getUserCheckIns, deleteCheckIn,
} from '../../services/dbService';
import { useLogin } from '../../app/useLogin';
import './trips.css';

type Tab = 'trips' | 'stamps' | 'activity' | 'achievements';

function tsToDate(ts: any): Date | null {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (typeof ts.seconds === 'number') return new Date(ts.seconds * 1000);
    return null;
}

export const TripsPage: React.FC = () => {
    const { user, loading } = useAuth();
    const { t, language } = useLanguage();
    const { toast, confirm } = useFeedback();
    const navigate = useNavigate();
    const login = useLogin();
    const locale = language === 'en' ? 'en' : 'zh-TW';

    const [tab, setTab] = useState<Tab>('trips');
    const [trips, setTrips] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [checkIns, setCheckIns] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [openStamp, setOpenStamp] = useState<any | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setDataLoading(true);
        Promise.all([
            getUserItineraries(user.uid).then(setTrips),
            getUserActivities(user.uid).then(setActivities),
            getUserCheckIns(user.uid).then(setCheckIns),
        ]).catch(() => toast(t('common.error'), 'error')).finally(() => setDataLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return trips;
        return trips.filter((i) => [i.city, i.date, ...(i.preferences?.categories || []).map((c: string) => t(`category.${c}`))]
            .join(' ').toLowerCase().includes(q));
    }, [trips, query, t]);

    if (loading) return <div className="loading-screen"><span className="spinner" aria-label={t('common.loading')} /></div>;

    if (!user) {
        return (
            <div className="page">
                <div className="empty">
                    <h1 className="page-title">{t('trips.signedOut.title')}</h1>
                    <p>{t('trips.signedOut.desc')}</p>
                    <button className="btn btn-primary" onClick={login}>{t('trips.signedOut.cta')}</button>
                </div>
            </div>
        );
    }

    const cities = new Set(trips.map((i) => i.city)).size;

    const removeTrip = async (trip: any) => {
        const ok = await confirm({
            title: t('trips.delete.title', { city: trip.city || t('common.unnamed') }),
            message: t('trips.delete.desc'),
            confirmLabel: t('trips.delete.confirm'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!ok) return;
        try {
            await deleteItinerary(trip.id);
            setTrips((prev) => prev.filter((i) => i.id !== trip.id));
            logActivity(user.uid, { type: 'delete', title: t('trips.activity.deleted'), message: trip.city || '' });
            toast(t('trips.toast.deleted'));
        } catch {
            toast(t('common.error'), 'error');
        }
    };

    const removeStamp = async (stamp: any) => {
        const ok = await confirm({
            title: t('trips.stamp.delete.title', { name: stamp.placeName }),
            confirmLabel: t('trips.stamp.delete.confirm'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!ok) return;
        try {
            await deleteCheckIn(stamp.id);
            setCheckIns((prev) => prev.filter((c) => c.id !== stamp.id));
            setOpenStamp(null);
            toast(t('trips.toast.stampDeleted'));
        } catch {
            toast(t('common.error'), 'error');
        }
    };

    const achievements: { Icon: LucideIcon; title: string; desc: string; current: number; goal: number }[] = [
        { Icon: CalendarRange, title: t('achievement.firstPlan'), desc: t('achievement.firstPlan.desc'), current: trips.length, goal: 1 },
        { Icon: Camera, title: t('achievement.photographer'), desc: t('achievement.photographer.desc'), current: checkIns.filter((c) => c.photo).length, goal: 1 },
        { Icon: CalendarDays, title: t('achievement.planner'), desc: t('achievement.planner.desc'), current: trips.length, goal: 5 },
        { Icon: Globe2, title: t('achievement.traveler'), desc: t('achievement.traveler.desc'), current: cities, goal: 3 },
        { Icon: StampIcon, title: t('achievement.explorer'), desc: t('achievement.explorer.desc'), current: checkIns.length, goal: 10 },
    ];

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: 'trips', label: t('trips.tab.trips'), count: trips.length },
        { id: 'stamps', label: t('trips.tab.stamps'), count: checkIns.length },
        { id: 'activity', label: t('trips.tab.activity') },
        { id: 'achievements', label: t('trips.tab.achievements') },
    ];

    return (
        <div className="page trips">
            <header className="trips-head">
                {user.photoURL && <img src={user.photoURL} alt="" className="trips-head__avatar" referrerPolicy="no-referrer" />}
                <div className="trips-head__who">
                    <h1 className="page-title">{user.displayName || t('trips.title')}</h1>
                    <p className="subtle">{user.email}</p>
                </div>
                <button className="btn btn-ghost btn-sm trips-head__logout" onClick={logout}>{t('nav.logout')}</button>
            </header>

            <dl className="trips-stats">
                <div><dt>{t('trips.stats.trips')}</dt><dd className="num">{trips.length}</dd></div>
                <div><dt>{t('trips.stats.cities')}</dt><dd className="num">{cities}</dd></div>
                <div><dt>{t('trips.stats.stamps')}</dt><dd className="num">{checkIns.length}</dd></div>
            </dl>

            <div className="trips-tabs" role="tablist" aria-label={t('trips.title')}>
                {tabs.map((tb) => (
                    <button
                        key={tb.id}
                        role="tab"
                        id={`tab-${tb.id}`}
                        aria-selected={tab === tb.id}
                        aria-controls={`panel-${tb.id}`}
                        className="trips-tab"
                        onClick={() => setTab(tb.id)}
                    >
                        {tb.label}
                        {tb.count != null && tb.count > 0 && <span className="trips-tab__count num">{tb.count}</span>}
                    </button>
                ))}
            </div>

            <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="trips-panel">
                {dataLoading && <p className="subtle">{t('common.loading')}</p>}

                {!dataLoading && tab === 'trips' && (
                    trips.length === 0 ? (
                        <div className="empty">
                            <p>{t('trips.empty.trips')}</p>
                            <Link to="/" className="btn btn-primary">{t('trips.empty.trips.cta')}</Link>
                        </div>
                    ) : (
                        <>
                            <label className="trips-search">
                                <Search size={18} aria-hidden="true" />
                                <span className="sr-only">{t('profile.search.placeholder')}</span>
                                <input
                                    type="search"
                                    className="input"
                                    placeholder={t('profile.search.placeholder')}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </label>
                            {filtered.length === 0 && <p className="subtle">{t('trips.search.none', { q: query })}</p>}
                            <ul className="trip-list">
                                {filtered.map((trip) => {
                                    const stops = Object.values(trip.trailData || {})
                                        .reduce((n: number, tr: any) => n + (tr?.places?.length || 0), 0);
                                    return (
                                        <li key={trip.id} className="trip-item">
                                            <button
                                                className="trip-item__main"
                                                onClick={() => navigate('/', { state: { savedItinerary: trip } })}
                                            >
                                                <span className="trip-item__city">{trip.city || t('common.unnamed')}</span>
                                                <span className="trip-item__meta">
                                                    <span className="num">{trip.date}</span>
                                                    {stops > 0 && <span>{t('trips.stops', { n: stops })}</span>}
                                                    {(trip.preferences?.categories || []).slice(0, 3).map((c: string) => (
                                                        <span key={c}>{t(`category.${c}`)}</span>
                                                    ))}
                                                    {trip.isPublic && <span className="trip-item__public">{t('trips.shared')}</span>}
                                                </span>
                                            </button>
                                            <button
                                                className="icon-btn"
                                                onClick={() => removeTrip(trip)}
                                                aria-label={t('trips.delete.title', { city: trip.city || t('common.unnamed') })}
                                            >
                                                <Trash2 size={18} aria-hidden="true" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )
                )}

                {!dataLoading && tab === 'stamps' && (
                    checkIns.length === 0 ? (
                        <div className="empty">
                            <p>{t('trips.empty.stamps')}</p>
                            <Link to="/" className="btn btn-secondary">{t('trips.empty.stamps.cta')}</Link>
                        </div>
                    ) : (
                        <ul className="stamp-book">
                            {checkIns.map((c) => {
                                const d = tsToDate(c.timestamp);
                                return (
                                    <li key={c.id}>
                                        <button className="stamp-book__item" onClick={() => setOpenStamp(c)}>
                                            <Stamp
                                                name={c.placeName}
                                                caption={d ? d.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }) : undefined}
                                                seed={c.id}
                                                size={124}
                                            />
                                            <span className="stamp-book__name">{c.placeName}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )
                )}

                {!dataLoading && tab === 'activity' && (
                    activities.length === 0 ? (
                        <div className="empty"><p>{t('profile.empty.activity')}</p></div>
                    ) : (
                        <ol className="activity">
                            {activities.map((a) => {
                                const d = tsToDate(a.timestamp);
                                return (
                                    <li key={a.id}>
                                        <time className="num subtle">{d ? d.toLocaleString(locale, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : t('common.just.now')}</time>
                                        <p><strong>{a.title}</strong> {a.message}</p>
                                    </li>
                                );
                            })}
                        </ol>
                    )
                )}

                {!dataLoading && tab === 'achievements' && (
                    <ul className="achievements">
                        {achievements.map(({ Icon, title, desc, current, goal }) => {
                            const done = current >= goal;
                            return (
                                <li key={title} className={done ? 'is-done' : ''}>
                                    <span className="achievements__icon"><Icon size={20} aria-hidden="true" /></span>
                                    <span className="achievements__body">
                                        <strong>{title}</strong>
                                        <small>{desc}</small>
                                        {!done && (
                                            <span className="achievements__bar px-meter" role="meter" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={current} aria-label={title}>
                                                <span style={{ width: `${Math.min(100, (current / goal) * 100)}%` }} />
                                            </span>
                                        )}
                                    </span>
                                    <span className="achievements__state num">
                                        {done ? <Award size={18} aria-label={t('trips.achievement.done')} /> : `${current}/${goal}`}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <Sheet
                open={Boolean(openStamp)}
                onClose={() => setOpenStamp(null)}
                title={openStamp?.placeName}
                closeLabel={t('common.close')}
                flush={Boolean(openStamp?.photo)}
                footer={openStamp && (
                    <div className="sheet__actions">
                        <button className="btn btn-ghost btn-danger" onClick={() => removeStamp(openStamp)}>
                            <Trash2 size={16} aria-hidden="true" /> {t('trips.stamp.delete.confirm')}
                        </button>
                    </div>
                )}
            >
                {openStamp && (
                    <div className="stamp-detail">
                        {openStamp.photo && <img src={openStamp.photo} alt={openStamp.placeName} className="stamp-detail__photo" />}
                        <div className="stamp-detail__body">
                            {openStamp.placeAddress && <p className="muted">{openStamp.placeAddress}</p>}
                            <p className="stamp-detail__rating" aria-label={t('plan2.stamp.stars', { n: openStamp.rating || 5 })}>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star key={i} size={18} aria-hidden="true" className={i < (openStamp.rating || 5) ? 'is-on' : ''} />
                                ))}
                            </p>
                            {openStamp.note && <p className="stamp-detail__note">{openStamp.note}</p>}
                            {tsToDate(openStamp.timestamp) && (
                                <p className="subtle num">{tsToDate(openStamp.timestamp)!.toLocaleString(locale)}</p>
                            )}
                        </div>
                    </div>
                )}
            </Sheet>
        </div>
    );
};

export default TripsPage;
