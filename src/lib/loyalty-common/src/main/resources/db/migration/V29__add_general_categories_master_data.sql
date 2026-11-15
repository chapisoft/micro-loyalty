-- =====================================================================================
-- V29: Khởi tạo bảng danh mục dùng chung (Master Data) CFG_GENERAL_CATEGORIES chuẩn DIP
-- Loại bỏ hardcode Enum/Constant cố định cho các loại dữ liệu lưu trữ CSDL (Loại, Trạng thái...)
-- Hỗ trợ phân cấp 2 tầng: Nhóm danh mục (CATEGORY_GROUP) và Danh mục Giá trị theo nhóm
-- =====================================================================================

CREATE TABLE IF NOT EXISTS cfg_general_categories (
    tenant_id      VARCHAR(64)  NOT NULL DEFAULT 'NATCASH',
    category_type  VARCHAR(64)  NOT NULL,
    code           VARCHAR(64)  NOT NULL,
    name           VARCHAR(255) NOT NULL,
    parent_code    VARCHAR(64),
    display_order  INTEGER      NOT NULL DEFAULT 0,
    status         INTEGER      NOT NULL DEFAULT 1, -- 1: Hoạt động, 0: Vô hiệu hóa
    description    TEXT,
    metadata       JSONB,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_cfg_general_categories PRIMARY KEY (tenant_id, category_type, code)
);

CREATE INDEX IF NOT EXISTS idx_cfg_categories_tenant_type ON cfg_general_categories(tenant_id, category_type, display_order, name);
CREATE INDEX IF NOT EXISTS idx_cfg_categories_parent ON cfg_general_categories(tenant_id, parent_code);

-- =====================================================================================
-- SEED DỮ LIỆU DANH MỤC CHO TOÀN BỘ CÁC THUÊ BAO (IDEMPOTENT)
-- =====================================================================================

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
-- 1. SEED TẦNG 1: DANH MỤC NHÓM LOẠI (CATEGORY_GROUP)
INSERT INTO cfg_general_categories (tenant_id, category_type, code, name, display_order, status, description)
SELECT
    t.tenant_id,
    'CATEGORY_GROUP',
    g.code,
    g.name,
    g.display_order,
    1,
    g.description
