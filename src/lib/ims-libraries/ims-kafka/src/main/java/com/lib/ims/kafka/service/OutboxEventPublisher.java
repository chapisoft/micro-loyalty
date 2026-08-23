package com.lib.ims.kafka.service;

import com.lib.ims.kafka.dto.EventDto;
import java.util.List;

public interface OutboxEventPublisher {
   void publishEvent(String var1, String var2, Object var3);

   void publishEvent(String var1, String var2, String var3, Object var4);

   void publishEvents(EventDto var1);

   void publishEvents(List<EventDto> var1);

   void updateOutboxEventStatus(String var1, boolean var2, String var3);
}
