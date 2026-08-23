package com.lib.ims.core.utils;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.TypeReference;
import com.alibaba.fastjson2.JSONReader.Feature;

public final class JsonUtil {
   private JsonUtil() {
   }

   public static String toJson(Object object) {
      return JSON.toJSONString(object);
   }

   public static <T> T fromJson(String json, Class<T> valueType) {
      return JSON.parseObject(json, valueType);
   }

   public static <T> T fromJson(String json, TypeReference<T> typeReference) {
      return JSON.parseObject(json, typeReference, new Feature[0]);
   }
}
