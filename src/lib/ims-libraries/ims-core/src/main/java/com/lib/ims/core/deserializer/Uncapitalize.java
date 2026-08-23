package com.lib.ims.core.deserializer;

import org.apache.commons.lang3.StringUtils;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

public class Uncapitalize extends JsonDeserializer<String> {
   public String deserialize(JsonParser p, DeserializationContext ctx) throws java.io.IOException {
      String value = StringUtils.trimToEmpty(p.getText());
      return StringUtils.isBlank(value) ? null : StringUtils.uncapitalize(value);
   }
}
