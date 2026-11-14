-- =====================================================================================
-- V27: Chuẩn hóa danh mục Tham số Hệ thống (hỗ trợ Cache L1/Redis & kiểu dữ liệu DIP)
--      và Hệ thống Khai báo / Tự sinh Mã Nghiệp vụ Có Cấu trúc (SYS_CODE_TYPES)
-- Dialect: PostgreSQL 15+
-- =====================================================================================

-- 1. NÂNG CẤP BẢNG SYSTEM_PARAMETERS
ALTER TABLE system_parameters
    ADD COLUMN IF NOT EXISTS param_name     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS allowed_values VARCHAR(500),
    ADD COLUMN IF NOT EXISTS updated_by     VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_system_params_tenant_group ON system_parameters(tenant_id, group_code);

-- Đồng bộ đầy đủ danh mục tham số cấu hình vận hành và nghiệp vụ cho toàn bộ thuê bao
WITH seed_tenants AS (
    SELECT code AS tenant_id FROM tenants
    UNION
    SELECT 'NATCASH' AS tenant_id
    UNION
    SELECT 'TENANT_NATCASH' AS tenant_id
    UNION
    SELECT 'TENANT_DELIMART' AS tenant_id
    UNION
    SELECT 'TENANT_MICRO_CRM' AS tenant_id
)
INSERT INTO system_parameters (
    tenant_id, param_key, param_name, param_value, value_type, group_code, allowed_values, description, status
)
SELECT
    t.tenant_id,
    v.param_key,
    v.param_name,
    v.param_value,
    v.value_type,
    v.group_code,
    v.allowed_values,
    v.description,
    'ACTIVE'
