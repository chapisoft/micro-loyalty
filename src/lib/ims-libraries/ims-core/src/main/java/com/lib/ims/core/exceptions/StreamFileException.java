package com.lib.ims.core.exceptions;

import com.lib.ims.i18n.config.I18n;
import lombok.Generated;

public class StreamFileException extends RuntimeException {
   private final String path;
   private final String fileName;
   private final String mineType;

   public StreamFileException(String message, String path, String fileName, String mineType) {
      super(message);
      this.path = path;
      this.fileName = fileName;
      this.mineType = mineType;
   }

   public StreamFileException(String path, String fileName, String mineType) {
      super(I18n.get("common.error.file"));
      this.path = path;
      this.fileName = fileName;
      this.mineType = mineType;
   }

   @Generated
   public String getPath() {
      return this.path;
   }

   @Generated
   public String getFileName() {
      return this.fileName;
   }

   @Generated
   public String getMineType() {
      return this.mineType;
   }
}
