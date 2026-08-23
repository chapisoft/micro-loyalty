package com.lib.ims.core.exceptions;

import com.lib.ims.i18n.config.I18n;
import lombok.Generated;

public class FileException extends RuntimeException {
   private final byte[] fileData;
   private final String fileName;
   private final String mineType;

   public FileException(String message, byte[] fileData, String fileName, String mineType) {
      super(message);
      this.fileData = fileData;
      this.fileName = fileName;
      this.mineType = mineType;
   }

   public FileException(byte[] fileData, String fileName, String mineType) {
      super(I18n.get("common.error.file"));
      this.fileData = fileData;
      this.fileName = fileName;
      this.mineType = mineType;
   }

   @Generated
   public byte[] getFileData() {
      return this.fileData;
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
