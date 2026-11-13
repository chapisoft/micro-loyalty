-- ==============================================================================
-- FLYWAY MIGRATION V22: LEARNING QUIZ BANK & MONTHLY GAME LEADERBOARDS
-- Hệ Sinh Thái Khách Hàng Thân Thiết Liên Minh & Cổng Game Đa Thuê Bao (micro-loyalty)
-- Cơ sở dữ liệu: PostgreSQL 15+ (loyalty_db)
-- ==============================================================================

-- 1. BẢNG KHÓA HỌC TRẮC NGHIỆM EDTECH (LEARNING_COURSES)
CREATE TABLE IF NOT EXISTS learning_courses (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    course_code VARCHAR(80) NOT NULL, -- ENGLISH_DAILY, APRANN_LI, MONEY_SMART
    title_vi VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_fr VARCHAR(255) NOT NULL,
    title_ht VARCHAR(255) NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    description_fr TEXT,
    description_ht TEXT,
    game_category VARCHAR(40) NOT NULL DEFAULT 'LEARNING_EDTECH',
    level VARCHAR(30) NOT NULL DEFAULT 'BEGINNER',
    icon_url VARCHAR(500),
    total_questions INT NOT NULL DEFAULT 5,
    reward_tier1_points NUMERIC(18, 2) NOT NULL DEFAULT 20.00, -- >= 5 câu đúng
    reward_tier2_points NUMERIC(18, 2) NOT NULL DEFAULT 50.00, -- >= 10 câu đúng
    reward_tier3_points NUMERIC(18, 2) NOT NULL DEFAULT 100.00, -- 15 câu đúng
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_learning_course UNIQUE (tenant_id, course_code)
);

-- 2. BẢNG NGÂN HÀNG CÂU HỎI HỌC TẬP ĐA NGÔN NGỮ & ÂM THANH (LEARNING_QUESTIONS)
CREATE TABLE IF NOT EXISTS learning_questions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    course_id BIGINT NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
    question_text JSONB NOT NULL, -- {"en":"...","fr":"...","ht":"...","vi":"..."}
    options JSONB NOT NULL,       -- ["opt1","opt2","opt3","opt4"]
    correct_option_index INT NOT NULL,
    explanation JSONB,
    audio_url VARCHAR(500),
    difficulty VARCHAR(20) NOT NULL DEFAULT 'EASY',
    display_order INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_questions_course ON learning_questions(tenant_id, course_id, display_order);

-- 3. BẢNG TIẾN ĐỘ HỌC TẬP & CHẤM ĐIỂM NGƯỜI DÙNG (LEARNING_USER_PROGRESS)
CREATE TABLE IF NOT EXISTS learning_user_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    external_user_id VARCHAR(100) NOT NULL,
    course_id BIGINT NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
    attempt_no INT NOT NULL DEFAULT 1,
    correct_count INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    score INT NOT NULL DEFAULT 0,
    points_awarded NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user ON learning_user_progress(tenant_id, external_user_id);

-- 4. BẢNG XẾP HẠNG TRÒ CHƠI & HỌC TẬP HÀNG THÁNG (GAME_MONTHLY_LEADERBOARDS)
CREATE TABLE IF NOT EXISTS game_monthly_leaderboards (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    leaderboard_month VARCHAR(10) NOT NULL, -- YYYY-MM
    external_user_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    total_score INT NOT NULL DEFAULT 0,
    games_played INT NOT NULL DEFAULT 0,
    rank_position INT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_game_leaderboard UNIQUE (tenant_id, leaderboard_month, external_user_id)
);

CREATE INDEX IF NOT EXISTS idx_game_leaderboard_rank ON game_monthly_leaderboards(tenant_id, leaderboard_month, total_score DESC);

-- 5. SEED 3 KHÓA HỌC CHUẨN HAITI (ENGLISH DAILY, APRANN LI, MONEY SMART) + 15 CÂU HỎI MẪU
INSERT INTO learning_courses (
    tenant_id, course_code, title_vi, title_en, title_fr, title_ht,
    description_vi, description_en, description_fr, description_ht,
    game_category, level, total_questions, reward_tier1_points, reward_tier2_points, reward_tier3_points, status
)
SELECT
    t.tenant_id,
    c.course_code,
    c.title_vi, c.title_en, c.title_fr, c.title_ht,
    c.desc_vi, c.desc_en, c.desc_fr, c.desc_ht,
    'LEARNING_EDTECH', c.level, 5, 20.00, 50.00, 100.00, 'ACTIVE'
