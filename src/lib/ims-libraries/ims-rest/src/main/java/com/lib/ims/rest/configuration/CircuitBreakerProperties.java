package com.lib.ims.rest.configuration;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Generated;


@SuppressWarnings({"unchecked", "rawtypes"})
public class CircuitBreakerProperties {
   private boolean enabled = true;
   private String baseNamePrefix = "restClientCircuitBreaker";
   private int slidingWindowSize = 100;
   private float failureRateThreshold = 50.0F;
   private int waitDurationInOpenStateMillis = 10000;
   private int permittedNumberOfCallsInHalfOpenState = 10;
   private int slowCallRateThreshold = 100;
   private int slowCallDurationThresholdMillis = 60000;
   private boolean perServiceEnabled = true;
   private List<String> hostnames;
   private transient Map<String, String> circuitBreakerNameCache = new ConcurrentHashMap();

   public String getCircuitBreakerName(String hostname) {
      if (!this.perServiceEnabled) {
         return this.baseNamePrefix;
      } else {
         try {
            return this.hostnames != null && this.hostnames.contains(hostname) ? (String)this.circuitBreakerNameCache.computeIfAbsent(hostname, (host) -> {
               return this.baseNamePrefix + "." + host;
            }) : null;
         } catch (Exception var3) {
            return null;
         }
      }
   }

   @Generated
   public boolean isEnabled() {
      return this.enabled;
   }

   @Generated
   public String getBaseNamePrefix() {
      return this.baseNamePrefix;
   }

   @Generated
   public int getSlidingWindowSize() {
      return this.slidingWindowSize;
   }

   @Generated
   public float getFailureRateThreshold() {
      return this.failureRateThreshold;
   }

   @Generated
   public int getWaitDurationInOpenStateMillis() {
      return this.waitDurationInOpenStateMillis;
   }

   @Generated
   public int getPermittedNumberOfCallsInHalfOpenState() {
      return this.permittedNumberOfCallsInHalfOpenState;
   }

   @Generated
   public int getSlowCallRateThreshold() {
      return this.slowCallRateThreshold;
   }

   @Generated
   public int getSlowCallDurationThresholdMillis() {
      return this.slowCallDurationThresholdMillis;
   }

   @Generated
   public boolean isPerServiceEnabled() {
      return this.perServiceEnabled;
   }

   @Generated
   public List<String> getHostnames() {
      return this.hostnames;
   }

   @Generated
   public Map<String, String> getCircuitBreakerNameCache() {
      return this.circuitBreakerNameCache;
   }

   @Generated
   public void setEnabled(boolean enabled) {
      this.enabled = enabled;
   }

   @Generated
   public void setBaseNamePrefix(String baseNamePrefix) {
      this.baseNamePrefix = baseNamePrefix;
   }

   @Generated
   public void setSlidingWindowSize(int slidingWindowSize) {
      this.slidingWindowSize = slidingWindowSize;
   }

   @Generated
   public void setFailureRateThreshold(float failureRateThreshold) {
      this.failureRateThreshold = failureRateThreshold;
   }

   @Generated
   public void setWaitDurationInOpenStateMillis(int waitDurationInOpenStateMillis) {
      this.waitDurationInOpenStateMillis = waitDurationInOpenStateMillis;
   }

   @Generated
   public void setPermittedNumberOfCallsInHalfOpenState(int permittedNumberOfCallsInHalfOpenState) {
      this.permittedNumberOfCallsInHalfOpenState = permittedNumberOfCallsInHalfOpenState;
   }

   @Generated
   public void setSlowCallRateThreshold(int slowCallRateThreshold) {
      this.slowCallRateThreshold = slowCallRateThreshold;
   }

   @Generated
   public void setSlowCallDurationThresholdMillis(int slowCallDurationThresholdMillis) {
      this.slowCallDurationThresholdMillis = slowCallDurationThresholdMillis;
   }

   @Generated
   public void setPerServiceEnabled(boolean perServiceEnabled) {
      this.perServiceEnabled = perServiceEnabled;
   }

