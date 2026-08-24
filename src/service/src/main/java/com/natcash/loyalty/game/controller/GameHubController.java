package com.natcash.loyalty.game.controller;

import com.natcash.loyalty.game.dto.GameHubDto.ActiveWheelThemeResponse;
import com.natcash.loyalty.game.dto.GameHubDto.GameAdminDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameHubGlobalConfigDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameDetailResponse;
import com.natcash.loyalty.game.dto.GameHubDto.GameListItemDto;
import com.natcash.loyalty.game.dto.GameHubDto.GameListRequest;
import com.natcash.loyalty.game.dto.GameHubDto.GameListResponse;
import com.natcash.loyalty.game.dto.GameHubDto.GamePlayHistoryItemDto;
import com.natcash.loyalty.game.dto.GameHubDto.GamePrizeDto;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionResponse;
import com.natcash.loyalty.game.dto.GameHubDto.PlayGameRequest;
import com.natcash.loyalty.game.dto.GameHubDto.PlayGameResponse;
import com.natcash.loyalty.game.dto.GameHubDto.SelectWheelThemeRequest;
import com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultRequest;
import com.natcash.loyalty.game.dto.GameHubDto.SubmitGameResultResponse;
import com.natcash.loyalty.game.service.GameHubService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/gamehub/v1")
@Tag(name = "Game Hub API", description = "Cổng Game Đa Năng & Quản Lý Phiên Chơi")
public class GameHubController {

    private final GameHubService gameHubService;

    public GameHubController(GameHubService gameHubService) {
        this.gameHubService = gameHubService;
    }

