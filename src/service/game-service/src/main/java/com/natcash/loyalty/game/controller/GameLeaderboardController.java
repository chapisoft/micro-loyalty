package com.natcash.loyalty.game.controller;

import com.natcash.loyalty.game.entity.GameMonthlyLeaderboardEntity;
import com.natcash.loyalty.game.entity.GamePointRuleEntity;
import com.natcash.loyalty.game.entity.LeaderboardPayoutEntity;
import com.natcash.loyalty.game.entity.LeaderboardPrizeEntity;
import com.natcash.loyalty.game.service.GameLeaderboardService;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Game Points & Leaderboard Admin API", description = "Điểm thi đua Game points (pts), Luật trần ngày & Giải thưởng Bảng xếp hạng (GM-01, GM-10)")
public class GameLeaderboardController {

    private final GameLeaderboardService leaderboardService;

    @GetMapping("/gamehub/v1/leaderboard/board")
    @Operation(summary = "Lấy bảng xếp hạng theo tháng và loại bảng (ALL / LEARNING / MINI_GAMES)")
    public ResponseEntity<List<GameMonthlyLeaderboardEntity>> getBoard(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "month", required = false) String month,
            @RequestParam(value = "board", required = false, defaultValue = "ALL") String board) {
        return ResponseEntity.ok(leaderboardService.getLeaderboard(resolveTenantId(headerTenantId), month, board));
    }

    @GetMapping("/gamehub/v1/leaderboard/rules")
    @Operation(summary = "Lấy thể lệ tính Game points (pts) và cơ cấu giải thưởng tháng")
    public ResponseEntity<Map<String, Object>> getPublicRules(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "board", required = false, defaultValue = "ALL") String board) {
        return ResponseEntity.ok(leaderboardService.getPublicRulesAndPrizes(resolveTenantId(headerTenantId), board));
    }

    @GetMapping("/gamehub/v1/admin/leaderboard/rules")
    @Operation(summary = "Admin CMS (GM-10) - Danh sách luật cộng Game points & trần ngày")
    public ResponseEntity<List<GamePointRuleEntity>> listRules(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(leaderboardService.listRules(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/gamehub/v1/admin/leaderboard/rules")
    @Operation(summary = "Admin CMS (GM-10) - Tạo hoặc cập nhật luật cộng Game points")
    public ResponseEntity<GamePointRuleEntity> saveRule(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody GamePointRuleEntity rule) {
        return ResponseEntity.ok(leaderboardService.saveRule(resolveTenantId(headerTenantId), rule));
    }

    @GetMapping("/gamehub/v1/admin/leaderboard/prizes")
    @Operation(summary = "Admin CMS (GM-10) - Danh sách cơ cấu giải thưởng theo hạng")
    public ResponseEntity<List<LeaderboardPrizeEntity>> listPrizes(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(leaderboardService.listPrizes(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/gamehub/v1/admin/leaderboard/prizes")
    @Operation(summary = "Admin CMS (GM-10) - Tạo hoặc cập nhật giải thưởng theo hạng")
    public ResponseEntity<LeaderboardPrizeEntity> savePrize(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody LeaderboardPrizeEntity prize) {
        return ResponseEntity.ok(leaderboardService.savePrize(resolveTenantId(headerTenantId), prize));
    }

    @DeleteMapping("/gamehub/v1/admin/leaderboard/prizes/{id}")
    @Operation(summary = "Admin CMS (GM-10) - Xóa giải thưởng theo hạng")
    public ResponseEntity<Void> deletePrize(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("id") Long id) {
        leaderboardService.deletePrize(resolveTenantId(headerTenantId), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/gamehub/v1/admin/leaderboard/payouts")
    @Operation(summary = "Admin CMS (GM-10) - Danh sách chi trả giải thưởng bảng xếp hạng")
    public ResponseEntity<List<LeaderboardPayoutEntity>> listPayouts(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "month", required = false) String month) {
        return ResponseEntity.ok(leaderboardService.listPayouts(resolveTenantId(headerTenantId), month));
    }

    @PostMapping("/gamehub/v1/admin/leaderboard/close-month")
    @Operation(summary = "Admin CMS (GM-10) - Chốt bảng xếp hạng tháng & tạo payout chờ duyệt (QT-04)")
    public ResponseEntity<List<LeaderboardPayoutEntity>> closeMonth(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "month", required = false) String month) {
        return ResponseEntity.ok(leaderboardService.closeMonthAndGeneratePayouts(resolveTenantId(headerTenantId), month));
    }

    @PostMapping("/gamehub/v1/admin/leaderboard/payouts/{id}/approve")
    @Operation(summary = "Admin CMS (QT-04) - Người duyệt thứ hai phê duyệt trả thưởng bảng xếp hạng")
    public ResponseEntity<LeaderboardPayoutEntity> approvePayout(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Username", required = false) String username,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(leaderboardService.approvePayout(resolveTenantId(headerTenantId), id, username));
    }

    @PostMapping("/gamehub/v1/admin/leaderboard/payouts/{id}/reject")
    @Operation(summary = "Admin CMS (QT-04) - Từ chối trả thưởng bảng xếp hạng")
    public ResponseEntity<LeaderboardPayoutEntity> rejectPayout(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestHeader(value = "X-Username", required = false) String username,
            @PathVariable("id") Long id) {
        return ResponseEntity.ok(leaderboardService.rejectPayout(resolveTenantId(headerTenantId), id, username));
    }

    private String resolveTenantId(String headerTenantId) {
        if (headerTenantId != null && !headerTenantId.isBlank()) {
            return headerTenantId;
        }
        String ctx = TenantContext.getTenantId();
        return (ctx != null && !ctx.isBlank()) ? ctx : "TENANT_NATCASH";
    }
}
