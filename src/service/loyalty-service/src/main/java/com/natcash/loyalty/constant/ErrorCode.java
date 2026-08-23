package com.natcash.loyalty.constant;

import lombok.Getter;

@Getter
public enum ErrorCode {

    SUCCESS("00", "Giao dịch thành công"),
    TENANT_INVALID("01", "Mã thuê bao không hợp lệ hoặc bị khóa"),
    API_KEY_INVALID("02", "API Key không hợp lệ"),
    SIGNATURE_INVALID("03", "Chữ ký số không hợp lệ hoặc đã bị thay đổi"),
    TIMESTAMP_DRIFT_EXCEEDED("04", "Thời gian yêu cầu vượt quá dung sai cho phép (+-300s)"),
    ACCOUNT_NOT_FOUND("05", "Hồ sơ hội viên không tồn tại"),
    INSUFFICIENT_POINTS("06", "Số dư điểm không đủ để thực hiện giao dịch"),
    VOUCHER_NOT_FOUND("07", "Phiếu ưu đãi không tồn tại hoặc đã hết hạn"),
    VOUCHER_OUT_OF_STOCK("08", "Phiếu ưu đãi đã hết số lượng khả dụng"),
    TRANSACTION_DUPLICATE("09", "Mã giao dịch đã tồn tại (Trùng lặp Idempotency)"),
    CONCURRENT_LOCK_BUSY("10", "Hệ thống đang xử lý một giao dịch khác cho tài khoản này, vui lòng thử lại"),
    PARTNER_UNAUTHORIZED("11", "Đối tác không có quyền thực hiện nghiệp vụ này"),
    POLICY_VIOLATION("12", "Vi phạm chính sách chấp nhận tiêu điểm tại điểm bán"),
    GAME_OUT_OF_TURNS("13", "Người dùng đã hết lượt chơi hôm nay"),
    SYSTEM_ERROR("99", "Lỗi xử lý nội bộ hệ thống");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
}