FROM (VALUES ('TENANT_NATCASH'), ('TENANT_DELIMART')) AS t(tenant_id)
CROSS JOIN (
    VALUES
    (
        'ENGLISH_DAILY',
        'English Daily - Giao Tiếp Hàng Ngày', 'English Daily - Everyday Communication', 'English Daily - Communication Quotidienne', 'English Daily - Pale Anglè Chak Jou',
        'Luyện nghe và từ vựng tiếng Anh giao dịch thương mại hàng ngày.', 'Practice listening and everyday commerce English vocabulary.', 'Pratiquez le vocabulaire anglais commercial du quotidien.', 'Pratike mo anglè pou komès ak lavi chak jou.',
        'BEGINNER'
    ),
    (
        'APRANN_LI',
        'Aprann Li - Đọc Hiểu Tiếng Kreyòl', 'Aprann Li - Kreyòl Literacy', 'Aprann Li - Littératie Kreyòl', 'Aprann Li - Lekti ak Ekriti Kreyòl',
        'Khóa học đọc viết và hiểu văn bản tiếng Kreyòl Ayisyen chuẩn mực.', 'Foundational Haitian Kreyòl reading comprehension course.', 'Cours de compréhension de la lecture en Kreyòl haïtien.', 'Kou pou aprann li ak konprann Kreyòl Ayisyen byen.',
        'BEGINNER'
    ),
    (
        'MONEY_SMART',
        'Money Smart - Quản Lý Tài Chính Số', 'Money Smart - Digital Financial Literacy', 'Money Smart - Éducation Financière Numérique', 'Money Smart - Jere Lajan ak Sekirite Dijital',
        'Kiến thức an toàn ví điện tử, phòng chống lừa đảo và tiết kiệm thông minh.', 'Safe mobile wallet habits, fraud prevention, and smart saving.', 'Sécurité du portefeuille mobile, prévention de la fraude et épargne.', 'Sekirite bous dijital Natcash, pwoteksyon kont fwòd ak ekonomi.',
        'INTERMEDIATE'
    )
) AS c(course_code, title_vi, title_en, title_fr, title_ht, desc_vi, desc_en, desc_fr, desc_ht, level)
ON CONFLICT (tenant_id, course_code) DO NOTHING;

-- Seed câu hỏi cho ENGLISH_DAILY (TENANT_NATCASH)
INSERT INTO learning_questions (tenant_id, course_id, question_text, options, correct_option_index, explanation, audio_url, difficulty, display_order)
SELECT
    c.tenant_id,
    c.id,
    q.question_text::jsonb,
    q.options::jsonb,
    q.correct_idx,
    q.explanation::jsonb,
    q.audio_url,
    'EASY',
    q.ord
FROM learning_courses c
CROSS JOIN (
    VALUES
    (1, '{"en":"How do you politely ask for a receipt at the store?","fr":"Comment demander poliment un reçu au magasin ?","ht":"Kijan ou mande yon resi ak politès nan magazen?","vi":"Bạn hỏi xin hóa đơn một cách lịch sự ở cửa hàng như thế nào?"}', '["Give me paper now","Could I have a receipt, please?","Where is money?","Pay me back"]', 1, '{"en":"Using Could I have..., please? is polite and standard.","ht":"Sèvi ak Could I have..., please? se fason ki pi poli."}', 'https://cdn.natcash.ht/audio/en_daily_01.mp3'),
    (2, '{"en":"What does Balance mean in your Natcash Wallet?","fr":"Que signifie Balance dans votre portefeuille ?","ht":"Kisa Balance vle di nan bous Natcash ou?","vi":"Từ Balance trong ví Natcash có nghĩa là gì?"}', '["Available money in account","Password","Phone number","Store address"]', 0, '{"en":"Balance refers to the funds currently available in your account.","ht":"Balance se kantite lajan ki disponib nan kont ou."}', 'https://cdn.natcash.ht/audio/en_daily_02.mp3'),
    (3, '{"en":"Which phrase means Discount?","fr":"Quelle expression signifie Remise ?","ht":"Ki mo ki vle di Rabè?","vi":"Cụm từ nào có nghĩa là Giảm giá?"}', '["Extra fee","Price reduction","Late penalty","Tax rate"]', 1, '{"en":"Discount means a reduction in the usual price.","ht":"Discount vle di yon rediksyon sou pri nòmal la."}', 'https://cdn.natcash.ht/audio/en_daily_03.mp3'),
    (4, '{"en":"How do you say Thank you very much in English?","fr":"Comment dire Merci beaucoup en anglais ?","ht":"Kijan yo di Mèsi anpil an anglè?","vi":"Bạn nói Cảm ơn rất nhiều bằng tiếng Anh thế nào?"}', '["Good night","Thank you very much","See you later","Excuse me"]', 1, '{"en":"Thank you very much expresses strong gratitude.","ht":"Thank you very much vle di mèsi anpil."}', 'https://cdn.natcash.ht/audio/en_daily_04.mp3'),
    (5, '{"en":"What is a PIN code used for?","fr":"À quoi sert un code PIN ?","ht":"Pou kisa yo itilize yon kòd PIN?","vi":"Mã PIN được dùng để làm gì?"}', '["To authorize and protect payments","To share publicly","To write on bills","To delete contacts"]', 0, '{"en":"Never share your PIN; it protects your financial transactions.","ht":"Pa janm pataje kòd PIN ou; li pwoteje tranzaksyon ou."}', 'https://cdn.natcash.ht/audio/en_daily_05.mp3')
) AS q(ord, question_text, options, correct_idx, explanation, audio_url)
WHERE c.course_code = 'ENGLISH_DAILY'
  AND NOT EXISTS (SELECT 1 FROM learning_questions lq WHERE lq.course_id = c.id AND lq.display_order = q.ord);

