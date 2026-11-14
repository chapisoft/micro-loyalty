package com.natcash.loyalty.config;

import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.util.MessageUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Schema-in-code cho toàn bộ tham số cấu hình hệ thống (đồng bộ 1-1 với bảng system_parameters và CMS).
 */
public enum SystemParamSpec {

    // Nhóm Ví & Sổ cái điểm
    LOYALTY_POINT_EXCHANGE_RATE_HTG(
            "LOYALTY_POINT_EXCHANGE_RATE_HTG",
            "Tỷ giá quy đổi điểm thưởng (HTG)",
            "WALLET",
            ParamType.DECIMAL,
            "1.00",
            null,
            "Tỷ giá quy đổi điểm thưởng sang tiền tệ thanh toán (1 Điểm = 1 HTG)"),
    WALLET_DEFAULT_POINT_EXPIRATION_MONTHS(
            "WALLET_DEFAULT_POINT_EXPIRATION_MONTHS",
            "Thời hạn hiệu lực điểm thưởng mặc định (tháng)",
            "WALLET",
            ParamType.INTEGER,
            "12",
            null,
            "Số tháng hết hạn FIFO mặc định cho các giao dịch tích điểm mới"),
    WALLET_MAX_EARN_POINTS_PER_TX(
            "WALLET_MAX_EARN_POINTS_PER_TX",
            "Hạn mức tích điểm tối đa mỗi giao dịch",
            "WALLET",
            ParamType.DECIMAL,
            "100000",
            null,
            "Số điểm tích lũy tối đa cho phép trong một giao dịch đơn lẻ"),
    WALLET_MAX_EARN_POINTS_PER_DAY(
            "WALLET_MAX_EARN_POINTS_PER_DAY",
            "Hạn mức tích điểm tối đa mỗi ngày",
            "WALLET",
            ParamType.DECIMAL,
            "500000",
            null,
            "Tổng số điểm tích lũy tối đa của một tài khoản trong ngày"),
    POINT_EXPIRATION_BATCH_CHUNK_SIZE(
            "POINT_EXPIRATION_BATCH_CHUNK_SIZE",
            "Kích thước lô quét điểm hết hạn FIFO",
            "WALLET",
            ParamType.INTEGER,
            "500",
            null,
            "Kích thước trang quét tài khoản trong tiến trình hết hạn điểm FIFO"),
    PAYMENT_HOLD_DEFAULT_TTL_MINUTES(
            "PAYMENT_HOLD_DEFAULT_TTL_MINUTES",
            "Thời gian giữ điểm Pre-Auth Hold mặc định (phút)",
            "WALLET",
            ParamType.INTEGER,
            "10",
            null,
            "Thời gian giữ điểm tạm thời Pre-Auth Hold mặc định (phút)"),

    // Nhóm Chính sách & Voucher
    PERCENT_DIVISOR(
            "PERCENT_DIVISOR",
            "Hệ số chia tính tỷ lệ phần trăm",
            "POLICY",
            ParamType.DECIMAL,
            "100.00",
            null,
            "Hệ số chia tính tỷ lệ phần trăm chiết khấu, khấu trừ điểm và phí MDR"),
    MAX_DAILY_BURN_PERCENTAGE(
            "MAX_DAILY_BURN_PERCENTAGE",
            "Tỷ lệ khấu trừ điểm tối đa trên hóa đơn (%)",
            "POLICY",
            ParamType.DECIMAL,
            "50.00",
            null,
            "Tỷ lệ phần trăm giá trị hóa đơn tối đa được phép thanh toán bằng điểm"),
    MIN_BURN_POINTS_TRANSACTION(
            "MIN_BURN_POINTS_TRANSACTION",
            "Số điểm tối thiểu mỗi giao dịch tiêu điểm",
            "POLICY",
            ParamType.DECIMAL,
            "10",
            null,
            "Ngưỡng điểm tối thiểu để thực hiện một giao dịch khấu trừ điểm"),
    MAX_BURN_POINTS_PER_TX(
            "MAX_BURN_POINTS_PER_TX",
            "Số điểm tối đa mỗi giao dịch tiêu điểm",
            "POLICY",
            ParamType.DECIMAL,
            "5000.00",
            null,
            "Ngưỡng điểm tối đa cho phép trong một giao dịch thanh toán bằng điểm"),
    MAX_BURN_POINTS_PER_DAY(
            "MAX_BURN_POINTS_PER_DAY",
            "Số điểm tối đa tiêu dùng mỗi ngày",
            "POLICY",
            ParamType.DECIMAL,
            "10000.00",
            null,
            "Ngưỡng điểm tối đa cho phép tiêu dùng trong ngày theo chính sách mặc định"),
    VOUCHER_DEFAULT_VALIDITY_DAYS(
            "VOUCHER_DEFAULT_VALIDITY_DAYS",
            "Thời hạn sử dụng voucher sau quy đổi (ngày)",
            "POLICY",
            ParamType.INTEGER,
            "30",
            null,
            "Số ngày hiệu lực mặc định của mã voucher sau khi hội viên quy đổi"),

