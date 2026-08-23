package com.lib.ims.rest.configuration;

import com.lib.ims.core.exceptions.ApplicationException;
import com.lib.ims.core.exceptions.ErrorCode;
import com.lib.ims.core.exceptions.ThirdPartyServiceException;
import com.lib.ims.core.utils.JsonUtil;
import com.lib.ims.rest.payload.ResponseData;
import java.nio.charset.StandardCharsets;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;



public abstract class BaseHttpClientConfig {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(BaseHttpClientConfig.class);

   @Bean
   protected RestClient defaultRestClient(RestClientFactory restClientFactory) {
      return restClientFactory.createRestClient(status -> status != null && status.isError(), (request, response) -> {
         if (HttpStatus.FORBIDDEN.equals(response.getStatusCode())) {
            log.error("Không có quyền truy cập API: {}", request.getURI());
            throw new ApplicationException(ErrorCode.FORBIDDEN);
         } else {
            String errorMessage = "common.error.execute.thirty.service";

            try {
               String responseBody = StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
               ResponseData<?> errorResponse = JsonUtil.fromJson(responseBody, ResponseData.class);
               if (errorResponse != null && StringUtils.isNotBlank(errorResponse.getMessage())) {
                  errorMessage = errorResponse.getMessage();
               }

               log.error("Lỗi từ dịch vụ ngoài: {}", responseBody);
            } catch (Exception var5) {
               log.error("Không thể đọc nội dung lỗi từ response: {}", var5.getMessage(), var5);
            }

            throw new ThirdPartyServiceException(errorMessage);
         }
      });
   }
}
