import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sheet } from './Sheet';
import { FeedbackContext, type ConfirmOptions, type ToastTone } from './feedbackContext';
import './ui.css';

interface Toast {
    id: number;
    message: string;
    tone: ToastTone;
}

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [pending, setPending] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((ok: boolean) => void) | null>(null);
    const nextId = useRef(1);

    const toast = useCallback((message: string, tone: ToastTone = 'default') => {
        const id = nextId.current++;
        setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
        window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), tone === 'error' ? 6000 : 3500);
    }, []);

    const confirm = useCallback((options: ConfirmOptions) => {
        setPending(options);
        return new Promise<boolean>((resolve) => { resolver.current = resolve; });
    }, []);

    const settle = (ok: boolean) => {
        resolver.current?.(ok);
        resolver.current = null;
        setPending(null);
    };

    return (
        <FeedbackContext.Provider value={{ toast, confirm }}>
            {children}
            {createPortal(
                <div className="toasts" role="status" aria-live="polite">
                    {toasts.map((t) => (
                        <div key={t.id} className={`toast ${t.tone === 'error' ? 'toast--error' : ''}`}>{t.message}</div>
                    ))}
                </div>,
                document.body,
            )}
            <Sheet
                open={Boolean(pending)}
                onClose={() => settle(false)}
                title={pending?.title}
                closeLabel={pending?.cancelLabel}
                footer={pending && (
                    <div className="sheet__actions">
                        <button className="btn btn-secondary" onClick={() => settle(false)}>{pending.cancelLabel}</button>
                        <button
                            className={`btn ${pending.danger ? 'btn-primary btn-primary--danger' : 'btn-primary'}`}
                            onClick={() => settle(true)}
                        >
                            {pending.confirmLabel}
                        </button>
                    </div>
                )}
            >
                {pending?.message && <p className="muted">{pending.message}</p>}
            </Sheet>
        </FeedbackContext.Provider>
    );
};

