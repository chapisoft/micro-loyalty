package com.natcash.loyalty.domain.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.natcash.loyalty.util.MessageUtils;
import lombok.Getter;

@Getter
public enum IntegrationProviderCode {

    GENERIC_REST("GENERIC_REST", "Generic REST Adapter", "REST_ADAPTER", "enum.integration_provider.generic_rest", false),
    NATCASH_WALLET("NATCASH_WALLET", "Natcash Core eWallet", "PAYMENT_GATEWAY", "enum.integration_provider.natcash_wallet", false),
    NATCOM_SMS("NATCOM_SMS", "Natcom SMS Brandname", "SMS_GATEWAY", "enum.integration_provider.natcom_sms", false),
    WSO2("WSO2", "WSO2 API Gateway & SSO", "API_GATEWAY", "enum.integration_provider.wso2", true),
    MOBILE_SERVICE("MOBILE_SERVICE", "Natcash Mobile Service", "MOBILE_CHANNEL", "enum.integration_provider.mobile_service", true),
    PAYMENT_POINT("PAYMENT_POINT", "Natcash Payment Point POS", "POS_TERMINAL", "enum.integration_provider.payment_point", true),
    BCCS("BCCS", "Natcom BCCS Core Telecom", "CORE_TELECOM", "enum.integration_provider.bccs", true),
    USSD_202("USSD_202", "USSD *202# Gateway", "USSD", "enum.integration_provider.ussd_202", true),
    DATA_LAKE("DATA_LAKE", "Enterprise Data Lake CDC", "ANALYTICS_ETL", "enum.integration_provider.data_lake", true),
    SMP_SMS("SMP_SMS", "SMP / Natcom SMS Brandname", "SMS_GATEWAY", "enum.integration_provider.smp_sms", false);

    @JsonValue
    private final String code;
    private final String displayName;
    private final String category;
    private final String messageKey;
    private final boolean overviewSystem;

    IntegrationProviderCode(String code, String displayName, String category, String messageKey, boolean overviewSystem) {
        this.code = code;
        this.displayName = displayName;
        this.category = category;
        this.messageKey = messageKey;
        this.overviewSystem = overviewSystem;
    }

    public String getDescription() {
        return MessageUtils.getMessage(this.messageKey);
    }

    @JsonCreator
    public static IntegrationProviderCode fromCode(String code) {
        if (code == null) {
            return null;
        }
        for (IntegrationProviderCode item : values()) {
            if (item.code.equalsIgnoreCase(code.trim())) {
                return item;
            }
        }
        return null;
    }

    public enum ConnectionStatus {
        CONNECTED,
        STANDBY
    }
}
