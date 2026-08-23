package com.lib.ims.core.deserializer;

import org.apache.commons.lang3.StringUtils;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

public class ToUpperCase extends JsonDeserializer<String> {
   public String deserialize(JsonParser p, DeserializationContext ctx) throws java.io.IOException {
      return StringUtils.trimToNull(p.getText().toUpperCase());
   }
}
