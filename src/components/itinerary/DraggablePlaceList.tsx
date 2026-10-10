import React, { useState, useCallback } from 'react';
import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';
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
    const [isDraggingMobile, setIsDraggingMobile] = useState(false);

    const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
        // Only start drag if touching the handle or if we want the whole item to be draggable
        // For better UX, we'll allow the whole item but prevent scroll only when moving
        setTouchStartY(e.touches[0].clientY);
        setTouchedIndex(index);
        setIsDraggingMobile(false);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchStartY === null || touchedIndex === null) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartY;

        // If moved more than 10px, consider it a drag and prevent scrolling
        if (Math.abs(diff) > 10) {
            if (e.cancelable) {
                e.preventDefault();
            }
            setIsDraggingMobile(true);
        }

        if (isDraggingMobile) {
            // Calculate which index we're hovering over
            const itemHeight = 90; // Approximate height of each item on mobile
            const indexDiff = Math.round(diff / itemHeight);
            const newIndex = Math.max(0, Math.min(places.length - 1, touchedIndex + indexDiff));

            if (newIndex !== touchedIndex) {
                setDragOverIndex(newIndex);
            }
        }
    }, [touchStartY, touchedIndex, places.length, isDraggingMobile]);

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
        setIsDraggingMobile(false);
    }, [touchedIndex, dragOverIndex, places, onReorder]);

    const move = (from: number, to: number) => {
        if (to < 0 || to >= places.length) return;
        const next = [...places];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        onReorder(next);
    };

    return (
        <div className="reorder">
            {editable && <p className="subtle">{t('plan2.reorder.hint')}</p>}
            <ol className="reorder__list">
                {places.map((place, index) => (
                    <li
                        key={place.place_id}
                        className={`reorder__item ${draggedIndex === index || (touchedIndex === index && isDraggingMobile) ? 'is-dragging' : ''} ${dragOverIndex === index ? 'is-over' : ''}`}
                        draggable={editable}
                        onDragStart={(e) => editable && handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        {editable && (
                            <span
                                className="reorder__handle"
                                aria-hidden="true"
                                onTouchStart={(e) => handleTouchStart(e, index)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <GripVertical size={18} />
                            </span>
                        )}
                        <span className="reorder__index num">{index + 1}</span>
                        <span className="reorder__name">
                            <strong>{place.name}</strong>
                            {place.address && <small>{place.address}</small>}
                        </span>
                        {editable && (
                            <span className="reorder__actions">
                                <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => move(index, index - 1)}
                                    disabled={index === 0}
                                    aria-label={t('plan2.reorder.up', { name: place.name })}
                                >
                                    <ArrowUp size={16} aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className="icon-btn"
                                    onClick={() => move(index, index + 1)}
                                    disabled={index === places.length - 1}
                                    aria-label={t('plan2.reorder.down', { name: place.name })}
                                >
                                    <ArrowDown size={16} aria-hidden="true" />
                                </button>
                                {onEdit && (
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(place)}>
                                        {t('common.edit')}
                                    </button>
                                )}
                                {onRemove && (
                                    <button
                                        type="button"
                                        className="icon-btn"
                                        onClick={() => onRemove(place.place_id)}
                                        aria-label={t('plan2.reorder.remove', { name: place.name })}
                                    >
                                        <X size={16} aria-hidden="true" />
                                    </button>
                                )}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
            {places.length === 0 && <p className="subtle">{t('generator.spots.empty')}</p>}
        </div>
    );
};

export default DraggablePlaceList;
