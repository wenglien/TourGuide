import React, { useState, useEffect, useCallback } from 'react';
import './QASection.css';
import type { QuestionType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
    createQuestion,
    createAnswer,
    subscribeToQuestions,
    subscribeToAnswers,
    voteAnswer,
    deleteQuestion,
    type Question,
    type Answer
} from '../../services/dbService';

interface QASectionProps {
    trailId: string;
}

const QUESTION_TEMPLATES: { type: QuestionType; icon: string; label: string }[] = [
    { type: 'queue', icon: '', label: '排隊狀況' },
    { type: 'safety', icon: '', label: '晚上是否安全' },
    { type: 'weather', icon: '', label: '雨天可行嗎' },
    { type: 'solo', icon: '', label: '適合獨旅嗎' },
    { type: 'family', icon: '', label: '適合親子嗎' },
    { type: 'general', icon: '', label: '其他問題' },
];

export const QASection: React.FC<QASectionProps> = ({ trailId }) => {
    const { user } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [showAskForm, setShowAskForm] = useState(false);
    const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswers, setNewAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Subscribe to questions
    useEffect(() => {
        if (!trailId) return;

        setIsLoading(true);
        const unsubscribe = subscribeToQuestions(trailId, (fetchedQuestions) => {
            setQuestions(fetchedQuestions);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [trailId]);

    // Subscribe to answers when a question is expanded
    useEffect(() => {
        if (!selectedQuestion) return;

        const unsubscribe = subscribeToAnswers(selectedQuestion, (fetchedAnswers) => {
            setAnswers(prev => ({
                ...prev,
                [selectedQuestion]: fetchedAnswers
            }));
        });

        return () => unsubscribe();
    }, [selectedQuestion]);

    const handleAsk = useCallback(async () => {
        if (!selectedType || !newQuestion.trim() || !user) return;

        setIsSubmitting(true);
        try {
            await createQuestion({
                trailId,
                type: selectedType,
                content: newQuestion.trim(),
                userId: user.uid,
                userName: user.displayName || '匿名用戶',
                userPhoto: user.photoURL || undefined
            });

            setShowAskForm(false);
            setSelectedType(null);
            setNewQuestion('');
        } catch (error) {
            console.error('Failed to create question:', error);
            alert('提問失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedType, newQuestion, user, trailId]);

    const handleAnswer = useCallback(async (questionId: string) => {
        const answerContent = newAnswers[questionId]?.trim();
        if (!answerContent || !user) return;

        setIsSubmitting(true);
        try {
            await createAnswer({
                questionId,
                content: answerContent,
                userId: user.uid,
                userName: user.displayName || '匿名用戶',
                userPhoto: user.photoURL || undefined
            });

            setNewAnswers(prev => ({
                ...prev,
                [questionId]: ''
            }));
        } catch (error) {
            console.error('Failed to create answer:', error);
            alert('回答失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    }, [newAnswers, user]);

    const handleVote = useCallback(async (answerId: string, voteType: 'up' | 'down') => {
        if (!user) {
            alert('請先登入才能投票');
            return;
        }

        try {
            await voteAnswer(answerId, user.uid, voteType);
        } catch (error) {
            console.error('Failed to vote:', error);
        }
    }, [user]);

    const handleDeleteQuestion = useCallback(async (questionId: string) => {
        if (!user) return;

        if (!window.confirm('確定要刪除這個問題嗎？所有回答也會一併刪除。')) {
            return;
        }

        try {
            await deleteQuestion(questionId);
        } catch (error) {
            console.error('Failed to delete question:', error);
            alert('刪除失敗，請稍後再試');
        }
    }, [user]);

    const formatTime = (timestamp: any) => {
        if (!timestamp?.seconds) return '剛剛';
        const date = new Date(timestamp.seconds * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '剛剛';
        if (diffMins < 60) return `${diffMins} 分鐘前`;
        if (diffHours < 24) return `${diffHours} 小時前`;
        if (diffDays < 7) return `${diffDays} 天前`;
        return date.toLocaleDateString('zh-TW');
    };

    return (
        <div className="qa-section">
            <div className="qa-section__header">
                <h3 className="qa-section__title">旅人問答</h3>
                <p className="qa-section__subtitle">
                    對這條路線有疑問？查看其他旅人的問答或提出你的問題
                </p>
            </div>

            {!showAskForm ? (
                <button
                    className="qa-section__ask-btn"
                    onClick={() => {
                        if (!user) {
                            alert('請先登入才能提問');
                            return;
                        }
                        setShowAskForm(true);
                    }}
                >
                    <span>提出問題</span>
                </button>
            ) : (
                <div className="qa-section__ask-form">
                    <h4 className="qa-section__form-title">選擇問題類型</h4>
                    <div className="qa-section__type-grid">
                        {QUESTION_TEMPLATES.map(({ type, icon, label }) => (
                            <button
                                key={type}
                                className={`qa-section__type-btn ${selectedType === type ? 'selected' : ''}`}
                                onClick={() => setSelectedType(type)}
                            >
                                <span className="qa-section__type-icon">{icon}</span>
                                <span className="qa-section__type-label">{label}</span>
                            </button>
                        ))}
                    </div>

                    {selectedType && (
                        <div className="qa-section__input-area">
                            <textarea
                                className="qa-section__textarea"
                                placeholder="詳細描述你的問題..."
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                rows={3}
                            />
                            <div className="qa-section__form-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowAskForm(false);
                                        setSelectedType(null);
                                        setNewQuestion('');
                                    }}
                                    disabled={isSubmitting}
                                >
                                    取消
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAsk}
                                    disabled={!newQuestion.trim() || isSubmitting}
                                >
                                    {isSubmitting ? '送出中...' : '送出問題'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isLoading ? (
                <div className="qa-section__loading">
                    <div className="loading-spinner"></div>
                    <p>載入問答中...</p>
                </div>
            ) : (
                <div className="qa-section__questions">
                    {questions.map((question) => {
                        const template = QUESTION_TEMPLATES.find(t => t.type === question.type);
                        const questionAnswers = answers[question.id!] || [];
                        const isExpanded = selectedQuestion === question.id;
                        const isOwner = user?.uid === question.userId;

                        return (
                            <div key={question.id} className="qa-question">
                                <div
                                    className="qa-question__header"
                                    onClick={() => setSelectedQuestion(isExpanded ? null : question.id!)}
                                >
                                    <div className="qa-question__top">
                                        <div className="qa-question__type-badge">
                                            <span>{template?.icon}</span>
                                            <span>{template?.label}</span>
                                        </div>
                                        <span className="qa-question__time">
                                            {formatTime(question.createdAt)}
                                        </span>
                                    </div>
                                    <p className="qa-question__content">{question.content}</p>
                                    <div className="qa-question__meta">
                                        <div className="qa-question__user">
                                            {question.userPhoto && (
                                                <img
                                                    src={question.userPhoto}
                                                    alt={question.userName}
                                                    className="qa-question__avatar"
                                                />
                                            )}
                                            <span className="qa-question__username">{question.userName}</span>
                                        </div>
                                        <div className="qa-question__stats">
                                            <span className="qa-question__answer-count">
                                                {question.answerCount} 個回答
                                            </span>
                                            <span className="qa-question__expand">
                                                {isExpanded ? '收起' : '展開'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="qa-question__answers">
                                        {isOwner && (
                                            <button
                                                className="qa-question__delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteQuestion(question.id!);
                                                }}
                                            >
                                                刪除問題
                                            </button>
                                        )}

                                        {questionAnswers.length === 0 ? (
                                            <div className="qa-answers__empty">
                                                <p>還沒有人回答這個問題</p>
                                                <p>成為第一個回答的人吧！</p>
                                            </div>
                                        ) : (
                                            questionAnswers.map((answer) => {
                                                const userVote = answer.votedBy?.[user?.uid || ''];
                                                return (
                                                    <div key={answer.id} className="qa-answer">
                                                        <div className="qa-answer__user">
                                                            {answer.userPhoto && (
                                                                <img
                                                                    src={answer.userPhoto}
                                                                    alt={answer.userName}
                                                                    className="qa-answer__avatar"
                                                                />
                                                            )}
                                                            <span className="qa-answer__username">{answer.userName}</span>
                                                            <span className="qa-answer__time">{formatTime(answer.createdAt)}</span>
                                                        </div>
                                                        <p className="qa-answer__content">{answer.content}</p>
                                                        <div className="qa-answer__footer">
                                                            <div className="qa-answer__votes">
                                                                <button
                                                                    className={`qa-answer__vote-btn ${userVote === 'up' ? 'active' : ''}`}
                                                                    onClick={() => handleVote(answer.id!, 'up')}
                                                                >
                                                                    Upvote {answer.upvotes}
                                                                </button>
                                                                <button
                                                                    className={`qa-answer__vote-btn ${userVote === 'down' ? 'active' : ''}`}
                                                                    onClick={() => handleVote(answer.id!, 'down')}
                                                                >
                                                                    Downvote {answer.downvotes}
                                                                </button>
                                                            </div>
                                                            {answer.isVerified && (
                                                                <span className="qa-answer__verified">Verified 已驗證</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}

                                        {user ? (
                                            <div className="qa-question__add-answer">
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="分享你的經驗..."
                                                    value={newAnswers[question.id!] || ''}
                                                    onChange={(e) => setNewAnswers(prev => ({
                                                        ...prev,
                                                        [question.id!]: e.target.value
                                                    }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleAnswer(question.id!);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleAnswer(question.id!)}
                                                    disabled={!newAnswers[question.id!]?.trim() || isSubmitting}
                                                >
                                                    {isSubmitting ? '...' : '回答'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="qa-question__login-prompt">
                                                <p>登入後即可回答問題</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {!isLoading && questions.length === 0 && (
                <div className="qa-section__empty">
                    <p>還沒有人提問過這條路線</p>
                    <p>成為第一個提問的人吧！</p>
                </div>
            )}
        </div>
    );
};

export default QASection;
