package com.lib.ims.core.exceptions;

public class CircuitBreakerOpenException extends ApplicationException {
   public CircuitBreakerOpenException() {
      super("Circuit breaker đang ở trạng thái mở. Dịch vụ tạm thời không khả dụng.");
   }

   public CircuitBreakerOpenException(String message) {
      super(message);
   }
}
