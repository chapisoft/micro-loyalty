package com.lib.ims.core.model.response;

import java.util.Objects;

public record StreamResponseFile(String path, String fileName, String mineType) {
   public StreamResponseFile(String path, String fileName, String mineType) {
      this.path = path;
      this.fileName = fileName;
      this.mineType = mineType;
   }

   public boolean equals(Object o) {
      if (o != null && this.getClass() == o.getClass()) {
         StreamResponseFile that = (StreamResponseFile)o;
         return Objects.equals(this.path, that.path) && Objects.equals(this.fileName, that.fileName) && Objects.equals(this.mineType, that.mineType);
      } else {
         return false;
      }
   }

   public int hashCode() {
      return Objects.hash(new Object[]{this.path, this.fileName, this.mineType});
   }

   public String path() {
      return this.path;
   }

   public String fileName() {
      return this.fileName;
   }

   public String mineType() {
      return this.mineType;
   }
}