-- Seed câu hỏi cho APRANN_LI
INSERT INTO learning_questions (tenant_id, course_id, question_text, options, correct_option_index, explanation, audio_url, difficulty, display_order)
SELECT
    c.tenant_id,
    c.id,
    q.question_text::jsonb,
    q.options::jsonb,
    q.correct_idx,
    q.explanation::jsonb,
    q.audio_url,
    'EASY',
    q.ord
FROM learning_courses c
CROSS JOIN (
    VALUES
    (1, '{"en":"In Haitian Kreyòl, what does Mèsi anpil mean?","fr":"En créole haïtien, que signifie Mèsi anpil ?","ht":"Nan Kreyòl Ayisyen, kisa Mèsi anpil vle di?","vi":"Trong tiếng Kreyòl Haiti, Mèsi anpil nghĩa là gì?"}', '["Thank you very much","Good morning","Goodbye","How much?"]', 0, '{"ht":"Mèsi anpil eksprime rekonesans."}','https://cdn.natcash.ht/audio/aprann_li_01.mp3'),
    (2, '{"en":"Which word means Money in Kreyòl?","fr":"Quel mot signifie Argent en créole ?","ht":"Ki mo ki vle di Lajan?","vi":"Từ nào nghĩa là Tiền trong tiếng Kreyòl?"}', '["Kay","Lajan","Dlo","Solèy"]', 1, '{"ht":"Lajan = Money / Argent."}','https://cdn.natcash.ht/audio/aprann_li_02.mp3'),
    (3, '{"en":"What does Pwen Kado mean in Natcash Loyalty?","fr":"Que signifie Pwen Kado ?","ht":"Kisa Pwen Kado vle di nan Natcash Loyalty?","vi":"Pwen Kado có nghĩa là gì?"}', '["Gift Points / Loyalty Coins","Bank Loan","Phone Battery","Monthly Tax"]', 0, '{"ht":"Pwen Kado se pwen rekonpans ou genyen lè ou itilize Natcash."}','https://cdn.natcash.ht/audio/aprann_li_03.mp3'),
    (4, '{"en":"Which phrase means Welcome?","fr":"Quelle phrase signifie Bienvenue ?","ht":"Ki fraz ki vle di Byenvini?","vi":"Cụm từ nào nghĩa là Chào mừng?"}', '["Byenvini","Orevwa","Padon","Silvouplè"]', 0, '{"ht":"Byenvini = Welcome."}','https://cdn.natcash.ht/audio/aprann_li_04.mp3'),
    (5, '{"en":"What does Peye ak kòd QR mean?","fr":"Que signifie Peye ak kòd QR ?","ht":"Kisa Peye ak kòd QR vle di?","vi":"Peye ak kòd QR nghĩa là gì?"}', '["Pay with QR code","Call customer support","Change SIM card","Open a savings book"]', 0, '{"ht":"Peye ak kòd QR = Thanh toán bằng mã QR."}','https://cdn.natcash.ht/audio/aprann_li_05.mp3')
) AS q(ord, question_text, options, correct_idx, explanation, audio_url)
WHERE c.course_code = 'APRANN_LI'
  AND NOT EXISTS (SELECT 1 FROM learning_questions lq WHERE lq.course_id = c.id AND lq.display_order = q.ord);

