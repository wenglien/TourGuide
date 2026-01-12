import React from 'react';
import './TrailDetail.css';
import type { Trail } from '../../types';
import { getPlacesByIds } from '../../data/places';
import PlaceItem from './PlaceItem';
import QASection from '../qa/QASection';
import { GoogleMap } from '../map/GoogleMap';

interface TrailDetailProps {
    trail: Trail;
    onBack: () => void;
    onSave?: () => void;
    isSaved?: boolean;
}

const WALKING_LABELS: Record<string, { label: string; desc: string }> = {
    low: { label: '輕鬆', desc: '大部分時間都能輕鬆步行' },
    medium: { label: '適中', desc: '需要一些體力，建議穿舒適的鞋' },
    high: { label: '挑戰', desc: '會有較多的步行和爬坡' },
};

const TIME_LABELS: Record<string, string> = {
    morning: '早晨 (6:00-11:00)',
    afternoon: '午後 (11:00-16:00)',
    evening: '黃昏 (16:00-19:00)',
    night: '夜晚 (19:00-24:00)',
};

export const TrailDetail: React.FC<TrailDetailProps> = ({
    trail,
    onBack,
    onSave,
    isSaved = false,
}) => {
    const places = getPlacesByIds(trail.orderedPlaces);
    const hours = Math.floor(trail.totalTime / 60);
    const minutes = trail.totalTime % 60;
    
    // For AI-generated trails, we need to get place details from Google Maps
    // For now, we'll show the map only if we have places with location data
    const placesWithLocation = places.filter(p => p.location && p.location.lat && p.location.lng);

    return (
        <div className="trail-detail">
            <header className="trail-detail__header">
                <button className="trail-detail__back" onClick={onBack}>
                    返回
                </button>
                <button
                    className={`trail-detail__save ${isSaved ? 'saved' : ''}`}
                    onClick={onSave}
                >
                    {isSaved ? '已收藏' : '收藏'}
                </button>
            </header>

            <div
                className="trail-detail__hero"
                style={{
                    backgroundImage: `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.8)), url(${trail.coverImage})`,
                    backgroundColor: 'var(--gray-400)'
                }}
            >
                <div className="trail-detail__hero-content">
                    <span className="trail-detail__theme">{trail.theme}</span>
                    <h1 className="trail-detail__title">{trail.title}</h1>
                    <p className="trail-detail__description">{trail.description}</p>
                </div>
            </div>

            <div className="trail-detail__content">
                <section className="trail-detail__section">
                    <h2 className="trail-detail__section-title">路線資訊</h2>
                    <div className="trail-detail__info-grid">
                        <div className="trail-detail__info-card">
                            <div className="trail-detail__info-text">
                                <span className="trail-detail__info-label">所需時間</span>
                                <span className="trail-detail__info-value">
                                    {hours > 0 ? `${hours} 小時` : ''} {minutes > 0 ? `${minutes} 分鐘` : ''}
                                </span>
                            </div>
                        </div>
                        <div className="trail-detail__info-card">
                            <div className="trail-detail__info-text">
                                <span className="trail-detail__info-label">預算</span>
                                <span className="trail-detail__info-value">
                                    ${trail.budgetRange.min} ~ ${trail.budgetRange.max}
                                </span>
                            </div>
                        </div>
                        <div className={`trail-detail__info-card walk-${trail.walkingLevel}`}>
                            <div className="trail-detail__info-text">
                                <span className="trail-detail__info-label">步行量</span>
                                <span className="trail-detail__info-value">
                                    {WALKING_LABELS[trail.walkingLevel].label}
                                </span>
                            </div>
                        </div>
                        <div className="trail-detail__info-card">
                            <div className="trail-detail__info-text">
                                <span className="trail-detail__info-label">地點數</span>
                                <span className="trail-detail__info-value">{places.length} 個</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="trail-detail__section">
                    <h2 className="trail-detail__section-title">最佳時段</h2>
                    <div className="trail-detail__time-tags">
                        {trail.timeTags.map((time) => (
                            <span key={time} className={`trail-detail__time-tag tag-${time}`}>
                                {TIME_LABELS[time]}
                            </span>
                        ))}
                    </div>
                    {trail.rainAlternative && (
                        <div className="trail-detail__rain-notice">
                            <span>此路線有雨天備案版本</span>
                        </div>
                    )}
                </section>

                <section className="trail-detail__section">
                    <h2 className="trail-detail__section-title">亮點</h2>
                    <ul className="trail-detail__highlights">
                        {trail.highlights.map((highlight, index) => (
                            <li key={index} className="trail-detail__highlight">
                                {highlight}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="trail-detail__section">
                    <h2 className="trail-detail__section-title">
                        路線地點 <span className="count">({places.length})</span>
                    </h2>
                    {placesWithLocation.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <GoogleMap
                                center={{
                                    lat: placesWithLocation[0].location.lat,
                                    lng: placesWithLocation[0].location.lng,
                                }}
                                places={placesWithLocation.map(place => ({
                                    name: place.name,
                                    location: place.location,
                                }))}
                                height="400px"
                            />
                        </div>
                    )}
                    <div className="trail-detail__places">
                        {places.map((place, index) => (
                            <PlaceItem
                                key={place.id}
                                place={place}
                                index={index + 1}
                                isLast={index === places.length - 1}
                            />
                        ))}
                    </div>
                </section>

                <section className="trail-detail__section">
                    <h2 className="trail-detail__section-title">路線問答</h2>
                    <QASection trailId={trail.id} />
                </section>
            </div>
        </div>
    );
};

export default TrailDetail;
