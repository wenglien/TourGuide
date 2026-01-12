// Budget Tracking Service
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { TransportOption } from './budgetService';

export interface Expense {
    id?: string;
    itineraryId: string;
    userId: string;
    type: 'transport' | 'food' | 'activity' | 'shopping' | 'other';
    amount: number;
    currency: string;
    description: string;
    placeId?: string;
    placeName?: string;
    date: string;
    timestamp?: any;
}

export interface BudgetStatus {
    itineraryId: string;
    estimatedBudget: { min: number; max: number; currency: string };
    actualSpent: number;
    remainingBudget: { min: number; max: number };
    percentageUsed: number;
    status: 'under_budget' | 'within_budget' | 'over_budget' | 'exceeded';
    breakdown: {
        transport: number;
        food: number;
        activity: number;
        shopping: number;
        other: number;
    };
    recommendations: string[];
}

/**
 * Add an expense
 */
export async function addExpense(expense: Omit<Expense, 'id' | 'timestamp'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'expenses'), {
            ...expense,
            timestamp: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding expense:', error);
        throw error;
    }
}

/**
 * Get expenses for an itinerary
 */
export async function getItineraryExpenses(itineraryId: string): Promise<Expense[]> {
    try {
        const q = query(
            collection(db, 'expenses'),
            where('itineraryId', '==', itineraryId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Expense));
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return [];
    }
}

/**
 * Get user's expenses
 */
export async function getUserExpenses(userId: string): Promise<Expense[]> {
    try {
        const q = query(
            collection(db, 'expenses'),
            where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Expense));
    } catch (error) {
        console.error('Error fetching user expenses:', error);
        return [];
    }
}

/**
 * Calculate budget status for an itinerary
 */
export async function calculateBudgetStatus(
    itineraryId: string,
    estimatedBudget: { min: number; max: number; currency: string }
): Promise<BudgetStatus> {
    const expenses = await getItineraryExpenses(itineraryId);
    
    const breakdown = {
        transport: 0,
        food: 0,
        activity: 0,
        shopping: 0,
        other: 0,
    };

    let totalSpent = 0;

    expenses.forEach(expense => {
        totalSpent += expense.amount;
        breakdown[expense.type] += expense.amount;
    });

    const avgBudget = (estimatedBudget.min + estimatedBudget.max) / 2;
    const percentageUsed = avgBudget > 0 ? (totalSpent / avgBudget) * 100 : 0;

    let status: BudgetStatus['status'];
    if (totalSpent < estimatedBudget.min) {
        status = 'under_budget';
    } else if (totalSpent <= estimatedBudget.max) {
        status = 'within_budget';
    } else if (totalSpent <= estimatedBudget.max * 1.2) {
        status = 'over_budget';
    } else {
        status = 'exceeded';
    }

    const remainingBudget = {
        min: Math.max(0, estimatedBudget.min - totalSpent),
        max: Math.max(0, estimatedBudget.max - totalSpent),
    };

    // Generate recommendations
    const recommendations: string[] = [];
    if (status === 'over_budget' || status === 'exceeded') {
        if (breakdown.food > estimatedBudget.max * 0.4) {
            recommendations.push('餐飲支出較高，建議選擇更經濟的餐廳或減少用餐次數');
        }
        if (breakdown.transport > estimatedBudget.max * 0.3) {
            recommendations.push('交通支出較高，建議多使用大眾運輸工具');
        }
        if (breakdown.shopping > estimatedBudget.max * 0.3) {
            recommendations.push('購物支出較高，建議控制購物預算');
        }
    } else if (status === 'under_budget') {
        recommendations.push('預算使用良好，還有餘裕可以增加體驗');
    }

    return {
        itineraryId,
        estimatedBudget,
        actualSpent: totalSpent,
        remainingBudget,
        percentageUsed,
        status,
        breakdown,
        recommendations,
    };
}

/**
 * Quick add expense from place visit
 */
export async function addPlaceExpense(
    itineraryId: string,
    userId: string,
    placeId: string,
    placeName: string,
    expenseType: Expense['type'],
    amount: number,
    description?: string
): Promise<string> {
    return addExpense({
        itineraryId,
        userId,
        type: expenseType,
        amount,
        currency: 'TWD',
        description: description || `在 ${placeName} 的${expenseType === 'food' ? '餐飲' : expenseType === 'activity' ? '活動' : expenseType === 'shopping' ? '購物' : '其他'}支出`,
        placeId,
        placeName,
        date: new Date().toISOString().split('T')[0],
    });
}

/**
 * Add transport expense
 */
export async function addTransportExpense(
    itineraryId: string,
    userId: string,
    fromPlace: string,
    toPlace: string,
    transportOption: TransportOption,
    actualAmount?: number
): Promise<string> {
    return addExpense({
        itineraryId,
        userId,
        type: 'transport',
        amount: actualAmount || transportOption.cost,
        currency: 'TWD',
        description: `從 ${fromPlace} 到 ${toPlace} (${transportOption.mode === 'Uber' ? 'Uber' : transportOption.mode === 'Public' ? '大眾運輸' : '步行'})`,
        date: new Date().toISOString().split('T')[0],
    });
}

/**
 * Get budget summary for user
 */
export async function getUserBudgetSummary(userId: string): Promise<{
    totalSpent: number;
    averagePerTrip: number;
    mostExpensiveCategory: string;
    monthlySpending: number;
}> {
    const expenses = await getUserExpenses(userId);
    
    const now = new Date();
    const thisMonth = expenses.filter(e => {
        const expenseDate = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.date);
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear();
    });

    const monthlySpending = thisMonth.reduce((sum, e) => sum + e.amount, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Group by itinerary to calculate average
    const itineraryIds = new Set(expenses.map(e => e.itineraryId));
    const averagePerTrip = itineraryIds.size > 0 ? totalSpent / itineraryIds.size : 0;

    // Find most expensive category
    const categoryTotals = expenses.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + e.amount;
        return acc;
    }, {} as Record<string, number>);

    const mostExpensiveCategory = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

    return {
        totalSpent,
        averagePerTrip: Math.round(averagePerTrip),
        mostExpensiveCategory,
        monthlySpending,
    };
}
