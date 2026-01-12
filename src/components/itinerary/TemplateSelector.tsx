import React, { useState } from 'react';
import { useLanguage } from '../../services/i18n';
import './TemplateSelector.css';
import { getPopularTemplates, getTemplatesByCity, getMatchingTemplates, templateToPreferences, type ItineraryTemplate } from '../../data/itineraryTemplates';
import type { UserPreferences } from '../../types';

interface TemplateSelectorProps {
    onSelectTemplate: (preferences: UserPreferences) => void;
    currentCity?: string;
    currentCategories?: string[];
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    onSelectTemplate,
    currentCity,
    currentCategories,
}) => {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<'popular' | 'city' | 'matching'>('popular');
    const [selectedTemplate, setSelectedTemplate] = useState<ItineraryTemplate | null>(null);

    let templates: ItineraryTemplate[] = [];

    if (filter === 'popular') {
        templates = getPopularTemplates(6);
    } else if (filter === 'city' && currentCity) {
        templates = getTemplatesByCity(currentCity);
    } else if (filter === 'matching' && (currentCity || currentCategories)) {
        templates = getMatchingTemplates({
            city: currentCity,
            categories: currentCategories as any,
        });
    } else {
        templates = getPopularTemplates(6);
    }

    const handleSelect = (template: ItineraryTemplate) => {
        setSelectedTemplate(template);
        const preferences = templateToPreferences(template);
        onSelectTemplate(preferences);
    };

    return (
        <div className="template-selector">
            <div className="template-selector__header">
                <h3 className="template-selector__title">{t('template.title')}</h3>
                <p className="template-selector__subtitle">{t('template.subtitle')}</p>
            </div>

            <div className="template-selector__filters">
                <button
                    className={`filter-btn ${filter === 'popular' ? 'active' : ''}`}
                    onClick={() => setFilter('popular')}
                >
                    {t('template.filter.popular')}
                </button>
                {currentCity && (
                    <button
                        className={`filter-btn ${filter === 'city' ? 'active' : ''}`}
                        onClick={() => setFilter('city')}
                    >
                        {t('template.filter.city', { city: currentCity })}
                    </button>
                )}
                {(currentCity || currentCategories) && (
                    <button
                        className={`filter-btn ${filter === 'matching' ? 'active' : ''}`}
                        onClick={() => setFilter('matching')}
                    >
                        {t('template.filter.matching')}
                    </button>
                )}
            </div>

            <div className="template-selector__grid">
                {templates.map(template => (
                    <div
                        key={template.id}
                        className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                        onClick={() => handleSelect(template)}
                    >
                        <div className="template-card__header">
                            <div className="template-card__title-group">
                                <h4 className="template-card__title">{template.title}</h4>
                                <span className="template-card__city">{template.city}</span>
                            </div>
                        </div>
                        <p className="template-card__description">{template.description}</p>
                        <div className="template-card__meta">
                            <span className="template-card__duration">{template.duration} {t('common.unit.days')}</span>
                            <span className="template-card__budget">
                                NT$ {template.estimatedBudget.min.toLocaleString()} - {template.estimatedBudget.max.toLocaleString()}
                            </span>
                        </div>
                        <div className="template-card__tags">
                            {template.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="template-card__tag">{tag}</span>
                            ))}
                        </div>
                        <div className="template-card__popularity">
                            <span className="popularity-bar">
                                <span
                                    className="popularity-fill"
                                    style={{ width: `${template.popularity}%` }}
                                />
                            </span>
                            <span className="popularity-text">{t('template.popularity', { n: template.popularity })}</span>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="template-selector__empty">
                    <p>{t('template.empty')}</p>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setFilter('popular')}
                    >
                        {t('template.viewPopular')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TemplateSelector;
