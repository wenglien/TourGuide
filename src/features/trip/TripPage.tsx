import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Route, X } from 'lucide-react';
import { useLanguage } from '../../services/i18n';
import { useAuth } from '../../context/AuthContext';
import { getUserItineraries, getUserCheckIns } from '../../services/dbService';
import { usePlanner } from '../plan/usePlanner';
import { PlanResult } from '../plan/PlanResult';
import { WalkResult } from '../walk/WalkResult';
import { RouteLoading } from '../route-line/RouteLoading';
import { HeroDemo } from '../home/HeroDemo';
import { Stamp } from '../stamps/Stamp';
import { Composer } from './Composer';
import '../plan/plan.css';
import '../home/home.css';
import './trip.css';

export const TripPage: React.FC = () => {
    const p = usePlanner();
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [recent, setRecent] = useState<any[]>([]);
    const [stamps, setStamps] = useState<any[]>([]);

    useEffect(() => { window.scrollTo({ top: 0 }); }, [p.phase]);

    useEffect(() => {
        if (!user) return;
        getUserItineraries(user.uid).then((list) => setRecent(list.slice(0, 3))).catch(() => undefined);
        getUserCheckIns(user.uid).then((list) => setStamps(list.slice(0, 4))).catch(() => undefined);
    }, [user]);

    if (p.phase === 'generating') {
        return (
            <div className="page trip">
                <RouteLoading
                    title={p.isWalk ? t('route.planner.loading', { city: p.preferences.city }) : t('plan2.generating', { city: p.preferences.city })}
                    detail={p.isWalk ? t('trip.generating.walk') : t('plan2.generating.detail')}
                />
                <button className="btn btn-secondary" onClick={p.cancelGenerate}>
                    <X size={16} aria-hidden="true" /> {t('trip.cancel')}
                </button>
            </div>
        );
    }

    if (p.phase === 'result') {
        return (
            <div className="page trip">
                {p.kind === 'walk' && p.walkRoute ? (
                    <WalkResult
                        route={p.walkRoute}
                        destination={p.request?.city || p.preferences.city}
                        meta={[
                            p.request?.span === 'quick' ? t('trip.span.quick') : t('trip.span.half'),
                            (p.request?.categories || []).map((c) => t(`category.${c}`)).join('、'),
                        ]}
                        animate={p.freshResult}
                        onEdit={p.editPreferences}
                    />
                ) : p.result ? (
                    <PlanResult planner={p} />
                ) : null}
            </div>
        );
    }

    return (
        <div className="page trip home">
            <section className="trip-compose">
                <Composer planner={p} />
                <aside className="trip-compose__side">
                    {p.hasResult && (
                        <button className="trip-resume" onClick={p.showResult}>
                            <Route size={20} aria-hidden="true" />
                            <span>
                                <strong>{t('trip.resume')}</strong>
                                <small>{p.kind === 'walk' ? p.walkRoute?.title : p.request?.city}</small>
                            </span>
                        </button>
                    )}
                    <h2 className="section-heading trip-compose__example">{t('trip.example')}</h2>
                    <HeroDemo />
                </aside>
            </section>

            {user && (recent.length > 0 || stamps.length > 0) && (
                <section className="home-section">
                    <div className="home-section__head">
                        <h2 className="section-heading">{t('home2.recent')}</h2>
                        <Link to="/me" className="btn btn-ghost btn-sm">{t('home2.recent.all')}</Link>
                    </div>
                    <div className="home-recent">
                        {recent.length > 0 && (
                            <ul className="trip-rows">
                                {recent.map((trip) => (
                                    <li key={trip.id}>
                                        <button className="trip-row" onClick={() => navigate('/', { state: { savedItinerary: trip } })}>
                                            <span className="trip-row__city">{trip.city || t('common.unnamed')}</span>
                                            <span className="trip-row__date num">{trip.date}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {stamps.length > 0 && (
                            <div className="home-stamps" aria-label={t('trips.tab.stamps')}>
                                {stamps.map((s) => <Stamp key={s.id} name={s.placeName} seed={s.id} size={96} />)}
                            </div>
                        )}
                    </div>
                </section>
            )}

        </div>
    );
};

export default TripPage;