FROM seed_tenants t
CROSS JOIN (VALUES
    ('PARTNER_TYPE',              'Loại đối tác liên minh',           1, 'Phân loại các đối tác thương mại tham gia hệ sinh thái Loyalty'),
    ('MEMBER_STATUS',             'Trạng thái hội viên',              2, 'Trạng thái tài khoản khách hàng trong hệ thống tích điểm'),
    ('TRANSACTION_TYPE',          'Loại giao dịch điểm',              3, 'Các hình thức biến động số dư sổ cái điểm thưởng'),
    ('TRANSACTION_STATUS',        'Trạng thái giao dịch',             4, 'Trạng thái xử lý của giao dịch tích / tiêu / hoàn điểm'),
    ('VOUCHER_STATUS',            'Trạng thái Voucher',               5, 'Vòng đời và trạng thái sử dụng của mã ưu đãi'),
    ('DISCOUNT_TYPE',             'Loại chiết khấu Voucher',          6, 'Hình thức giảm giá hoặc ưu đãi của Voucher'),
    ('GAME_TYPE',                 'Loại trò chơi GameHub',            7, 'Danh mục các loại minigame tương tác thu hút người dùng'),
    ('PRIZE_TYPE',                'Loại giải thưởng',                 8, 'Hình thức phần thưởng nhận được từ minigame và chiến dịch'),
    ('CAMPAIGN_MISSION_CATEGORY', 'Phân loại nhiệm vụ chiến dịch',    9, 'Phân nhóm các hành động và nhiệm vụ hội viên cần hoàn thành'),
    ('APPROVAL_STATUS',           'Trạng thái phê duyệt',            10, 'Trạng thái quy trình xét duyệt nghiệp vụ'),
    ('APPROVAL_TARGET_TYPE',      'Loại đối tượng phê duyệt',        11, 'Các đối tượng yêu cầu phê duyệt 2 bước Maker-Checker'),
    ('CLEARING_STATUS',           'Trạng thái kỳ bù trừ',            12, 'Trạng thái chu kỳ đối soát và quyết toán tài chính liên minh'),
    ('DISPUTE_STATUS',            'Trạng thái khiếu nại',            13, 'Tiến trình xử lý sai lệch số liệu và khiếu nại giao dịch'),
    ('PAYMENT_BATCH_STATUS',      'Trạng thái lô chi trả',           14, 'Trạng thái thực thi lệnh thanh toán tiền mặt đối tác'),
    ('ALERT_SEVERITY',            'Mức độ cảnh báo hệ thống',        15, 'Mức độ nghiêm trọng của sự cố và rủi ro vận hành'),
    ('ALERT_STATUS',              'Trạng thái cảnh báo',             16, 'Tiến trình tiếp nhận và khắc phục cảnh báo'),
    ('SYSTEM_USER_STATUS',        'Trạng thái tài khoản quản trị',   17, 'Tình trạng hoạt động của người dùng hệ thống'),
    ('INTEGRATION_TYPE',          'Loại giao thức tích hợp',         18, 'Phương thức kết nối kỹ thuật giữa các dịch vụ'),
    ('VALUE_TYPE',                'Định dạng kiểu dữ liệu',          19, 'Kiểu dữ liệu của các tham số cấu hình hệ thống'),
    ('CUSTOMER_SEGMENT_TYPE',     'Phân khúc khách hàng',            20, 'Phân tầng nhóm khách hàng theo hành vi và giá trị giao dịch'),
    ('REMINDER_TRIGGER_TYPE',     'Loại kích hoạt gợi nhắc',         21, 'Sự kiện kích hoạt tin nhắn và thông báo thông minh'),
    ('AGENT_ROLE_TYPE',           'Phân cấp đại lý',                 22, 'Phân cấp mô hình mạng lưới đại lý và điểm giao dịch')
) AS g(code, name, display_order, description)
ON CONFLICT ON CONSTRAINT pk_cfg_general_categories DO UPDATE
SET name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 2. SEED TẦNG 2: DANH MỤC GIÁ TRỊ THEO TỪNG NHÓM
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
INSERT INTO cfg_general_categories (tenant_id, category_type, code, name, display_order, status, description)
SELECT
    t.tenant_id,
    c.category_type,
    c.code,
    c.name,
    c.display_order,
    1,
    c.description
