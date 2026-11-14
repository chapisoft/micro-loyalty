package com.natcash.loyalty.codegeneration.domain;

import lombok.Getter;

import java.util.Optional;

/**
 * Danh mục định danh các loại mã nghiệp vụ có cấu trúc sinh tự động từ CSDL (sys_code_types).
 */
@Getter
public enum CodeType {

    SETTLEMENT_BATCH(
            "SETTLE",
            "{prefix}_{period}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_settlement",
            "Mã lô chốt kỳ bù trừ tài chính liên minh"),
    PAYMENT_BATCH(
            "BATCH",
            "{prefix}-{period}-{seq:6}",
            "yyyyMM",
            6,
            "seq_code_payment_batch",
            "Mã bảng kê thanh toán chi trả đối tác"),
    RECON_BATCH(
            "AUTO_RECON",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_settlement",
            "Mã phiên đối soát tự động B2B"),
    CLEARING_DISPUTE(
            "DISPUTE",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_dispute",
            "Mã hồ sơ tranh chấp sai lệch đối soát B2B"),
    PARTNER_CLAIM(
            "KN",
            "{prefix}-{date}-{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_dispute",
            "Mã khiếu nại lô thanh toán từ Cổng Đối Tác"),
    PAYMENT_HOLD(
            "HOLD",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_hold",
            "Mã phiên tạm giữ điểm thanh toán (Pre-Auth Hold)"),
    APPROVAL_REQ(
            "APR",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_approval",
            "Mã phiếu trình phê duyệt Maker-Checker"),
    VOUCHER_CODE(
            "VCH",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_voucher",
            "Mã chiến dịch ưu đãi / Voucher hệ thống"),
    VOUCHER_REDEEM(
            "REDEEM_VCH",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_voucher",
            "Mã tham chiếu sổ cái khi quy đổi Voucher"),
    VOUCHER_REDEMPTION_CODE(
            "VCHR",
            "{scope}-{date}-{seq:6}",
            "yyMMdd",
            6,
            "seq_code_voucher",
            "Mã đổi thưởng cụ thể cấp cho hội viên"),
    CAMPAIGN(
            "CAMP",
            "{prefix}_{date}_{seq:5}",
            "yyyyMMdd",
            5,
            "seq_code_campaign",
            "Mã chiến dịch khuyến mãi & cột mốc"),
    CAMPAIGN_RULE(
            "RULE",
            "{prefix}_{date}_{seq:5}",
            "yyyyMMdd",
            5,
            "seq_code_campaign",
            "Mã bộ quy tắc điều kiện chiến dịch"),
    MILESTONE_CLAIM(
            "CLAIM_MS",
            "{prefix}_{scope}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_campaign",
            "Mã giao dịch nhận thưởng cột mốc chiến dịch"),
    PARTNER(
            "PARTNER",
            "{prefix}_{date}_{seq:4}",
            "yyyyMMdd",
            4,
            "seq_code_partner",
            "Mã định danh đối tác liên minh"),
    PARTNER_BRANCH(
            "BR",
            "{prefix}_{scope}_{seq:4}",
            "yyyyMMdd",
            4,
            "seq_code_partner",
            "Mã chi nhánh điểm bán của đối tác"),
    PARTNER_GROUP(
            "PG",
            "{prefix}_{scope}_{seq:4}",
            "yyyyMMdd",
            4,
            "seq_code_partner",
            "Mã nhóm ngành hàng chấp nhận điểm đối tác"),
    PARTNER_PAYMENT_POINT(
            "NC_PP",
            "{prefix}_{date}_{seq:4}",
            "yyyyMMdd",
            4,
            "seq_code_partner",
            "Mã điểm thu ngân NatCash tự quản"),
    GAME_TX(
            "GTRX",
            "{prefix}_{kind}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_game_tx",
            "Mã giao dịch GameHub (Thưởng / Nạp lượt)"),
    GAME_PLAY_TX(
            "PLAY",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_game_tx",
            "Mã phiên chơi GameHub ghi nhận lịch sử"),
    SPIN_TX(
            "SPIN",
            "{prefix}_{kind}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_game_tx",
            "Mã giao dịch Vòng quay May mắn (Phí / Thưởng)"),
    QUIZ_REWARD_TX(
            "QUIZ",
            "{prefix}_{scope}_{date}_{seq:5}",
            "yyyyMMdd",
            5,
            "seq_code_point_tx",
            "Mã giao dịch cộng thưởng đố vui kiến thức"),
    POINT_EXPIRY_TX(
            "EXP",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_point_tx",
            "Mã bút toán hết hạn điểm định kỳ FIFO"),
    POINT_TX(
            "PTX",
            "{prefix}_{date}_{seq:6}",
            "yyyyMMdd",
            6,
            "seq_code_point_tx",
            "Mã tham chiếu giao dịch điểm & kiểm tra kết nối");

    private final String defaultPrefix;
    private final String defaultTemplate;
    private final String defaultDateFormat;
    private final int defaultPadding;
    private final String defaultSeqName;
    private final String defaultDescription;

    CodeType(
            String defaultPrefix,
            String defaultTemplate,
            String defaultDateFormat,
            int defaultPadding,
            String defaultSeqName,
            String defaultDescription) {
        this.defaultPrefix = defaultPrefix;
        this.defaultTemplate = defaultTemplate;
        this.defaultDateFormat = defaultDateFormat;
        this.defaultPadding = defaultPadding;
        this.defaultSeqName = defaultSeqName;
        this.defaultDescription = defaultDescription;
    }

    public static Optional<CodeType> fromCode(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        String normalized = code.trim().toUpperCase();
        for (CodeType ct : values()) {
            if (ct.name().equals(normalized)) {
                return Optional.of(ct);
            }
        }
        return Optional.empty();
    }
}
