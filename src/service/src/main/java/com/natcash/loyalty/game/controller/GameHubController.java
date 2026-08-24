package com.natcash.loyalty.game.controller;

import com.natcash.loyalty.game.dto.GameHubDto.GameListRequest;
import com.natcash.loyalty.game.dto.GameHubDto.GameListResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionResponse;
import com.natcash.loyalty.game.dto.GameHubDto.PartnerTurnPurchaseWebhookRequest;
import com.natcash.loyalty.game.dto.GameHubDto.PartnerTurnPurchaseWebhookResponse;
import com.natcash.loyalty.game.service.GameHubService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/gamehub/v1")
@Tag(name = "Game Hub API", description = "Cổng Game Đa Năng & Quản Lý Phiên Chơi")
public class GameHubController {

    private final GameHubService gameHubService;

    public GameHubController(GameHubService gameHubService) {
        this.gameHubService = gameHubService;
    }

    @PostMapping("/games/list")
    @Operation(summary = "Lấy danh mục trò chơi", description = "Tra cứu danh sách game đang kích hoạt theo đơn vị thuê bao")
    public ResponseEntity<GameListResponse> getGamesList(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody(required = false) GameListRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        GameListResponse response = gameHubService.getGamesList(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/session/init")
    @Operation(summary = "Khởi tạo phiên chơi game", description = "Tạo session token bảo mật và cấp lượt chơi ban đầu cho người dùng")
    public ResponseEntity<InitSessionResponse> initSession(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody InitSessionRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        InitSessionResponse response = gameHubService.initGameSession(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/billing/in-game-checkout")
    @Operation(summary = "Thanh toán mua thêm lượt chơi trong game bằng Điểm", description = "Khấu trừ điểm Loyalty để gia tăng số lượt chơi trong phiên 1 chạm")
    public ResponseEntity<InGameCheckoutResponse> inGameCheckout(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody InGameCheckoutRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        InGameCheckoutResponse response = gameHubService.inGameCheckout(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/games/submit-result")
    @Operation(summary = "Tiếp nhận & Xử lý kết quả lượt chơi", description = "Xác thực phiên, kiểm tra khóa phân tán, trừ lượt chơi, tính toán điểm thưởng theo thể loại và ghi nhận vào sổ cái bất biến")
    public ResponseEntity<com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultResponse> submitGameResult(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultResponse response = gameHubService.submitGameResult(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @org.springframework.web.bind.annotation.GetMapping("/admin/games")
    @Operation(summary = "Lấy toàn bộ danh mục game cho CMS Admin", description = "Trả về danh sách game kèm tham số chi tiết và ngân sách")
    public ResponseEntity<java.util.List<com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto>> getAllGamesAdmin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        java.util.List<com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto> list = gameHubService.getAllGamesAdmin(tenantId);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/admin/games")
    @Operation(summary = "Thêm mới hoặc Cập nhật thông tin game trên CMS", description = "Lưu thông tin trò chơi, giá lượt, hạn mức ngày và tham số chuyên sâu")
    public ResponseEntity<com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto> saveGameAdmin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto dto) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto saved = gameHubService.saveGameAdmin(tenantId, dto);
        return ResponseEntity.ok(saved);
    }

    @org.springframework.web.bind.annotation.GetMapping("/admin/config")
    @Operation(summary = "Lấy cấu hình chung cổng game", description = "Trả về tỷ lệ đổi điểm, khung giờ vàng, chế độ bảo trì")
    public ResponseEntity<com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto> getGlobalConfig(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto config = gameHubService.getGlobalConfig(tenantId);
        return ResponseEntity.ok(config);
    }

    @PostMapping("/admin/config")
    @Operation(summary = "Lưu cấu hình chung cổng game", description = "Cập nhật các tham số toàn cục của GameHub")
    public ResponseEntity<com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto> saveGlobalConfig(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto dto) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto saved = gameHubService.saveGlobalConfig(tenantId, dto);
        return ResponseEntity.ok(saved);
    }

    @org.springframework.web.bind.annotation.GetMapping("/history/my-history")
    @Operation(summary = "Tra cứu lịch sử chơi game của hội viên", description = "Lấy danh sách các lượt chơi, điểm số và phần thưởng đã nhận")
    public ResponseEntity<org.springframework.data.domain.Page<com.natcash.loyalty.game.dto.GameHubDto.GamePlayHistoryItemDto>> getMyGameHistory(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @org.springframework.web.bind.annotation.RequestParam(value = "externalUserId", required = false) String externalUserId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        org.springframework.data.domain.Page<com.natcash.loyalty.game.dto.GameHubDto.GamePlayHistoryItemDto> page = gameHubService.getGamePlayHistory(tenantId, externalUserId, pageable);
        return ResponseEntity.ok(page);
    }
}
