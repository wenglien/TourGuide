import { useLanguage } from '../services/i18n';
import { loginWithGoogle } from '../services/authService';
import { useFeedback } from '../ui/feedbackContext';

export function useLogin() {
    const { t } = useLanguage();
    const { toast } = useFeedback();
    return async () => {
        try {
            await loginWithGoogle();
        } catch (error: any) {
            if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') return;
            toast(error?.code === 'auth/popup-blocked' ? t('auth.popupBlocked') : t('shell.loginFailed'), 'error');
        }
    };
}
