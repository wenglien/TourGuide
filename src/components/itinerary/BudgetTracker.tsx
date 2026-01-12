import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../services/i18n';
import './BudgetTracker.css';
import { useAuth } from '../../context/AuthContext';
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
            alert(t('budget.error.add'));
        }
    };

    if (isLoading || !budgetStatus) {
        return (
            <div className="budget-tracker">
                <div className="budget-tracker__loading">{t('common.loading')}</div>
            </div>
        );
    }

    const avgBudget = (estimatedBudget.min + estimatedBudget.max) / 2;
    const percentageUsed = avgBudget > 0 ? (budgetStatus.actualSpent / avgBudget) * 100 : 0;

    return (
        <div className="budget-tracker">
            <div className="budget-tracker__header">
                <h3 className="budget-tracker__title">{t('budget.title')}</h3>
                <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setShowAddExpense(!showAddExpense)}
                >
                    {showAddExpense ? t('budget.cancel') : t('budget.add')}
                </button>
            </div>

            {showAddExpense && (
                <div className="budget-tracker__add-form">
                    <div className="form-group">
                        <label>{t('budget.type')}</label>
                        <select
                            value={newExpense.type}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value as Expense['type'] }))}
                        >
                            <option value="food">{t('budget.category.food')}</option>
                            <option value="transport">{t('budget.category.transport')}</option>
                            <option value="activity">{t('budget.category.activity')}</option>
                            <option value="shopping">{t('budget.category.shopping')}</option>
                            <option value="other">{t('budget.category.other')}</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('budget.amount', { currency: 'NT$' })}</label>
                        <input
                            type="number"
                            value={newExpense.amount || ''}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            min="0"
                            step="1"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('budget.description')}</label>
                        <input
                            type="text"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                            placeholder={t('budget.placeholder')}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleAddExpense}
                        disabled={newExpense.amount <= 0 || !newExpense.description.trim()}
                    >
                        {t('budget.submit')}
                    </button>
                </div>
            )}

            <div className="budget-tracker__summary">
                <div className="budget-summary__item">
                    <span className="budget-summary__label">{t('budget.estimated')}</span>
                    <span className="budget-summary__value">
                        NT$ {estimatedBudget.min.toLocaleString()} - {estimatedBudget.max.toLocaleString()}
                    </span>
                </div>
                <div className="budget-summary__item">
                    <span className="budget-summary__label">{t('budget.actual')}</span>
                    <span className={`budget-summary__value ${budgetStatus.status === 'over_budget' || budgetStatus.status === 'exceeded' ? 'over-budget' : ''}`}>
                        NT$ {budgetStatus.actualSpent.toLocaleString()}
                    </span>
                </div>
                <div className="budget-summary__item">
                    <span className="budget-summary__label">{t('budget.remaining')}</span>
                    <span className="budget-summary__value">
                        NT$ {budgetStatus.remainingBudget.min.toLocaleString()} - {budgetStatus.remainingBudget.max.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="budget-tracker__progress">
                <div className="budget-progress__bar">
                    <div
                        className={`budget-progress__fill ${budgetStatus.status}`}
                        style={{ width: `${Math.min(100, percentageUsed)}%` }}
                    />
                </div>
                <div className="budget-progress__text">
                    <span>{t('budget.used', { n: percentageUsed.toFixed(1) })}</span>
                    <span className={`budget-status-badge ${budgetStatus.status}`}>
                        {budgetStatus.status === 'under_budget' ? t('budget.status.sufficient') :
                            budgetStatus.status === 'within_budget' ? t('budget.status.normal') :
                                budgetStatus.status === 'over_budget' ? t('budget.status.over') : t('budget.status.exceeded')}
                    </span>
                </div>
            </div>

            <div className="budget-tracker__breakdown">
                <h4>{t('budget.breakdown')}</h4>
                <div className="breakdown-list">
                    {Object.entries(budgetStatus.breakdown).map(([type, amount]: [string, any]) => (
                        amount > 0 && (
                            <div key={type} className="breakdown-item">
                                <span className="breakdown-label">
                                    {t(`budget.category.${type}`)}
                                </span>
                                <span className="breakdown-amount">NT$ {amount.toLocaleString()}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {budgetStatus.recommendations.length > 0 && (
                <div className="budget-tracker__recommendations">
                    <h4>{t('budget.recommendations')}</h4>
                    <ul>
                        {budgetStatus.recommendations.map((rec: string, i: number) => (
                            <li key={i}>{rec}</li>
                        ))}
                    </ul>
                </div>
            )}

            {expenses.length > 0 && (
                <div className="budget-tracker__expenses">
                    <h4>{t('budget.history')}</h4>
                    <div className="expenses-list">
                        {expenses.map(expense => (
                            <div key={expense.id} className="expense-item">
                                <div className="expense-item__info">
                                    <span className="expense-item__type">
                                        {expense.type === 'transport' ? 'Transport' :
                                            expense.type === 'food' ? 'Food' :
                                                expense.type === 'activity' ? 'Activity' :
                                                    expense.type === 'shopping' ? 'Shopping' : 'Other'}
                                    </span>
                                    <span className="expense-item__description">{expense.description}</span>
                                </div>
                                <span className="expense-item__amount">NT$ {expense.amount.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetTracker;
