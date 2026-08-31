import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Delete, Lightbulb, Sparkles } from 'lucide-react';
import { GameSounds } from '../../utils/audio';
import { GameHeader } from '../../components/common/GameHeader';
import { GameTutorialModal } from '../../components/common/GameTutorialModal';

export interface WordleGameProps {
  onBack: () => void;
  onClaimReward?: (pointsWon: number) => void;
}

interface WordEntry {
  word: string;
  topic: string;
  meaning: string;
  language: 'Kreyòl' | 'Français' | 'English' | 'Natcom';
}

const WORD_DATABASE: WordEntry[] = [
  // ── NHÓM 1: VIỄN THÔNG & NATCOM (25 TỪ) ──
  { word: 'NATCO', topic: 'Viễn Thông Natcom', meaning: 'Nhà mạng viễn thông hàng đầu Haiti', language: 'Natcom' },
  { word: 'PWENW', topic: 'Điểm Thưởng Loyalty', meaning: 'Điểm thưởng của bạn trong Kreyòl (Pwen w)', language: 'Kreyòl' },
  { word: 'KREDI', topic: 'Ví & Tài Chính', meaning: 'Tín dụng & tiền nạp điện thoại (Kredi)', language: 'Kreyòl' },
  { word: 'BONUS', topic: 'Quà Tặng & Ưu Đãi', meaning: 'Phần thưởng khuyến mại tặng thêm', language: 'English' },
  { word: 'FIBER', topic: 'Hạ Tầng Viễn Thông', meaning: 'Cáp quang Internet siêu tốc độ', language: 'English' },
  { word: 'SPEED', topic: 'Tốc Độ Mạng', meaning: 'Tốc độ truy cập mạng 4G/5G', language: 'English' },
  { word: 'VOICE', topic: 'Dịch Vụ Thoại', meaning: 'Cuộc gọi thoại chất lượng cao HD', language: 'English' },
  { word: 'PHONE', topic: 'Thiết Bị Di Động', meaning: 'Điện thoại thông minh kết nối', language: 'English' },
  { word: 'SIGNAL', topic: 'Sóng Di Động', meaning: 'Tín hiệu sóng viễn thông phủ rộng', language: 'English' },
  { word: 'TOWER', topic: 'Trạm Phát Sóng', meaning: 'Tháp ăng-ten phát sóng BTS', language: 'English' },
  { word: 'ROUTER', topic: 'Thiết Bị Mạng', meaning: 'Bộ phát sóng Wi-Fi gia đình', language: 'English' },
  { word: 'ONLINE', topic: 'Trực Tuyến', meaning: 'Kết nối thế giới số không giới hạn', language: 'English' },
  { word: 'STREAM', topic: 'Truyền Phát Số', meaning: 'Xem video và nghe nhạc trực tuyến', language: 'English' },
  { word: 'PORTAL', topic: 'Cổng Thông Tin', meaning: 'Cổng tra cứu & nạp cước trực tuyến', language: 'English' },
  { word: 'BUNDLE', topic: 'Gói Cước Tích Hợp', meaning: 'Gói combo Data kèm phút gọi', language: 'English' },
  { word: 'PACKS', topic: 'Gói Dịch Vụ', meaning: 'Gói cước data theo ngày/tuần/tháng', language: 'English' },
  { word: 'RECHAR', topic: 'Nạp Tiền Nhanh', meaning: 'Nạp cước tài khoản trả trước', language: 'Français' },
  { word: 'PLANS', topic: 'Kế Hoạch Cước', meaning: 'Bảng giá gói cước linh hoạt', language: 'English' },
  { word: 'HOTSP', topic: 'Điểm Phát Sóng', meaning: 'Điểm chia sẻ Internet Wi-Fi di động', language: 'English' },
  { word: 'ROAMY', topic: 'Chuyển Vùng Quốc Tế', meaning: 'Giữ kết nối liên lạc toàn cầu', language: 'English' },

  // ── NHÓM 2: VÍ NATCASH & TÀI CHÍNH SỐ (25 TỪ) ──
  { word: 'KASHA', topic: 'Ví & Thanh Toán', meaning: 'Tiền mặt & thanh toán mua sắm (Kash)', language: 'Kreyòl' },
  { word: 'MONEY', topic: 'Tài Chính & Ví', meaning: 'Tiền tệ và số dư tài khoản', language: 'English' },
  { word: 'GOURD', topic: 'Tiền Tệ Haiti', meaning: 'Đồng Gourde (HTG) chính thức', language: 'Kreyòl' },
  { word: 'SOLDE', topic: 'Số Dư Tài Khoản', meaning: 'Số dư ví khả dụng tức thì', language: 'Français' },
  { word: 'CARTE', topic: 'Thẻ Thanh Toán', meaning: 'Thẻ thành viên liên kết mua sắm', language: 'Français' },
  { word: 'PAYER', topic: 'Thanh Toán Hóa Đơn', meaning: 'Giao dịch chuyển tiền tức thì', language: 'Français' },
  { word: 'AGENT', topic: 'Điểm Đại Lý', meaning: 'Đại lý nạp rút tiền mặt Natcash', language: 'English' },
  { word: 'STORE', topic: 'Cửa Hàng Đối Tác', meaning: 'Điểm chấp nhận thanh toán quét mã', language: 'English' },
  { word: 'VAULT', topic: 'Két An Toàn', meaning: 'Kho lưu trữ điểm thưởng tích lũy', language: 'English' },
  { word: 'EARNS', topic: 'Tích Lũy Điểm', meaning: 'Nhận điểm thưởng sau mỗi giao dịch', language: 'English' },
  { word: 'TIERS', topic: 'Hạng Hội Viên', meaning: 'Phân hạng từ Đồng đến Kim Cương', language: 'English' },
  { word: 'CASHB', topic: 'Hoàn Tiền Thưởng', meaning: 'Hoàn trả phần trăm chi tiêu', language: 'English' },
  { word: 'PRIME', topic: 'Đặc Quyền Hội Viên', meaning: 'Quyền lợi dành riêng cho VIP', language: 'English' },
  { word: 'OFFER', topic: 'Ưu Đãi Đặc Biệt', meaning: 'Chương trình khuyến mại độc quyền', language: 'English' },
  { word: 'GIFTS', topic: 'Quà Tặng Tri Ân', meaning: 'Món quà may mắn từ chương trình', language: 'English' },
  { word: 'TOKEN', topic: 'Mã Bảo Mật', meaning: 'Mã xác thực thanh toán an toàn', language: 'English' },
  { word: 'CLAIM', topic: 'Nhận Phần Thưởng', meaning: 'Đổi quà tặng ngay trên ứng dụng', language: 'English' },
  { word: 'TRADE', topic: 'Giao Dịch Đổi Điểm', meaning: 'Chuyển đổi điểm lấy voucher giảm giá', language: 'English' },
  { word: 'ASSET', topic: 'Tài Sản Số', meaning: 'Giá trị điểm tích lũy trong ví', language: 'English' },
  { word: 'SMART', topic: 'Công Nghệ Thông Minh', meaning: 'Giải pháp số và ứng dụng thông minh', language: 'English' },

  // ── NHÓM 3: ĐỐI TÁC LIÊN MINH & MUA SẮM (25 TỪ) ──
  { word: 'TOTAL', topic: 'Đối Tác Năng Lượng', meaning: 'Chuỗi trạm xăng dầu đối tác TotalEnergies', language: 'English' },
  { word: 'DELIM', topic: 'Đối Tác Bán Lẻ', meaning: 'Hệ thống siêu thị đối tác Delimart', language: 'English' },
  { word: 'PLAZA', topic: 'Địa Điểm & Mua Sắm', meaning: 'Trung tâm thương mại hiện đại', language: 'English' },
  { word: 'SUPER', topic: 'Siêu Thị Tiện Lợi', meaning: 'Mua sắm tích điểm mỗi ngày', language: 'English' },
  { word: 'MARKT', topic: 'Chợ & Trung Tâm', meaning: 'Khu thương mại sầm uất', language: 'English' },
  { word: 'HOTEL', topic: 'Khách Sạn Nghỉ Dưỡng', meaning: 'Dịch vụ lưu trú cao cấp đối tác', language: 'English' },
  { word: 'CAFEZ', topic: 'Cà Phê & Ẩm Thực', meaning: 'Thưởng thức cà phê đặc sản Haiti', language: 'Français' },
  { word: 'RESTO', topic: 'Nhà Hàng Ẩm Thực', meaning: 'Trải nghiệm ẩm thực phong phú', language: 'Français' },
  { word: 'PIZZA', topic: 'Ẩm Thực Nhanh', meaning: 'Bữa ăn nhanh tiện lợi cùng bạn bè', language: 'English' },
  { word: 'DRINK', topic: 'Đồ Uống Giải Khát', meaning: 'Nước giải khát nhiệt đới tươi ngon', language: 'English' },
  { word: 'PETRO', topic: 'Nhiên Liệu Xăng Dầu', meaning: 'Đổ xăng tích điểm tại trạm đối tác', language: 'English' },
  { word: 'SOLAR', topic: 'Năng Lượng Sạch', meaning: 'Năng lượng mặt trời sinh thái', language: 'English' },
  { word: 'CLEAN', topic: 'Dịch Vụ Tiêu Chuẩn', meaning: 'Không gian mua sắm văn minh', language: 'English' },
  { word: 'FRESH', topic: 'Nông Sản Tươi Sống', meaning: 'Thực phẩm sạch mỗi ngày', language: 'English' },
  { word: 'MANGO', topic: 'Đặc Sản Caribe', meaning: 'Xoài ngọt ngon nổi tiếng Haiti', language: 'English' },
  { word: 'SWEET', topic: 'Hương Vị Ngọt Ngào', meaning: 'Bánh ngọt và món tráng miệng', language: 'English' },
  { word: 'BREAD', topic: 'Bánh Mì Tươi Mới', meaning: 'Bánh mì nướng nóng hổi mỗi sáng', language: 'English' },
  { word: 'JUICE', topic: 'Nước Ép Tự Nhiên', meaning: 'Nước ép hoa quả nhiệt đới tươi mát', language: 'English' },
  { word: 'SNACK', topic: 'Món Ăn Vặt', meaning: 'Bữa phụ tiện lợi trong ngày', language: 'English' },
  { word: 'FASHT', topic: 'Thời Trang May Mặc', meaning: 'Trang phục phong cách sành điệu', language: 'English' },

  // ── NHÓM 4: VĂN HÓA, DU LỊCH & LỄ HỘI CARIBE (25 TỪ) ──
  { word: 'CARIB', topic: 'Địa Lý & Biển Đảo', meaning: 'Vùng biển nhiệt đới Caribe xinh đẹp', language: 'English' },
  { word: 'FESTA', topic: 'Lễ Hội & Âm Nhạc', meaning: 'Lễ hội âm nhạc và văn hóa sôi động', language: 'Kreyòl' },
  { word: 'OCEAN', topic: 'Đại Dương Xanh', meaning: 'Bờ biển trong xanh cát trắng', language: 'English' },
  { word: 'BEACH', topic: 'Bãi Biển Nghỉ Dưỡng', meaning: 'Điểm đến du lịch lý tưởng', language: 'English' },
  { word: 'SUNNY', topic: 'Ánh Nắng Nhiệt Đới', meaning: 'Khí hậu ấm áp quanh năm', language: 'English' },
  { word: 'ISLAN', topic: 'Hòn Đảo Thiên Đường', meaning: 'Đảo ngọc giữa đại dương Caribe', language: 'English' },
  { word: 'MUSIC', topic: 'Âm Nhạc Bản Sắc', meaning: 'Giai điệu Kompa rộn ràng', language: 'English' },
  { word: 'DANCE', topic: 'Vũ Điệu Lễ Hội', meaning: 'Những bước nhảy sôi động Kanaval', language: 'English' },
  { word: 'DRUMS', topic: 'Nhịp Trống Truyền Thống', meaning: 'Âm vang nhạc cụ dân tộc Haiti', language: 'English' },
  { word: 'SMILE', topic: 'Nụ Cười Rạng Rỡ', meaning: 'Sự thân thiện mến khách của người dân', language: 'English' },
  { word: 'HAPPY', topic: 'Niềm Vui Cuộc Sống', meaning: 'Hạnh phúc ngập tràn mỗi ngày', language: 'English' },
  { word: 'UNITY', topic: 'Đoàn Kết Gắn Bó', meaning: 'Khẩu hiệu sức mạnh cộng đồng', language: 'English' },
  { word: 'PEACE', topic: 'Hòa Bình Yên Vui', meaning: 'Cuộc sống an lành thịnh vượng', language: 'English' },
  { word: 'ROYAL', topic: 'Hoàng Gia Sang Trọng', meaning: 'Chất lượng dịch vụ chuẩn mực', language: 'English' },
  { word: 'MAGIC', topic: 'Kỳ Diệu Thần Tiên', meaning: 'Những trải nghiệm bất ngờ thú vị', language: 'English' },
  { word: 'DREAM', topic: 'Ước Mơ Tương Lai', meaning: 'Khát vọng vươn tầm số hóa', language: 'English' },
  { word: 'STARS', topic: 'Ngôi Sao Sáng Ngời', meaning: 'Thành tích xuất sắc trên bảng xếp hạng', language: 'English' },
  { word: 'QUEEN', topic: 'Nữ Hoàng Sắc Đẹp', meaning: 'Biểu tượng duyên dáng lễ hội', language: 'English' },
  { word: 'KINGS', topic: 'Vua Lễ Hội', meaning: 'Nhân vật dẫn dắt vũ hội Kanaval', language: 'English' },
  { word: 'CHAMP', topic: 'Nhà Vô Địch', meaning: 'Người dẫn đầu các giải đấu GameHub', language: 'English' },

  // ── NHÓM 5: GIAO TIẾP & TRÍ TUỆ (25 TỪ) ──
  { word: 'MERCI', topic: 'Giao Tiếp & Lịch Sự', meaning: 'Lời cảm ơn chân thành trong tiếng Pháp', language: 'Français' },
  { word: 'LUCKY', topic: 'Trò Chơi May Mắn', meaning: 'Sự may mắn và trúng thưởng lớn', language: 'English' },
  { word: 'BRAVO', topic: 'Tán Thưởng Khích Lệ', meaning: 'Lời chúc mừng xuất sắc chiến thắng', language: 'Français' },
  { word: 'GREAT', topic: 'Tuyệt Vời Xuất Chúng', meaning: 'Thành tích ấn tượng vượt trội', language: 'English' },
  { word: 'SUPER', topic: 'Đỉnh Cao Phong Độ', meaning: 'Kỹ năng suy luận nhạy bén', language: 'English' },
  { word: 'QUICK', topic: 'Nhanh Nhẹn Phản Xạ', meaning: 'Tốc độ tìm ra đáp án chớp nhoáng', language: 'English' },
  { word: 'SHARP', topic: 'Tư Duy Sắc Bén', meaning: 'Khả năng phân tích logic xuất sắc', language: 'English' },
  { word: 'LOGIC', topic: 'Quy Luật Suy Luận', meaning: 'Tư duy logic giải đố chuẩn xác', language: 'English' },
  { word: 'FOCUS', topic: 'Tập Trung Cao Độ', meaning: 'Khóa chặt mục tiêu chiến thắng', language: 'English' },
  { word: 'LEVEL', topic: 'Màn Chơi Thử Thách', meaning: 'Cấp độ thử thách ngày càng cao', language: 'English' },
  { word: 'SCORE', topic: 'Điểm Số Kỷ Lục', meaning: 'Ghi danh bảng vàng thành tích', language: 'English' },
  { word: 'QUEST', topic: 'Nhiệm Vụ Khám Phá', meaning: 'Chinh phục các thử thách mỗi ngày', language: 'English' },
  { word: 'MATCH', topic: 'Ghép Nối Chuẩn Xác', meaning: 'Tìm kiếm những sự trùng khớp', language: 'English' },
  { word: 'COLOR', topic: 'Sắc Màu Rực Rỡ', meaning: 'Giao diện sinh động cuốn hút', language: 'English' },
  { word: 'LIGHT', topic: 'Ánh Sáng Dẫn Lối', meaning: 'Gợi ý thông minh mở đường', language: 'English' },
  { word: 'POWER', topic: 'Sức Mạnh Bứt Phá', meaning: 'Trợ lực vươn lên vị trí dẫn đầu', language: 'English' },
  { word: 'BRAIN', topic: 'Trí Não Nhạy Bén', meaning: 'Rèn luyện trí nhớ và phản xạ', language: 'English' },
  { word: 'SOLVE', topic: 'Giải Quyết Vấn Đề', meaning: 'Vượt qua mọi câu đố hóc búa', language: 'English' },
  { word: 'GUARD', topic: 'Bảo Vệ Tài Khoản', meaning: 'An toàn bảo mật đa lớp', language: 'English' },
  { word: 'FLASH', topic: 'Tốc Biến Chớp Mắt', meaning: 'Phản ứng tức thì trước thử thách', language: 'English' },
];

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

