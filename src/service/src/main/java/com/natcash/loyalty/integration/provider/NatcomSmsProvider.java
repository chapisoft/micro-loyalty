package com.natcash.loyalty.integration.provider;

import com.natcash.loyalty.integration.NatcomSmsClient;
import com.natcash.loyalty.integration.entity.TenantIntegrationEntity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class NatcomSmsProvider implements SmsGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(NatcomSmsProvider.class);
    private final NatcomSmsClient natcomSmsClient;

    public NatcomSmsProvider(NatcomSmsClient natcomSmsClient) {
        this.natcomSmsClient = natcomSmsClient;
    }

    @Override
    public String getProviderCode() {
        return "NATCOM_VAS";
    }

    @Override
    public boolean sendSms(
            TenantIntegrationEntity config,
            String phoneNumber,
            String messageContent) {
        log.info("[PROVIDER-NATCOM-SMS] tenant={}, phone={}, content='{}'",
                config.getTenantId(), phoneNumber, messageContent);
        return natcomSmsClient.sendBrandnameSms(phoneNumber, messageContent);
    }
}
