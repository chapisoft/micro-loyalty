package com.natcash.loyalty.engagement.controller;

import com.natcash.loyalty.batch.SegmentCalculationJob;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.CustomerSegmentCode;
import com.natcash.loyalty.engagement.entity.CustomerSegmentEntity;
import com.natcash.loyalty.engagement.entity.CustomerSegmentMemberEntity;
import com.natcash.loyalty.engagement.repository.CustomerSegmentMemberRepository;
import com.natcash.loyalty.engagement.repository.CustomerSegmentRepository;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.tenant.TenantContext;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/loyalty/v1/segments")
@RequiredArgsConstructor
@Tag(name = "Customer Segments API", description = "Phân khúc khách hàng động 7 nhóm (CN-01, CN-03)")
public class SegmentController {

    private final CustomerSegmentRepository segmentRepository;
    private final CustomerSegmentMemberRepository memberRepository;
    private final SegmentCalculationJob segmentCalculationJob;

    @GetMapping
    @Operation(summary = "Danh sách 7 phân khúc khách hàng")
    public ResponseEntity<List<CustomerSegmentEntity>> listSegments(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(segmentRepository.findByTenantIdOrderByIdAsc(resolveTenantId(headerTenantId)));
    }

    @PostMapping("/recalculate")
    @Operation(summary = "Chạy tính toán phân khúc theo yêu cầu")
    public ResponseEntity<List<CustomerSegmentEntity>> recalculateSegments(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId) {
        return ResponseEntity.ok(segmentCalculationJob.recalculateSegments(resolveTenantId(headerTenantId)));
    }

    @GetMapping("/{code}/members")
    @Operation(summary = "Danh sách hội viên thuộc phân khúc")
    public ResponseEntity<List<CustomerSegmentMemberEntity>> listSegmentMembers(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("code") CustomerSegmentCode code) {
        return ResponseEntity.ok(memberRepository.findByTenantIdAndSegmentCodeOrderByScoreDesc(
                resolveTenantId(headerTenantId), code));
    }

    @GetMapping("/{code}/export")
    @Operation(summary = "Xuất danh sách hội viên phân khúc định dạng CSV")
    public ResponseEntity<String> exportSegmentCsv(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @PathVariable("code") CustomerSegmentCode code) {
        String tenantId = resolveTenantId(headerTenantId);
        List<CustomerSegmentMemberEntity> members = memberRepository
                .findByTenantIdAndSegmentCodeOrderByScoreDesc(tenantId, code);
        StringBuilder sb = new StringBuilder("externalUserId,segmentCode,score,assignedAt\n");
        for (CustomerSegmentMemberEntity m : members) {
            sb.append(m.getExternalUserId()).append(',')
              .append(m.getSegmentCode()).append(',')
              .append(m.getScore()).append(',')
              .append(m.getAssignedAt()).append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=segment_" + code.name() + ".csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(sb.toString());
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy phân khúc cá nhân hóa của hội viên đang đăng nhập")
    public ResponseEntity<CustomerSegmentEntity> getMySegment(
            @RequestHeader(value = "X-Tenant-Id", required = false) String headerTenantId,
            @RequestParam("externalUserId") String externalUserId) {
        String tenantId = resolveTenantId(headerTenantId);
        List<CustomerSegmentMemberEntity> memberships = memberRepository
                .findByTenantIdAndExternalUserId(tenantId, externalUserId);
        CustomerSegmentCode targetCode = memberships != null && !memberships.isEmpty()
                ? memberships.get(0).getSegmentCode()
                : CustomerSegmentCode.GENERAL;

        CustomerSegmentEntity segment = segmentRepository.findByTenantIdAndSegmentCode(tenantId, targetCode)
                .or(() -> segmentRepository.findByTenantIdAndSegmentCode(tenantId, CustomerSegmentCode.GENERAL))
                .orElseThrow(() -> new LoyaltyException(ErrorCode.NOT_FOUND));
        return ResponseEntity.ok(segment);
    }

    private String resolveTenantId(String headerTenantId) {
        return headerTenantId != null && !headerTenantId.isBlank()
                ? headerTenantId.trim()
                : TenantContext.getTenantId();
    }
}
