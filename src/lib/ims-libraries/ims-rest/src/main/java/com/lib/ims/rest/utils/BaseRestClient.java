package com.lib.ims.rest.utils;

import java.util.Map;

public interface BaseRestClient {
   <T> T get(String var1, Map<String, String> var2, Class<T> var3, Map<String, String> var4, Object... var5);

   <T> T post(String var1, Object var2, Class<T> var3, Map<String, String> var4);

   <T> T put(String var1, Object var2, Class<T> var3, Map<String, String> var4);

   <T> T delete(String var1, Class<T> var2, Map<String, String> var3, Object... var4);
}
