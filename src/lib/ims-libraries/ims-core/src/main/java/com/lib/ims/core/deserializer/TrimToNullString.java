package com.lib.ims.core.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

public class TrimToNullString extends JsonDeserializer<String> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(TrimToNullString.class);

   public String deserialize(JsonParser p, DeserializationContext ctx) throws IOException {
      return StringUtils.trimToNull(p.getText());
   }
}
