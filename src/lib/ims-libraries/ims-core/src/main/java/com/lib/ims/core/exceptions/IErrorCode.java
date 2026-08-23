package com.lib.ims.core.exceptions;

import org.springframework.http.HttpStatus;

public interface IErrorCode {
   int getCode();

   String getMessageKey();

   HttpStatus getHttpStatus();

   String getDomain();

   String getFullCode();
}