FROM seed_tenants t
CROSS JOIN (VALUES
    -- Nhóm Ví & Sổ cái điểm
    ('LOYALTY_POINT_EXCHANGE_RATE_HTG',         'Tỷ giá quy đổi điểm thưởng (HTG)',                      '1.00',      'DECIMAL',     'WALLET',     NULL, 'Tỷ giá quy đổi điểm thưởng sang tiền tệ thanh toán (1 Điểm = 1 HTG)'),
    ('WALLET_DEFAULT_POINT_EXPIRATION_MONTHS',  'Thời hạn hiệu lực điểm thưởng mặc định (tháng)',        '12',        'INTEGER',     'WALLET',     NULL, 'Số tháng hết hạn FIFO mặc định cho các giao dịch tích điểm mới'),
    ('WALLET_MAX_EARN_POINTS_PER_TX',           'Hạn mức tích điểm tối đa mỗi giao dịch',                '100000',    'DECIMAL',     'WALLET',     NULL, 'Số điểm tích lũy tối đa cho phép trong một giao dịch đơn lẻ'),
    ('WALLET_MAX_EARN_POINTS_PER_DAY',          'Hạn mức tích điểm tối đa mỗi ngày',                     '500000',    'DECIMAL',     'WALLET',     NULL, 'Tổng số điểm tích lũy tối đa của một tài khoản trong ngày'),
    ('POINT_EXPIRATION_BATCH_CHUNK_SIZE',       'Kích thước lô quét điểm hết hạn FIFO',                  '500',       'INTEGER',     'WALLET',     NULL, 'Kích thước trang quét tài khoản trong tiến trình hết hạn điểm FIFO'),
    ('PAYMENT_HOLD_DEFAULT_TTL_MINUTES',        'Thời gian giữ điểm Pre-Auth Hold mặc định (phút)',      '10',        'INTEGER',     'WALLET',     NULL, 'Thời gian giữ điểm tạm thời Pre-Auth Hold mặc định (phút)'),

    -- Nhóm Chính sách & Voucher
    ('PERCENT_DIVISOR',                         'Hệ số chia tính tỷ lệ phần trăm',                      '100.00',    'DECIMAL',     'POLICY',     NULL, 'Hệ số chia tính tỷ lệ phần trăm chiết khấu, khấu trừ điểm và phí MDR'),
    ('MAX_DAILY_BURN_PERCENTAGE',               'Tỷ lệ khấu trừ điểm tối đa trên hóa đơn (%)',          '50.00',     'DECIMAL',     'POLICY',     NULL, 'Tỷ lệ phần trăm giá trị hóa đơn tối đa được phép thanh toán bằng điểm'),
    ('MIN_BURN_POINTS_TRANSACTION',             'Số điểm tối thiểu mỗi giao dịch tiêu điểm',             '10',        'DECIMAL',     'POLICY',     NULL, 'Ngưỡng điểm tối thiểu để thực hiện một giao dịch khấu trừ điểm'),
    ('MAX_BURN_POINTS_PER_TX',                  'Số điểm tối đa mỗi giao dịch tiêu điểm',                '5000.00',   'DECIMAL',     'POLICY',     NULL, 'Ngưỡng điểm tối đa cho phép trong một giao dịch thanh toán bằng điểm'),
    ('MAX_BURN_POINTS_PER_DAY',                 'Số điểm tối đa tiêu dùng mỗi ngày',                     '10000.00',  'DECIMAL',     'POLICY',     NULL, 'Ngưỡng điểm tối đa cho phép tiêu dùng trong ngày theo chính sách mặc định'),
    ('VOUCHER_DEFAULT_VALIDITY_DAYS',           'Thời hạn sử dụng voucher sau quy đổi (ngày)',           '30',        'INTEGER',     'POLICY',     NULL, 'Số ngày hiệu lực mặc định của mã voucher sau khi hội viên quy đổi'),

    -- Nhóm Mã QR Động
    ('REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS',    'Thời gian sống mã QR động Ví Phần Thưởng (giây)',       '60',        'INTEGER',     'QR',         NULL, 'Thời gian hiệu lực (TTL) của mã QR động thanh toán tại POS'),
    ('QR_MIN_TTL_SECONDS',                      'Thời gian sống QR tối thiểu cho phép (giây)',           '30',        'INTEGER',     'QR',         NULL, 'Ngưỡng thời gian sống tối thiểu hợp lệ khi cấu hình mã QR động'),
    ('QR_MAX_TTL_SECONDS',                      'Thời gian sống QR tối đa cho phép (giây)',              '300',       'INTEGER',     'QR',         NULL, 'Ngưỡng thời gian sống tối đa hợp lệ khi cấu hình mã QR động'),

    -- Nhóm An toàn thông tin, Khóa phân tán & Phiên SSO
    ('HMAC_DRIFT_TOLERANCE_SECONDS',            'Dung sai lệch thời gian chữ ký HMAC (giây)',            '300',       'INTEGER',     'SECURITY',   NULL, 'Khoảng dung sai thời gian tối đa của header X-Timestamp chữ ký số HMAC-SHA256'),
    ('REDISSON_LOCK_BURN_TIMEOUT_MS',           'Thời gian chờ khóa phân tán tiêu điểm (ms)',            '3000',      'INTEGER',     'SECURITY',   NULL, 'Thời gian chờ tối đa (waitTimeMs) khi chiếm giữ Redisson RLock'),
    ('REDISSON_LOCK_LEASE_TIME_MS',             'Thời gian giữ khóa phân tán tiêu chuẩn (ms)',           '10000',     'INTEGER',     'SECURITY',   NULL, 'Thời gian giữ khóa tối đa (leaseTimeMs) cho giao dịch tài chính'),
    ('REDISSON_LOCK_SHORT_LEASE_MS',            'Thời gian giữ khóa phân tán ngắn hạn (ms)',             '5000',      'INTEGER',     'SECURITY',   NULL, 'Thời gian giữ khóa tối đa cho thao tác nhanh (quy đổi voucher, claim mốc)'),
    ('REDISSON_LOCK_SPIN_TIMEOUT_MS',           'Thời gian chờ khóa phân tán lượt quay game (ms)',       '3000',      'INTEGER',     'SECURITY',   NULL, 'Thời gian chờ tối đa khi chiếm giữ Redisson RLock cho thao tác chơi game/quay thưởng'),
    ('REDISSON_LOCK_SPIN_LEASE_MS',             'Thời gian giữ khóa phân tán lượt quay game (ms)',       '5000',      'INTEGER',     'SECURITY',   NULL, 'Thời gian giữ khóa tối đa khi xử lý lượt chơi game/quay thưởng'),
    ('SESSION_TICKET_TTL_SECONDS',              'Thời gian sống vé phiên SSO (giây)',                    '60',        'INTEGER',     'SECURITY',   NULL, 'Thời gian hiệu lực vé một lần (single-use ticket) khi mở Webview'),
    ('SESSION_ACCESS_TOKEN_TTL_SECONDS',        'Thời gian sống Access Token SSO (giây)',                '900',       'INTEGER',     'SECURITY',   NULL, 'Thời gian sống token phiên làm việc sau khi đổi vé SSO'),
    ('AUTH_OTP_LENGTH',                         'Độ dài mã xác thực OTP đăng nhập',                      '6',         'INTEGER',     'SECURITY',   NULL, 'Độ dài mã xác thực OTP khi đăng nhập'),
    ('AUTH_DEFAULT_TOKEN_TTL_SECONDS',          'Thời gian sống JWT Access Token mặc định (giây)',       '86400',     'INTEGER',     'SECURITY',   NULL, 'Thời gian sống mặc định của JWT Access Token (giây)'),
    ('AUTH_REFRESH_TOKEN_TTL_SECONDS',          'Thời gian sống JWT Refresh Token mặc định (giây)',      '604800',    'INTEGER',     'SECURITY',   NULL, 'Thời gian sống mặc định của JWT Refresh Token (giây)'),

    -- Nhóm Webhook & Outbox
    ('WEBHOOK_MAX_RETRIES',                     'Số lần thử lại tối đa khi gửi Webhook',                 '5',         'INTEGER',     'WEBHOOK',    NULL, 'Số lần thử lại tối đa trước khi đưa sự kiện Webhook vào Dead Letter Queue'),
    ('OUTBOX_BATCH_SIZE',                       'Số lượng sự kiện Outbox xử lý mỗi lô',                  '50',        'INTEGER',     'WEBHOOK',    NULL, 'Kích thước lô tối đa cho mỗi chu kỳ đẩy sự kiện Outbox'),
    ('OUTBOX_PUBLISH_INTERVAL_MS',              'Chu kỳ quét đẩy Outbox Webhook (ms)',                   '1000',      'INTEGER',     'WEBHOOK',    NULL, 'Khoảng thời gian nghỉ giữa các lần quét bảng Outbox'),

    -- Nhóm Gợi nhắc & Chống làm phiền (Engagement)
    ('ENGAGEMENT_QUIET_HOURS',                  'Khung giờ yên lặng không gửi Push thông báo',           '20:00-08:00','TIME_WINDOW','ENGAGEMENT', NULL, 'Khung giờ cấm gửi thông báo tiếp thị tự động (định dạng HH:mm-HH:mm)'),
    ('ENGAGEMENT_TIMEZONE',                     'Múi giờ đánh giá lịch gửi thông báo',                   'America/Port-au-Prince','STRING','ENGAGEMENT',NULL, 'Mã định danh múi giờ chuẩn IANA để đánh giá khung giờ yên lặng'),
    ('ENGAGEMENT_MAX_PUSH_PER_DAY',             'Giới hạn số thông báo tối đa mỗi ngày',                 '1',         'INTEGER',     'ENGAGEMENT', NULL, 'Số thông báo marketing tối đa gửi tới một người dùng trong ngày'),
    ('ENGAGEMENT_MAX_PUSH_PER_WEEK',            'Giới hạn số thông báo tối đa mỗi tuần',                 '3',         'INTEGER',     'ENGAGEMENT', NULL, 'Số thông báo marketing tối đa gửi tới một người dùng trong tuần'),
    ('ENGAGEMENT_DEDUP_WINDOW_HOURS',           'Cửa sổ chống gửi trùng thông báo (giờ)',                '24',        'INTEGER',     'ENGAGEMENT', NULL, 'Thời gian giãn cách tối thiểu giữa hai lần gửi cùng một kịch bản thông báo'),

    -- Nhóm Giám sát Ngân sách Chiến dịch
    ('BUDGET_ALERT_THRESHOLD_PERCENT',          'Ngưỡng phần trăm cảnh báo ngân sách tháng (%)',         '80',        'INTEGER',     'BUDGET',     NULL, 'Tỷ lệ tiêu thụ ngân sách kích hoạt cảnh báo sớm mức WARNING'),
    ('BUDGET_HARD_STOP_PERCENT',                'Ngưỡng ngắt mạch cứng ngân sách tháng (%)',             '100',       'INTEGER',     'BUDGET',     NULL, 'Tỷ lệ tiêu thụ ngân sách kích hoạt tự động ngắt chiến dịch'),

    -- Nhóm Đối tác Liên minh
    ('PARTNER_API_KEY_GRACE_PERIOD_DAYS',       'Thời gian ân hạn khóa API cũ khi xoay vòng (ngày)',      '7',         'INTEGER',     'PARTNER',    NULL, 'Số ngày khóa API cũ tiếp tục hoạt động song song sau khi xoay vòng khóa mới'),
    ('PARTNER_LOOKBACK_DAYS',                   'Số ngày truy vấn lịch sử mặc định cổng đối tác',        '180',       'INTEGER',     'PARTNER',    NULL, 'Khoảng thời gian truy vấn mặc định trên Dashboard & Lịch sử giao dịch Đối tác'),
    ('PARTNER_TX_PAGE_SIZE',                    'Kích thước trang dữ liệu giao dịch đối tác',            '200',       'INTEGER',     'PARTNER',    NULL, 'Số bản ghi tối đa trả về khi tổng hợp sổ giao dịch đối tác'),
    ('PARTNER_RECENT_TX_LIMIT',                 'Số giao dịch gần nhất trên Dashboard đối tác',          '20',        'INTEGER',     'PARTNER',    NULL, 'Số dòng giao dịch gần đây hiển thị ở màn hình tổng quan Đối tác'),
    ('PARTNER_DEFAULT_MAX_BURN_PERCENT',        'Tỷ lệ khấu trừ điểm mặc định của đối tác mới (%)',      '50.00',     'DECIMAL',     'PARTNER',    NULL, 'Tỷ lệ tiêu điểm mặc định áp dụng khi khởi tạo đối tác liên minh mới'),
    ('PARTNER_DEFAULT_API_KEY_SCOPES',          'Phạm vi quyền mặc định của API Key đối tác',            'READ,REDEEM,SETTLEMENT', 'STRING', 'PARTNER', NULL, 'Danh sách quyền mặc định khi cấp API Key đối tác'),

    -- Nhóm Đối soát & Bù trừ Tài chính
    ('SETTLEMENT_CONFIRM_DEADLINE_DAYS',        'Hạn đối tác xác nhận bảng kê bù trừ (ngày)',            '3',         'INTEGER',     'SETTLEMENT', NULL, 'Số ngày tối đa chờ đối tác xác nhận hoặc khiếu nại lô thanh toán'),
    ('SETTLEMENT_DEFAULT_MDR_FEE_PERCENT',      'Tỷ lệ phí MDR khấu trừ bù trừ mặc định (%)',            '1.50',      'DECIMAL',     'SETTLEMENT', NULL, 'Phí dịch vụ bù trừ (MDR) mặc định khi tạo lô thanh toán đối tác'),
    ('CLEARING_AUTO_SETTLE_ENABLED',            'Bật tự động kết chuyển kỳ bù trừ định kỳ',              'true',      'BOOLEAN',     'SETTLEMENT', NULL, 'Cho phép tác vụ nền tự động tổng hợp bảng kê bù trừ cuối kỳ'),
    ('CLEARING_DEBT_LIMIT_HTG',                 'Hạn mức công nợ bù trừ mặc định (HTG)',                 '500000.00', 'DECIMAL',     'SETTLEMENT', NULL, 'Hạn mức tín dụng bù trừ tối đa mặc định dành cho đối tác liên minh (HTG)'),

    -- Nhóm Phân hạng & Chiến dịch
    ('TIER_EVALUATION_CYCLE_MONTHS',            'Chu kỳ đánh giá phân hạng hội viên (tháng)',            '12',        'INTEGER',     'TIER',       NULL, 'Chu kỳ đánh giá lại điểm xét hạng và duy trì hạng hội viên'),
    ('TIER_EXPIRY_WARNING_DAYS',                'Số ngày cảnh báo trước khi hết hạn hạng hội viên',      '30',        'INTEGER',     'TIER',       NULL, 'Số ngày gửi thông báo cảnh báo trước thời điểm hết hạn hạng hiện tại'),
    ('CAMPAIGN_DEFAULT_CONTROL_GROUP_PERCENT',  'Tỷ lệ nhóm đối chứng A/B mặc định (%)',                 '5',         'INTEGER',     'CAMPAIGN',   NULL, 'Phần trăm người dùng phân vào nhóm đối chứng mặc định trong chiến dịch A/B'),
    ('SEGMENT_VIP_MIN_TIER_POINTS',             'Ngưỡng điểm xét hạng tối thiểu phân khúc VIP',          '5000',      'DECIMAL',     'CAMPAIGN',   NULL, 'Điểm xét hạng tối thiểu để tự động phân loại hội viên vào phân khúc Giá trị cao (HIGH_VALUE)'),

    -- Nhóm GameHub & Đố vui Học tập
    ('GAME_LUCKY_DRAW_FREE_DAILY_TURNS',        'Số lượt quay miễn phí mỗi ngày GameHub',                '2',         'INTEGER',     'GAMEHUB',    NULL, 'Số lượt quay thưởng Vòng quay May mắn miễn phí cấp mỗi ngày'),
    ('DEFAULT_WHEEL_CODE',                      'Mã Vòng quay May mắn mặc định',                         'DEFAULT_LUCKY_WHEEL', 'STRING', 'GAMEHUB', NULL, 'Mã Vòng quay May mắn mặc định khi yêu cầu không truyền wheelCode'),
    ('GAME_SESSION_TTL_SECONDS',                'Thời gian sống phiên chơi GameHub (giây)',              '1800',      'INTEGER',     'GAMEHUB',    NULL, 'Thời gian sống phiên chơi GameHub (giây)'),
    ('GAME_DEFAULT_DAILY_BUDGET',               'Ngân sách trả thưởng ngày mặc định của GameHub',        '50000.00',  'DECIMAL',     'GAMEHUB',    NULL, 'Ngân sách trả thưởng tối đa mỗi ngày mặc định áp dụng cho trò chơi trên GameHub'),
    ('GAME_CONSOLATION_POINTS',                 'Điểm an ủi mặc định khi hết ngân sách hoặc thua lượt',  '5',         'DECIMAL',     'GAMEHUB',    NULL, 'Số điểm khuyến khích tối thiểu cấp cho người chơi khi ngân sách ngày chạm trần hoặc gặp ô thua'),
    ('GAME_DEFAULT_POINTS_PER_TURN',            'Số điểm quy đổi mỗi lượt chơi mặc định',                '50',        'INTEGER',     'GAMEHUB',    NULL, 'Số điểm mặc định để đổi lấy một lượt chơi bổ sung trên GameHub'),
    ('GAME_DEFAULT_MAX_DAILY_TURNS',            'Số lượt chơi tối đa mỗi ngày của mỗi hội viên',         '10',        'INTEGER',     'GAMEHUB',    NULL, 'Giới hạn lượt chơi tối đa mỗi ngày của một hội viên trên GameHub'),
    ('GAME_DEFAULT_REVENUE_SHARE_PERCENT',      'Tỷ lệ chia sẻ doanh thu mặc định cho Studio Game (%)',  '70',        'INTEGER',     'GAMEHUB',    NULL, 'Tỷ lệ phần trăm chia sẻ doanh thu mặc định dành cho đối tác phát triển trò chơi'),
    ('GAME_DEFAULT_WHEEL_THEME_CODE',           'Mã chủ đề giao diện Vòng quay mặc định',                'THEME_DEFAULT', 'STRING',  'GAMEHUB',    NULL, 'Mã chủ đề giao diện vòng quay sử dụng mặc định khi thuê bao chưa kích hoạt chủ đề riêng'),
    ('WHEEL_PROBABILITY_TOTAL_WEIGHT',          'Tổng trọng số xác suất chuẩn Vòng quay May mắn',        '100',       'INTEGER',     'GAMEHUB',    NULL, 'Tổng trọng số mục tiêu khi cân bằng xác suất các ô giải thưởng Vòng quay May mắn'),
    ('GAME_PRIZE_PROBABILITY_TOTAL_WEIGHT',     'Tổng trọng số xác suất chuẩn giải thưởng GameHub',      '1000',      'INTEGER',     'GAMEHUB',    NULL, 'Tổng trọng số mục tiêu khi tự động cân bằng ma trận giải thưởng trò chơi GameHub'),
    ('LEARNING_TIER1_CORRECT',                  'Số câu đúng tối thiểu đạt mốc thưởng cấp 1',            '5',         'INTEGER',     'GAMEHUB',    NULL, 'Ngưỡng câu trả lời đúng cấp 1 trong trò chơi đố vui kiến thức'),
    ('LEARNING_TIER2_CORRECT',                  'Số câu đúng tối thiểu đạt mốc thưởng cấp 2',            '10',        'INTEGER',     'GAMEHUB',    NULL, 'Ngưỡng câu trả lời đúng cấp 2 trong trò chơi đố vui kiến thức'),
    ('LEARNING_TIER3_CORRECT',                  'Số câu đúng tối thiểu đạt mốc thưởng cấp 3',            '15',        'INTEGER',     'GAMEHUB',    NULL, 'Ngưỡng câu trả lời đúng cấp 3 trong trò chơi đố vui kiến thức'),

    -- Nhóm Đại lý & Phê duyệt Maker-Checker
    ('AGENT_MONTHLY_NEW_CUSTOMER_TARGET',       'Chỉ tiêu khách hàng mới hàng tháng của Đại lý',         '100',       'INTEGER',     'AGENT',      NULL, 'Số lượng khách hàng định danh thành công tối thiểu trong tháng để nhận thưởng Đại lý'),
    ('AGENT_REWARD_HTG',                        'Tiền thưởng đạt KPI Đại lý (HTG)',                      '2000',      'DECIMAL',     'AGENT',      NULL, 'Mức tiền thưởng cố định (HTG) cho Đại lý đạt chỉ tiêu tháng'),
    ('AGENT_SUPER_MIN_ACHIEVEMENT_PCT',         'Tỷ lệ đạt KPI tối thiểu của Tổng Đại lý (%)',           '50',        'DECIMAL',     'AGENT',      NULL, 'Tỷ lệ đại lý tuyến dưới hoàn thành KPI tối thiểu để Tổng Đại lý hưởng thưởng mạng lưới'),
    ('AGENT_SUPER_REWARD_HTG',                  'Tiền thưởng đạt KPI Tổng Đại lý (HTG)',                 '10000',     'DECIMAL',     'AGENT',      NULL, 'Mức tiền thưởng (HTG) dành cho Tổng Đại lý đạt chỉ tiêu mạng lưới'),
    ('APPROVAL_POINT_ADJUSTMENT_MAX_LIMIT',     'Hạn mức điều chỉnh điểm tối đa cần phê duyệt',          '100000.00', 'DECIMAL',     'APPROVAL',   NULL, 'Số điểm điều chỉnh tối đa cho phép trong một phiếu trình duyệt Maker-Checker'),
    ('APPROVAL_DEFAULT_SYSTEM_ACTOR',           'Tác nhân hệ thống mặc định luồng phê duyệt',            'system_operator', 'STRING', 'APPROVAL',  NULL, 'Định danh tác nhân hệ thống mặc định trong luồng Maker-Checker'),

    -- Nhóm Hệ thống & Cache
    ('ISO_LOCAL_DATE_LENGTH',                   'Độ dài chuỗi ngày chuẩn ISO (yyyy-MM-dd)',              '10',        'INTEGER',     'SYSTEM',     NULL, 'Độ dài chuỗi ngày chuẩn ISO (yyyy-MM-dd) khi phân tích bộ lọc thời gian'),
    ('SYSTEM_OPERATION_MODE',                   'Chế độ vận hành toàn hệ thống',                         'NORMAL',    'ENUM',       'SYSTEM',     'NORMAL|MAINTENANCE|READ_ONLY', 'Chế độ hoạt động hiện tại của nền tảng (NORMAL, MAINTENANCE, READ_ONLY)'),
    ('SYSTEM_CACHE_TTL_SECONDS',                'Thời gian lưu đệm cấu hình hệ thống (giây)',            '3600',      'INTEGER',     'SYSTEM',     NULL, 'Thời gian sống (TTL) của tham số cấu hình trong bộ nhớ đệm L1 và Redis'),
    ('FEATURE_FLAGS_JSON',                      'Cấu hình bật/tắt tính năng nâng cao (JSON)',            '{"enablePartnerPortal":true,"enableGameHub":true,"enableAutoClearing":true}', 'JSON', 'SYSTEM', NULL, 'Bộ cờ điều khiển tính năng mở rộng lưu dạng JSON')
) AS v(param_key, param_name, param_value, value_type, group_code, allowed_values, description)
ON CONFLICT ON CONSTRAINT uq_system_params_tenant_key DO UPDATE
SET
    param_name     = EXCLUDED.param_name,
    value_type     = EXCLUDED.value_type,
    group_code     = EXCLUDED.group_code,
    allowed_values = EXCLUDED.allowed_values,
    description    = EXCLUDED.description;

