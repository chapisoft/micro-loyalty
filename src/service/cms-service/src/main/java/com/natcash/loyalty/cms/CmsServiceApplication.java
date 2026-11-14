package com.natcash.loyalty.cms;

import com.natcash.loyalty.util.ConfigPathResolver;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@Slf4j
@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableAspectJAutoProxy(proxyTargetClass = true)
@ComponentScan(basePackages = {"com.natcash.loyalty", "com.lib.ims"})
@EntityScan(basePackages = {"com.natcash.loyalty"})
@EnableJpaRepositories(basePackages = {"com.natcash.loyalty"})
public class CmsServiceApplication {

    public static void main(String[] args) {
        ConfigPathResolver.configureSpringConfigLocation();
        ConfigPathResolver.configureLoggingLocation();
        SpringApplication.run(CmsServiceApplication.class, args);
        log.info("==================================================================");
        log.info("  MICRO-LOYALTY CMS-SERVICE");
        log.info("  TRẠNG THÁI: KHỞI ĐỘNG THÀNH CÔNG VÀ SẴN SÀNG TIẾP NHẬN YÊU CẦU");
        log.info("==================================================================");
    }
}