type LetterState = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY';

// In-session Non-repeating Word Deck
let remainingWordIndices: number[] = [];

function getNextWord(): WordEntry {
  if (remainingWordIndices.length === 0) {
    remainingWordIndices = Array.from({ length: WORD_DATABASE.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = remainingWordIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingWordIndices[i], remainingWordIndices[j]] = [remainingWordIndices[j], remainingWordIndices[i]];
    }
  }
  const chosenIndex = remainingWordIndices.pop()!;
  return WORD_DATABASE[chosenIndex];
}

export const WordleGame: React.FC<WordleGameProps> = ({ onBack, onClaimReward }) => {
  const { t } = useTranslation();

  const [currentEntry, setCurrentEntry] = useState<WordEntry>(WORD_DATABASE[0]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!GameSounds.isSoundMuted());
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [shakeRow, setShakeRow] = useState<boolean>(false);
  const [revealedLetterIdx, setRevealedLetterIdx] = useState<number | null>(null);

  const secretWord = useMemo(() => currentEntry.word, [currentEntry]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    GameSounds.setMuted(!next);
  };

  const startNewGame = useCallback(() => {
    const chosen = getNextWord();
    setCurrentEntry(chosen);
    setGuesses([]);
    setCurrentGuess('');
    setIsGameOver(false);
    setIsWon(false);
    setShowHint(false);
    setRevealedLetterIdx(null);
    setShakeRow(false);
    GameSounds.playStart();
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleKeyPress = useCallback(
    (char: string) => {
      if (isGameOver || isWon) return;

      if (char === 'ENTER') {
        if (currentGuess.length !== WORD_LENGTH) {
          setShakeRow(true);
          setTimeout(() => setShakeRow(false), 400);
          GameSounds.playWrong();
          return;
        }

        const nextGuesses = [...guesses, currentGuess];
        setGuesses(nextGuesses);

        if (currentGuess === secretWord) {
          setIsWon(true);
          setIsGameOver(true);
          const reward = 100 + (MAX_GUESSES - nextGuesses.length) * 25;
          setRewardAmount(reward);
          setTimeout(() => {
            setShowRewardModal(true);
            GameSounds.playWinFanfare();
          }, 500);
        } else if (nextGuesses.length >= MAX_GUESSES) {
          setIsGameOver(true);
          GameSounds.playLose();
        } else {
          GameSounds.playCorrect();
        }
        setCurrentGuess('');
      } else if (char === 'BACKSPACE') {
        if (currentGuess.length > 0) {
          setCurrentGuess((prev) => prev.slice(0, -1));
          GameSounds.playTap();
        }
      } else if (currentGuess.length < WORD_LENGTH) {
        // Only accept A-Z
        const upper = char.toUpperCase();
        if (/^[A-Z]$/.test(upper)) {
          setCurrentGuess((prev) => prev + upper);
          GameSounds.playTap();
        }
      }
    },
    [isGameOver, isWon, currentGuess, guesses, secretWord]
  );

  // Global Physical Keyboard Support (A-Z, Enter, Backspace)
  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [handleKeyPress]);

  const revealOneLetterHint = () => {
    if (revealedLetterIdx !== null || isGameOver || isWon) return;
    const unrevealedIndices: number[] = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
      let isAlreadyKnown = false;
      for (const g of guesses) {
        if (g[i] === secretWord[i]) {
          isAlreadyKnown = true;
          break;
        }
      }
      if (!isAlreadyKnown) unrevealedIndices.push(i);
    }

    if (unrevealedIndices.length > 0) {
      const pick = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      setRevealedLetterIdx(pick);
      GameSounds.playWinFanfare();
    }
  };

  const getLetterState = (word: string, index: number): LetterState => {
    const char = word[index];
    if (char === secretWord[index]) return 'CORRECT';
    if (secretWord.includes(char)) return 'PRESENT';
    return 'ABSENT';
  };

  const getKeyboardKeyStatus = (char: string): LetterState => {
    let status: LetterState = 'EMPTY';
    for (const g of guesses) {
      for (let i = 0; i < g.length; i++) {
        if (g[i] === char) {
          if (secretWord[i] === char) return 'CORRECT';
          if (secretWord.includes(char)) status = 'PRESENT';
          else if (status === 'EMPTY') status = 'ABSENT';
        }
      }
    }
    return status;
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
  ];

  const claimReward = () => {
    if (onClaimReward && rewardAmount > 0) {
      onClaimReward(rewardAmount);
    }
    setShowRewardModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none pb-10 animate-fade-in">
      <GameHeader
        title={t('games.wordle.title')}
        subtitle={t('games.wordle.guesses_left', { count: MAX_GUESSES - guesses.length })}
        onBack={onBack}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRestart={startNewGame}
        restartTooltip={t('games.wordle.btn_new_word')}
        onHelp={() => setShowTutorial(true)}
      />

      {/* ── MAIN STAGE ── */}
      <main className="flex-1 max-w-md mx-auto w-full px-3 py-2 flex flex-col items-center justify-between">
        {/* Topic Badge & Hint Trigger Banner */}
        <div className="w-full bg-slate-900/70 border border-slate-800/90 rounded-2xl p-2.5 shadow-lg space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <div className="min-w-0">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  {t('games.wordle.topic_label', { topic: currentEntry.topic, lang: currentEntry.language })}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowHint((prev) => !prev)}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold flex items-center gap-1 active:scale-95 transition shrink-0"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('games.wordle.btn_hint')}</span>
            </button>
          </div>

          {/* Expandable Clue & Meaning Box */}
          {showHint && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2 text-xs text-amber-200 animate-fade-in flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">
                  <strong className="text-amber-300">{t('games.wordle.hint_title')}:</strong> {currentEntry.meaning}
                </p>
                {revealedLetterIdx === null ? (
                  <button
                    onClick={revealOneLetterHint}
                    className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-md hover:bg-amber-400 transition"
                  >
                    {t('games.wordle.unlock_letter_btn', { defaultValue: '💡 Mở khóa 1 chữ cái ngẫu nhiên' })}
                  </button>
                ) : (
                  <p className="text-[11px] text-emerald-400 font-bold">
                    {t('games.wordle.revealed_letter_info', {
                      pos: revealedLetterIdx + 1,
                      letter: secretWord[revealedLetterIdx],
                      defaultValue: `✓ Chữ cái ở vị trí thứ ${revealedLetterIdx + 1} là: "${secretWord[revealedLetterIdx]}"`,
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6x5 3D Glassmorphism Letter Grid */}
        <div className="grid grid-rows-6 gap-1.5 my-2 w-full max-w-[280px] p-2 bg-slate-900/60 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-2xl">
          {Array.from({ length: MAX_GUESSES }).map((_, rIdx) => {
            const isCurrentRow = rIdx === guesses.length;
            const rowGuess = guesses[rIdx] || (isCurrentRow ? currentGuess : '');

            return (
              <div
                key={rIdx}
                className={`grid grid-cols-5 gap-1.5 transition-transform ${
                  isCurrentRow && shakeRow ? 'scale-105 rotate-1 border border-red-500 rounded-xl' : ''
                }`}
              >
                {Array.from({ length: WORD_LENGTH }).map((_, cIdx) => {
                  const letter = rowGuess[cIdx] || '';
                  let cellStyle = 'bg-slate-800/50 border-slate-700/40 text-slate-400';

                  if (rIdx < guesses.length) {
                    const state = getLetterState(guesses[rIdx], cIdx);
                    if (state === 'CORRECT') {
                      cellStyle =
                        'bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 border-emerald-300 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-300 animate-flip';
                    } else if (state === 'PRESENT') {
                      cellStyle =
                        'bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-700 border-yellow-200 text-white shadow-lg shadow-amber-950/60 ring-1 ring-yellow-200 animate-flip';
                    } else {
                      cellStyle = 'bg-slate-800/90 border-slate-700 text-slate-400';
                    }
                  } else if (letter) {
                    cellStyle =
                      'bg-slate-800 border-amber-400 text-white scale-105 shadow-md shadow-amber-500/30';
                  } else if (isCurrentRow && revealedLetterIdx === cIdx) {
                    cellStyle =
                      'bg-emerald-950/40 border-emerald-500/80 text-emerald-400 animate-pulse';
                  }

                  return (
                    <div
                      key={cIdx}
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center font-mono font-black text-lg sm:text-xl transition-all duration-200 relative overflow-hidden ${cellStyle}`}
                    >
                      {/* 3D Specular Highlight */}
                      <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-xl" />
                      <span className="relative z-10 drop-shadow-md">
                        {letter || (isCurrentRow && revealedLetterIdx === cIdx ? secretWord[cIdx] : '')}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Clear Color Meaning Legend Bar */}
        <div className="w-full max-w-[340px] flex items-center justify-center gap-3 bg-slate-900/50 border border-slate-800/80 rounded-xl px-2.5 py-1 text-[10px] text-slate-300">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-300" />
            <span>{t('games.wordle.legend_correct')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 border border-yellow-200" />
            <span>{t('games.wordle.legend_present')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 border border-slate-600" />
            <span>{t('games.wordle.legend_absent')}</span>
          </div>
        </div>

        {/* Secret Word Reveal on Game Over */}
        {isGameOver && !isWon && (
          <div className="bg-red-950/80 border border-red-500/50 px-4 py-2 rounded-xl text-center text-xs text-red-300 font-mono my-1 shadow-lg animate-fade-in">
            {t('games.wordle.correct_word', { word: secretWord, meaning: currentEntry.meaning })}
          </div>
        )}

        {/* Cyberpunk Virtual Keyboard */}
        <div className="w-full max-w-[360px] space-y-1 mt-1.5">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1">
              {row.map((key) => {
                const keyStatus = getKeyboardKeyStatus(key);
                let btnStyle = 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700/80 shadow-xs';

                if (keyStatus === 'CORRECT')
                  btnStyle =
                    'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-300 shadow-md shadow-emerald-950/50';
                else if (keyStatus === 'PRESENT')
                  btnStyle =
                    'bg-gradient-to-br from-amber-400 to-yellow-600 text-white border-yellow-200 shadow-md shadow-amber-950/50';
                else if (keyStatus === 'ABSENT')
                  btnStyle = 'bg-slate-900/60 text-slate-600 border-slate-800/80';

                return (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    className={`py-2.5 sm:py-3 rounded-xl border font-mono font-bold text-xs sm:text-sm active:scale-95 transition flex items-center justify-center ${
                      key === 'ENTER' || key === 'BACKSPACE'
                        ? 'px-2 sm:px-3 text-[10px] bg-slate-700/90 text-amber-300 border-slate-600 font-black'
                        : 'flex-1'
                    } ${btnStyle}`}
                  >
                    {key === 'BACKSPACE' ? <Delete className="w-4 h-4" /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* ── REWARD MODAL ── */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl animate-bounce border-2 border-white">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t('games.wordle.win_title')}</h3>
              <p className="text-xs text-amber-300 mt-1 font-mono font-bold">
                &quot;{secretWord}&quot; • {currentEntry.meaning}
              </p>
              <div className="text-3xl font-black text-amber-400 font-mono mt-2">
                +{rewardAmount} {t('nav.points_unit')}
              </div>
            </div>
            <button
              onClick={claimReward}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl text-sm shadow-lg active:scale-95 transition"
            >
              {t('games.common.btn_claim')}
            </button>
          </div>
        </div>
      )}

      {/* ── GAME TUTORIAL MODAL ── */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        gameTitle={t('games.wordle.title')}
        gameIcon="🔤"
        goal={t('games.wordle.tutorial.goal')}
        controls={t('games.wordle.tutorial.controls')}
        scoring={t('games.wordle.tutorial.scoring')}
        tips={t('games.wordle.tutorial.tips')}
      />
    </div>
  );
};