    // Nhóm Mã QR Động
    REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS(
            "REWARD_WALLET_DYNAMIC_QR_TTL_SECONDS",
            "Thời gian sống mã QR động Ví Phần Thưởng (giây)",
            "QR",
            ParamType.INTEGER,
            "60",
            null,
            "Thời gian hiệu lực (TTL) của mã QR động thanh toán tại POS"),
    QR_MIN_TTL_SECONDS(
            "QR_MIN_TTL_SECONDS",
            "Thời gian sống QR tối thiểu cho phép (giây)",
            "QR",
            ParamType.INTEGER,
            "30",
            null,
            "Ngưỡng thời gian sống tối thiểu hợp lệ khi cấu hình mã QR động"),
    QR_MAX_TTL_SECONDS(
            "QR_MAX_TTL_SECONDS",
            "Thời gian sống QR tối đa cho phép (giây)",
            "QR",
            ParamType.INTEGER,
            "300",
            null,
            "Ngưỡng thời gian sống tối đa hợp lệ khi cấu hình mã QR động"),

    // Nhóm An toàn thông tin, Khóa phân tán & Phiên SSO
    HMAC_DRIFT_TOLERANCE_SECONDS(
            "HMAC_DRIFT_TOLERANCE_SECONDS",
            "Dung sai lệch thời gian chữ ký HMAC (giây)",
            "SECURITY",
            ParamType.INTEGER,
            "300",
            null,
            "Khoảng dung sai thời gian tối đa của header X-Timestamp chữ ký số HMAC-SHA256"),
    REDISSON_LOCK_BURN_TIMEOUT_MS(
            "REDISSON_LOCK_BURN_TIMEOUT_MS",
            "Thời gian chờ khóa phân tán tiêu điểm (ms)",
            "SECURITY",
            ParamType.INTEGER,
            "3000",
            null,
            "Thời gian chờ tối đa (waitTimeMs) khi chiếm giữ Redisson RLock"),
    REDISSON_LOCK_LEASE_TIME_MS(
            "REDISSON_LOCK_LEASE_TIME_MS",
            "Thời gian giữ khóa phân tán tiêu chuẩn (ms)",
            "SECURITY",
            ParamType.INTEGER,
            "10000",
            null,
            "Thời gian giữ khóa tối đa (leaseTimeMs) cho giao dịch tài chính"),
    REDISSON_LOCK_SHORT_LEASE_MS(
            "REDISSON_LOCK_SHORT_LEASE_MS",
            "Thời gian giữ khóa phân tán ngắn hạn (ms)",
            "SECURITY",
            ParamType.INTEGER,
            "5000",
            null,
            "Thời gian giữ khóa tối đa cho thao tác nhanh (quy đổi voucher, claim mốc)"),
    REDISSON_LOCK_SPIN_TIMEOUT_MS(
            "REDISSON_LOCK_SPIN_TIMEOUT_MS",
            "Thời gian chờ khóa phân tán lượt quay game (ms)",
            "SECURITY",
            ParamType.INTEGER,
            "3000",
            null,
            "Thời gian chờ tối đa khi chiếm giữ Redisson RLock cho thao tác chơi game/quay thưởng"),
    REDISSON_LOCK_SPIN_LEASE_MS(
            "REDISSON_LOCK_SPIN_LEASE_MS",
            "Thời gian giữ khóa phân tán lượt quay game (ms)",
            "SECURITY",
            ParamType.INTEGER,
            "5000",
            null,
            "Thời gian giữ khóa tối đa khi xử lý lượt chơi game/quay thưởng"),
    SESSION_TICKET_TTL_SECONDS(
            "SESSION_TICKET_TTL_SECONDS",
            "Thời gian sống vé phiên SSO (giây)",
            "SECURITY",
            ParamType.INTEGER,
            "60",
            null,
            "Thời gian hiệu lực vé một lần (single-use ticket) khi mở Webview"),
    SESSION_ACCESS_TOKEN_TTL_SECONDS(
            "SESSION_ACCESS_TOKEN_TTL_SECONDS",
            "Thời gian sống Access Token SSO (giây)",
            "SECURITY",
            ParamType.INTEGER,
            "900",
            null,
            "Thời gian sống token phiên làm việc sau khi đổi vé SSO"),
    AUTH_OTP_LENGTH(
            "AUTH_OTP_LENGTH",
            "Độ dài mã xác thực OTP đăng nhập",
            "SECURITY",
            ParamType.INTEGER,
            "6",
            null,
            "Độ dài mã xác thực OTP khi đăng nhập"),
    AUTH_DEFAULT_TOKEN_TTL_SECONDS(
            "AUTH_DEFAULT_TOKEN_TTL_SECONDS",
            "Thời gian sống JWT Access Token mặc định (giây)",
            "SECURITY",
            ParamType.INTEGER,
            "86400",
            null,
            "Thời gian sống mặc định của JWT Access Token (giây)"),
    AUTH_REFRESH_TOKEN_TTL_SECONDS(
            "AUTH_REFRESH_TOKEN_TTL_SECONDS",
            "Thời gian sống JWT Refresh Token mặc định (giây)",
            "SECURITY",
            ParamType.INTEGER,
            "604800",
            null,
            "Thời gian sống mặc định của JWT Refresh Token (giây)"),

