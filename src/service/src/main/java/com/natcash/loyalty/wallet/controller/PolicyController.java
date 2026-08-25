package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;
import com.natcash.loyalty.wallet.entity.LoyaltyAcceptancePolicyEntity;
import com.natcash.loyalty.wallet.repository.LoyaltyAcceptancePolicyRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/loyalty/v1/policies")
@Tag(name = "Policy Configuration API", description = "Quản lý Chính Sách Tích & Tiêu Điểm")
public class PolicyController {

    private final LoyaltyAcceptancePolicyRepository policyRepository;
    private final LoyaltyPartnerRepository partnerRepository;

    public PolicyController(LoyaltyAcceptancePolicyRepository policyRepository,
                            LoyaltyPartnerRepository partnerRepository) {
        this.policyRepository = policyRepository;
        this.partnerRepository = partnerRepository;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách chính sách tích tiêu điểm", description = "Trả về danh sách chính sách tích lũy và khấu trừ điểm tại các điểm bán")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PolicyResponse>> getPolicies(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        List<LoyaltyAcceptancePolicyEntity> entities = policyRepository.findByTenantId(tenantId);

        if (entities.isEmpty()) {
            // Fallback default policies if DB is not seeded for this tenant yet
            List<PolicyResponse> fallbackList = getFallbackPolicies(tenantId);
            return ResponseEntity.ok(fallbackList);
        }

        List<PolicyResponse> responses = entities.stream()
                .map(this::mapEntityToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    @PostMapping
    @Operation(summary = "Tạo mới chính sách tích tiêu điểm", description = "Thêm mới chính sách tích/tiêu điểm lưu trực tiếp vào cơ sở dữ liệu")
    @Transactional
    public ResponseEntity<PolicyResponse> createPolicy(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PolicyRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        LoyaltyPartnerEntity partner = null;
        if (request.getPartnerId() != null) {
            partner = partnerRepository.findByIdAndTenantId(request.getPartnerId(), tenantId)
                    .orElse(null);
        }
        if (partner == null && request.getPartnerCode() != null) {
            partner = partnerRepository.findByTenantIdAndPartnerCode(tenantId, request.getPartnerCode())
                    .orElse(null);
        }
        if (partner == null) {
            // Auto-create or fetch default partner for consistency
            partner = partnerRepository.findByTenantId(tenantId).stream().findFirst()
                    .orElseGet(() -> partnerRepository.save(LoyaltyPartnerEntity.builder()
                            .tenantId(tenantId)
                            .partnerCode(request.getPartnerCode() != null ? request.getPartnerCode() : "PARTNER_" + System.currentTimeMillis())
                            .partnerName(request.getPartnerName() != null ? request.getPartnerName() : "Đối Tác Mới")
                            .apiKey("API_KEY_" + System.currentTimeMillis())
                            .secretKey("SEC_KEY_" + System.currentTimeMillis())
                            .status(CommonStatus.ACTIVE)
                            .build()));
        }

        LoyaltyAcceptancePolicyEntity entity = LoyaltyAcceptancePolicyEntity.builder()
                .tenantId(tenantId)
                .partner(partner)
                .pointExchangeRate(request.getExchangeRate() != null ? request.getExchangeRate() : BigDecimal.ONE)
                .maxBurnPercentage(request.getMaxBurnPercentage() != null ? request.getMaxBurnPercentage() : new BigDecimal("50.00"))
                .minBurnPoints(request.getMinBillAmount() != null ? request.getMinBillAmount() : BigDecimal.TEN)
                .maxBurnPointsPerDay(new BigDecimal("10000.00"))
                .allowedPointTypes("ALL")
                .status(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE)
                .build();

        LoyaltyAcceptancePolicyEntity saved = policyRepository.save(entity);
        return ResponseEntity.ok(mapEntityToResponse(saved));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật chính sách tích tiêu điểm", description = "Cập nhật thông tin chính sách trong cơ sở dữ liệu")
    @Transactional
    public ResponseEntity<PolicyResponse> updatePolicy(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestBody PolicyRequest request) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();

        LoyaltyAcceptancePolicyEntity entity = policyRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND, "Không tìm thấy chính sách #" + id));

        if (request.getMaxBurnPercentage() != null) {
            entity.setMaxBurnPercentage(request.getMaxBurnPercentage());
        }
        if (request.getExchangeRate() != null) {
            entity.setPointExchangeRate(request.getExchangeRate());
        }
        if (request.getMinBillAmount() != null) {
            entity.setMinBurnPoints(request.getMinBillAmount());
        }
        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }

