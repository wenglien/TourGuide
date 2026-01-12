import React from 'react';
import './TrailCard.css';
import type { Trail } from '../../types';
import { getPlacesByIds } from '../../data/places';

interface TrailCardProps {
    trail: Trail;
    onClick?: () => void;
    onSave?: () => void;
    isSaved?: boolean;
}

const WALKING_LABELS: Record<string, string> = {
    low: '輕鬆',
    medium: '適中',
    high: '挑戰',
};

const TIME_LABELS: Record<string, string> = {
    morning: '早晨',
    afternoon: '午後',
    evening: '黃昏',
    night: '夜晚',
};

export const TrailCard: React.FC<TrailCardProps> = ({
    trail,
    onClick,
    onSave,
    isSaved = false,
}) => {
    const places = getPlacesByIds(trail.orderedPlaces);
    const hours = Math.floor(trail.totalTime / 60);
    const minutes = trail.totalTime % 60;
    const duration = hours > 0
        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
        : `${minutes}m`;

    return (
        <article className="trail-card" onClick={onClick}>
            <div className="trail-card__image-container">
                <div
                    className="trail-card__image"
                    style={{
                        backgroundImage: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7)), url(${trail.coverImage})`,
                        backgroundColor: 'var(--gray-300)'
                    }}
                />
                <div className="trail-card__overlay">
                    <span className="trail-card__theme">{trail.theme}</span>
                    <button
                        className={`trail-card__save ${isSaved ? 'saved' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSave?.();
                        }}
                        aria-label={isSaved ? '取消收藏' : '收藏'}
                    >
                        {isSaved ? '已收藏' : '收藏'}
                    </button>
                </div>
                <div className="trail-card__bottom-overlay">
                    <h3 className="trail-card__title">{trail.title}</h3>
                    <p className="trail-card__places-count">{places.length} 個地點</p>
                </div>
            </div>

            <div className="trail-card__content">
                <p className="trail-card__description">{trail.description}</p>

                <div className="trail-card__meta">
                    <div className="trail-card__meta-item">
                        <span>Time: {duration}</span>
                    </div>
                    <div className="trail-card__meta-item">
                        <span>Budget: ${trail.budgetRange.min}~${trail.budgetRange.max}</span>
                    </div>
                    <div className={`trail-card__meta-item walk-${trail.walkingLevel}`}>
                        <span>Walking: {WALKING_LABELS[trail.walkingLevel]}</span>
                    </div>
                </div>

                <div className="trail-card__tags">
                    {trail.timeTags.map((time) => (
                        <span key={time} className={`tag tag-${time}`}>
                            {TIME_LABELS[time]}
                        </span>
                    ))}
                    {trail.rainAlternative && (
                        <span className="tag tag-rain">有雨備</span>
                    )}
                </div>

                <div className="trail-card__highlights">
                    {trail.highlights.slice(0, 3).map((highlight, index) => (
                        <span key={index} className="trail-card__highlight">
                            {highlight}
                        </span>
                    ))}
                </div>
            </div>
        </article>
    );
};

export default TrailCard;
