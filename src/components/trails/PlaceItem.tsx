import React from 'react';
import './PlaceItem.css';
import type { Place } from '../../types';

interface PlaceItemProps {
    place: Place;
    index: number;
    isLast?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
    cafe: '',
    restaurant: '',
    exhibition: '',
    market: '',
    nightview: '',
    park: '',
    temple: '',
    shop: '',
    street: '',
    landmark: '',
};

const TYPE_LABELS: Record<string, string> = {
    cafe: '咖啡廳',
    restaurant: '餐廳',
    exhibition: '展覽',
    market: '市集',
    nightview: '夜景',
    park: '公園',
    temple: '寺廟',
    shop: '商店',
    street: '街區',
    landmark: '地標',
};

export const PlaceItem: React.FC<PlaceItemProps> = ({ place, index, isLast = false }) => {
    const hours = Math.floor(place.avgStayTime / 60);
    const minutes = place.avgStayTime % 60;
    const stayTime = hours > 0
        ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
        : `${minutes}m`;

    return (
        <div className={`place-item ${isLast ? 'is-last' : ''}`}>
            <div className="place-item__connector">
                <div className="place-item__number">{index}</div>
                {!isLast && <div className="place-item__line" />}
            </div>

            <div className="place-item__content">
                <div className="place-item__header">
                    <div className="place-item__type">
                        <span className="place-item__type-icon">{TYPE_ICONS[place.type]}</span>
                        <span className="place-item__type-label">{TYPE_LABELS[place.type]}</span>
                    </div>
                    <span className="place-item__stay-time">Stay: {stayTime}</span>
                </div>

                <h3 className="place-item__name">{place.name}</h3>
                <p className="place-item__description">{place.description}</p>

                <div className="place-item__meta">
                    <span className="place-item__price">{place.priceRange}</span>
                    <span className="place-item__address">{place.location.address}</span>
                </div>

                <div className="place-item__tags">
                    {place.tags.slice(0, 4).map((tag) => (
                        <span
                            key={tag}
                            className={`place-item__tag ${tag === '雨天可' ? 'tag-rain' : ''}`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="place-item__transport">
                    {place.transportTags.map((tag) => (
                        <span key={tag} className="place-item__transport-tag">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlaceItem;
