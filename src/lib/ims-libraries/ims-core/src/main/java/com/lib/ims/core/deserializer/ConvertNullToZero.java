package com.lib.ims.core.deserializer;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

public class ConvertNullToZero extends JsonDeserializer<Integer> {
   public Integer deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
      Integer value = (Integer)p.readValueAs(Integer.class);
      return value == null ? 0 : value;
   }
}
