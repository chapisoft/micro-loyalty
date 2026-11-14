package com.natcash.loyalty.stream;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyStreamEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private String eventId;
    private String tenantId;
    private String eventType;
    private String externalUserId;
    private Long amount;
    private String transactionCode;
    private Map<String, String> metadata;
    private Instant timestamp;
}
