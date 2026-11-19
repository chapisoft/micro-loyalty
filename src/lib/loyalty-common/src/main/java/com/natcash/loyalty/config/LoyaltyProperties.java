package com.natcash.loyalty.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Cấu hình tập trung của dịch vụ loyalty-service được nạp từ etc/application.yml (và hồ sơ môi trường).
 * Thay thế toàn bộ giá trị cấu hình trước đây nằm rải rác trong LoyaltyConstants và @Value fallback.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "loyalty")
public class LoyaltyProperties {

    private static final LoyaltyProperties DEFAULT_INSTANCE = new LoyaltyProperties();
    private static volatile LoyaltyProperties instance;

    private String deploymentMode = "STANDALONE";
    private String defaultTenantId;
    private String partnerCode;
    private String localesPath = "/app/locales";

    private Tenant tenant = new Tenant();
    private Security security = new Security();
    private Qr qr = new Qr();
    private Wallet wallet = new Wallet();
    private Session session = new Session();
    private Webhook webhook = new Webhook();
    private Outbox outbox = new Outbox();
    private Lock lock = new Lock();
    private Engagement engagement = new Engagement();
    private Budget budget = new Budget();
    private Partner partner = new Partner();
    private Tier tier = new Tier();
    private Settlement settlement = new Settlement();
    private Campaign campaign = new Campaign();
    private Agent agent = new Agent();
    private Learning learning = new Learning();
    private Approval approval = new Approval();
    private SystemParam systemParam = new SystemParam();
    private Stream stream = new Stream();
    private Gateway gateway = new Gateway();
    private PublicUrls publicUrls = new PublicUrls();
    private Integration integration = new Integration();
    private Media media = new Media();

    @PostConstruct
    void registerInstance() {
        if (defaultTenantId != null && !defaultTenantId.isBlank() && tenant.getDefaultTenant() == null) {
            tenant.setDefaultTenant(defaultTenantId.trim());
        }
        instance = this;
    }

    /**
     * Truy cập cấu hình đang hoạt động (từ Spring Context hoặc fallback an toàn khi chạy Unit Test).
     */
    public static LoyaltyProperties get() {
        return instance != null ? instance : DEFAULT_INSTANCE;
    }

    @Getter
    @Setter
    public static class Tenant {
        private String defaultTenant = "DEFAULT";
        private String headerName = "X-Tenant-Id";
    }

    @Getter
    @Setter
    public static class Security {
        private long timestampDriftToleranceSeconds = 300L;
        private long timestampToleranceSeconds = 300L;
        private String masterKey = "";
    }

    @Getter
    @Setter
    public static class Qr {
        private int tokenTtlSeconds = 60;
        private int defaultTtlSeconds = 60;
    }

    @Getter
    @Setter
    public static class Wallet {
        private BigDecimal maxBurnPercentPerBill = new BigDecimal("50.00");
        private int defaultPointExpirationMonths = 12;
    }

    @Getter
    @Setter
    public static class Session {
        private int ticketTtlSeconds = 60;
        private long accessTokenTtlSeconds = 900L;
    }

    @Getter
    @Setter
    public static class Webhook {
        private int maxRetries = 5;
    }

    @Getter
    @Setter
    public static class Outbox {
        private int maxRetries = 5;
        private int batchSize = 50;
        private long publishIntervalMs = 1000L;
    }

    @Getter
    @Setter
    public static class Lock {
        private long waitTimeMs = 3000L;
        private long leaseTimeMs = 10000L;
        private long shortLeaseTimeMs = 5000L;
    }

    @Getter
    @Setter
    public static class Engagement {
        private int quietHoursStartHour = 20;
        private int quietHoursEndHour = 8;
        private String timezone = "America/Port-au-Prince";
        private int maxPushPerDay = 1;
        private int maxPushPerWeek = 3;
        private int defaultDedupWindowHours = 24;
    }

    @Getter
    @Setter
    public static class Budget {
        private int alertThresholdPercent = 80;
        private int hardStopPercent = 100;
    }

    @Getter
    @Setter
    public static class Partner {
        private int apiKeyGracePeriodDays = 7;
        private int lookbackDays = 180;
        private int txPageSize = 200;
        private int recentTxLimit = 20;
        private BigDecimal defaultMaxBurnPercent = new BigDecimal("50.00");
    }

    @Getter
    @Setter
    public static class Tier {
        private int expiryWarningDays = 30;
    }

    @Getter
    @Setter
    public static class Settlement {
        private int confirmDeadlineDays = 3;
        private BigDecimal defaultMdrFeePercent = new BigDecimal("1.50");
    }

    @Getter
    @Setter
    public static class Campaign {
        private int defaultControlGroupPercent = 5;
    }

    @Getter
    @Setter
    public static class Agent {
        private int monthlyNewCustomerTarget = 100;
        private int rewardHtg = 2000;
        private int superAgentMinAchievementPct = 50;
        private int superAgentRewardHtg = 10000;
    }

    @Getter
    @Setter
    public static class Learning {
        private int tier1Correct = 5;
        private int tier2Correct = 10;
        private int tier3Correct = 15;
    }

    @Getter
    @Setter
    public static class Approval {
        private BigDecimal defaultPointAdjustmentMaxLimit = new BigDecimal("100000.00");
    }

    @Getter
    @Setter
    public static class SystemParam {
        private String defaultValueType = "STRING";
        private String defaultGroupCode = "GENERAL";
    }

    @Getter
    @Setter
    public static class Stream {
        private String channelPrefix = "loyalty.events.";
    }

    @Getter
    @Setter
    public static class Gateway {
        private String endpoint = "";
    }

    @Getter
    @Setter
    public static class PublicUrls {
        private String webviewGamehub = "";
        private String cmsPortal = "";
    }

    @Getter
    @Setter
    public static class Integration {
        private Natcash natcash = new Natcash();
        private Sms sms = new Sms();

        @Getter
        @Setter
        public static class Natcash {
            private String baseUrl = "";
            private String apiKey = "";
        }

        @Getter
        @Setter
        public static class Sms {
            private String gatewayUrl = "";
            private String brandname = "";
        }
    }

    @Getter
    @Setter
    public static class Media {
        private String storageDir = "./uploads";
        private long maxFileSizeBytes = 5_242_880L;
        private String publicUrlPrefix = "/loyalty/v1/media";
    }
}
