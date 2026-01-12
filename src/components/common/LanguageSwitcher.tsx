// Language Switcher Component
import React from 'react';
import { useLanguage, type Language } from '../../services/i18n';
import './LanguageSwitcher.css';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
    };

    return (
        <div className="language-switcher">
            <button
                className={`lang-btn ${language === 'zh-TW' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('zh-TW')}
                aria-label="Switch to Chinese"
            >
                中文
            </button>
            <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
                aria-label="Switch to English"
            >
                EN
            </button>
        </div>
    );
};
