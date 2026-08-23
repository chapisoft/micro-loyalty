package com.lib.ims.kafka.service;

import java.util.Map;

public interface MessageProducer<T> {
   void send(String var1, T var2);

   void send(String var1, T var2, Map<String, Object> var3);
}