FROM seed_tenants t
CROSS JOIN (VALUES
    -- PARTNER_TYPE
    ('PARTNER_TYPE', 'RETAIL',          'Bán lẻ & Cửa hàng tiện lợi', 1, 'Cửa hàng tạp hóa, bán lẻ hàng tiêu dùng'),
    ('PARTNER_TYPE', 'GROCERY',         'Siêu thị & Thực phẩm',        2, 'Chuỗi siêu thị thực phẩm, nông sản sạch'),
    ('PARTNER_TYPE', 'FNB',             'Ẩm thực & Nhà hàng',          3, 'Nhà hàng, quán cafe, dịch vụ ăn uống'),
    ('PARTNER_TYPE', 'BANK',            'Ngân hàng & Tài chính',       4, 'Tổ chức tín dụng, cổng thanh toán, ví điện tử'),
    ('PARTNER_TYPE', 'TELCO',           'Viễn thông & Số',             5, 'Nhà mạng viễn thông, dịch vụ số di động'),
    ('PARTNER_TYPE', 'ENTERTAINMENT',   'Giải trí & Điện ảnh',         6, 'Rạp chiếu phim, khu vui chơi, sự kiện'),
    ('PARTNER_TYPE', 'HEALTHCARE',      'Y tế & Dược phẩm',            7, 'Nhà thuốc, phòng khám, bệnh viện'),
    ('PARTNER_TYPE', 'TRANSPORTATION',  'Vận tải & Giao thông',        8, 'Hãng xe công nghệ, taxi, vé xe buýt, máy bay'),
    ('PARTNER_TYPE', 'OTHER',           'Ngành nghề khác',             99, 'Các đối tác thương mại dịch vụ khác'),

    -- MEMBER_STATUS
    ('MEMBER_STATUS', 'ACTIVE',         'Đang hoạt động',              1, 'Tài khoản hội viên bình thường, có thể tích và tiêu điểm'),
    ('MEMBER_STATUS', 'LOCKED',         'Tạm khóa',                    2, 'Tài khoản bị khóa do nghi vấn gian lận hoặc yêu cầu của người dùng'),
    ('MEMBER_STATUS', 'PENDING',        'Chờ kích hoạt',               3, 'Tài khoản mới tạo, chưa xác thực OTP hoặc eKYC'),
    ('MEMBER_STATUS', 'INACTIVE',       'Ngừng hoạt động',             4, 'Tài khoản đã đóng hoặc ngừng tham gia chương trình'),

    -- TRANSACTION_TYPE
    ('TRANSACTION_TYPE', 'EARN',        'Tích điểm',                   1, 'Cộng điểm khi thanh toán giao dịch hoặc hoàn thành nhiệm vụ'),
    ('TRANSACTION_TYPE', 'BURN',        'Tiêu điểm',                   2, 'Trừ điểm để đổi voucher hoặc thanh toán trừ tiền trực tiếp'),
    ('TRANSACTION_TYPE', 'REFUND',      'Hoàn điểm',                   3, 'Cộng lại điểm do hủy đơn hàng hoặc giao dịch thanh toán thất bại'),
    ('TRANSACTION_TYPE', 'EXPIRE',      'Hết hạn điểm',                4, 'Trừ điểm hết hạn sử dụng theo chu kỳ FIFO'),
    ('TRANSACTION_TYPE', 'ADJUST',      'Điều chỉnh điểm',             5, 'Điều chỉnh điểm thủ công bởi kiểm toán viên sau phê duyệt'),
    ('TRANSACTION_TYPE', 'HOLD',        'Tạm giữ điểm',                6, 'Tạm phong tỏa điểm trong lúc xác nhận giao dịch thanh toán quầy'),
    ('TRANSACTION_TYPE', 'RELEASE',     'Giải tỏa điểm tạm giữ',       7, 'Hoàn trả lại điểm tạm giữ khi giao dịch quầy bị hủy bỏ'),

    -- TRANSACTION_STATUS
    ('TRANSACTION_STATUS', 'SUCCESS',   'Thành công',                  1, 'Giao dịch hạch toán thành công và ghi sổ cái điểm'),
    ('TRANSACTION_STATUS', 'PENDING',   'Đang xử lý',                  2, 'Giao dịch đang chờ xác nhận từ hệ thống lõi hoặc ví điện tử'),
    ('TRANSACTION_STATUS', 'FAILED',    'Thất bại',                    3, 'Giao dịch bị từ chối do lỗi số dư, hạn mức hoặc hệ thống'),
    ('TRANSACTION_STATUS', 'CANCELLED', 'Đã hủy',                      4, 'Giao dịch bị hủy bởi người dùng hoặc hệ thống trước khi quyết toán'),
    ('TRANSACTION_STATUS', 'TIMEOUT',   'Hết thời gian',               5, 'Giao dịch hết thời gian chờ phản hồi từ đối tác bên ngoài'),

    -- VOUCHER_STATUS
    ('VOUCHER_STATUS', 'ACTIVE',        'Khả dụng',                    1, 'Voucher còn hạn và sẵn sàng được áp dụng'),
    ('VOUCHER_STATUS', 'USED',          'Đã sử dụng',                  2, 'Voucher đã được thanh toán hoặc đổi quà thành công'),
    ('VOUCHER_STATUS', 'EXPIRED',       'Đã hết hạn',                  3, 'Voucher quá thời hạn hiệu lực phát hành'),
    ('VOUCHER_STATUS', 'LOCKED',        'Đang tạm khóa',               4, 'Voucher tạm thời bị khóa trong phiên thanh toán'),
    ('VOUCHER_STATUS', 'CANCELLED',     'Đã hủy bỏ',                   5, 'Voucher bị thu hồi hoặc hủy bởi ban quản trị'),

    -- DISCOUNT_TYPE
    ('DISCOUNT_TYPE', 'PERCENTAGE',     'Giảm theo phần trăm (%)',     1, 'Giảm giá theo tỷ lệ % giá trị đơn hàng có kèm mức tối đa'),
    ('DISCOUNT_TYPE', 'FIXED_AMOUNT',   'Giảm số tiền cố định',        2, 'Giảm một số tiền xác định trên tổng hóa đơn'),
    ('DISCOUNT_TYPE', 'FREE_SHIPPING',  'Miễn phí vận chuyển',         3, 'Hỗ trợ toàn bộ hoặc một phần phí giao hàng'),
    ('DISCOUNT_TYPE', 'GIFT',           'Quà tặng hiện vật',           4, 'Tặng kèm sản phẩm hoặc quà lưu niệm'),

    -- GAME_TYPE
    ('GAME_TYPE', 'LUCKY_WHEEL',        'Vòng quay may mắn',           1, 'Vòng quay trúng thưởng với các ô quà ngẫu nhiên'),
    ('GAME_TYPE', 'MYSTERY_BOX',        'Hộp quà bí mật',              2, 'Mở hộp quà may mắn nhận ưu đãi bất ngờ'),
    ('GAME_TYPE', 'QUIZ',               'Câu đố trắc nghiệm',          3, 'Trả lời câu hỏi kiến thức ngắn để tích lũy điểm thưởng'),
    ('GAME_TYPE', 'LUCKY_DRAW',         'Bốc thăm trúng thưởng',       4, 'Quay số định kỳ tìm mã số may mắn nhận giải đặc biệt'),
    ('GAME_TYPE', 'SCREW_PUZZLE',       'Xếp hình đố vui',             5, 'Trò chơi trí tuệ xếp thanh và ốc vít vượt qua thử thách'),

    -- PRIZE_TYPE
    ('PRIZE_TYPE', 'POINTS',            'Điểm thưởng',                 1, 'Cộng trực tiếp điểm vào ví Loyalty của hội viên'),
    ('PRIZE_TYPE', 'VOUCHER',           'Mã giảm giá Voucher',         2, 'Phát hành mã ưu đãi lưu vào kho voucher của người chơi'),
    ('PRIZE_TYPE', 'CASH',              'Tiền mặt vào Ví',             3, 'Cộng tiền trực tiếp vào tài khoản ví điện tử Natcash'),
    ('PRIZE_TYPE', 'PHYSICAL',          'Hiện vật / Quà lưu niệm',     4, 'Sản phẩm vật lý nhận tại quầy giao dịch đối tác'),
    ('PRIZE_TYPE', 'EXTRA_TURN',        'Thêm lượt chơi',              5, 'Tặng thêm lượt tham gia minigame'),
    ('PRIZE_TYPE', 'MESSAGE',           'Lời chúc may mắn',            6, 'Thông điệp may mắn lần sau không kèm quà hiện vật'),

    -- CAMPAIGN_MISSION_CATEGORY
    ('CAMPAIGN_MISSION_CATEGORY', 'TRANSACTION',    'Giao dịch thanh toán', 1, 'Thực hiện thanh toán đơn hàng đạt ngưỡng giá trị'),
    ('CAMPAIGN_MISSION_CATEGORY', 'DAILY_LOGIN',    'Đăng nhập hàng ngày',  2, 'Truy cập ứng dụng điểm danh đều đặn mỗi ngày'),
    ('CAMPAIGN_MISSION_CATEGORY', 'REFERRAL',       'Giới thiệu bạn bè',    3, 'Mời người dùng mới cài đặt và kích hoạt thành công'),
    ('CAMPAIGN_MISSION_CATEGORY', 'SURVEY',         'Khảo sát ý kiến',      4, 'Hoàn thành phiếu đánh giá chất lượng dịch vụ'),
    ('CAMPAIGN_MISSION_CATEGORY', 'GAME',           'Tham gia trò chơi',    5, 'Chơi minigame đạt số điểm hoặc số lượt yêu cầu'),
    ('CAMPAIGN_MISSION_CATEGORY', 'PROFILE_UPDATE', 'Cập nhật hồ sơ',       6, 'Bổ sung thông tin cá nhân hoặc hoàn thành eKYC'),

    -- APPROVAL_STATUS
    ('APPROVAL_STATUS', 'PENDING',      'Chờ phê duyệt',               1, 'Yêu cầu đang chờ cấp có thẩm quyền xem xét'),
    ('APPROVAL_STATUS', 'APPROVED',     'Đã phê duyệt',                2, 'Yêu cầu đã được chấp thuận và thực thi tự động'),
    ('APPROVAL_STATUS', 'REJECTED',     'Từ chối phê duyệt',           3, 'Yêu cầu bị từ chối kèm lý do bác bỏ'),
    ('APPROVAL_STATUS', 'CANCELLED',    'Đã hủy yêu cầu',              4, 'Người tạo đã thu hồi hoặc hủy bỏ yêu cầu'),

    -- APPROVAL_TARGET_TYPE
    ('APPROVAL_TARGET_TYPE', 'CAMPAIGN',         'Chiến dịch ưu đãi',      1, 'Phê duyệt ngân sách và kịch bản chiến dịch mới'),
    ('APPROVAL_TARGET_TYPE', 'VOUCHER_ISSUE',    'Phát hành Voucher',      2, 'Phê duyệt phát hành đợt mã giảm giá số lượng lớn'),
    ('APPROVAL_TARGET_TYPE', 'POINT_ADJUSTMENT', 'Điều chỉnh điểm số',     3, 'Phê duyệt cộng/trừ điểm thủ công cho khách hàng'),
    ('APPROVAL_TARGET_TYPE', 'REFUND',           'Hoàn trả giao dịch',     4, 'Phê duyệt hoàn tiền hoặc điểm cho khiếu nại đối tác'),
    ('APPROVAL_TARGET_TYPE', 'SETTLEMENT',       'Lô quyết toán bù trừ',   5, 'Phê duyệt chi trả kỳ đối soát tài chính liên minh'),

    -- CLEARING_STATUS
    ('CLEARING_STATUS', 'INITIATED',    'Mới khởi tạo',                1, 'Kỳ quyết toán mới mở, đang thu thập chứng từ đối soát'),
    ('CLEARING_STATUS', 'PENDING',      'Chờ đối soát',                2, 'Hồ sơ đang được đối chiếu ba chiều giữa các bên'),
    ('CLEARING_STATUS', 'SETTLED',      'Đã quyết toán hoàn tất',      3, 'Nghĩa vụ công nợ tài chính đã được thanh toán đầy đủ'),
    ('CLEARING_STATUS', 'DISPUTED',     'Có sai lệch tranh chấp',      4, 'Phát sinh chênh lệch số liệu cần tra soát thêm'),
    ('CLEARING_STATUS', 'FAILED',       'Quyết toán thất bại',         5, 'Lệnh chuyển khoản quyết toán không thực hiện được'),
    ('CLEARING_STATUS', 'CANCELLED',    'Đã hủy kỳ',                   6, 'Kỳ quyết toán bị hủy do sai dữ liệu đầu vào'),

    -- DISPUTE_STATUS
    ('DISPUTE_STATUS', 'OPEN',          'Mới tiếp nhận',               1, 'Khiếu nại mới được gửi từ đối tác hoặc khách hàng'),
    ('DISPUTE_STATUS', 'IN_REVIEW',     'Đang tra soát',               2, 'Bộ phận đối soát đang trích xuất nhật ký kiểm toán'),
    ('DISPUTE_STATUS', 'RESOLVED',      'Đã giải quyết',               3, 'Hai bên đã thống nhất kết quả và điều chỉnh số dư'),
    ('DISPUTE_STATUS', 'REJECTED',      'Từ chối giải quyết',          4, 'Khiếu nại không đủ căn cứ chứng từ hợp lệ'),

    -- PAYMENT_BATCH_STATUS
    ('PAYMENT_BATCH_STATUS', 'INITIATED',  'Mới tạo lô',               1, 'Lô thanh toán đã tổng hợp danh sách người thụ hưởng'),
    ('PAYMENT_BATCH_STATUS', 'PROCESSING', 'Đang chuyển khoản',        2, 'Lệnh thanh toán đang được xử lý qua cổng ngân hàng/ví'),
    ('PAYMENT_BATCH_STATUS', 'COMPLETED',  'Thanh toán hoàn tất',      3, 'Toàn bộ các bản ghi trong lô đã được chi trả thành công'),
    ('PAYMENT_BATCH_STATUS', 'FAILED',     'Lỗi thanh toán',           4, 'Lô thanh toán gặp sự cố kỹ thuật hoặc từ chối kết nối'),

    -- ALERT_SEVERITY
    ('ALERT_SEVERITY', 'INFO',          'Thông tin',                   1, 'Thông báo trạng thái thông thường của hệ thống'),
    ('ALERT_SEVERITY', 'WARNING',       'Cảnh báo',                    2, 'Cảnh báo nguy cơ chạm ngưỡng ngân sách hoặc tài nguyên'),
    ('ALERT_SEVERITY', 'ERROR',         'Nghiêm trọng',                3, 'Lỗi gián đoạn một phần tính năng hoặc giao dịch thất bại nhiều'),
    ('ALERT_SEVERITY', 'CRITICAL',      'Khẩn cấp',                    4, 'Sự cố sập dịch vụ hoặc tấn công an ninh cần can thiệp ngay'),

    -- ALERT_STATUS
    ('ALERT_STATUS', 'NEW',             'Mới ghi nhận',                1, 'Cảnh báo mới phát sinh chưa có người tiếp nhận'),
    ('ALERT_STATUS', 'IN_PROGRESS',     'Đang khắc phục',              2, 'Kỹ sư trực hệ thống đang xử lý nguyên nhân gốc rễ'),
    ('ALERT_STATUS', 'RESOLVED',        'Đã xử lý xong',               3, 'Sự cố đã được khắc phục hoàn toàn'),
    ('ALERT_STATUS', 'IGNORED',         'Bỏ qua',                      4, 'Cảnh báo giả hoặc đã được xác nhận không cần can thiệp'),

    -- SYSTEM_USER_STATUS
    ('SYSTEM_USER_STATUS', 'ACTIVE',    'Đang hoạt động',              1, 'Tài khoản quản trị có quyền đăng nhập bình thường'),
    ('SYSTEM_USER_STATUS', 'LOCKED',    'Bị khóa tài khoản',           2, 'Tài khoản bị khóa do vượt quá số lần nhập sai mật khẩu'),
    ('SYSTEM_USER_STATUS', 'PENDING',   'Chờ kích hoạt',               3, 'Tài khoản chưa đổi mật khẩu lần đầu hoặc chưa xác thực email'),
    ('SYSTEM_USER_STATUS', 'INACTIVE',  'Vô hiệu hóa',                 4, 'Tài khoản đã nghỉ việc hoặc bị thu hồi quyền truy cập'),

    -- INTEGRATION_TYPE
    ('INTEGRATION_TYPE', 'REST_API',    'Giao thức RESTful API',       1, 'Kết nối đồng bộ qua giao thức HTTP/HTTPS REST API'),
    ('INTEGRATION_TYPE', 'WEBHOOK',     'Webhook đẩy sự kiện',         2, 'Đẩy thông báo bất đồng bộ qua Webhook sự kiện thời gian thực'),
    ('INTEGRATION_TYPE', 'SFTP',        'Giao thức truyền tệp SFTP',   3, 'Đồng bộ định kỳ tệp sao kê đối soát qua kênh SFTP bảo mật'),
    ('INTEGRATION_TYPE', 'KAFKA',       'Hàng đợi Kafka Event Stream', 4, 'Bắn nhận sự kiện phân tán qua cụm Kafka đa luồng'),

    -- VALUE_TYPE
    ('VALUE_TYPE', 'STRING',            'Chuỗi ký tự',                 1, 'Giá trị dạng văn bản thông thường'),
    ('VALUE_TYPE', 'NUMBER',            'Số nguyên hoặc số thực',      2, 'Giá trị dạng số dùng để tính toán hoặc so sánh'),
    ('VALUE_TYPE', 'BOOLEAN',           'Logic Đúng / Sai',            3, 'Giá trị dạng cờ bật/tắt (true/false)'),
    ('VALUE_TYPE', 'JSON',              'Cấu trúc JSON',               4, 'Dữ liệu mảng hoặc đối tượng có cấu trúc phức hợp'),

    -- CUSTOMER_SEGMENT_TYPE
    ('CUSTOMER_SEGMENT_TYPE', 'HIGH_VALUE', 'Hội viên Chi tiêu cao',   1, 'Khách hàng có tổng chi tiêu lớn và giao dịch thường xuyên'),
    ('CUSTOMER_SEGMENT_TYPE', 'NEWBIE',     'Hội viên Mới',            2, 'Khách hàng mới gia nhập hệ sinh thái dưới 30 ngày'),
    ('CUSTOMER_SEGMENT_TYPE', 'CHAMPION',   'Hội viên Trung thành',    3, 'Khách hàng gắn bó lâu năm, tương tác đa kênh tích cực'),
    ('CUSTOMER_SEGMENT_TYPE', 'AT_RISK',    'Nguy cơ rời bỏ',          4, 'Khách hàng giảm tần suất giao dịch đột ngột trong 60 ngày'),
    ('CUSTOMER_SEGMENT_TYPE', 'DORMANT',    'Hội viên Ngủ đông',       5, 'Khách hàng không phát sinh giao dịch trên 90 ngày'),

    -- REMINDER_TRIGGER_TYPE
    ('REMINDER_TRIGGER_TYPE', 'POINT_EXPIRATION',  'Điểm sắp hết hạn', 1, 'Gửi thông báo nhắc nhở hội viên tiêu điểm trước khi bị hủy'),
    ('REMINDER_TRIGGER_TYPE', 'BIRTHDAY',          'Sinh nhật hội viên', 2, 'Tặng quà và lời chúc đặc biệt trong tháng sinh nhật'),
    ('REMINDER_TRIGGER_TYPE', 'MILESTONE_PROGRESS','Cột mốc sắp đạt',  3, 'Cổ vũ hoàn thành những giao dịch cuối cùng để nâng hạng/nhận thưởng'),
    ('REMINDER_TRIGGER_TYPE', 'DAILY_GAME',        'Nhắc chơi Minigame', 4, 'Nhắc nhở nhận lượt quay miễn phí trong ngày'),

    -- AGENT_ROLE_TYPE
    ('AGENT_ROLE_TYPE', 'SUPER_AGENT',  'Đại lý Cấp 1 Tổng đại lý',    1, 'Đại lý phân phối cấp vùng quản lý nhiều đại lý trực thuộc'),
    ('AGENT_ROLE_TYPE', 'AGENT',        'Đại lý Tiêu chuẩn',           2, 'Đại lý bán hàng và tiếp thị trực tiếp tại địa phương'),
    ('AGENT_ROLE_TYPE', 'SUB_AGENT',    'Điểm giao dịch vệ tinh',      3, 'Cửa hàng liên kết hoặc cộng tác viên bán hàng')
) AS c(category_type, code, name, display_order, description)
ON CONFLICT ON CONSTRAINT pk_cfg_general_categories DO UPDATE
SET name = EXCLUDED.name,
    display_order = EXCLUDED.display_order,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;
