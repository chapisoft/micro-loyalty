package com.lib.ims.rest.configuration;

import java.util.Arrays;
import lombok.Generated;



public class HttpConnPoolProperties {
   private int maxConnections = 25;
   private int maxPerConnections = 25;
   private int ttl = 120000;
   private int connectTimeout = 15000;
   private int socketTimeout = 60000;
   private int inactiveValidationTime;
   private int maxIdleTime = 20000;
   private int leaseRequestTimeout = 60000;
   private boolean evictExpiredConnections = false;
   private boolean evictIdleConnections = false;
   private int retryLimit = 3;
   private int retryWaitTimeMillis = 750;
   private Integer[] retryException = new Integer[]{500, 502, 503, 504};
   private CircuitBreakerProperties circuitBreaker = new CircuitBreakerProperties();

   @Generated
   public int getMaxConnections() {
      return this.maxConnections;
   }

   @Generated
   public int getMaxPerConnections() {
      return this.maxPerConnections;
   }

   @Generated
   public int getTtl() {
      return this.ttl;
   }

   @Generated
   public int getConnectTimeout() {
      return this.connectTimeout;
   }

   @Generated
   public int getSocketTimeout() {
      return this.socketTimeout;
   }

   @Generated
   public int getInactiveValidationTime() {
      return this.inactiveValidationTime;
   }

   @Generated
   public int getMaxIdleTime() {
      return this.maxIdleTime;
   }

   @Generated
   public int getLeaseRequestTimeout() {
      return this.leaseRequestTimeout;
   }

   @Generated
   public boolean isEvictExpiredConnections() {
      return this.evictExpiredConnections;
   }

   @Generated
   public boolean isEvictIdleConnections() {
      return this.evictIdleConnections;
   }

   @Generated
   public int getRetryLimit() {
      return this.retryLimit;
   }

   @Generated
   public int getRetryWaitTimeMillis() {
      return this.retryWaitTimeMillis;
   }

   @Generated
   public Integer[] getRetryException() {
      return this.retryException;
   }

   @Generated
   public CircuitBreakerProperties getCircuitBreaker() {
      return this.circuitBreaker;
   }

   @Generated
   public void setMaxConnections(int maxConnections) {
      this.maxConnections = maxConnections;
   }

   @Generated
   public void setMaxPerConnections(int maxPerConnections) {
      this.maxPerConnections = maxPerConnections;
   }

   @Generated
   public void setTtl(int ttl) {
      this.ttl = ttl;
   }

   @Generated
   public void setConnectTimeout(int connectTimeout) {
      this.connectTimeout = connectTimeout;
   }

   @Generated
   public void setSocketTimeout(int socketTimeout) {
      this.socketTimeout = socketTimeout;
   }

   @Generated
   public void setInactiveValidationTime(int inactiveValidationTime) {
      this.inactiveValidationTime = inactiveValidationTime;
   }

   @Generated
   public void setMaxIdleTime(int maxIdleTime) {
      this.maxIdleTime = maxIdleTime;
   }

   @Generated
   public void setLeaseRequestTimeout(int leaseRequestTimeout) {
      this.leaseRequestTimeout = leaseRequestTimeout;
   }

   @Generated
   public void setEvictExpiredConnections(boolean evictExpiredConnections) {
      this.evictExpiredConnections = evictExpiredConnections;
   }

   @Generated
   public void setEvictIdleConnections(boolean evictIdleConnections) {
      this.evictIdleConnections = evictIdleConnections;
   }

   @Generated
   public void setRetryLimit(int retryLimit) {
      this.retryLimit = retryLimit;
   }

   @Generated
   public void setRetryWaitTimeMillis(int retryWaitTimeMillis) {
      this.retryWaitTimeMillis = retryWaitTimeMillis;
   }

   @Generated
   public void setRetryException(Integer[] retryException) {
      this.retryException = retryException;
   }

   @Generated
   public void setCircuitBreaker(CircuitBreakerProperties circuitBreaker) {
      this.circuitBreaker = circuitBreaker;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof HttpConnPoolProperties)) {
         return false;
      } else {
         HttpConnPoolProperties other = (HttpConnPoolProperties)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.getMaxConnections() != other.getMaxConnections()) {
            return false;
         } else if (this.getMaxPerConnections() != other.getMaxPerConnections()) {
            return false;
         } else if (this.getTtl() != other.getTtl()) {
            return false;
         } else if (this.getConnectTimeout() != other.getConnectTimeout()) {
            return false;
         } else if (this.getSocketTimeout() != other.getSocketTimeout()) {
            return false;
         } else if (this.getInactiveValidationTime() != other.getInactiveValidationTime()) {
            return false;
         } else if (this.getMaxIdleTime() != other.getMaxIdleTime()) {
            return false;
         } else if (this.getLeaseRequestTimeout() != other.getLeaseRequestTimeout()) {
            return false;
         } else if (this.isEvictExpiredConnections() != other.isEvictExpiredConnections()) {
            return false;
         } else if (this.isEvictIdleConnections() != other.isEvictIdleConnections()) {
            return false;
         } else if (this.getRetryLimit() != other.getRetryLimit()) {
            return false;
         } else if (this.getRetryWaitTimeMillis() != other.getRetryWaitTimeMillis()) {
            return false;
         } else if (!Arrays.deepEquals(this.getRetryException(), other.getRetryException())) {
            return false;
         } else {
            Object this$circuitBreaker = this.getCircuitBreaker();
            Object other$circuitBreaker = other.getCircuitBreaker();
            if (this$circuitBreaker == null) {
               if (other$circuitBreaker != null) {
                  return false;
               }
            } else if (!this$circuitBreaker.equals(other$circuitBreaker)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof HttpConnPoolProperties;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + this.getMaxConnections();
      result = result * 59 + this.getMaxPerConnections();
      result = result * 59 + this.getTtl();
      result = result * 59 + this.getConnectTimeout();
      result = result * 59 + this.getSocketTimeout();
      result = result * 59 + this.getInactiveValidationTime();
      result = result * 59 + this.getMaxIdleTime();
      result = result * 59 + this.getLeaseRequestTimeout();
      result = result * 59 + (this.isEvictExpiredConnections() ? 79 : 97);
      result = result * 59 + (this.isEvictIdleConnections() ? 79 : 97);
      result = result * 59 + this.getRetryLimit();
      result = result * 59 + this.getRetryWaitTimeMillis();
      result = result * 59 + Arrays.deepHashCode(this.getRetryException());
      Object $circuitBreaker = this.getCircuitBreaker();
      result = result * 59 + ($circuitBreaker == null ? 43 : $circuitBreaker.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      int var10000 = this.getMaxConnections();
      return "HttpConnPoolProperties(maxConnections=" + var10000 + ", maxPerConnections=" + this.getMaxPerConnections() + ", ttl=" + this.getTtl() + ", connectTimeout=" + this.getConnectTimeout() + ", socketTimeout=" + this.getSocketTimeout() + ", inactiveValidationTime=" + this.getInactiveValidationTime() + ", maxIdleTime=" + this.getMaxIdleTime() + ", leaseRequestTimeout=" + this.getLeaseRequestTimeout() + ", evictExpiredConnections=" + this.isEvictExpiredConnections() + ", evictIdleConnections=" + this.isEvictIdleConnections() + ", retryLimit=" + this.getRetryLimit() + ", retryWaitTimeMillis=" + this.getRetryWaitTimeMillis() + ", retryException=" + Arrays.deepToString(this.getRetryException()) + ", circuitBreaker=" + String.valueOf(this.getCircuitBreaker()) + ")";
   }
}
