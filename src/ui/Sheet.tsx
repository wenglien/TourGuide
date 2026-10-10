import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './ui.css';

interface SheetProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    /** Bleed content to edges (e.g. a photo header). */
    flush?: boolean;
    closeLabel?: string;
}

/** Bottom sheet on phones, centred dialog on wider screens. */
export const Sheet: React.FC<SheetProps> = ({ open, onClose, title, children, footer, flush, closeLabel = 'Close' }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const lastFocus = useRef<Element | null>(null);
    const closeRef = useRef(onClose);
    useLayoutEffect(() => { closeRef.current = onClose; });

    useEffect(() => {
        if (!open) return;
        lastFocus.current = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        panelRef.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeRef.current();
            if (e.key === 'Tab' && panelRef.current) {
                const nodes = panelRef.current.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
                );
                if (nodes.length === 0) return;
                const first = nodes[0];
                const last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
            (lastFocus.current as HTMLElement | null)?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div className="sheet-layer" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div
                ref={panelRef}
                className={`sheet ${flush ? 'sheet--flush' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === 'string' ? title : undefined}
                tabIndex={-1}
            >
                <div className="sheet__grip" aria-hidden="true" />
                <div className="sheet__head">
                    {title && <h2 className="sheet__title">{title}</h2>}
                    <button className="icon-btn sheet__close" onClick={onClose} aria-label={closeLabel}>
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                <div className="sheet__body">{children}</div>
                {footer && <div className="sheet__foot">{footer}</div>}
            </div>
        </div>,
        document.body,
    );
};

export default Sheet;
