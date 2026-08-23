package com.lib.ims.rest;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

@AutoConfiguration
@ComponentScan(
   basePackages = {"com.lib.ims.rest"}
)
public class IMSRestAutoConfiguration {
}