    // Nhóm Webhook & Outbox
    WEBHOOK_MAX_RETRIES(
            "WEBHOOK_MAX_RETRIES",
            "Số lần thử lại tối đa khi gửi Webhook",
            "WEBHOOK",
            ParamType.INTEGER,
            "5",
            null,
            "Số lần thử lại tối đa trước khi đưa sự kiện Webhook vào Dead Letter Queue"),
    OUTBOX_BATCH_SIZE(
            "OUTBOX_BATCH_SIZE",
            "Số lượng sự kiện Outbox xử lý mỗi lô",
            "WEBHOOK",
            ParamType.INTEGER,
            "50",
            null,
            "Kích thước lô tối đa cho mỗi chu kỳ đẩy sự kiện Outbox"),
    OUTBOX_PUBLISH_INTERVAL_MS(
            "OUTBOX_PUBLISH_INTERVAL_MS",
            "Chu kỳ quét đẩy Outbox Webhook (ms)",
            "WEBHOOK",
            ParamType.INTEGER,
            "1000",
            null,
            "Khoảng thời gian nghỉ giữa các lần quét bảng Outbox"),

    // Nhóm Gợi nhắc & Chống làm phiền
    ENGAGEMENT_QUIET_HOURS(
            "ENGAGEMENT_QUIET_HOURS",
            "Khung giờ yên lặng không gửi Push thông báo",
            "ENGAGEMENT",
            ParamType.TIME_WINDOW,
            "20:00-08:00",
            null,
            "Khung giờ cấm gửi thông báo tiếp thị tự động (định dạng HH:mm-HH:mm)"),
    ENGAGEMENT_TIMEZONE(
            "ENGAGEMENT_TIMEZONE",
            "Múi giờ đánh giá lịch gửi thông báo",
            "ENGAGEMENT",
            ParamType.STRING,
            "America/Port-au-Prince",
            null,
            "Mã định danh múi giờ chuẩn IANA để đánh giá khung giờ yên lặng"),
    ENGAGEMENT_MAX_PUSH_PER_DAY(
            "ENGAGEMENT_MAX_PUSH_PER_DAY",
            "Giới hạn số thông báo tối đa mỗi ngày",
            "ENGAGEMENT",
            ParamType.INTEGER,
            "1",
            null,
            "Số thông báo marketing tối đa gửi tới một người dùng trong ngày"),
    ENGAGEMENT_MAX_PUSH_PER_WEEK(
            "ENGAGEMENT_MAX_PUSH_PER_WEEK",
            "Giới hạn số thông báo tối đa mỗi tuần",
            "ENGAGEMENT",
            ParamType.INTEGER,
            "3",
            null,
            "Số thông báo marketing tối đa gửi tới một người dùng trong tuần"),
    ENGAGEMENT_DEDUP_WINDOW_HOURS(
            "ENGAGEMENT_DEDUP_WINDOW_HOURS",
            "Cửa sổ chống gửi trùng thông báo (giờ)",
            "ENGAGEMENT",
            ParamType.INTEGER,
            "24",
            null,
            "Thời gian giãn cách tối thiểu giữa hai lần gửi cùng một kịch bản thông báo"),

