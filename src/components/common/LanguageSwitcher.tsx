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
        <div className="language-switcher" role="group" aria-label="Language">
            <button
                className={`lang-btn ${language === 'zh-TW' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('zh-TW')}
                aria-pressed={language === 'zh-TW'}
                lang="zh-TW"
            >
                中文
            </button>
            <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
                aria-pressed={language === 'en'}
                lang="en"
            >
                EN
            </button>
        </div>
    );
};
