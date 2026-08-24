import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  HelpCircle,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { LoyaltyJSBridge } from '../../bridge/LoyaltyJSBridge';
import { LoyaltyApi } from '../../services/api';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Khi mua sắm tại siêu thị Delimart, tỷ lệ tích lũy điểm Loyalty cơ bản là bao nhiêu?',
    options: ['1% giá trị hóa đơn', '3% giá trị hóa đơn', '5% giá trị hóa đơn', '10% giá trị hóa đơn'],
    correctAnswer: 0,
    explanation: 'Hội viên nhận 1% điểm tích lũy trên tổng hóa đơn mua hàng tại Delimart.',
  },
  {
    id: 2,
    question: 'Mã QR thanh toán ví phần thưởng tự động làm mới sau bao nhiêu giây?',
    options: ['30 giây', '60 giây', '120 giây', '5 phút'],
    correctAnswer: 1,
    explanation: 'Mã QR động tự đổi sau mỗi 60 giây để đảm bảo an toàn tuyệt đối.',
  },
  {
    id: 3,
    question: 'Hội viên Hạng Kim Cương (Diamond VIP) được hưởng hệ số nhân tích điểm là bao nhiêu?',
    options: ['×1.2', '×1.5', '×2.0', '×3.0'],
    correctAnswer: 2,
    explanation: 'Hạng Kim Cương được nhân đôi (×2.0) toàn bộ số điểm tích lũy trong hệ sinh thái liên minh.',
  },
  {
    id: 4,
    question: 'Tỷ lệ quy đổi điểm Loyalty sang tiền mặt hoàn thẳng vào Ví Natcash là bao nhiêu?',
    options: ['100 Điểm = 1 HTG', '100 Điểm = 10 HTG', '100 Điểm = 50 HTG', '100 Điểm = 100 HTG'],
    correctAnswer: 1,
    explanation: 'Mỗi 100 điểm thưởng tương đương 10 HTG tiền hoàn ví trực tiếp.',
  },
  {
    id: 5,
    question: 'Chu kỳ xét duyệt và duy trì hạng hội viên VIP kéo dài trong bao lâu?',
    options: ['3 tháng', '6 tháng', '12 tháng', '24 tháng'],
    correctAnswer: 2,
    explanation: 'Điểm xét hạng được tính lũy kế và duy trì theo chu kỳ 12 tháng liên tục.',
  },
];

export const TriviaQuizGame: React.FC<{ onBack?: () => void; onClaimReward?: (points: number) => void }> = ({
  onBack,
  onClaimReward,
}) => {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);

  const currentQ = QUIZ_QUESTIONS[currentIdx];

  // Timer countdown per question
  useEffect(() => {
    if (isFinished || isAnswered) return;
    if (timeLeft <= 0) {
      setIsAnswered(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, isFinished]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctAnswer) {
      setScore((s) => s + 1);
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(20);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setTimeLeft(20);
    setIsFinished(false);
    setIsClaimed(false);
  };

  const handleClaim = async () => {
    setIsClaimed(true);
    let pointsAwarded = 150;
    try {
      const res = await LoyaltyApi.submitGameResult('SUPERMARKET_QUIZ', score);
      if (res && res.pointsAwarded !== undefined) {
        pointsAwarded = Number(res.pointsAwarded);
      }
    } catch (e) {
      console.warn('[TriviaQuizGame] Submit result fallback:', e);
    }
    if (onClaimReward) {
      onClaimReward(pointsAwarded);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.location.hash && window.location.hash !== '#/' && window.location.hash !== '') {
      window.history.back();
    } else {
      LoyaltyJSBridge.closeWebview();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-200"
            title={t('nav.back')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t('gamehub.title')}</span>
          </button>

          <div className="text-center">
            <h1 className="text-sm sm:text-base font-black text-slate-900 flex items-center justify-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>{t('quiz.title')}</span>
            </h1>
            <p className="text-[10px] text-slate-500">{t('quiz.subtitle')}</p>
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-900">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Question Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Quiz Body */}
      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8 flex-1 w-full flex flex-col justify-between">
        {!isFinished ? (
          <div className="space-y-6">
            {/* Question Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {t('quiz.question_progress', { current: currentIdx + 1, total: QUIZ_QUESTIONS.length })}
                </span>
                <span className="text-xs font-black text-amber-600 font-mono">
                  ★ Điểm: {score}/{QUIZ_QUESTIONS.length}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentQ.question}
              </h2>
            </div>

            {/* Answer Options Grid */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-xs';
                if (isAnswered) {
                  if (idx === currentQ.correctAnswer) {
                    btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-black shadow-sm ring-2 ring-emerald-500/20';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-sm';
                  } else {
                    btnStyle = 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-bold transition flex items-center justify-between active:scale-98 ${btnStyle}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-600 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswered && idx === currentQ.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isAnswered && idx === selectedOption && idx !== currentQ.correctAnswer && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Next Button */}
            {isAnswered && (
              <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200/80 space-y-3 animate-fade-in">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-900">Giải thích:</span> {currentQ.explanation}
                </p>
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md active:scale-95 transition"
                >
                  {t('quiz.btn_next')}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Result Card */
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-5 my-auto animate-scale-up">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center mx-auto text-slate-950 shadow-xl animate-bounce">
              <Trophy className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs uppercase font-black text-amber-600 tracking-widest">
                {t('quiz.congrats_title')}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {score >= 3 ? 'Xuất Sắc! Thắng Lớn' : 'Hoàn Thành Thử Thách'}
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                {t('quiz.congrats_desc', { correct: score, total: QUIZ_QUESTIONS.length, points: 150 })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-amber-900 font-medium">Phần thưởng đạt được:</span>
              <span className="font-black text-amber-700 text-sm font-mono">+150 Điểm Loyalty</span>
            </div>

            <div className="space-y-2.5 pt-2">
              {!isClaimed ? (
                <button
                  onClick={handleClaim}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t('quiz.btn_claim_points')}</span>
                </button>
              ) : (
                <div className="py-3 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-2xl">
                  ✓ Đã nhận +150 điểm vào ví tài khoản!
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRestart}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('quiz.btn_play_again')}</span>
                </button>
                <button
                  onClick={handleBack}
                  className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                >
                  {t('quiz.btn_back_gamehub')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TriviaQuizGame;