    // Nhóm Giám sát Ngân sách
    BUDGET_ALERT_THRESHOLD_PERCENT(
            "BUDGET_ALERT_THRESHOLD_PERCENT",
            "Ngưỡng phần trăm cảnh báo ngân sách tháng (%)",
            "BUDGET",
            ParamType.INTEGER,
            "80",
            null,
            "Tỷ lệ tiêu thụ ngân sách kích hoạt cảnh báo sớm mức WARNING"),
    BUDGET_HARD_STOP_PERCENT(
            "BUDGET_HARD_STOP_PERCENT",
            "Ngưỡng ngắt mạch cứng ngân sách tháng (%)",
            "BUDGET",
            ParamType.INTEGER,
            "100",
            null,
            "Tỷ lệ tiêu thụ ngân sách kích hoạt tự động ngắt chiến dịch"),

    // Nhóm Đối tác Liên minh
    PARTNER_API_KEY_GRACE_PERIOD_DAYS(
            "PARTNER_API_KEY_GRACE_PERIOD_DAYS",
            "Thời gian ân hạn khóa API cũ khi xoay vòng (ngày)",
            "PARTNER",
            ParamType.INTEGER,
            "7",
            null,
            "Số ngày khóa API cũ tiếp tục hoạt động song song sau khi xoay vòng khóa mới"),
    PARTNER_LOOKBACK_DAYS(
            "PARTNER_LOOKBACK_DAYS",
            "Số ngày truy vấn lịch sử mặc định cổng đối tác",
            "PARTNER",
            ParamType.INTEGER,
            "180",
            null,
            "Khoảng thời gian truy vấn mặc định trên Dashboard & Lịch sử giao dịch Đối tác"),
    PARTNER_TX_PAGE_SIZE(
            "PARTNER_TX_PAGE_SIZE",
            "Kích thước trang dữ liệu giao dịch đối tác",
            "PARTNER",
            ParamType.INTEGER,
            "200",
            null,
            "Số bản ghi tối đa trả về khi tổng hợp sổ giao dịch đối tác"),
    PARTNER_RECENT_TX_LIMIT(
            "PARTNER_RECENT_TX_LIMIT",
            "Số giao dịch gần nhất trên Dashboard đối tác",
            "PARTNER",
            ParamType.INTEGER,
            "20",
            null,
            "Số dòng giao dịch gần đây hiển thị ở màn hình tổng quan Đối tác"),
    PARTNER_DEFAULT_MAX_BURN_PERCENT(
            "PARTNER_DEFAULT_MAX_BURN_PERCENT",
            "Tỷ lệ khấu trừ điểm mặc định của đối tác mới (%)",
            "PARTNER",
            ParamType.DECIMAL,
            "50.00",
            null,
            "Tỷ lệ tiêu điểm mặc định áp dụng khi khởi tạo đối tác liên minh mới"),
    PARTNER_DEFAULT_API_KEY_SCOPES(
            "PARTNER_DEFAULT_API_KEY_SCOPES",
            "Phạm vi quyền mặc định của API Key đối tác",
            "PARTNER",
            ParamType.STRING,
            "READ,REDEEM,SETTLEMENT",
            null,
            "Danh sách quyền mặc định khi cấp API Key đối tác"),

    // Nhóm Đối soát & Bù trừ
    SETTLEMENT_CONFIRM_DEADLINE_DAYS(
            "SETTLEMENT_CONFIRM_DEADLINE_DAYS",
            "Hạn đối tác xác nhận bảng kê bù trừ (ngày)",
            "SETTLEMENT",
            ParamType.INTEGER,
            "3",
            null,
            "Số ngày tối đa chờ đối tác xác nhận hoặc khiếu nại lô thanh toán"),
    SETTLEMENT_DEFAULT_MDR_FEE_PERCENT(
            "SETTLEMENT_DEFAULT_MDR_FEE_PERCENT",
            "Tỷ lệ phí MDR khấu trừ bù trừ mặc định (%)",
            "SETTLEMENT",
            ParamType.DECIMAL,
            "1.50",
            null,
            "Phí dịch vụ bù trừ (MDR) mặc định khi tạo lô thanh toán đối tác"),
    CLEARING_AUTO_SETTLE_ENABLED(
            "CLEARING_AUTO_SETTLE_ENABLED",
            "Bật tự động kết chuyển kỳ bù trừ định kỳ",
            "SETTLEMENT",
            ParamType.BOOLEAN,
            "true",
            null,
            "Cho phép tác vụ nền tự động tổng hợp bảng kê bù trừ cuối kỳ"),
    CLEARING_DEBT_LIMIT_HTG(
            "CLEARING_DEBT_LIMIT_HTG",
            "Hạn mức công nợ bù trừ mặc định (HTG)",
            "SETTLEMENT",
            ParamType.DECIMAL,
            "500000.00",
            null,
            "Hạn mức tín dụng bù trừ tối đa mặc định dành cho đối tác liên minh (HTG)"),

