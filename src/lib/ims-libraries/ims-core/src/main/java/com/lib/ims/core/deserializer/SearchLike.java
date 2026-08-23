package com.lib.ims.core.deserializer;

import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

public class SearchLike extends JsonDeserializer<String> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(SearchLike.class);

   public String deserialize(JsonParser p, DeserializationContext ctx) throws java.io.IOException {
      String value = StringUtils.trimToEmpty(p.getText()).toUpperCase();
      return StringUtils.isBlank(value) ? null : "%" + value + "%";
   }
}
