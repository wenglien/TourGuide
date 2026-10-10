import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { CircleUserRound, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../services/i18n';
import { useLogin } from './useLogin';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import './AppShell.css';

export const Wordmark: React.FC = () => (
    <span className="wordmark">
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path d="M5 3v16" stroke="var(--line-morning)" strokeWidth="4" strokeLinecap="round" />
            <path d="M5 11h12" stroke="var(--line-evening)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="5" cy="11" r="3.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
            <circle cx="17" cy="11" r="3.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2.5" />
        </svg>
        TourGuide
    </span>
);

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const login = useLogin();

    return (
        <div className="shell">
            <a href="#main" className="skip-link">{t('shell.skip')}</a>
            <header className="topbar">
                <div className="topbar__inner">
                    <Link to="/" className="topbar__brand" aria-label={t('shell.homeLabel')}>
                        <Wordmark />
                    </Link>
                    <div className="topbar__end">
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
        </div>
    );
};

export default AppShell;
