import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { CircleUserRound, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../services/i18n';
import { useLogin } from './useLogin';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { PixelFx } from '../ui/PixelFx';
import { useCoins } from '../ui/fxStore';
import coinUrl from '../assets/pixel/coin.svg';
import './AppShell.css';

export const Wordmark: React.FC = () => (
    <span className="wordmark">
        <img src={coinUrl} alt="" className="wordmark__coin" aria-hidden="true" />
        TourGuide
    </span>
);

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const login = useLogin();
    const coins = useCoins();

    return (
        <div className="shell">
            <a href="#main" className="skip-link">{t('shell.skip')}</a>
            <header className="topbar">
                <div className="topbar__inner">
                    <Link to="/" className="topbar__brand" aria-label={t('shell.homeLabel')}>
                        <Wordmark />
                    </Link>
                    <div className="topbar__end">
                        {coins > 0 && (
                            // keyed on the count so each new coin replays the bump
                            <span key={coins} className="coin-count" aria-hidden="true">
                                <img src={coinUrl} alt="" />×<span className="num">{coins}</span>
                            </span>
                        )}
                        <LanguageSwitcher />
                        {loading ? null : user ? (
                            <NavLink to="/me" className="account" aria-label={t('shell.me')}>
                                {user.photoURL
                                    ? <img src={user.photoURL} alt="" className="account__avatar" referrerPolicy="no-referrer" />
                                    : <CircleUserRound size={22} aria-hidden="true" />}
                                <span className="account__label">{t('shell.me')}</span>
                            </NavLink>
                        ) : (
                            <button className="btn btn-secondary btn-sm topbar__login" onClick={login}>
                                <LogIn size={16} aria-hidden="true" /> {t('shell.login')}
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main id="main" className="shell__main">{children}</main>
            <PixelFx />
        </div>
    );
};

export default AppShell;
