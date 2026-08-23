package com.natcash.loyalty.game.controller;

import com.natcash.loyalty.game.dto.GameHubDto.GameListRequest;
import com.natcash.loyalty.game.dto.GameHubDto.GameListResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InGameCheckoutResponse;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionRequest;
import com.natcash.loyalty.game.dto.GameHubDto.InitSessionResponse;
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
    @Operation(summary = "Thanh toán mua thêm lượt chơi trong game", description = "Khấu trừ điểm hoặc tiền ví để gia tăng số lượt chơi trong phiên")
    public ResponseEntity<InGameCheckoutResponse> inGameCheckout(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @Valid @RequestBody InGameCheckoutRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        InGameCheckoutResponse response = gameHubService.inGameCheckout(tenantId, request);
        return ResponseEntity.ok(response);
    }
}