    // Nhóm Phân hạng & Chiến dịch
    TIER_EVALUATION_CYCLE_MONTHS(
            "TIER_EVALUATION_CYCLE_MONTHS",
            "Chu kỳ đánh giá phân hạng hội viên (tháng)",
            "TIER",
            ParamType.INTEGER,
            "12",
            null,
            "Chu kỳ đánh giá lại điểm xét hạng và duy trì hạng hội viên"),
    TIER_EXPIRY_WARNING_DAYS(
            "TIER_EXPIRY_WARNING_DAYS",
            "Số ngày cảnh báo trước khi hết hạn hạng hội viên",
            "TIER",
            ParamType.INTEGER,
            "30",
            null,
            "Số ngày gửi thông báo cảnh báo trước thời điểm hết hạn hạng hiện tại"),
    CAMPAIGN_DEFAULT_CONTROL_GROUP_PERCENT(
            "CAMPAIGN_DEFAULT_CONTROL_GROUP_PERCENT",
            "Tỷ lệ nhóm đối chứng A/B mặc định (%)",
            "CAMPAIGN",
            ParamType.INTEGER,
            "5",
            null,
            "Phần trăm người dùng phân vào nhóm đối chứng mặc định trong chiến dịch A/B"),
    SEGMENT_VIP_MIN_TIER_POINTS(
            "SEGMENT_VIP_MIN_TIER_POINTS",
            "Ngưỡng điểm xét hạng tối thiểu phân khúc VIP",
            "CAMPAIGN",
            ParamType.DECIMAL,
            "5000",
            null,
            "Điểm xét hạng tối thiểu để tự động phân loại hội viên vào phân khúc Giá trị cao (HIGH_VALUE)"),

