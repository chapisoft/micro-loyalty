package com.natcash.loyalty.partner.controller;

import com.natcash.loyalty.domain.enums.CommonStatus;
import com.natcash.loyalty.partner.entity.PartnerBranchEntity;
import com.natcash.loyalty.partner.repository.PartnerBranchRepository;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/partners/locations")
@RequiredArgsConstructor
@Tag(name = "Where To Use API", description = "Danh sách điểm chấp nhận sử dụng điểm theo tỉnh thành/GPS (LM-04)")
public class PartnerLocationController {

    private final PartnerBranchRepository branchRepository;

    @GetMapping
    @Operation(summary = "Danh sách địa điểm chấp nhận tích/tiêu điểm")
    public ResponseEntity<List<PartnerBranchEntity>> getPartnerLocations(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam(value = "province", required = false) String province,
            @RequestParam(value = "partnerId", required = false) Long partnerId) {
        String tenantId = headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();

        List<PartnerBranchEntity> branches = partnerId != null
                ? branchRepository.findByTenantIdAndPartnerIdOrderByIdDesc(tenantId, partnerId)
                : branchRepository.findByTenantIdAndStatus(tenantId, CommonStatus.ACTIVE);

        if (province != null && !province.isBlank()) {
            String filter = province.trim().toLowerCase();
            branches = branches.stream()
                    .filter(b -> b.getProvince() != null && b.getProvince().toLowerCase().contains(filter))
                    .toList();
        }
        return ResponseEntity.ok(branches);
    }
}
