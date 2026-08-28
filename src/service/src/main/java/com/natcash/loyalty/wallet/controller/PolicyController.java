package com.natcash.loyalty.wallet.controller;

import com.natcash.loyalty.account.entity.LoyaltyPartnerEntity;
import com.natcash.loyalty.account.repository.LoyaltyPartnerRepository;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.domain.enums.PartnerType;
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
import org.springframework.web.bind.annotation.CrossOrigin;
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
import java.util.Optional;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping(value = {"/loyalty/v1/policies", "/policies", "/v1/policies", "/api/loyalty/v1/policies"})
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
        if (partner == null && request.getPartnerCode() != null && !request.getPartnerCode().trim().isEmpty()) {
            partner = partnerRepository.findByTenantIdAndPartnerCode(tenantId, request.getPartnerCode().trim())
                    .orElse(null);
        }
        if (partner == null) {
            String partnerCode = request.getPartnerCode() != null && !request.getPartnerCode().trim().isEmpty()
                    ? request.getPartnerCode().trim()
                    : "PARTNER_" + System.currentTimeMillis();
            String partnerName = request.getPartnerName() != null && !request.getPartnerName().trim().isEmpty()
                    ? request.getPartnerName().trim()
                    : "Đối Tác Mới";

            // Check if partner code already exists
            Optional<LoyaltyPartnerEntity> existingPartnerOpt = partnerRepository.findByTenantIdAndPartnerCode(tenantId, partnerCode);
            if (existingPartnerOpt.isPresent()) {
                partner = existingPartnerOpt.get();
            } else {
                partner = partnerRepository.save(LoyaltyPartnerEntity.builder()
                        .tenantId(tenantId)
                        .partnerCode(partnerCode)
                        .partnerName(partnerName)
                        .partnerType(PartnerType.RETAIL)
                        .apiKey("API_KEY_" + System.currentTimeMillis())
                        .secretKey("SEC_KEY_" + System.currentTimeMillis())
                        .status(CommonStatus.ACTIVE)
                        .build());
            }
        }

        // Check if policy already exists for this tenant and partner (Prevent Unique Constraint violation)
        Optional<LoyaltyAcceptancePolicyEntity> existingPolicyOpt = policyRepository.findByTenantIdAndPartnerId(tenantId, partner.getId());
        LoyaltyAcceptancePolicyEntity entity;
        if (existingPolicyOpt.isPresent()) {
            entity = existingPolicyOpt.get();
            if (request.getExchangeRate() != null) entity.setPointExchangeRate(request.getExchangeRate());
            if (request.getMaxBurnPercentage() != null) entity.setMaxBurnPercentage(request.getMaxBurnPercentage());
            if (request.getMinBillAmount() != null) entity.setMinBurnPoints(request.getMinBillAmount());
            if (request.getStatus() != null) entity.setStatus(request.getStatus());
        } else {
            entity = LoyaltyAcceptancePolicyEntity.builder()
                    .tenantId(tenantId)
                    .partner(partner)
                    .pointExchangeRate(request.getExchangeRate() != null ? request.getExchangeRate() : BigDecimal.ONE)
                    .maxBurnPercentage(request.getMaxBurnPercentage() != null ? request.getMaxBurnPercentage() : new BigDecimal("50.00"))
                    .minBurnPoints(request.getMinBillAmount() != null ? request.getMinBillAmount() : BigDecimal.TEN)
                    .maxBurnPointsPerDay(new BigDecimal("10000.00"))
                    .allowedPointTypes("ALL")
                    .status(request.getStatus() != null ? request.getStatus() : CommonStatus.ACTIVE)
                    .build();
        }

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
        String partnerCode = "N/A";
        String partnerName = "N/A";
        Long partnerId = null;
        if (entity.getPartner() != null) {
            partnerId = entity.getPartner().getId();
            partnerCode = entity.getPartner().getPartnerCode() != null ? entity.getPartner().getPartnerCode() : "N/A";
            partnerName = entity.getPartner().getPartnerName() != null ? entity.getPartner().getPartnerName() : "N/A";
        }
        return PolicyResponse.builder()
                .id(entity.getId())
                .code("POLICY_" + entity.getId())
                .name("Chính Sách Tiêu Điểm " + partnerName)
                .partnerId(partnerId)
                .partnerCode(partnerCode)
                .partnerName(partnerName)
                .type("BURN")
                .earnRatePercent(BigDecimal.ONE)
                .exchangeRate(entity.getPointExchangeRate() != null ? entity.getPointExchangeRate() : BigDecimal.ONE)
                .minBillAmount(entity.getMinBurnPoints() != null ? entity.getMinBurnPoints() : BigDecimal.TEN)
                .maxBurnPercentage(entity.getMaxBurnPercentage() != null ? entity.getMaxBurnPercentage() : new BigDecimal("50.00"))
                .status(entity.getStatus() != null ? entity.getStatus() : CommonStatus.ACTIVE)
                .description(entity.getMaxBurnPercentage() != null ? "Quy định khấu trừ tối đa " + entity.getMaxBurnPercentage() + "% hóa đơn" : "Chính sách điểm")
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