    // Nhóm GameHub & Học tập
    GAME_LUCKY_DRAW_FREE_DAILY_TURNS(
            "GAME_LUCKY_DRAW_FREE_DAILY_TURNS",
            "Số lượt quay miễn phí mỗi ngày GameHub",
            "GAMEHUB",
            ParamType.INTEGER,
            "2",
            null,
            "Số lượt quay thưởng Vòng quay May mắn miễn phí cấp mỗi ngày"),
    DEFAULT_WHEEL_CODE(
            "DEFAULT_WHEEL_CODE",
            "Mã Vòng quay May mắn mặc định",
            "GAMEHUB",
            ParamType.STRING,
            "DEFAULT_LUCKY_WHEEL",
            null,
            "Mã Vòng quay May mắn mặc định khi yêu cầu không truyền wheelCode"),
    GAME_SESSION_TTL_SECONDS(
            "GAME_SESSION_TTL_SECONDS",
            "Thời gian sống phiên chơi GameHub (giây)",
            "GAMEHUB",
            ParamType.INTEGER,
            "1800",
            null,
            "Thời gian sống phiên chơi GameHub (giây)"),
    GAME_DEFAULT_DAILY_BUDGET(
            "GAME_DEFAULT_DAILY_BUDGET",
            "Ngân sách trả thưởng ngày mặc định của GameHub",
            "GAMEHUB",
            ParamType.DECIMAL,
            "50000.00",
            null,
            "Ngân sách trả thưởng tối đa mỗi ngày mặc định áp dụng cho trò chơi trên GameHub"),
    GAME_CONSOLATION_POINTS(
            "GAME_CONSOLATION_POINTS",
            "Điểm an ủi mặc định khi hết ngân sách hoặc thua lượt",
            "GAMEHUB",
            ParamType.DECIMAL,
            "5",
            null,
            "Số điểm khuyến khích tối thiểu cấp cho người chơi khi ngân sách ngày chạm trần hoặc gặp ô thua"),
    GAME_DEFAULT_POINTS_PER_TURN(
            "GAME_DEFAULT_POINTS_PER_TURN",
            "Số điểm quy đổi mỗi lượt chơi mặc định",
            "GAMEHUB",
            ParamType.INTEGER,
            "50",
            null,
            "Số điểm mặc định để đổi lấy một lượt chơi bổ sung trên GameHub"),
    GAME_DEFAULT_MAX_DAILY_TURNS(
            "GAME_DEFAULT_MAX_DAILY_TURNS",
            "Số lượt chơi tối đa mỗi ngày của mỗi hội viên",
            "GAMEHUB",
            ParamType.INTEGER,
            "10",
            null,
            "Giới hạn lượt chơi tối đa mỗi ngày của một hội viên trên GameHub"),
    GAME_DEFAULT_REVENUE_SHARE_PERCENT(
            "GAME_DEFAULT_REVENUE_SHARE_PERCENT",
            "Tỷ lệ chia sẻ doanh thu mặc định cho Studio Game (%)",
            "GAMEHUB",
            ParamType.INTEGER,
            "70",
            null,
            "Tỷ lệ phần trăm chia sẻ doanh thu mặc định dành cho đối tác phát triển trò chơi"),
    GAME_DEFAULT_WHEEL_THEME_CODE(
            "GAME_DEFAULT_WHEEL_THEME_CODE",
            "Mã chủ đề giao diện Vòng quay mặc định",
            "GAMEHUB",
            ParamType.STRING,
            "THEME_DEFAULT",
            null,
            "Mã chủ đề giao diện vòng quay sử dụng mặc định khi thuê bao chưa kích hoạt chủ đề riêng"),
    WHEEL_PROBABILITY_TOTAL_WEIGHT(
            "WHEEL_PROBABILITY_TOTAL_WEIGHT",
            "Tổng trọng số xác suất chuẩn Vòng quay May mắn",
            "GAMEHUB",
            ParamType.INTEGER,
            "100",
            null,
            "Tổng trọng số mục tiêu khi cân bằng xác suất các ô giải thưởng Vòng quay May mắn"),
    GAME_PRIZE_PROBABILITY_TOTAL_WEIGHT(
            "GAME_PRIZE_PROBABILITY_TOTAL_WEIGHT",
            "Tổng trọng số xác suất chuẩn giải thưởng GameHub",
            "GAMEHUB",
            ParamType.INTEGER,
            "1000",
            null,
            "Tổng trọng số mục tiêu khi tự động cân bằng ma trận giải thưởng trò chơi GameHub"),
    LEARNING_TIER1_CORRECT(
            "LEARNING_TIER1_CORRECT",
            "Số câu đúng tối thiểu đạt mốc thưởng cấp 1",
            "GAMEHUB",
            ParamType.INTEGER,
            "5",
            null,
            "Ngưỡng câu trả lời đúng cấp 1 trong trò chơi đố vui kiến thức"),
    LEARNING_TIER2_CORRECT(
            "LEARNING_TIER2_CORRECT",
            "Số câu đúng tối thiểu đạt mốc thưởng cấp 2",
            "GAMEHUB",
            ParamType.INTEGER,
            "10",
            null,
            "Ngưỡng câu trả lời đúng cấp 2 trong trò chơi đố vui kiến thức"),
    LEARNING_TIER3_CORRECT(
            "LEARNING_TIER3_CORRECT",
            "Số câu đúng tối thiểu đạt mốc thưởng cấp 3",
            "GAMEHUB",
            ParamType.INTEGER,
            "15",
            null,
            "Ngưỡng câu trả lời đúng cấp 3 trong trò chơi đố vui kiến thức"),