    @GetMapping("/games/detail")
    @Operation(summary = "Lấy chi tiết cấu hình và ma trận giải thưởng trò chơi", description = "Nạp động toàn bộ danh sách giải thưởng, tỷ lệ và thông số game từ DB")
    public ResponseEntity<GameDetailResponse> getGameDetail(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam("gameCode") String gameCode,
            @RequestParam(value = "userId", required = false) String userId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        GameDetailResponse response = gameHubService.getGameDetail(tenantId, gameCode, userId);
        return ResponseEntity.ok(response);
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

    @PostMapping("/games/play")
    @Operation(summary = "Thực hiện lượt chơi game may rủi bảo mật", description = "Sinh kết quả ngẫu nhiên có trọng số an toàn tuyệt đối tại Backend cho Vé Cào, Penalty, Rương Báu, Tháp May Mắn, Plinko, Đập Trứng, Xúc Xắc")
    public ResponseEntity<PlayGameResponse> playGame(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody PlayGameRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        PlayGameResponse response = gameHubService.playGame(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/games/submit-result")
    @Operation(summary = "Tiếp nhận & Xử lý kết quả lượt chơi", description = "Xác thực phiên, kiểm tra khóa phân tán, trừ lượt chơi, tính toán điểm thưởng theo thể loại và ghi nhận vào sổ cái bất biến")
    public ResponseEntity<SubmitGameResultResponse> submitGameResult(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody SubmitGameResultRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        SubmitGameResultResponse response = gameHubService.submitGameResult(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/themes")
    @Operation(summary = "Lấy danh sách giao diện chủ đề vòng quay", description = "Lấy chủ đề đang kích hoạt và các chủ đề khả dụng (Natcash Gold, Kanaval Haiti, Caribbean...)")
    public ResponseEntity<ActiveWheelThemeResponse> getWheelThemes(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ActiveWheelThemeResponse response = gameHubService.getWheelThemes(tenantId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/themes/select")
    @Operation(summary = "Chọn giao diện chủ đề vòng quay", description = "Kích hoạt chủ đề vòng quay mới cho đơn vị thuê bao")
    public ResponseEntity<ActiveWheelThemeResponse> selectWheelTheme(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody SelectWheelThemeRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        ActiveWheelThemeResponse response = gameHubService.selectWheelTheme(tenantId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/games")
    @Operation(summary = "Lấy toàn bộ danh mục game cho CMS Admin", description = "Trả về danh sách game kèm tham số chi tiết và ngân sách")
    public ResponseEntity<List<GameAdminDto>> getAllGamesAdmin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<GameAdminDto> list = gameHubService.getAllGamesAdmin(tenantId);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/admin/games")
    @Operation(summary = "Thêm mới hoặc Cập nhật thông tin game trên CMS", description = "Lưu thông tin trò chơi, giá lượt, hạn mức ngày và tham số chuyên sâu")
    public ResponseEntity<GameAdminDto> saveGameAdmin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody GameAdminDto dto) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        GameAdminDto saved = gameHubService.saveGameAdmin(tenantId, dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/admin/config")
    @Operation(summary = "Lấy cấu hình chung cổng game", description = "Trả về tỷ lệ đổi điểm, khung giờ vàng, chế độ bảo trì")
    public ResponseEntity<GameHubGlobalConfigDto> getGlobalConfig(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        GameHubGlobalConfigDto config = gameHubService.getGlobalConfig(tenantId);
        return ResponseEntity.ok(config);
    }

    @PostMapping("/admin/config")
    @Operation(summary = "Lưu cấu hình chung cổng game", description = "Cập nhật các tham số toàn cục của GameHub")
    public ResponseEntity<GameHubGlobalConfigDto> saveGlobalConfig(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody GameHubGlobalConfigDto dto) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        GameHubGlobalConfigDto saved = gameHubService.saveGlobalConfig(tenantId, dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/history/my-history")
    @Operation(summary = "Tra cứu lịch sử chơi game của hội viên", description = "Lấy danh sách các lượt chơi, điểm số và phần thưởng đã nhận")
    public ResponseEntity<Page<GamePlayHistoryItemDto>> getMyGameHistory(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "externalUserId", required = false) String externalUserId,
            @PageableDefault(size = 20) Pageable pageable) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        Page<GamePlayHistoryItemDto> page = gameHubService.getGamePlayHistory(tenantId, externalUserId, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/admin/games/{gameCode}/prizes")
    @Operation(summary = "Lấy ma trận giải thưởng game cho CMS Admin", description = "Trả về danh sách tất cả các hạng giải và xác suất cấu hình")
    public ResponseEntity<List<GamePrizeDto>> getGamePrizesAdmin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("gameCode") String gameCode) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<GamePrizeDto> list = gameHubService.getGamePrizesAdmin(tenantId, gameCode);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/admin/games/{gameCode}/prizes")
    @Operation(summary = "Lưu hoặc Cập nhật giải thưởng game trên CMS", description = "Thêm mới hoặc sửa đổi giá trị thưởng, trọng số xác suất, màu sắc và biểu tượng")
    public ResponseEntity<GamePrizeDto> saveGamePrizeAdmin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("gameCode") String gameCode,
            @RequestBody GamePrizeDto dto) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        GamePrizeDto saved = gameHubService.saveGamePrizeAdmin(tenantId, gameCode, dto);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/admin/prizes/{prizeId}")
    @Operation(summary = "Xóa giải thưởng game trên CMS", description = "Loại bỏ hạng giải thưởng khỏi ma trận")
    public ResponseEntity<Void> deleteGamePrizeAdmin(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("prizeId") Long prizeId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        gameHubService.deleteGamePrizeAdmin(tenantId, prizeId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/games/{gameCode}/prizes/auto-balance")
    @Operation(summary = "Tự động cân bằng xác suất giải thưởng", description = "Chuẩn hóa tổng trọng số xác suất về 1000")
    public ResponseEntity<List<GamePrizeDto>> autoBalanceGamePrizes(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("gameCode") String gameCode) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<GamePrizeDto> list = gameHubService.autoBalanceGamePrizes(tenantId, gameCode);
        return ResponseEntity.ok(list);
    }
}
