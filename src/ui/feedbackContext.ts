import { createContext, useContext } from 'react';

export type ToastTone = 'default' | 'error';

export interface ConfirmOptions {
    title: string;
    message?: string;
    confirmLabel: string;
    cancelLabel: string;
    danger?: boolean;
}

export interface FeedbackContextType {
    toast: (message: string, tone?: ToastTone) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const FeedbackContext = createContext<FeedbackContextType | null>(null);

export function useFeedback(): FeedbackContextType {
    const ctx = useContext(FeedbackContext);
    if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
    return ctx;
}