    // Nhóm Đại lý & Phê duyệt
    AGENT_MONTHLY_NEW_CUSTOMER_TARGET(
            "AGENT_MONTHLY_NEW_CUSTOMER_TARGET",
            "Chỉ tiêu khách hàng mới hàng tháng của Đại lý",
            "AGENT",
            ParamType.INTEGER,
            "100",
            null,
            "Số lượng khách hàng định danh thành công tối thiểu trong tháng để nhận thưởng Đại lý"),
    AGENT_REWARD_HTG(
            "AGENT_REWARD_HTG",
            "Tiền thưởng đạt KPI Đại lý (HTG)",
            "AGENT",
            ParamType.DECIMAL,
            "2000",
            null,
            "Mức tiền thưởng cố định (HTG) cho Đại lý đạt chỉ tiêu tháng"),
    AGENT_SUPER_MIN_ACHIEVEMENT_PCT(
            "AGENT_SUPER_MIN_ACHIEVEMENT_PCT",
            "Tỷ lệ đạt KPI tối thiểu của Tổng Đại lý (%)",
            "AGENT",
            ParamType.DECIMAL,
            "50",
            null,
            "Tỷ lệ đại lý tuyến dưới hoàn thành KPI tối thiểu để Tổng Đại lý hưởng thưởng mạng lưới"),
    AGENT_SUPER_REWARD_HTG(
            "AGENT_SUPER_REWARD_HTG",
            "Tiền thưởng đạt KPI Tổng Đại lý (HTG)",
            "AGENT",
            ParamType.DECIMAL,
            "10000",
            null,
            "Mức tiền thưởng (HTG) dành cho Tổng Đại lý đạt chỉ tiêu mạng lưới"),
    APPROVAL_POINT_ADJUSTMENT_MAX_LIMIT(
            "APPROVAL_POINT_ADJUSTMENT_MAX_LIMIT",
            "Hạn mức điều chỉnh điểm tối đa cần phê duyệt",
            "APPROVAL",
            ParamType.DECIMAL,
            "100000.00",
            null,
            "Số điểm điều chỉnh tối đa cho phép trong một phiếu trình duyệt Maker-Checker"),
    APPROVAL_DEFAULT_SYSTEM_ACTOR(
            "APPROVAL_DEFAULT_SYSTEM_ACTOR",
            "Tác nhân hệ thống mặc định luồng phê duyệt",
            "APPROVAL",
            ParamType.STRING,
            "system_operator",
            null,
            "Định danh tác nhân hệ thống mặc định trong luồng Maker-Checker"),

    // Nhóm Hệ thống & Cache
    ISO_LOCAL_DATE_LENGTH(
            "ISO_LOCAL_DATE_LENGTH",
            "Độ dài chuỗi ngày chuẩn ISO (yyyy-MM-dd)",
            "SYSTEM",
            ParamType.INTEGER,
            "10",
            null,
            "Độ dài chuỗi ngày chuẩn ISO (yyyy-MM-dd) khi phân tích bộ lọc thời gian"),
    SYSTEM_OPERATION_MODE(
            "SYSTEM_OPERATION_MODE",
            "Chế độ vận hành toàn hệ thống",
            "SYSTEM",
            ParamType.ENUM,
            "NORMAL",
            "NORMAL|MAINTENANCE|READ_ONLY",
            "Chế độ hoạt động hiện tại của nền tảng (NORMAL, MAINTENANCE, READ_ONLY)"),
    SYSTEM_CACHE_TTL_SECONDS(
            "SYSTEM_CACHE_TTL_SECONDS",
            "Thời gian lưu đệm cấu hình hệ thống (giây)",
            "SYSTEM",
            ParamType.INTEGER,
            "3600",
            null,
            "Thời gian sống (TTL) của tham số cấu hình trong bộ nhớ đệm L1 và Redis"),
    FEATURE_FLAGS_JSON(
            "FEATURE_FLAGS_JSON",
            "Cấu hình bật/tắt tính năng nâng cao (JSON)",
            "SYSTEM",
            ParamType.JSON,
            "{\"enablePartnerPortal\":true,\"enableGameHub\":true,\"enableAutoClearing\":true}",
            null,
            "Bộ cờ điều khiển tính năng mở rộng lưu dạng JSON");

    private static final Map<String, SystemParamSpec> BY_CODE = new LinkedHashMap<>();

    static {
        for (SystemParamSpec spec : values()) {
            BY_CODE.put(spec.code.toUpperCase(), spec);
        }
    }

    private final String code;
    private final String paramName;
    private final String groupCode;
    private final ParamType type;
    private final String defaultValue;
    private final String allowedValues;
    private final String description;

    SystemParamSpec(
            String code,
            String paramName,
            String groupCode,
            ParamType type,
            String defaultValue,
            String allowedValues,
            String description) {
        this.code = code;
        this.paramName = paramName;
        this.groupCode = groupCode;
        this.type = type;
        this.defaultValue = defaultValue;
        this.allowedValues = allowedValues;
        this.description = description;
    }

    public String code() {
        return code;
    }

    public String paramName() {
        return paramName;
    }

    public String groupCode() {
        return groupCode;
    }

    public ParamType type() {
        return type;
    }

    public String defaultValue() {
        return defaultValue;
    }

    public String allowedValues() {
        return allowedValues;
    }

    public String description() {
        return description;
    }