   @Generated
   public void setHostnames(List<String> hostnames) {
      this.hostnames = hostnames;
   }

   @Generated
   public void setCircuitBreakerNameCache(Map<String, String> circuitBreakerNameCache) {
      this.circuitBreakerNameCache = circuitBreakerNameCache;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof CircuitBreakerProperties)) {
         return false;
      } else {
         CircuitBreakerProperties other = (CircuitBreakerProperties)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.isEnabled() != other.isEnabled()) {
            return false;
         } else if (this.getSlidingWindowSize() != other.getSlidingWindowSize()) {
            return false;
         } else if (Float.compare(this.getFailureRateThreshold(), other.getFailureRateThreshold()) != 0) {
            return false;
         } else if (this.getWaitDurationInOpenStateMillis() != other.getWaitDurationInOpenStateMillis()) {
            return false;
         } else if (this.getPermittedNumberOfCallsInHalfOpenState() != other.getPermittedNumberOfCallsInHalfOpenState()) {
            return false;
         } else if (this.getSlowCallRateThreshold() != other.getSlowCallRateThreshold()) {
            return false;
         } else if (this.getSlowCallDurationThresholdMillis() != other.getSlowCallDurationThresholdMillis()) {
            return false;
         } else if (this.isPerServiceEnabled() != other.isPerServiceEnabled()) {
            return false;
         } else {
            label55: {
               Object this$baseNamePrefix = this.getBaseNamePrefix();
               Object other$baseNamePrefix = other.getBaseNamePrefix();
               if (this$baseNamePrefix == null) {
                  if (other$baseNamePrefix == null) {
                     break label55;
                  }
               } else if (this$baseNamePrefix.equals(other$baseNamePrefix)) {
                  break label55;
               }

               return false;
            }

            Object this$hostnames = this.getHostnames();
            Object other$hostnames = other.getHostnames();
            if (this$hostnames == null) {
               if (other$hostnames != null) {
                  return false;
               }
            } else if (!this$hostnames.equals(other$hostnames)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof CircuitBreakerProperties;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + (this.isEnabled() ? 79 : 97);
      result = result * 59 + this.getSlidingWindowSize();
      result = result * 59 + Float.floatToIntBits(this.getFailureRateThreshold());
      result = result * 59 + this.getWaitDurationInOpenStateMillis();
      result = result * 59 + this.getPermittedNumberOfCallsInHalfOpenState();
      result = result * 59 + this.getSlowCallRateThreshold();
      result = result * 59 + this.getSlowCallDurationThresholdMillis();
      result = result * 59 + (this.isPerServiceEnabled() ? 79 : 97);
      Object $baseNamePrefix = this.getBaseNamePrefix();
      result = result * 59 + ($baseNamePrefix == null ? 43 : $baseNamePrefix.hashCode());
      Object $hostnames = this.getHostnames();
      result = result * 59 + ($hostnames == null ? 43 : $hostnames.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      boolean var10000 = this.isEnabled();
      return "CircuitBreakerProperties(enabled=" + var10000 + ", baseNamePrefix=" + this.getBaseNamePrefix() + ", slidingWindowSize=" + this.getSlidingWindowSize() + ", failureRateThreshold=" + this.getFailureRateThreshold() + ", waitDurationInOpenStateMillis=" + this.getWaitDurationInOpenStateMillis() + ", permittedNumberOfCallsInHalfOpenState=" + this.getPermittedNumberOfCallsInHalfOpenState() + ", slowCallRateThreshold=" + this.getSlowCallRateThreshold() + ", slowCallDurationThresholdMillis=" + this.getSlowCallDurationThresholdMillis() + ", perServiceEnabled=" + this.isPerServiceEnabled() + ", hostnames=" + String.valueOf(this.getHostnames()) + ", circuitBreakerNameCache=" + String.valueOf(this.getCircuitBreakerNameCache()) + ")";
   }
}
