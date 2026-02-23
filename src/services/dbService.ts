import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export const saveItinerary = async (userId: string, itineraryData: any) => {
    try {
        const docRef = await addDoc(collection(db, 'saved_itineraries'), {
            userId,
            ...itineraryData,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving itinerary:', error);
        throw error;
    }
};

export const getUserItineraries = async (userId: string) => {
    try {
        const q = query(collection(db, 'saved_itineraries'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching itineraries:', error);
        throw error;
    }
};

export const deleteItinerary = async (itineraryId: string) => {
    try {
        await deleteDoc(doc(db, 'saved_itineraries', itineraryId));
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        throw error;
    }
};

export const getItineraryById = async (id: string) => {
    try {
        const docRef = doc(db, 'saved_itineraries', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error getting itinerary:', error);
        throw error;
    }
};

export const subscribeToItinerary = (id: string, callback: (data: any) => void) => {
    const docRef = doc(db, 'saved_itineraries', id);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        } else {
            callback(null);
        }
    });
};

// Activity Logs
export const logActivity = async (userId: string, activity: { type: string; title: string; message: string }) => {
    try {
        await addDoc(collection(db, 'activity_logs'), {
            userId,
            ...activity,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

export const getUserActivities = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'activity_logs'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    } catch (error) {
        console.error('Error fetching activities:', error);
        return [];
    }
};

// Check-in / Travel Journal
export interface CheckIn {
    userId: string;
    itineraryId?: string;
    placeName: string;
    placeAddress?: string;
    location?: { lat: number; lng: number };
    note?: string;
    photo?: string;
    rating?: number;
    timestamp?: any;
}

export const saveCheckIn = async (checkIn: CheckIn) => {
    try {
        const docRef = await addDoc(collection(db, 'check_ins'), {
            ...checkIn,
            timestamp: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving check-in:', error);
        throw error;
    }
};

export const getUserCheckIns = async (userId: string) => {
    try {
        const q = query(
            collection(db, 'check_ins'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    } catch (error) {
        console.error('Error fetching check-ins:', error);
        return [];
    }
};

export const deleteCheckIn = async (checkInId: string) => {
    try {
        await deleteDoc(doc(db, 'check_ins', checkInId));
    } catch (error) {
        console.error('Error deleting check-in:', error);
        throw error;
    }
};

export const getItineraryCheckIns = async (itineraryId: string) => {
    try {
        const q = query(
            collection(db, 'check_ins'),
            where('itineraryId', '==', itineraryId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
    } catch (error) {
        console.error('Error fetching itinerary check-ins:', error);
        return [];
    }
};

// ==========================================
// Q&A System - Questions & Answers
// ==========================================

export interface Question {
    id?: string;
    trailId: string;
    type: 'queue' | 'safety' | 'weather' | 'solo' | 'family' | 'general';
    content: string;
    userId: string;
    userName?: string;
    userPhoto?: string;
    answerCount: number;
    createdAt?: any;
}

export interface Answer {
    id?: string;
    questionId: string;
    content: string;
    userId: string;
    userName?: string;
    userPhoto?: string;
    upvotes: number;
    downvotes: number;
    votedBy?: { [userId: string]: 'up' | 'down' };
    isVerified: boolean;
    createdAt?: any;
}

// Create a new question
export const createQuestion = async (question: Omit<Question, 'id' | 'answerCount' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'qa_questions'), {
            ...question,
            answerCount: 0,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating question:', error);
        throw error;
    }
};

// Get questions for a specific trail
export const getTrailQuestions = async (trailId: string): Promise<Question[]> => {
    try {
        const q = query(
            collection(db, 'qa_questions'),
            where('trailId', '==', trailId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Question))
            .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
};

// Subscribe to questions for real-time updates
export const subscribeToQuestions = (trailId: string, callback: (questions: Question[]) => void) => {
    const q = query(
        collection(db, 'qa_questions'),
        where('trailId', '==', trailId)
    );
    return onSnapshot(q, (snapshot) => {
        const questions = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Question))
            .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        callback(questions);
    });
};

// Create a new answer
export const createAnswer = async (answer: Omit<Answer, 'id' | 'upvotes' | 'downvotes' | 'votedBy' | 'isVerified' | 'createdAt'>) => {
    try {
        // Add the answer
        const docRef = await addDoc(collection(db, 'qa_answers'), {
            ...answer,
            upvotes: 0,
            downvotes: 0,
            votedBy: {},
            isVerified: false,
            createdAt: serverTimestamp()
        });

        // Increment answer count on the question
        const questionRef = doc(db, 'qa_questions', answer.questionId);
        const questionSnap = await getDoc(questionRef);
        if (questionSnap.exists()) {
            const currentCount = questionSnap.data().answerCount || 0;
            await import('firebase/firestore').then(({ updateDoc }) => 
                updateDoc(questionRef, { answerCount: currentCount + 1 })
            );
        }

        return docRef.id;
    } catch (error) {
        console.error('Error creating answer:', error);
        throw error;
    }
};

// Get answers for a specific question
export const getQuestionAnswers = async (questionId: string): Promise<Answer[]> => {
    try {
        const q = query(
            collection(db, 'qa_answers'),
            where('questionId', '==', questionId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Answer))
            .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    } catch (error) {
        console.error('Error fetching answers:', error);
        return [];
    }
};

// Subscribe to answers for real-time updates
export const subscribeToAnswers = (questionId: string, callback: (answers: Answer[]) => void) => {
    const q = query(
        collection(db, 'qa_answers'),
        where('questionId', '==', questionId)
    );
    return onSnapshot(q, (snapshot) => {
        const answers = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Answer))
            .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
        callback(answers);
    });
};

// Vote on an answer
export const voteAnswer = async (answerId: string, odId: string, voteType: 'up' | 'down') => {
    try {
        const answerRef = doc(db, 'qa_answers', answerId);
        const answerSnap = await getDoc(answerRef);
        
        if (!answerSnap.exists()) {
            throw new Error('Answer not found');
        }

        const data = answerSnap.data();
        const votedBy = data.votedBy || {};
        const previousVote = votedBy[odId];

        let upvoteDelta = 0;
        let downvoteDelta = 0;

        if (previousVote === voteType) {
            // Remove vote if clicking same button
            delete votedBy[odId];
            if (voteType === 'up') upvoteDelta = -1;
            else downvoteDelta = -1;
        } else {
            // Add or change vote
            if (previousVote === 'up') upvoteDelta = -1;
            if (previousVote === 'down') downvoteDelta = -1;
            
            votedBy[odId] = voteType;
            if (voteType === 'up') upvoteDelta += 1;
            else downvoteDelta += 1;
        }

        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(answerRef, {
            upvotes: (data.upvotes || 0) + upvoteDelta,
            downvotes: (data.downvotes || 0) + downvoteDelta,
            votedBy
        });

        return { success: true };
    } catch (error) {
        console.error('Error voting:', error);
        throw error;
    }
};

// Delete a question (and its answers)
export const deleteQuestion = async (questionId: string) => {
    try {
        // Delete all answers first
        const answersQuery = query(
            collection(db, 'qa_answers'),
            where('questionId', '==', questionId)
        );
        const answersSnapshot = await getDocs(answersQuery);
        const deletePromises = answersSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete the question
        await deleteDoc(doc(db, 'qa_questions', questionId));
    } catch (error) {
        console.error('Error deleting question:', error);
        throw error;
    }
};

// Notification Settings
export const saveNotificationToken = async (userId: string, token: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            await updateDoc(userRef, {
                notificationToken: token,
                notificationTokenUpdatedAt: serverTimestamp()
            });
        } else {
            await addDoc(collection(db, 'users'), {
                userId,
                notificationToken: token,
                notificationTokenUpdatedAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error saving notification token:', error);
        throw error;
    }
};

export const getUserNotificationSettings = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                enabled: data.notificationEnabled !== false,
                reminders: data.remindersEnabled !== false,
                token: data.notificationToken || null
            };
        }
        
        return {
            enabled: false,
            reminders: false,
            token: null
        };
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        return {
            enabled: false,
            reminders: false,
            token: null
        };
    }
};
