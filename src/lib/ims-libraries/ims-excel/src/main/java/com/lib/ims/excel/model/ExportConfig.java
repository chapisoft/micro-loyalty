package com.lib.ims.excel.model;

import java.util.List;
import lombok.Generated;



public class ExportConfig {
   private String fileName;
   private List<SheetModel> sheet;

   @Generated
   public String getFileName() {
      return this.fileName;
   }

   @Generated
   public List<SheetModel> getSheet() {
      return this.sheet;
   }

   @Generated
   public void setFileName(String fileName) {
      this.fileName = fileName;
   }

   @Generated
   public void setSheet(List<SheetModel> sheet) {
      this.sheet = sheet;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ExportConfig)) {
         return false;
      } else {
         ExportConfig other = (ExportConfig)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$fileName = this.getFileName();
            Object other$fileName = other.getFileName();
            if (this$fileName == null) {
               if (other$fileName != null) {
                  return false;
               }
            } else if (!this$fileName.equals(other$fileName)) {
               return false;
            }

            Object this$sheet = this.getSheet();
            Object other$sheet = other.getSheet();
            if (this$sheet == null) {
               if (other$sheet != null) {
                  return false;
               }
            } else if (!this$sheet.equals(other$sheet)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ExportConfig;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $fileName = this.getFileName();
      result = result * 59 + ($fileName == null ? 43 : $fileName.hashCode());
      Object $sheet = this.getSheet();
      result = result * 59 + ($sheet == null ? 43 : $sheet.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getFileName();
      return "ExportConfig(fileName=" + var10000 + ", sheet=" + String.valueOf(this.getSheet()) + ")";
   }
}
