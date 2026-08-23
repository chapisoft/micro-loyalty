package com.lib.ims.core.model.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public interface BaseEnum<T> {
   @JsonValue
   T getValue();

   String name();

   boolean isValid();
}
