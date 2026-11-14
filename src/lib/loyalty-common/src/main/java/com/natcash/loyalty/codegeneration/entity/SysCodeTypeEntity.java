package com.natcash.loyalty.codegeneration.entity;

import com.natcash.loyalty.domain.enums.CommonStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Thực thể ánh xạ bảng khai báo cấu trúc sinh mã nghiệp vụ sys_code_types.
 */
@Entity
@Table(name = "sys_code_types")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SysCodeTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code_type", nullable = false, unique = true, length = 64)
    private String codeType;

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Column(name = "format_template", nullable = false, length = 128)
    private String formatTemplate;

    @Column(name = "static_prefix", nullable = false, length = 32)
    private String staticPrefix;

    @Column(name = "date_format", nullable = false, length = 32)
    @Builder.Default
    private String dateFormat = "yyyyMMdd";

    @Column(name = "seq_padding", nullable = false)
    @Builder.Default
    private Integer seqPadding = 6;

    @Column(name = "seq_name", nullable = false, length = 64)
    private String seqName;

    @Column(name = "seq_is_param_scoped", nullable = false)
    @Builder.Default
    private Boolean seqIsParamScoped = Boolean.FALSE;

    @Column(name = "batch_allocation_size", nullable = false)
    @Builder.Default
    private Integer batchAllocationSize = 50;

    @Column(name = "immutable_after_create", nullable = false)
    @Builder.Default
    private Boolean immutableAfterCreate = Boolean.TRUE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private CommonStatus status = CommonStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
