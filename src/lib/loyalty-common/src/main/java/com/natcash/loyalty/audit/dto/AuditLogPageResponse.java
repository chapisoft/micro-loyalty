package com.natcash.loyalty.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogPageResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<AuditLogDto> data;
    private List<AuditLogDto> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
