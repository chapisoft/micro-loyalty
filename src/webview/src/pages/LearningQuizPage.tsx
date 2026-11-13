import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Trophy,
  History,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { GameHeader } from '../components/common/GameHeader';
import { SkeletonCard, EmptyState } from '../components/common/StateBlocks';
import {
  LoyaltyApi,
  LearningCourseItem,
  LearningQuestionItem,
  LearningQuizSubmitResponse,
  LearningLeaderboardItem,
  getDefaultUserId,
} from '../services/api';
import { soundHaptics } from '../utils/soundHaptics';

interface PlayHistoryEntry {
  id?: number | string;
  gameType?: string;
  gameCode?: string;
  prizeName?: string;
  pointsAwarded?: number;
  outcome?: string;
  playedAt?: string;
  createdAt?: string;
}

export interface LearningQuizPageProps {
  onBack: () => void;
  externalUserId?: string;
  initialTab?: 'courses' | 'leaderboard' | 'history';
  onPointsUpdated?: (pointsAwarded: number, newBalance?: number) => void;
}

export const LearningQuizPage: React.FC<LearningQuizPageProps> = ({
  onBack,
  externalUserId,
  initialTab = 'courses',
  onPointsUpdated,
}) => {
  const { t } = useTranslation();
  const userId = externalUserId || getDefaultUserId();
  const [soundEnabled, setSoundEnabled] = useState(!soundHaptics.isMuted());
  const [activeTab, setActiveTab] = useState<'courses' | 'quiz' | 'leaderboard' | 'history'>(
    initialTab
  );

  const [courses, setCourses] = useState<LearningCourseItem[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<LearningCourseItem | null>(null);

  const [questions, setQuestions] = useState<LearningQuestionItem[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<LearningQuizSubmitResponse | null>(null);

  const [leaderboard, setLeaderboard] = useState<LearningLeaderboardItem[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [history, setHistory] = useState<PlayHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggleSound = () => {
    const muted = soundHaptics.toggleMute();
    setSoundEnabled(!muted);
    soundHaptics.playClick();
  };

  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    setErrorMsg(null);
    try {
      const list = await LoyaltyApi.getLearningCourses();
      setCourses(list);
    } catch (err) {
      setCourses([]);
      setErrorMsg(err instanceof Error ? err.message : t('learning.load_error'));
    } finally {
      setLoadingCourses(false);
    }
  }, [t]);

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    setErrorMsg(null);
    try {
      const list = await LoyaltyApi.getLearningLeaderboard();
      setLeaderboard(list);
    } catch (err) {
      setLeaderboard([]);
      setErrorMsg(err instanceof Error ? err.message : t('learning.load_error'));
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [t]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    setErrorMsg(null);
    try {
      const res = await LoyaltyApi.getGamePlayHistory(userId, 0, 25);
      const rows = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.content)
        ? res.content
        : Array.isArray(res)
        ? res
        : [];
      setHistory(rows as PlayHistoryEntry[]);
    } catch (err) {
      setHistory([]);
      setErrorMsg(err instanceof Error ? err.message : t('learning.load_error'));
    } finally {
      setLoadingHistory(false);
    }
  }, [t, userId]);

  useEffect(() => {
    if (activeTab === 'courses') void fetchCourses();
    if (activeTab === 'leaderboard') void fetchLeaderboard();
    if (activeTab === 'history') void fetchHistory();
  }, [activeTab, fetchCourses, fetchLeaderboard, fetchHistory]);

  const handleOpenCourse = async (course: LearningCourseItem) => {
    soundHaptics.playClick();
    setSelectedCourse(course);
    setActiveTab('quiz');
    setLoadingQuiz(true);
    setSubmitResult(null);
    setAnswers({});
    setErrorMsg(null);
    try {
      const qs = await LoyaltyApi.getLearningQuestions(course.id);
      setQuestions(qs);
    } catch (err) {
      setQuestions([]);
      setErrorMsg(err instanceof Error ? err.message : t('learning.load_error'));
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (submitResult) return;
    soundHaptics.playClick();
    setAnswers((prev) => ({ ...prev, [String(questionId)]: optionIdx }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedCourse || questions.length === 0 || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: answers[String(q.id)] ?? -1,
      }));
      const res = await LoyaltyApi.submitLearningQuiz(selectedCourse.id, payload, userId);
      setSubmitResult(res);
      if (res.pointsAwarded > 0) {
        soundHaptics.playVictoryFanfare();
        soundHaptics.triggerHaptic(35);
      } else {
        soundHaptics.playMatchSuccess();
      }
      onPointsUpdated?.(res.pointsAwarded, res.newPointBalance);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('learning.submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = questions.filter((q) => answers[String(q.id)] !== undefined).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GameHeader
        title={t('learning.title')}
        subtitle={selectedCourse && activeTab === 'quiz' ? selectedCourse.title : t('learning.subtitle')}
        onBack={() => {
          if (activeTab === 'quiz') {
            setActiveTab('courses');
          } else {
            onBack();
          }
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <div className="max-w-md w-full mx-auto px-4 pt-3">
        <div className="grid grid-cols-3 gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'courses' || activeTab === 'quiz'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('learning.tab_courses')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'leaderboard'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{t('learning.tab_leaderboard')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{t('learning.tab_history')}</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-3">
        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {activeTab === 'courses' && (
          <>
            {loadingCourses ? (
              <div className="space-y-3">
                <SkeletonCard rows={3} />
                <SkeletonCard rows={3} />
              </div>
            ) : courses.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="w-6 h-6 text-indigo-500" />}
                title={t('learning.empty_courses')}
                description={t('learning.empty_courses_desc')}
              />
            ) : (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
                          {course.category || t('learning.course_tag')}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 mt-1.5">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{course.description}</p>
                        )}
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs shrink-0">
                        +{course.rewardPointsMax.toLocaleString()} {t('common.points_short')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>{t('learning.question_count', { count: course.totalQuestions })}</span>
                      <button
                        type="button"
                        onClick={() => void handleOpenCourse(course)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold inline-flex items-center gap-1 active:scale-95 transition"
                      >
                        <span>
                          {course.bestScore && course.bestScore > 0
                            ? t('learning.review_quiz')
                            : t('learning.start_quiz')}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'quiz' && (
          <>
            {loadingQuiz ? (
              <SkeletonCard rows={5} />
            ) : questions.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="w-6 h-6 text-slate-400" />}
                title={t('learning.empty_questions')}
                description={t('learning.empty_questions_desc')}
              />
            ) : (
              <div className="space-y-3">
                {submitResult && (
                  <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-bold">{t('learning.quiz_completed')}</span>
                      </div>
                      <span className="font-mono text-sm font-bold">
                        +{submitResult.pointsAwarded.toLocaleString()} {t('common.points_unit')}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-50">
                      {t('learning.score_summary', {
                        correct: submitResult.correctCount,
                        total: submitResult.totalQuestions,
                      })}
                    </p>
                  </div>
                )}

                {questions.map((q, qIdx) => {
                  const chosen = answers[String(q.id)];
                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-2.5"
                    >
                      <p className="text-xs font-semibold text-slate-900">
                        <span className="font-mono text-indigo-600 mr-1.5">Q{qIdx + 1}.</span>
                        {q.questionText}
                      </p>
                      <div className="space-y-1.5">
                        {q.options.map((opt: string, optIdx: number) => {
                          const selected = chosen === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={Boolean(submitResult)}
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition ${
                                selected
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {!submitResult && (
                  <button
                    type="button"
                    disabled={!allAnswered || submitting}
                    onClick={() => void handleSubmitQuiz()}
                    className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                      allAnswered && !submitting
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {submitting
                        ? t('common.processing')
                        : t('learning.submit_quiz', {
                            answered: answeredCount,
                            total: questions.length,
                          })}
                    </span>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'leaderboard' && (
          <>
            {loadingLeaderboard ? (
              <SkeletonCard rows={5} />
            ) : leaderboard.length === 0 ? (
              <EmptyState
                icon={<Trophy className="w-6 h-6 text-amber-500" />}
                title={t('learning.empty_leaderboard')}
                description={t('learning.empty_leaderboard_desc')}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={`${entry.rank}-${entry.displayName}`}
                    className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-800 shrink-0">
                        #{entry.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{entry.displayName}</p>
                        {entry.badge && (
                          <span className="text-[10px] text-indigo-600">{entry.badge}</span>
                        )}
                      </div>
                    </div>
                    <div className="font-mono text-amber-700 font-semibold shrink-0">
                      {entry.totalPoints.toLocaleString()} {t('common.points_short')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {loadingHistory ? (
              <SkeletonCard rows={5} />
            ) : history.length === 0 ? (
              <EmptyState
                icon={<History className="w-6 h-6 text-slate-400" />}
                title={t('learning.empty_history')}
                description={t('learning.empty_history_desc')}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2">
                {history.map((item, idx) => (
                  <div
                    key={item.id ?? idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {item.prizeName || item.gameType || item.gameCode || t('learning.session_default')}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.playedAt || item.createdAt
                          ? new Date(item.playedAt || item.createdAt || '').toLocaleString()
                          : ''}
                      </p>
                    </div>
                    <span
                      className={`font-mono shrink-0 ${
                        (item.pointsAwarded ?? 0) > 0 ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {(item.pointsAwarded ?? 0) > 0
                        ? `+${(item.pointsAwarded ?? 0).toLocaleString()} ${t('common.points_short')}`
                        : item.outcome || t('learning.recorded')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default LearningQuizPage;
