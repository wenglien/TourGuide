import {
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    type User
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