-- =====================================================================================
-- 2. HỆ THỐNG KHAI BÁO & TỰ SINH MÃ NGHIỆP VỤ CÓ CẤU TRÚC (SYS_CODE_TYPES & SEQUENCES)
--    Kiến trúc Hi-Lo Sequence Batch Allocation theo chuẩn DIP (INCREMENT BY 50)
-- =====================================================================================

CREATE SEQUENCE IF NOT EXISTS seq_code_settlement    START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_payment_batch START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_dispute       START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_hold          START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_approval      START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_voucher       START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_campaign      START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_partner       START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_game_tx       START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;
CREATE SEQUENCE IF NOT EXISTS seq_code_point_tx      START WITH 1 INCREMENT BY 50 NO CYCLE CACHE 500;

CREATE TABLE IF NOT EXISTS sys_code_types (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code_type               VARCHAR(64)  NOT NULL UNIQUE,
    description             VARCHAR(255) NOT NULL,
    format_template         VARCHAR(128) NOT NULL,
    static_prefix           VARCHAR(32)  NOT NULL,
    date_format             VARCHAR(32)  NOT NULL DEFAULT 'yyyyMMdd',
    seq_padding             INT          NOT NULL DEFAULT 6,
    seq_name                VARCHAR(64)  NOT NULL,
    seq_is_param_scoped     BOOLEAN      NOT NULL DEFAULT FALSE,
    batch_allocation_size   INT          NOT NULL DEFAULT 50,
    immutable_after_create  BOOLEAN      NOT NULL DEFAULT TRUE,
    status                  VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sys_code_types_status ON sys_code_types(status);

INSERT INTO sys_code_types (
    code_type, description, format_template, static_prefix, date_format, seq_padding, seq_name, seq_is_param_scoped, batch_allocation_size, immutable_after_create, status
) VALUES
    ('SETTLEMENT_BATCH',        'Mã lô chốt kỳ bù trừ tài chính liên minh',    '{prefix}_{period}_{date}_{seq:6}',  'SETTLE',     'yyyyMMdd', 6, 'seq_code_settlement',    FALSE, 50, TRUE, 'ACTIVE'),
    ('PAYMENT_BATCH',           'Mã bảng kê thanh toán chi trả đối tác',         '{prefix}-{period}-{seq:6}',         'BATCH',      'yyyyMM',   6, 'seq_code_payment_batch', FALSE, 50, TRUE, 'ACTIVE'),
    ('RECON_BATCH',             'Mã phiên đối soát tự động B2B',                 '{prefix}_{date}_{seq:6}',           'AUTO_RECON', 'yyyyMMdd', 6, 'seq_code_settlement',    FALSE, 50, TRUE, 'ACTIVE'),
    ('CLEARING_DISPUTE',        'Mã hồ sơ tranh chấp sai lệch đối soát B2B',     '{prefix}_{date}_{seq:6}',           'DISPUTE',    'yyyyMMdd', 6, 'seq_code_dispute',       FALSE, 50, TRUE, 'ACTIVE'),
    ('PARTNER_CLAIM',           'Mã khiếu nại lô thanh toán từ Cổng Đối Tác',    '{prefix}-{date}-{seq:6}',           'KN',         'yyyyMMdd', 6, 'seq_code_dispute',       FALSE, 50, TRUE, 'ACTIVE'),
    ('PAYMENT_HOLD',            'Mã phiên tạm giữ điểm thanh toán (Pre-Auth Hold)','{prefix}_{date}_{seq:6}',          'HOLD',       'yyyyMMdd', 6, 'seq_code_hold',          FALSE, 50, TRUE, 'ACTIVE'),
    ('APPROVAL_REQ',            'Mã phiếu trình phê duyệt Maker-Checker',        '{prefix}_{date}_{seq:6}',           'APR',        'yyyyMMdd', 6, 'seq_code_approval',      FALSE, 50, TRUE, 'ACTIVE'),
    ('VOUCHER_CODE',            'Mã chiến dịch ưu đãi / Voucher hệ thống',       '{prefix}_{date}_{seq:6}',           'VCH',        'yyyyMMdd', 6, 'seq_code_voucher',       FALSE, 50, TRUE, 'ACTIVE'),
    ('VOUCHER_REDEEM',          'Mã tham chiếu sổ cái khi quy đổi Voucher',      '{prefix}_{date}_{seq:6}',           'REDEEM_VCH', 'yyyyMMdd', 6, 'seq_code_voucher',       FALSE, 50, TRUE, 'ACTIVE'),
    ('VOUCHER_REDEMPTION_CODE', 'Mã đổi thưởng cụ thể cấp cho hội viên',         '{scope}-{date}-{seq:6}',            'VCHR',       'yyMMdd',   6, 'seq_code_voucher',       TRUE,  50, TRUE, 'ACTIVE'),
    ('CAMPAIGN',                'Mã chiến dịch khuyến mãi & cột mốc',            '{prefix}_{date}_{seq:5}',           'CAMP',       'yyyyMMdd', 5, 'seq_code_campaign',      FALSE, 50, TRUE, 'ACTIVE'),
    ('CAMPAIGN_RULE',           'Mã bộ quy tắc điều kiện chiến dịch',            '{prefix}_{date}_{seq:5}',           'RULE',       'yyyyMMdd', 5, 'seq_code_campaign',      FALSE, 50, TRUE, 'ACTIVE'),
    ('MILESTONE_CLAIM',         'Mã giao dịch nhận thưởng cột mốc chiến dịch',   '{prefix}_{scope}_{date}_{seq:6}',   'CLAIM_MS',   'yyyyMMdd', 6, 'seq_code_campaign',      TRUE,  50, TRUE, 'ACTIVE'),
    ('PARTNER',                 'Mã định danh đối tác liên minh',                '{prefix}_{date}_{seq:4}',           'PARTNER',    'yyyyMMdd', 4, 'seq_code_partner',       FALSE, 50, TRUE, 'ACTIVE'),
    ('PARTNER_BRANCH',          'Mã chi nhánh điểm bán của đối tác',             '{prefix}_{scope}_{seq:4}',          'BR',         'yyyyMMdd', 4, 'seq_code_partner',       TRUE,  50, TRUE, 'ACTIVE'),
    ('PARTNER_GROUP',           'Mã nhóm ngành hàng chấp nhận điểm đối tác',     '{prefix}_{scope}_{seq:4}',          'PG',         'yyyyMMdd', 4, 'seq_code_partner',       TRUE,  50, TRUE, 'ACTIVE'),
    ('PARTNER_PAYMENT_POINT',   'Mã điểm thu ngân NatCash tự quản',              '{prefix}_{date}_{seq:4}',           'NC_PP',      'yyyyMMdd', 4, 'seq_code_partner',       FALSE, 50, TRUE, 'ACTIVE'),
    ('GAME_TX',                 'Mã giao dịch GameHub (Thưởng / Nạp lượt)',      '{prefix}_{kind}_{date}_{seq:6}',    'GTRX',       'yyyyMMdd', 6, 'seq_code_game_tx',       TRUE,  50, TRUE, 'ACTIVE'),
    ('GAME_PLAY_TX',            'Mã phiên chơi GameHub ghi nhận lịch sử',        '{prefix}_{date}_{seq:6}',           'PLAY',       'yyyyMMdd', 6, 'seq_code_game_tx',       FALSE, 50, TRUE, 'ACTIVE'),
    ('SPIN_TX',                 'Mã giao dịch Vòng quay May mắn (Phí / Thưởng)', '{prefix}_{kind}_{date}_{seq:6}',    'SPIN',       'yyyyMMdd', 6, 'seq_code_game_tx',       TRUE,  50, TRUE, 'ACTIVE'),
    ('QUIZ_REWARD_TX',          'Mã giao dịch cộng thưởng đố vui kiến thức',     '{prefix}_{scope}_{date}_{seq:5}',   'QUIZ',       'yyyyMMdd', 5, 'seq_code_point_tx',      TRUE,  50, TRUE, 'ACTIVE'),
    ('POINT_EXPIRY_TX',         'Mã bút toán hết hạn điểm định kỳ FIFO',         '{prefix}_{date}_{seq:6}',           'EXP',        'yyyyMMdd', 6, 'seq_code_point_tx',      FALSE, 50, TRUE, 'ACTIVE'),
    ('POINT_TX',                'Mã tham chiếu giao dịch điểm & kiểm tra kết nối','{prefix}_{date}_{seq:6}',           'PTX',        'yyyyMMdd', 6, 'seq_code_point_tx',      FALSE, 50, TRUE, 'ACTIVE')
ON CONFLICT (code_type) DO NOTHING;
