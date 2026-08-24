import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { LoyaltyApi, GameDetailData } from '../../services/api';
import { soundManager } from '../../utils/audio';
import { ParticleCanvas } from '../../components/effects/ParticleCanvas';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
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
  const [gameConfig, setGameConfig] = useState<GameDetailData | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [userBalance, setUserBalance] = useState<number>(0);
  const [remainingTurns, setRemainingTurns] = useState<number>(1);
  const [particleTrigger, setParticleTrigger] = useState<number>(0);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [isFiftyUsed, setIsFiftyUsed] = useState<boolean>(false);

  // 1. Nạp cấu hình ma trận giải thưởng động từ Cơ sở dữ liệu
  useEffect(() => {
    LoyaltyApi.getGameDetail('TRIVIA_QUIZ')
      .then((cfg) => {
        setGameConfig(cfg);
        setUserBalance(cfg.userPointBalance || 0);
        setRemainingTurns(cfg.remainingTurnsToday || 1);
      })
      .catch(() => {});
  }, []);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) soundManager.playTap();
  };

  const currentQ = DEFAULT_QUIZ_QUESTIONS[currentIdx];

  // Đếm ngược thời gian từng câu hỏi
  useEffect(() => {
    if (isFinished || isAnswered) return;
    if (timeLeft <= 0) {
      soundManager.playLose();
      setIsAnswered(true);
      return;
    }
    if (timeLeft <= 5) {
      soundManager.playSpinTick();
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, isFinished]);

  const handleUseFiftyFifty = () => {
    if (isFiftyUsed || isAnswered) return;
    soundManager.playTap();
    setIsFiftyUsed(true);
    const wrongOptions = [0, 1, 2, 3].filter((i) => i !== currentQ.correctAnswer);
    const toHide = wrongOptions.slice(0, 2);
    setHiddenOptions(toHide);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctAnswer) {
      soundManager.playWinFanfare();
      soundManager.triggerHaptic('success');
      setScore((s) => s + 1);
    } else {
      soundManager.playLose();
      soundManager.triggerHaptic('error');
    }
  };

  const handleNextQuestion = () => {
    soundManager.playTap();
    if (currentIdx < DEFAULT_QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(20);
      setHiddenOptions([]);
    } else {
      setIsFinished(true);
      if (score >= 4) {
        soundManager.playJackpot();
        soundManager.playCoinRain();
        soundManager.triggerHaptic('success');
        setParticleTrigger((p) => p + 1);
      } else if (score >= 2) {
        soundManager.playWinFanfare();
        soundManager.playCoinRain();
        soundManager.triggerHaptic('success');
        setParticleTrigger((p) => p + 1);
      } else {
        soundManager.playLose();
      }
    }
  };

  const calculateReward = () => {
    if (score === 5) return 150;
    if (score === 4) return 100;
    if (score === 3) return 50;
    return 10;
  };

  const handleClaim = async () => {
    soundManager.playTap();
    const points = calculateReward();
    try {
      await LoyaltyApi.submitGameResult('TRIVIA_QUIZ', score, 'GS_QUIZ_' + Date.now());
      setIsClaimed(true);
      setUserBalance((b) => b + points);
      if (onClaimReward) onClaimReward(points);
    } catch {
      setIsClaimed(true);
      if (onClaimReward) onClaimReward(points);
    }
  };

  const handleRestart = () => {
    soundManager.playTap();
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setTimeLeft(20);
    setIsFinished(false);
    setIsClaimed(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-12">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-blue-500/20 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playTap();
            onBack?.();
          }}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-slate-300"
          aria-label={t('games.common.btn_back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg shadow-sm">
            🧠
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-200 to-indigo-400 bg-clip-text text-transparent">
            {gameConfig?.gameName || 'Đố Vui Trí Tuệ'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 transition-all text-blue-400"
            title={isMuted ? t('games.common.sound_off') : t('games.common.sound_on')}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 rounded-xl px-2.5 py-1">
            <Coins className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-300">{userBalance}đ</span>
          </div>
        </div>
      </header>

      {/* 2. Main Quiz Stage */}
      <main className="max-w-md mx-auto w-full px-4 py-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Banner Info */}
        <div className="w-full text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] text-blue-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('games.common.remaining_turns', { turns: remainingTurns })}</span>
          </div>
        </div>

        {!isFinished ? (
          <>
            {/* Progress & Countdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400">
                  Câu hỏi {currentIdx + 1}/{DEFAULT_QUIZ_QUESTIONS.length}
                </span>

                <div className="flex items-center gap-2">
                  {!isAnswered && (
                    <button
                      onClick={handleUseFiftyFifty}
                      disabled={isFiftyUsed}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition ${
                        isFiftyUsed
                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                      }`}
                    >
                      ⚡ Trợ Giúp 50:50
                    </button>
                  )}
                  <span className="flex items-center gap-1 font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Thanh Tiến Trình */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentIdx + 1) / DEFAULT_QUIZ_QUESTIONS.length) * 100}%`,
                  }}
                />
              </div>

              {/* Câu Hỏi */}
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-snug pt-2">
                {currentQ.question}
              </h2>
            </div>

            {/* 4 Phương Án Trả Lời */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                if (hiddenOptions.includes(idx)) {
                  return (
                    <div
                      key={idx}
                      className="w-full p-3.5 rounded-2xl border-2 border-slate-800/40 bg-slate-950/40 text-slate-600 text-xs italic text-center line-through"
                    >
                      Đã loại trừ bởi 50:50
                    </div>
                  );
                }

                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctAnswer;
                let btnStyle = 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20';
                  } else if (isSelected) {
                    btnStyle = 'bg-red-950/60 border-red-500 text-red-300';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full p-3.5 rounded-2xl border-2 font-medium text-xs sm:text-sm text-left flex items-center justify-between transition-all duration-200 ${btnStyle} active:scale-[0.98]`}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2 animate-bounce" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Giải thích câu trả lời & Nút Tiếp tục */}
            {isAnswered && (
              <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <p className="text-xs text-blue-200 leading-relaxed">
                  💡 <span className="font-bold">Giải thích:</span> {currentQ.explanation}
                </p>
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <span>{currentIdx < DEFAULT_QUIZ_QUESTIONS.length - 1 ? 'Câu Hỏi Tiếp Theo' : 'Xem Kết Quả Tổng Kết'}</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Kết Quả Hoàn Thành */
          <div className="bg-gradient-to-b from-blue-950/60 via-slate-900 to-slate-950 rounded-3xl p-6 border-2 border-blue-500/40 shadow-2xl text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/40 mx-auto flex items-center justify-center text-4xl animate-bounce">
              🏆
            </div>

            <div>
              <h2 className="text-lg font-black text-white">
                {score >= 4 ? 'Xuất Sắc Nhanh Trí!' : score >= 3 ? 'Hoàn Thành Tốt!' : 'Chúc May Mắn Lần Sau!'}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Bạn đã trả lời đúng <span className="font-bold text-amber-400">{score}/5</span> câu hỏi!
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
              <span className="text-xs text-slate-400 block mb-1">PHẦN THƯỞNG ĐẠT ĐƯỢC</span>
              <span className="text-2xl font-black text-amber-400">+{calculateReward()} Điểm Loyalty</span>
            </div>

            {!isClaimed ? (
              <button
                onClick={handleClaim}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                Nhận Thưởng & Cộng Vào Ví
              </button>
            ) : (
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử Thách Lại</span>
              </button>
            )}
          </div>
        )}

        {/* Security Stamp */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>{t('footer.enterprise_security')}</span>
        </div>
      </main>

      <ParticleCanvas trigger={particleTrigger} type="confetti" />
    </div>
  );
};