        LoyaltyAcceptancePolicyEntity updated = policyRepository.save(entity);
        return ResponseEntity.ok(mapEntityToResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa chính sách", description = "Xóa chính sách khỏi cơ sở dữ liệu")
    @Transactional
    public ResponseEntity<Void> deletePolicy(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        String tenantId = headerTenantId != null ? headerTenantId : TenantContext.getTenantId();
        policyRepository.findByIdAndTenantId(id, tenantId).ifPresent(policyRepository::delete);
        return ResponseEntity.ok().build();
    }

    private PolicyResponse mapEntityToResponse(LoyaltyAcceptancePolicyEntity entity) {
        return PolicyResponse.builder()
                .id(entity.getId())
                .code("POLICY_" + entity.getId())
                .name("Chính Sách Tiêu Điểm " + (entity.getPartner() != null ? entity.getPartner().getPartnerName() : ""))
                .partnerId(entity.getPartner() != null ? entity.getPartner().getId() : null)
                .partnerCode(entity.getPartner() != null ? entity.getPartner().getPartnerCode() : "N/A")
                .partnerName(entity.getPartner() != null ? entity.getPartner().getPartnerName() : "N/A")
                .type("BURN")
                .earnRatePercent(BigDecimal.ONE)
                .exchangeRate(entity.getPointExchangeRate())
                .minBillAmount(entity.getMinBurnPoints())
                .maxBurnPercentage(entity.getMaxBurnPercentage())
                .status(entity.getStatus())
                .description("Quy định khấu trừ tối đa " + entity.getMaxBurnPercentage() + "% hóa đơn")
                .build();
    }

    private List<PolicyResponse> getFallbackPolicies(String tenantId) {
        List<PolicyResponse> policies = new ArrayList<>();
        if ("TENANT_NATCASH".equalsIgnoreCase(tenantId)) {
            policies.add(PolicyResponse.builder()
                    .id(1L)
                    .code("EARN_TELCO_TOPUP")
                    .name("Chính Sách Tích Điểm Nạp Cước Natcom")
                    .partnerCode("NATCOM_TELCO")
                    .partnerName("Viễn Thông Natcom")
                    .type("EARN")
                    .earnRatePercent(new BigDecimal("2.00"))
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("50.00"))
                    .maxBurnPercentage(new BigDecimal("100.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Tích 2% cho mỗi giao dịch nạp tiền trực tuyến hoặc nạp thẻ cào")
                    .build());
            policies.add(PolicyResponse.builder()
                    .id(2L)
                    .code("BURN_NATCASH_PAYMENT")
                    .name("Chính Sách Khấu Trừ Điểm Thanh Toán Ví")
                    .partnerCode("NATCASH_WALLET")
                    .partnerName("Ví Điện Tử Natcash")
                    .type("BURN")
                    .earnRatePercent(BigDecimal.ZERO)
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("10.00"))
                    .maxBurnPercentage(new BigDecimal("100.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Khấu trừ tối đa 100% khi thanh toán cước, data 4G và hóa đơn dịch vụ")
                    .build());
        } else {
            policies.add(PolicyResponse.builder()
                    .id(1L)
                    .code("EARN_RETAIL_DEFAULT")
                    .name("Chính Sách Tích Điểm Bán Lẻ Siêu Thị")
                    .partnerCode("DELIMART")
                    .partnerName("Siêu Thị Delimart")
                    .type("EARN")
                    .earnRatePercent(new BigDecimal("1.00"))
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("50.00"))
                    .maxBurnPercentage(new BigDecimal("50.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Tích 1% giá trị hóa đơn cho mỗi giao dịch mua sắm")
                    .build());
            policies.add(PolicyResponse.builder()
                    .id(2L)
                    .code("BURN_RETAIL_DEFAULT")
                    .name("Chính Sách Tiêu Điểm Tại Quầy Thu Ngân")
                    .partnerCode("DELIMART")
                    .partnerName("Siêu Thị Delimart")
                    .type("BURN")
                    .earnRatePercent(BigDecimal.ZERO)
                    .exchangeRate(new BigDecimal("1.0000"))
                    .minBillAmount(new BigDecimal("10.00"))
                    .maxBurnPercentage(new BigDecimal("50.00"))
                    .status(CommonStatus.ACTIVE)
                    .description("Khấu trừ tối đa 50% tổng giá trị hóa đơn thanh toán")
                    .build());
        }
        return policies;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PolicyRequest {
        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private BigDecimal earnRatePercent;
        private BigDecimal exchangeRate;
        private BigDecimal minBillAmount;
        private BigDecimal maxBurnPercentage;
        private CommonStatus status;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PolicyResponse {
        private Long id;
        private String code;
        private String name;
        private Long partnerId;
        private String partnerCode;
        private String partnerName;
        private String type;
        private BigDecimal earnRatePercent;
        private BigDecimal exchangeRate;
        private BigDecimal minBillAmount;
        private BigDecimal maxBurnPercentage;
        private CommonStatus status;
        private String description;
    }
}
