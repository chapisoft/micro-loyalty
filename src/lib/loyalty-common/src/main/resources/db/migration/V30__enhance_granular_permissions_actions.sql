-- =====================================================================================
-- V30: Chuẩn hóa bảng Phân quyền chi tiết theo Chức năng (Module) & Hành động (Action)
-- Loại bỏ các quyền gộp chung cấp module (ALL), thiết lập Ma trận phân quyền doanh nghiệp
-- =====================================================================================

-- 1. BẢO ĐẢM CẤU TRÚC BẢNG SYSTEM_PERMISSIONS HỖ TRỢ ĐẦY ĐỦ THUỘC TÍNH
ALTER TABLE system_permissions
    ADD COLUMN IF NOT EXISTS action VARCHAR(50) NOT NULL DEFAULT 'VIEW',
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- 2. XÓA BẢN GHI PERMISSIONS CŨ GỘP CHUNG (NẾU CÓ) ĐỂ TÁI CẤU TRÚC CHUẨN MỰC
DELETE FROM system_role_permissions;
DELETE FROM system_permissions;

-- 3. KHỞI TẠO DANH MỤC 60+ QUYỀN HẠN CHI TIẾT THEO CHỨC NĂNG & HÀNH ĐỘNG
INSERT INTO system_permissions (code, name, description, module, action, display_order, is_active)
VALUES
    -- 1. QUẢN TRỊ NGƯỜI DÙNG (USER)
    ('user.view',       'Xem danh sách & Hồ sơ người dùng',       'Tra cứu danh sách tài khoản quản trị CMS',                    'USER', 'VIEW',    1, TRUE),
    ('user.create',     'Thêm mới người dùng quản trị',           'Tạo tài khoản quản trị mới trên hệ thống',                    'USER', 'CREATE',  2, TRUE),
    ('user.edit',       'Chỉnh sửa thông tin người dùng',         'Cập nhật họ tên, email, số điện thoại tài khoản',             'USER', 'EDIT',    3, TRUE),
    ('user.delete',     'Xóa tài khoản người dùng',               'Xóa bỏ vĩnh viễn tài khoản quản trị',                         'USER', 'DELETE',  4, TRUE),
    ('user.lock',       'Khóa / Mở khóa tài khoản',               'Đình chỉ hoặc kích hoạt lại quyền đăng nhập',                 'USER', 'LOCK',    5, TRUE),
    ('user.roles',      'Gán vai trò cho người dùng',             'Phân quyền và gán vai trò vận hành cho tài khoản',            'USER', 'ASSIGN',  6, TRUE),
    ('user.reset_pwd',  'Đặt lại mật khẩu người dùng',            'Cấp lại mật khẩu mới cho tài khoản quản trị',                 'USER', 'EDIT',    7, TRUE),
    ('user.export',     'Xuất danh sách người dùng ra Excel',     'Trích xuất tệp Excel danh sách tài khoản',                    'USER', 'EXPORT',  8, TRUE),

    -- 2. VAI TRÒ & PHÂN QUYỀN (ROLE)
    ('role.view',       'Xem danh mục vai trò',                   'Tra cứu danh sách vai trò và phân quyền hiện có',             'ROLE', 'VIEW',    1, TRUE),
    ('role.create',     'Tạo mới vai trò quản trị',               'Thiết lập vai trò mới và cấu hình quyền hạn',                 'ROLE', 'CREATE',  2, TRUE),
    ('role.edit',       'Chỉnh sửa vai trò & Ma trận quyền',      'Cập nhật tên, mô tả và ma trận quyền của vai trò',            'ROLE', 'EDIT',    3, TRUE),
    ('role.delete',     'Xóa vai trò quản trị',                   'Loại bỏ vai trò không còn sử dụng',                           'ROLE', 'DELETE',  4, TRUE),
    ('role.export',     'Xuất danh mục vai trò ra Excel',         'Trích xuất danh sách vai trò hệ thống',                       'ROLE', 'EXPORT',  5, TRUE),

    -- 3. DANH MỤC DÙNG CHUNG (CATEGORY)
    ('category.view',   'Xem danh mục loại & giá trị',            'Tra cứu các nhóm danh mục và bảng giá trị master data',       'CATEGORY', 'VIEW',   1, TRUE),
    ('category.create', 'Thêm mới nhóm hoặc giá trị danh mục',    'Bổ sung nhóm danh mục mới hoặc mục dữ liệu mới',              'CATEGORY', 'CREATE', 2, TRUE),
    ('category.edit',   'Chỉnh sửa danh mục dữ liệu',             'Cập nhật tên, thứ tự hiển thị và trạng thái danh mục',        'CATEGORY', 'EDIT',   3, TRUE),
    ('category.delete', 'Xóa nhóm hoặc giá trị danh mục',         'Loại bỏ danh mục không còn áp dụng',                          'CATEGORY', 'DELETE', 4, TRUE),
    ('category.export', 'Xuất danh mục dữ liệu ra Excel',         'Trích xuất tệp Excel danh mục master data',                   'CATEGORY', 'EXPORT', 5, TRUE),

    -- 4. QUẢN LÝ HỘI VIÊN (CUSTOMER)
    ('customer.view',   'Xem danh sách & Hồ sơ 360 hội viên',     'Tra cứu điểm số, cấp hạng, lịch sử và thông tin hội viên',    'CUSTOMER', 'VIEW',   1, TRUE),
    ('customer.edit',   'Chỉnh sửa thông tin hội viên',           'Cập nhật hồ sơ và thông tin liên hệ hội viên',                'CUSTOMER', 'EDIT',   2, TRUE),
    ('customer.lock',   'Khóa / Mở khóa tài khoản hội viên',      'Tạm phong tỏa hoặc mở lại ví tích điểm hội viên',             'CUSTOMER', 'LOCK',   3, TRUE),
    ('customer.export', 'Xuất danh sách hội viên ra Excel',       'Trích xuất danh sách khách hàng thân thiết',                  'CUSTOMER', 'EXPORT', 4, TRUE),

    -- 5. HẠNG HỘI VIÊN (TIER)
    ('tier.view',       'Xem cấu hình các hạng hội viên',         'Tra cứu tiêu chí thăng hạng và chính sách đãi ngộ từng hạng',  'TIER', 'VIEW',   1, TRUE),
    ('tier.create',     'Thêm mới hạng hội viên',                 'Thiết lập hạng thành viên mới trong chương trình',             'TIER', 'CREATE', 2, TRUE),
    ('tier.edit',       'Cập nhật tiêu chí & Quyền lợi hạng',     'Điều chỉnh điểm tối thiểu, hệ số nhân và lượt chơi game',     'TIER', 'EDIT',   3, TRUE),
    ('tier.delete',     'Xóa cấu hình hạng hội viên',             'Loại bỏ hạng thành viên',                                     'TIER', 'DELETE', 4, TRUE),

    -- 6. CHÍNH SÁCH ĐIỂM (POLICY)
    ('policy.view',     'Xem chính sách tích & Tiêu điểm',        'Tra cứu tỷ lệ tích điểm và hạn mức tiêu điểm',                'POLICY', 'VIEW',   1, TRUE),
    ('policy.create',   'Tạo mới quy tắc chính sách điểm',        'Thiết lập công thức tích điểm theo ngành hàng/giao dịch',     'POLICY', 'CREATE', 2, TRUE),
    ('policy.edit',     'Cập nhật chính sách điểm thưởng',        'Chỉnh sửa tỷ lệ hoàn điểm và điều kiện áp dụng',              'POLICY', 'EDIT',   3, TRUE),
    ('policy.delete',   'Xóa quy tắc chính sách điểm',            'Loại bỏ quy tắc chính sách điểm không còn hiệu lực',          'POLICY', 'DELETE', 4, TRUE),

    -- 7. ĐỐI TÁC LIÊN MINH (PARTNER)
    ('partner.view',    'Xem danh sách đối tác & Chi nhánh POS',  'Tra cứu hồ sơ doanh nghiệp liên minh và điểm chấp nhận POS',  'PARTNER', 'VIEW',   1, TRUE),
    ('partner.create',  'Thêm mới đối tác liên minh',             'Đăng ký đối tác thương mại mới tham gia hệ sinh thái',        'PARTNER', 'CREATE', 2, TRUE),
    ('partner.edit',    'Cập nhật thông tin đối tác & Chi nhánh', 'Chỉnh sửa pháp nhân, lĩnh vực và địa điểm quầy thu ngân',     'PARTNER', 'EDIT',   3, TRUE),
    ('partner.delete',  'Ngừng hợp tác / Xóa đối tác',            'Chấm dứt liên thông hoặc xóa hồ sơ đối tác',                  'PARTNER', 'DELETE', 4, TRUE),
    ('partner.apikey',  'Cấp mới & Thu hồi API Key đối tác',      'Quản lý khóa tích hợp kỹ thuật và bảo mật chữ ký HMAC',       'PARTNER', 'EDIT',   5, TRUE),
    ('partner.export',  'Xuất danh sách đối tác ra Excel',        'Trích xuất danh sách đối tác và chi nhánh',                   'PARTNER', 'EXPORT', 6, TRUE),

    -- 8. KHO VOUCHER (VOUCHER)
    ('voucher.view',    'Xem danh sách đợt phát hành & Kho mã',   'Tra cứu các gói voucher và tình trạng sử dụng từng mã',       'VOUCHER', 'VIEW',   1, TRUE),
    ('voucher.create',  'Tạo mới đợt phát hành Voucher',          'Thiết lập chương trình ưu đãi và sinh kho mã điện tử',        'VOUCHER', 'CREATE', 2, TRUE),
    ('voucher.edit',    'Cập nhật thông tin đợt Voucher',         'Chỉnh sửa thời hạn hiệu lực và hạn mức áp dụng',              'VOUCHER', 'EDIT',   3, TRUE),
    ('voucher.delete',  'Hủy bỏ / Thu hồi đợt Voucher',           'Khóa và hủy bỏ các mã ưu đãi chưa sử dụng',                   'VOUCHER', 'DELETE', 4, TRUE),
    ('voucher.export',  'Xuất danh sách mã Voucher ra Excel',     'Trích xuất tệp danh sách mã ưu đãi và trạng thái',            'VOUCHER', 'EXPORT', 5, TRUE),

    -- 9. CHIẾN DỊCH & CỘT MỐC (CAMPAIGN)
    ('campaign.view',   'Xem danh sách chiến dịch & Cột mốc',     'Tra cứu tiến độ và cấu hình các chiến dịch Marketing',        'CAMPAIGN', 'VIEW',    1, TRUE),
    ('campaign.create', 'Thiết lập chiến dịch ưu đãi mới',        'Khởi tạo chiến dịch tích điểm và cột mốc nhiệm vụ',           'CAMPAIGN', 'CREATE',  2, TRUE),
    ('campaign.edit',   'Chỉnh sửa chiến dịch & Ngân sách',       'Cập nhật thể lệ, thời gian và chỉ tiêu chiến dịch',           'CAMPAIGN', 'EDIT',    3, TRUE),
    ('campaign.delete', 'Hủy bỏ chiến dịch ưu đãi',               'Dừng trước hạn hoặc xóa chiến dịch',                          'CAMPAIGN', 'DELETE',  4, TRUE),
    ('campaign.approve','Phê duyệt ngân sách chiến dịch',         'Xét duyệt kinh phí đồng tài trợ cho chiến dịch',              'CAMPAIGN', 'APPROVE', 5, TRUE),

    -- 10. GAMEHUB & VÒNG QUAY (GAME)
    ('game.view',       'Xem danh mục trò chơi & Cơ cấu giải',    'Tra cứu minigame, vòng quay may mắn và kho quà tặng',         'GAME', 'VIEW',   1, TRUE),
    ('game.create',     'Tạo trò chơi hoặc giải thưởng mới',      'Thêm minigame mới và thiết lập cơ cấu trúng thưởng',          'GAME', 'CREATE', 2, TRUE),
    ('game.edit',       'Cập nhật tỷ lệ trúng & Ngân sách game',  'Điều chỉnh xác suất trúng thưởng và hạn mức quà ngày',        'GAME', 'EDIT',   3, TRUE),
    ('game.delete',     'Tạm dừng / Xóa minigame',                'Gỡ bỏ trò chơi khỏi cổng GameHub',                            'GAME', 'DELETE', 4, TRUE),

    -- 11. SỔ CÁI & GIAO DỊCH (TRANSACTION)
    ('transaction.view',   'Xem lịch sử giao dịch & Sổ cái FIFO', 'Tra cứu chi tiết từng bút toán tích / tiêu / hoàn điểm',      'TRANSACTION', 'VIEW',    1, TRUE),
    ('transaction.adjust', 'Tạo yêu cầu điều chỉnh điểm thủ công', 'Lập phiếu đề xuất cộng/trừ điểm tra soát khách hàng',        'TRANSACTION', 'CREATE',  2, TRUE),
    ('transaction.export', 'Xuất báo cáo giao dịch ra Excel',     'Trích xuất dữ liệu biến động số dư phục vụ kiểm toán',        'TRANSACTION', 'EXPORT',  3, TRUE),

    -- 12. QUYẾT TOÁN & BÙ TRỪ (CLEARING)
    ('clearing.view',    'Xem kỳ đối soát & Biên bản bù trừ',     'Tra cứu bảng tính nghĩa vụ công nợ liên minh các kỳ',         'CLEARING', 'VIEW',    1, TRUE),
    ('clearing.execute', 'Thực thi đối soát dữ liệu ba chiều',    'Khởi chạy quy trình đối soát giao dịch tự động',              'CLEARING', 'EXECUTE', 2, TRUE),
    ('clearing.approve', 'Phê duyệt quyết toán lô chi trả',       'Chấp thuận lệnh thanh toán tiền mặt cho đối tác',             'CLEARING', 'APPROVE', 3, TRUE),
    ('clearing.dispute', 'Xử lý khiếu nại sai lệch đối soát',     'Ghi nhận biên bản giải quyết chênh lệch số liệu',             'CLEARING', 'EDIT',    4, TRUE),
    ('clearing.export',  'Xuất biên bản đối soát ra Excel',       'Trích xuất bảng tổng hợp quyết toán bù trừ tài chính',        'CLEARING', 'EXPORT',  5, TRUE),

    -- 13. HÀNG ĐỢI PHÊ DUYỆT (APPROVAL)
    ('approval.view',    'Xem hàng đợi yêu cầu chờ duyệt',        'Danh sách phiếu Maker-Checker đang chờ cấp thẩm quyền',       'APPROVAL', 'VIEW',    1, TRUE),
    ('approval.approve', 'Phê duyệt yêu cầu nghiệp vụ',           'Chấp thuận đề xuất chiến dịch, voucher hoặc hoàn điểm',       'APPROVAL', 'APPROVE', 2, TRUE),
    ('approval.reject',  'Từ chối yêu cầu nghiệp vụ',             'Bác bỏ đề xuất kèm lý do từ chối',                            'APPROVAL', 'REJECT',  3, TRUE),

    -- 14. BÁO CÁO & PHÂN TÍCH (REPORT)
    ('report.view',      'Xem dashboard & Báo cáo tổng hợp',      'Theo dõi các chỉ số KPI, tỷ lệ kích hoạt và doanh thu',       'REPORT', 'VIEW',   1, TRUE),
    ('report.export',    'Xuất báo cáo quản trị ra Excel',        'Trích xuất các bảng biểu thống kê phục vụ ban điều hành',     'REPORT', 'EXPORT', 2, TRUE),

    -- 15. THAM SỐ HỆ THỐNG (SYSTEM_PARAM)
    ('system_param.view','Xem tham số vận hành nền tảng',         'Tra cứu các tham số bảo mật, hạn mức và cấu hình',            'SYSTEM_PARAM', 'VIEW', 1, TRUE),
    ('system_param.edit','Chỉnh sửa giá trị tham số hệ thống',    'Cập nhật tham số động có xác thực quyền hạn tối cao',         'SYSTEM_PARAM', 'EDIT', 2, TRUE),

    -- 16. NHẬT KÝ KIỂM TOÁN (AUDIT_LOG)
    ('audit_log.view',   'Xem nhật ký kiểm toán hệ thống',        'Tra cứu dấu vết thao tác của người dùng trên toàn hệ thống',   'AUDIT_LOG', 'VIEW',   1, TRUE),
    ('audit_log.export', 'Xuất nhật ký kiểm toán ra Excel',       'Trích xuất tệp nhật ký bảo mật phục vụ thanh tra',            'AUDIT_LOG', 'EXPORT', 2, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 4. TÁI GÁN MA TRẬN PHÂN QUYỀN CHO TẤT CẢ VAI TRÒ
-- SUPER_ADMIN & LOYALTY_ADMIN: Nhận 100% tất cả các quyền trên mọi module
INSERT INTO system_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM system_roles r
CROSS JOIN system_permissions p
WHERE r.code IN ('SUPER_ADMIN', 'LOYALTY_ADMIN')
ON CONFLICT DO NOTHING;

-- OPERATOR: Toàn quyền vận hành Voucher, Game, Campaign, Member, Category, Tier, Policy
INSERT INTO system_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM system_roles r
JOIN system_permissions p ON p.module IN ('CUSTOMER', 'TIER', 'POLICY', 'VOUCHER', 'GAME', 'CAMPAIGN', 'CATEGORY', 'REPORT')
WHERE r.code = 'OPERATOR'
ON CONFLICT DO NOTHING;

-- CAMPAIGN_MANAGER: Quyền trên Chiến dịch, Hội viên, Voucher, Game và Báo cáo
INSERT INTO system_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM system_roles r
JOIN system_permissions p ON p.module IN ('CAMPAIGN', 'CUSTOMER', 'VOUCHER', 'GAME', 'REPORT')
WHERE r.code = 'CAMPAIGN_MANAGER'
ON CONFLICT DO NOTHING;

-- FINANCE_AUDITOR: Quyền kiểm toán Sổ cái, Giao dịch, Quyết toán Bù trừ, Đối tác và Báo cáo
INSERT INTO system_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM system_roles r
JOIN system_permissions p ON p.module IN ('CLEARING', 'TRANSACTION', 'PARTNER', 'APPROVAL', 'REPORT', 'AUDIT_LOG')
WHERE r.code = 'FINANCE_AUDITOR'
ON CONFLICT DO NOTHING;

-- PARTNER_MANAGER: Quyền quản lý Đối tác, Chi nhánh, Chính sách, Voucher và Quyết toán
INSERT INTO system_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM system_roles r
JOIN system_permissions p ON p.module IN ('PARTNER', 'POLICY', 'VOUCHER', 'CLEARING', 'REPORT')
WHERE r.code = 'PARTNER_MANAGER'
ON CONFLICT DO NOTHING;

-- PARTNER_ADMIN: Quyền vận hành Cổng Đối Tác (Chi nhánh, nhân viên, voucher, đối soát của đối tác)
INSERT INTO system_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM system_roles r
JOIN system_permissions p ON p.module IN ('PARTNER', 'VOUCHER', 'CLEARING', 'REPORT')
    AND p.action IN ('VIEW', 'CREATE', 'EDIT', 'EXPORT')
WHERE r.code = 'PARTNER_ADMIN'
ON CONFLICT DO NOTHING;

-- CUSTOMER_SUPPORT: Quyền tra cứu Hội viên, Giao dịch, Voucher, Kiểm toán và lập đề xuất điều chỉnh
INSERT INTO system_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM system_roles r
JOIN system_permissions p ON (
    p.module IN ('CUSTOMER', 'TRANSACTION', 'VOUCHER', 'REPORT') AND p.action IN ('VIEW', 'EXPORT')
    OR p.code = 'transaction.adjust'
)
WHERE r.code = 'CUSTOMER_SUPPORT'
ON CONFLICT DO NOTHING;

-- 5. BẢO ĐẢM TÀI KHOẢN QUẢN TRỊ ĐỒNG BỘ ĐẦY ĐỦ CẢ 2 THUÊ BAO 'NATCASH' VÀ 'TENANT_NATCASH'
DO $$
DECLARE
    v_pwd_hash VARCHAR(255) := '{sha256}ad89b64d66caa8e30e5d5ce4a9763f4ecc205814c412175f3e2c50027471426d';
BEGIN
    -- Chèn tài khoản quản trị cho tenant NATCASH (nếu chưa có)
    INSERT INTO system_users (tenant_id, username, password_hash, full_name, email, phone, status)
    VALUES
        ('NATCASH', 'admin',           v_pwd_hash, 'Quản Trị Viên Hệ Thống',      'admin@mid.io.vn',    '+84988888888', 'ACTIVE'),
        ('NATCASH', 'loyalty_admin',   v_pwd_hash, 'Nguyễn Văn Vận Hành',          'operator@mid.io.vn', '+84977777777', 'ACTIVE'),
        ('NATCASH', 'campaign_mgr',    v_pwd_hash, 'Lê Minh Chiến Dịch',           'campaign@mid.io.vn', '+84966666661', 'ACTIVE'),
        ('NATCASH', 'finance_auditor', v_pwd_hash, 'Trần Thị Đối Soát',            'finance@mid.io.vn',  '+84966666666', 'ACTIVE'),
        ('NATCASH', 'support_user',    v_pwd_hash, 'Phạm Hỗ Trợ Hội Viên',         'support@mid.io.vn',  '+84955555555', 'ACTIVE')
    ON CONFLICT (username) DO UPDATE
    SET tenant_id = EXCLUDED.tenant_id,
        status = 'ACTIVE',
        updated_at = CURRENT_TIMESTAMP;

    -- Đảm bảo vai trò cho các tài khoản trên tenant NATCASH
    INSERT INTO system_user_roles (user_id, role_id)
    SELECT u.id, r.id
    FROM system_users u
    JOIN system_roles r ON (
        (u.username = 'admin'           AND r.code = 'SUPER_ADMIN')
        OR (u.username = 'loyalty_admin'   AND r.code IN ('LOYALTY_ADMIN', 'OPERATOR'))
        OR (u.username = 'campaign_mgr'    AND r.code = 'CAMPAIGN_MANAGER')
        OR (u.username = 'finance_auditor' AND r.code = 'FINANCE_AUDITOR')
        OR (u.username = 'support_user'    AND r.code = 'CUSTOMER_SUPPORT')
    )
    WHERE u.username IN ('admin', 'loyalty_admin', 'campaign_mgr', 'finance_auditor', 'support_user')
    ON CONFLICT DO NOTHING;
END $$;
