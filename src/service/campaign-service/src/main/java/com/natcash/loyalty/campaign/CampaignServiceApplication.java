package com.natcash.loyalty.campaign;

import com.natcash.loyalty.util.ConfigPathResolver;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@Slf4j
@SpringBootApplication
@EnableAsync
@EnableAspectJAutoProxy(proxyTargetClass = true)
@ComponentScan(basePackages = {"com.natcash.loyalty", "com.lib.ims"})
@EntityScan(basePackages = {"com.natcash.loyalty"})
@EnableJpaRepositories(basePackages = {"com.natcash.loyalty"})
public class CampaignServiceApplication {

    public static void main(String[] args) {
        ConfigPathResolver.configureSpringConfigLocation();
        ConfigPathResolver.configureLoggingLocation();
        SpringApplication.run(CampaignServiceApplication.class, args);
        log.info("==================================================================");
        log.info("  MICRO-LOYALTY CAMPAIGN-SERVICE");
        log.info("  TRẠNG THÁI: KHỞI ĐỘNG THÀNH CÔNG VÀ SẴN SÀNG TIẾP NHẬN YÊU CẦU");
        log.info("==================================================================");
    }
}
