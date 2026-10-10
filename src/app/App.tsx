import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../services/i18n';
import { FeedbackProvider } from '../ui/Feedback';
import { AppShell } from './AppShell';
import { TripPage } from '../features/trip/TripPage';
import '../styles/base.css';

const TripsPage = lazy(() => import('../features/trips/TripsPage'));
const SharedTripPage = lazy(() => import('../features/shared/SharedTripPage'));

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
};

const LegacyTripRedirect: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return <Navigate to={`/trip/${id}`} replace />;
};

/** Keeps router state (e.g. a saved itinerary) when redirecting old paths. */
const KeepState: React.FC<{ to: string }> = ({ to }) => {
    const location = useLocation();
    return <Navigate to={to} replace state={location.state} />;
};

const Fallback: React.FC = () => <div className="loading-screen"><span className="spinner" aria-hidden="true" /></div>;

const App: React.FC = () => (
    <LanguageProvider>
        <AuthProvider>
            <FeedbackProvider>
                <BrowserRouter>
                    <ScrollToTop />
                    <AppShell>
                        <Suspense fallback={<Fallback />}>
                            <Routes>
                                <Route path="/" element={<TripPage />} />
                                <Route path="/walk" element={<KeepState to="/" />} />
                                <Route path="/plan" element={<KeepState to="/" />} />
                                <Route path="/me" element={<TripsPage />} />
                                <Route path="/trip/:id" element={<SharedTripPage />} />

                                <Route path="/generator" element={<KeepState to="/" />} />
                                <Route path="/route" element={<KeepState to="/" />} />
                                <Route path="/profile" element={<KeepState to="/me" />} />
                                <Route path="/itinerary/:id" element={<LegacyTripRedirect />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </AppShell>
                </BrowserRouter>
            </FeedbackProvider>
        </AuthProvider>
    </LanguageProvider>
);

export default App;
