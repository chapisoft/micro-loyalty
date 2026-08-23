package com.lib.ims.security;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

@AutoConfiguration
@ComponentScan(
   basePackages = {"com.lib.ims.security.*"}
)
public class IMSSecurityAutoConfiguration {
}
