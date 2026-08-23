package com.lib.ims.core.exceptions;

public class ThirdPartyServiceException extends ApplicationException {
   public ThirdPartyServiceException() {
      super((IErrorCode)ErrorCode.THIRD_PARTY_SERVICE_ERROR);
   }

   public ThirdPartyServiceException(String mess) {
      super(mess);
   }
}
