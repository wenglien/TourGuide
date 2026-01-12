import React, { useState, useCallback } from 'react';
import { useLanguage } from '../../services/i18n';
import './DraggablePlaceList.css';

interface Place {
    place_id: string;
    name: string;
    address?: string;
    rating?: number;
    types?: string[];
    photos?: string[];
}

interface DraggablePlaceListProps {
    places: Place[];
    onReorder: (newPlaces: Place[]) => void;
    onRemove?: (placeId: string) => void;
    onEdit?: (place: Place) => void;
    editable?: boolean;
}

export const DraggablePlaceList: React.FC<DraggablePlaceListProps> = ({
    places,
    onReorder,
    onRemove,
    onEdit,
    editable = true,
}) => {
    const { t } = useLanguage();
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());

        // Add a delay to allow the drag image to be set
        setTimeout(() => {
            const element = e.target as HTMLElement;
            element.classList.add('dragging');
        }, 0);
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        const element = e.target as HTMLElement;
        element.classList.remove('dragging');
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    }, [draggedIndex]);

    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDragOverIndex(null);
            return;
        }

        const newPlaces = [...places];
        const [draggedItem] = newPlaces.splice(draggedIndex, 1);
        newPlaces.splice(dropIndex, 0, draggedItem);

        onReorder(newPlaces);
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, [draggedIndex, places, onReorder]);

    // Touch handlers for mobile
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [touchedIndex, setTouchedIndex] = useState<number | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
        setTouchStartY(e.touches[0].clientY);
        setTouchedIndex(index);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchStartY === null || touchedIndex === null) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY;

        // Calculate which index we're hovering over
        const itemHeight = 80; // Approximate height of each item
        const indexDiff = Math.round(diff / itemHeight);
        const newIndex = Math.max(0, Math.min(places.length - 1, touchedIndex + indexDiff));

        if (newIndex !== touchedIndex) {
            setDragOverIndex(newIndex);
        }
    }, [touchStartY, touchedIndex, places.length]);

    const handleTouchEnd = useCallback(() => {
        if (touchedIndex !== null && dragOverIndex !== null && touchedIndex !== dragOverIndex) {
            const newPlaces = [...places];
            const [draggedItem] = newPlaces.splice(touchedIndex, 1);
            newPlaces.splice(dragOverIndex, 0, draggedItem);
            onReorder(newPlaces);
        }

        setTouchStartY(null);
        setTouchedIndex(null);
        setDragOverIndex(null);
    }, [touchedIndex, dragOverIndex, places, onReorder]);

    return (
        <div className="draggable-place-list">
            <div className="draggable-place-list__header">
                <span className="draggable-place-list__title">{t('generator.spots.title')}</span>
                {editable && (
                    <span className="draggable-place-list__hint">{t('generator.spots.dragHint')}</span>
                )}
            </div>

            <div className="draggable-place-list__items">
                {places.map((place, index) => (
                    <div
                        key={place.place_id}
                        className={`draggable-place-item ${draggedIndex === index ? 'is-dragging' : ''
                            } ${dragOverIndex === index ? 'drag-over' : ''} ${!editable ? 'not-editable' : ''
                            }`}
                        draggable={editable}
                        onDragStart={(e) => editable && handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onTouchStart={(e) => editable && handleTouchStart(e, index)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="draggable-place-item__index">
                            {index + 1}
                        </div>

                        {editable && (
                            <div className="draggable-place-item__handle">
                                <span>Move</span>
                            </div>
                        )}

                        <div className="draggable-place-item__content">
                            <div className="draggable-place-item__name">{place.name}</div>
                            {place.address && (
                                <div className="draggable-place-item__address">{place.address}</div>
                            )}
                            <div className="draggable-place-item__meta">
                                {place.rating && (
                                    <span className="draggable-place-item__rating">
                                        Rating {place.rating}
                                    </span>
                                )}
                                {place.types?.slice(0, 2).map((type) => (
                                    <span key={type} className="draggable-place-item__tag">
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {editable && (
                            <div className="draggable-place-item__actions">
                                {onEdit && (
                                    <button
                                        className="draggable-place-item__btn edit"
                                        onClick={() => onEdit(place)}
                                        title={t('common.edit')}
                                    >
                                        Edit
                                    </button>
                                )}
                                {onRemove && (
                                    <button
                                        className="draggable-place-item__btn remove"
                                        onClick={() => onRemove(place.place_id)}
                                        title={t('common.remove')}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {places.length === 0 && (
                <div className="draggable-place-list__empty">
                    <p>{t('generator.spots.empty')}</p>
                </div>
            )}
        </div>
    );
};

export default DraggablePlaceList;
