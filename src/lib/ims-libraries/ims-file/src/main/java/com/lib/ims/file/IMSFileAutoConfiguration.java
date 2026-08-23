package com.lib.ims.file;

import com.lib.ims.file.config.FileStorageProperties;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@AutoConfiguration
@ComponentScan(
   basePackages = {"com.lib.ims.file"}
)
@EnableConfigurationProperties({FileStorageProperties.class})
public class IMSFileAutoConfiguration implements WebMvcConfigurer {
}
