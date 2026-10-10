import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../services/i18n';
import './BudgetTracker.css';
import { useAuth } from '../../context/AuthContext';
import { useFeedback } from '../../ui/feedbackContext';
import { calculateBudgetStatus, addExpense, getUserExpenses, type Expense } from '../../services/budgetTracker';

interface BudgetTrackerProps {
    itineraryId: string;
    estimatedBudget: { min: number; max: number; currency: string };
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
    itineraryId,
    estimatedBudget,
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { toast } = useFeedback();
    const [budgetStatus, setBudgetStatus] = useState<any>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [newExpense, setNewExpense] = useState({
        type: 'food' as Expense['type'],
        amount: 0,
        description: '',
    });

    useEffect(() => {
        if (user && itineraryId) {
            loadBudgetData();
        }
    }, [user, itineraryId]);

    const loadBudgetData = async () => {
        setIsLoading(true);
        try {
            const [status, expenseList] = await Promise.all([
                calculateBudgetStatus(itineraryId, estimatedBudget),
                getUserExpenses(user!.uid),
            ]);
            setBudgetStatus(status);
            setExpenses(expenseList.filter(e => e.itineraryId === itineraryId));
        } catch (error) {
            console.error('Failed to load budget data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddExpense = async () => {
        if (!user || newExpense.amount <= 0 || !newExpense.description.trim()) {
            return;
        }

        try {
            await addExpense({
                itineraryId,
                userId: user.uid,
                type: newExpense.type,
                amount: newExpense.amount,
                currency: 'TWD',
                description: newExpense.description,
                date: new Date().toISOString().split('T')[0],
            });
            setNewExpense({ type: 'food', amount: 0, description: '' });
            setShowAddExpense(false);
            loadBudgetData();
        } catch (error) {
            console.error('Failed to add expense:', error);
            toast(t('budget.error.add'), 'error');
        }
    };

    if (isLoading || !budgetStatus) {
        return <div className="budget"><p className="subtle">{t('common.loading')}</p></div>;
    }

    const avgBudget = (estimatedBudget.min + estimatedBudget.max) / 2;
    const percentageUsed = avgBudget > 0 ? (budgetStatus.actualSpent / avgBudget) * 100 : 0;
    const over = budgetStatus.status === 'over_budget' || budgetStatus.status === 'exceeded';
    const statusLabel = budgetStatus.status === 'under_budget' ? t('budget.status.sufficient')
        : budgetStatus.status === 'within_budget' ? t('budget.status.normal')
            : budgetStatus.status === 'over_budget' ? t('budget.status.over') : t('budget.status.exceeded');

    return (
        <div className="budget">
            <dl className="budget__figures">
                <div>
                    <dt>{t('budget.estimated')}</dt>
                    <dd className="num">NT$ {estimatedBudget.min.toLocaleString()}–{estimatedBudget.max.toLocaleString()}</dd>
                </div>
                <div>
                    <dt>{t('budget.actual')}</dt>
                    <dd className={`num ${over ? 'is-over' : ''}`}>NT$ {budgetStatus.actualSpent.toLocaleString()}</dd>
                </div>
                <div>
                    <dt>{t('budget.remaining')}</dt>
                    <dd className="num">NT$ {budgetStatus.remainingBudget.min.toLocaleString()}–{budgetStatus.remainingBudget.max.toLocaleString()}</dd>
                </div>
            </dl>

            <div className="budget__meter">
                <div
                    className="budget__bar"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(Math.min(100, percentageUsed))}
                    aria-label={t('budget.used', { n: percentageUsed.toFixed(0) })}
                >
                    <span className={over ? 'is-over' : ''} style={{ width: `${Math.min(100, percentageUsed)}%` }} />
                </div>
                <p className="subtle">{t('budget.used', { n: percentageUsed.toFixed(0) })}，{statusLabel}</p>
            </div>

            {Object.values(budgetStatus.breakdown).some((v: any) => v > 0) && (
                <ul className="budget__breakdown">
                    {Object.entries(budgetStatus.breakdown).map(([type, amount]: [string, any]) => (
                        amount > 0 && (
                            <li key={type}>
                                <span>{t(`budget.category.${type}`)}</span>
                                <span className="num">NT$ {amount.toLocaleString()}</span>
                            </li>
                        )
                    ))}
                </ul>
            )}

            {budgetStatus.recommendations.length > 0 && (
                <ul className="budget__tips">
                    {budgetStatus.recommendations.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
                </ul>
            )}

            {showAddExpense ? (
                <form
                    className="budget__form"
                    onSubmit={(e) => { e.preventDefault(); handleAddExpense(); }}
                >
                    <label className="field">
                        <span className="field__label">{t('budget.type')}</span>
                        <select
                            className="input"
                            value={newExpense.type}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value as Expense['type'] }))}
                        >
                            <option value="food">{t('budget.category.food')}</option>
                            <option value="transport">{t('budget.category.transport')}</option>
                            <option value="activity">{t('budget.category.activity')}</option>
                            <option value="shopping">{t('budget.category.shopping')}</option>
                            <option value="other">{t('budget.category.other')}</option>
                        </select>
                    </label>
                    <label className="field">
                        <span className="field__label">{t('budget.amount', { currency: 'NT$' })}</span>
                        <input
                            className="input num"
                            type="number"
                            inputMode="numeric"
                            value={newExpense.amount || ''}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            min="0"
                            step="1"
                        />
                    </label>
                    <label className="field budget__form-wide">
                        <span className="field__label">{t('budget.description')}</span>
                        <input
                            className="input"
                            type="text"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                            placeholder={t('budget.placeholder')}
                        />
                    </label>
                    <div className="budget__form-actions budget__form-wide">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddExpense(false)}>{t('budget.cancel')}</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={newExpense.amount <= 0 || !newExpense.description.trim()}
                        >
                            {t('budget.submit')}
                        </button>
                    </div>
                </form>
            ) : (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddExpense(true)}>{t('budget.add')}</button>
            )}

            {expenses.length > 0 && (
                <ul className="budget__expenses">
                    {expenses.map(expense => (
                        <li key={expense.id}>
                            <span>
                                <strong>{expense.description}</strong>
                                <small>{t(`budget.category.${expense.type}`)}</small>
                            </span>
                            <span className="num">NT$ {expense.amount.toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BudgetTracker;
