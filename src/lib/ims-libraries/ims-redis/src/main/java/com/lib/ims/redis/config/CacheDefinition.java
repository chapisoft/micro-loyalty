package com.lib.ims.redis.config;

import java.time.Duration;

public interface CacheDefinition {
   String getName();

   Duration getTtl();
}