    public static Optional<SystemParamSpec> findByCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(BY_CODE.get(code.trim().toUpperCase()));
    }

    /**
     * Kiểm tra tính hợp lệ và chuẩn hóa giá trị tham số theo SystemParamSpec hoặc ParamType khai báo.
     */
    public static String validateAndNormalize(String code, String rawValue, String requestedType, String allowedValues) {
        Optional<SystemParamSpec> specOpt = findByCode(code);
        ParamType effectiveType = specOpt.map(SystemParamSpec::type)
                .orElseGet(() -> ParamType.fromCode(requestedType));
        String effectiveAllowed = (allowedValues != null && !allowedValues.isBlank())
                ? allowedValues
                : specOpt.map(SystemParamSpec::allowedValues).orElse(null);
        return effectiveType.validate(code, rawValue, effectiveAllowed);
    }

    public enum ParamType {
        STRING {
            @Override
            public String validate(String code, String raw, String allowed) {
                return raw == null ? "" : raw.trim();
            }
        },
        BOOLEAN {
            @Override
            public String validate(String code, String raw, String allowed) {
                String trimmed = raw == null ? "" : raw.trim().toLowerCase();
                if (!"true".equals(trimmed) && !"false".equals(trimmed)) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.params.invalid_boolean", code));
                }
                return trimmed;
            }
        },
        INTEGER {
            @Override
            public String validate(String code, String raw, String allowed) {
                String trimmed = raw == null ? "" : raw.trim();
                try {
                    long parsed = Long.parseLong(trimmed);
                    return String.valueOf(parsed);
                } catch (NumberFormatException ex) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.params.invalid_integer", code));
                }
            }
        },
        DECIMAL {
            @Override
            public String validate(String code, String raw, String allowed) {
                String trimmed = raw == null ? "" : raw.trim();
                try {
                    BigDecimal parsed = new BigDecimal(trimmed);
                    return parsed.toPlainString();
                } catch (NumberFormatException ex) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.params.invalid_decimal", code));
                }
            }
        },
        ENUM {
            @Override
            public String validate(String code, String raw, String allowed) {
                String trimmed = raw == null ? "" : raw.trim();
                if (trimmed.isEmpty()) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.params.invalid_enum", code, allowed));
                }
                if (allowed != null && !allowed.isBlank()) {
                    List<String> validOptions = Arrays.stream(allowed.split("\\|"))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .toList();
                    Optional<String> matched = validOptions.stream()
                            .filter(opt -> opt.equalsIgnoreCase(trimmed))
                            .findFirst();
                    if (matched.isEmpty()) {
                        throw new LoyaltyException(
                                ErrorCode.VALIDATION_ERROR,
                                MessageUtils.getMessage("admin.params.invalid_enum", code, allowed));
                    }
                    return matched.get();
                }
                return trimmed;
            }
        },
        TIME_WINDOW {
            private final Pattern pattern = Pattern.compile("^(\\d{2}):(\\d{2})-(\\d{2}):(\\d{2})$");

            @Override
            public String validate(String code, String raw, String allowed) {
                String trimmed = raw == null ? "" : raw.trim();
                Matcher m = pattern.matcher(trimmed);
                if (!m.matches()) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.params.invalid_time_window", code));
                }
                int startHour = Integer.parseInt(m.group(1));
                int startMin = Integer.parseInt(m.group(2));
                int endHour = Integer.parseInt(m.group(3));
                int endMin = Integer.parseInt(m.group(4));
                if (startHour > 23 || endHour > 23 || startMin > 59 || endMin > 59) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.params.invalid_time_window", code));
                }
                return String.format("%02d:%02d-%02d:%02d", startHour, startMin, endHour, endMin);
            }
        },
        JSON {
            private final ObjectMapper mapper = new ObjectMapper();

            @Override
            public String validate(String code, String raw, String allowed) {
                String trimmed = raw == null ? "" : raw.trim();
                if (trimmed.isEmpty()) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.params.invalid_json", code));
                }
                try {
                    return mapper.writeValueAsString(mapper.readTree(trimmed));
                } catch (Exception ex) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("admin.params.invalid_json", code));
                }
            }
        };

        public abstract String validate(String code, String raw, String allowed);

        public static ParamType fromCode(String rawType) {
            if (rawType == null || rawType.isBlank()) {
                return STRING;
            }
            String normalized = rawType.trim().toUpperCase();
            if ("NUMBER".equals(normalized) || "INT".equals(normalized) || "LONG".equals(normalized)) {
                return INTEGER;
            }
            if ("FLOAT".equals(normalized) || "DOUBLE".equals(normalized) || "BIGDECIMAL".equals(normalized)) {
                return DECIMAL;
            }
            if ("BOOL".equals(normalized)) {
                return BOOLEAN;
            }
            for (ParamType t : values()) {
                if (t.name().equals(normalized)) {
                    return t;
                }
            }
            return STRING;
        }
    }
}