-- Seed câu hỏi cho MONEY_SMART
INSERT INTO learning_questions (tenant_id, course_id, question_text, options, correct_option_index, explanation, audio_url, difficulty, display_order)
SELECT
    c.tenant_id,
    c.id,
    q.question_text::jsonb,
    q.options::jsonb,
    q.correct_idx,
    q.explanation::jsonb,
    q.audio_url,
    'MEDIUM',
    q.ord
FROM learning_courses c
CROSS JOIN (
    VALUES
    (1, '{"en":"If someone calls claiming to be Natcash support and asks for your OTP, what should you do?","fr":"Si quelqu''un demande votre code OTP par téléphone, que faire ?","ht":"Si yon moun rele w pou mande kòd OTP Natcash ou, kisa ou dwe fè?","vi":"Nếu có người gọi tự xưng hỗ trợ Natcash hỏi mã OTP, bạn nên làm gì?"}', '["Share OTP immediately","Hang up and NEVER share OTP or PIN","Post OTP on Facebook","Send money to verify"]', 1, '{"ht":"Natcash pap janm mande kòd OTP oswa PIN ou nan telefòn."}','https://cdn.natcash.ht/audio/money_smart_01.mp3'),
    (2, '{"en":"What is the safest way to pay at a merchant counter with Loyalty Coins?","fr":"Quel est le moyen le plus sûr de payer avec des Loyalty Coins ?","ht":"Ki fason ki pi an sekirite pou peye ak Pwen Natcash nan kesye?","vi":"Cách an toàn nhất để tiêu điểm tại quầy là gì?"}', '["Use the 60-second dynamic QR token","Give your phone password to cashier","Write PIN on paper","Share static screenshot forever"]', 0, '{"ht":"Dynamic QR expires in 60 seconds and works once."}','https://cdn.natcash.ht/audio/money_smart_02.mp3'),
    (3, '{"en":"Why are points deducted using FIFO?","fr":"Pourquoi les points sont-ils déduits selon la méthode FIFO ?","ht":"Poukisa pwen yo dedwi dapre metòd FIFO?","vi":"Vì sao điểm được trừ theo nguyên tắc FIFO?"}', '["Oldest expiring coins are used first so you lose fewer points","Newest coins expire first","Points are deleted randomly","Only VIPs keep points"]', 0, '{"ht":"FIFO uses your earliest-expiring coins first."}','https://cdn.natcash.ht/audio/money_smart_03.mp3'),
    (4, '{"en":"How can you avoid losing your Silver/Gold/Platinum tier at cycle end?","fr":"Comment conserver votre niveau à la fin du cycle ?","ht":"Kijan ou ka kenbe nivo ou nan fen sik 12 mwa a?","vi":"Làm thế nào để giữ hạng vào cuối chu kỳ 12 tháng?"}', '["Maintain Tier Points above the Keep-Tier threshold","Never log in","Close your wallet","Spend all cash"]', 0, '{"ht":"Keep-tier thresholds are 800 (Gold), 4,000 (Platinum), 12,000 (Diamond)."}','https://cdn.natcash.ht/audio/money_smart_04.mp3'),
    (5, '{"en":"Which habit builds strong personal financial health?","fr":"Quelle habitude renforce la santé financière ?","ht":"Ki abitid ki ede w jere lajan ou pi byen?","vi":"Thói quen nào giúp tài chính cá nhân vững mạnh?"}', '["Tracking monthly spending and saving 10-20% regularly","Spending more than income","Ignoring payment receipts","Using weak PIN 1234"]', 0, '{"ht":"Budgeting and regular saving protect against emergencies."}','https://cdn.natcash.ht/audio/money_smart_05.mp3')
) AS q(ord, question_text, options, correct_idx, explanation, audio_url)
WHERE c.course_code = 'MONEY_SMART'
  AND NOT EXISTS (SELECT 1 FROM learning_questions lq WHERE lq.course_id = c.id AND lq.display_order = q.ord);

-- Seed bảng xếp hạng tháng 2026-11
INSERT INTO game_monthly_leaderboards (tenant_id, leaderboard_month, external_user_id, display_name, total_score, games_played, rank_position)
VALUES
('TENANT_NATCASH', '2026-11', '50937123456', 'Jean-Baptiste Pierre', 1850, 14, 1),
('TENANT_NATCASH', '2026-11', '84988888888', 'Marie-Louise Joseph', 1420, 11, 2),
('TENANT_NATCASH', '2026-11', '50938112233', 'Widler Jean', 980, 8, 3)
ON CONFLICT (tenant_id, leaderboard_month, external_user_id) DO NOTHING;
