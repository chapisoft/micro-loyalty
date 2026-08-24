package com.natcash.loyalty;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableScheduling;

@Slf4j
@SpringBootApplication
@EnableScheduling
@EnableAspectJAutoProxy
@ComponentScan(basePackages = {"com.natcash.loyalty", "com.lib.ims"})
public class LoyaltyApplication {

    public static void main(String[] args) {
        SpringApplication.run(LoyaltyApplication.class, args);
        log.info("==================================================================");
        log.info("  HỆ SINH THÁI KHÁCH HÀNG THÂN THIẾT & CỔNG GAME LOYALTY-SERVICE");
        log.info("  TRẠNG THÁI: KHỞI ĐỘNG THÀNH CÔNG VÀ SẴN SÀNG TIẾP NHẬN YÊU CẦU");
        log.info("==================================================================");
    }
}
