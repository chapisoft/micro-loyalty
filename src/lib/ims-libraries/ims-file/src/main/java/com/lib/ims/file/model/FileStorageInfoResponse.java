package com.lib.ims.file.model;

import lombok.Generated;



public class FileStorageInfoResponse {
   private String fileName;
   private String storagePath;
   private String logicalPath;

   @Generated
   public String getFileName() {
      return this.fileName;
   }

   @Generated
   public String getStoragePath() {
      return this.storagePath;
   }

   @Generated
   public String getLogicalPath() {
      return this.logicalPath;
   }

   @Generated
   public void setFileName(String fileName) {
      this.fileName = fileName;
   }

   @Generated
   public void setStoragePath(String storagePath) {
      this.storagePath = storagePath;
   }

   @Generated
   public void setLogicalPath(String logicalPath) {
      this.logicalPath = logicalPath;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof FileStorageInfoResponse)) {
         return false;
      } else {
         FileStorageInfoResponse other = (FileStorageInfoResponse)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            label47: {
               Object this$fileName = this.getFileName();
               Object other$fileName = other.getFileName();
               if (this$fileName == null) {
                  if (other$fileName == null) {
                     break label47;
                  }
               } else if (this$fileName.equals(other$fileName)) {
                  break label47;
               }

               return false;
            }

            Object this$storagePath = this.getStoragePath();
            Object other$storagePath = other.getStoragePath();
            if (this$storagePath == null) {
               if (other$storagePath != null) {
                  return false;
               }
            } else if (!this$storagePath.equals(other$storagePath)) {
               return false;
            }

            Object this$logicalPath = this.getLogicalPath();
            Object other$logicalPath = other.getLogicalPath();
            if (this$logicalPath == null) {
               if (other$logicalPath != null) {
                  return false;
               }
            } else if (!this$logicalPath.equals(other$logicalPath)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof FileStorageInfoResponse;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $fileName = this.getFileName();
      result = result * 59 + ($fileName == null ? 43 : $fileName.hashCode());
      Object $storagePath = this.getStoragePath();
      result = result * 59 + ($storagePath == null ? 43 : $storagePath.hashCode());
      Object $logicalPath = this.getLogicalPath();
      result = result * 59 + ($logicalPath == null ? 43 : $logicalPath.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getFileName();
      return "FileStorageInfoResponse(fileName=" + var10000 + ", storagePath=" + this.getStoragePath() + ", logicalPath=" + this.getLogicalPath() + ")";
   }

   @Generated
   public FileStorageInfoResponse(String fileName, String storagePath, String logicalPath) {
      this.fileName = fileName;
      this.storagePath = storagePath;
      this.logicalPath = logicalPath;
   }
}
