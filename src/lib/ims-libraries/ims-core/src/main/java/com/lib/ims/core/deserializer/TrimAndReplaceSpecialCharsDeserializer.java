package com.lib.ims.core.deserializer;

import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

public class TrimAndReplaceSpecialCharsDeserializer extends JsonDeserializer<String> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(TrimAndReplaceSpecialCharsDeserializer.class);

   public String deserialize(JsonParser p, DeserializationContext ctx) throws java.io.IOException {
      String value = StringUtils.trimToNull(p.getText());
      if (value == null) {
         return null;
      } else {
         value = value.replace("\"", " ").replace("<", " ").replace(">", " ").replace("'", " ");
         value = value.replaceAll("\\s+", " ").trim();
         return StringUtils.trimToNull(value);
      }
   }
}
