package com.lib.ims.excel.model;

import java.util.List;
import lombok.Generated;



public class ExcelWriteOptions {
   private String sheetName = "Sheet1";
   private boolean includeHeader = true;
   private List<String> customHeaders;
   private String password;
   private boolean autoSizeColumn = true;

   @Generated
   public String getSheetName() {
      return this.sheetName;
   }

   @Generated
   public boolean isIncludeHeader() {
      return this.includeHeader;
   }

   @Generated
   public List<String> getCustomHeaders() {
      return this.customHeaders;
   }

   @Generated
   public String getPassword() {
      return this.password;
   }

   @Generated
   public boolean isAutoSizeColumn() {
      return this.autoSizeColumn;
   }

   @Generated
   public void setSheetName(String sheetName) {
      this.sheetName = sheetName;
   }

   @Generated
   public void setIncludeHeader(boolean includeHeader) {
      this.includeHeader = includeHeader;
   }

   @Generated
   public void setCustomHeaders(List<String> customHeaders) {
      this.customHeaders = customHeaders;
   }

   @Generated
   public void setPassword(String password) {
      this.password = password;
   }

   @Generated
   public void setAutoSizeColumn(boolean autoSizeColumn) {
      this.autoSizeColumn = autoSizeColumn;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ExcelWriteOptions)) {
         return false;
      } else {
         ExcelWriteOptions other = (ExcelWriteOptions)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.isIncludeHeader() != other.isIncludeHeader()) {
            return false;
         } else if (this.isAutoSizeColumn() != other.isAutoSizeColumn()) {
            return false;
         } else {
            label52: {
               Object this$sheetName = this.getSheetName();
               Object other$sheetName = other.getSheetName();
               if (this$sheetName == null) {
                  if (other$sheetName == null) {
                     break label52;
                  }
               } else if (this$sheetName.equals(other$sheetName)) {
                  break label52;
               }

               return false;
            }

            Object this$customHeaders = this.getCustomHeaders();
            Object other$customHeaders = other.getCustomHeaders();
            if (this$customHeaders == null) {
               if (other$customHeaders != null) {
                  return false;
               }
            } else if (!this$customHeaders.equals(other$customHeaders)) {
               return false;
            }

            Object this$password = this.getPassword();
            Object other$password = other.getPassword();
            if (this$password == null) {
               if (other$password != null) {
                  return false;
               }
            } else if (!this$password.equals(other$password)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ExcelWriteOptions;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + (this.isIncludeHeader() ? 79 : 97);
      result = result * 59 + (this.isAutoSizeColumn() ? 79 : 97);
      Object $sheetName = this.getSheetName();
      result = result * 59 + ($sheetName == null ? 43 : $sheetName.hashCode());
      Object $customHeaders = this.getCustomHeaders();
      result = result * 59 + ($customHeaders == null ? 43 : $customHeaders.hashCode());
      Object $password = this.getPassword();
      result = result * 59 + ($password == null ? 43 : $password.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getSheetName();
      return "ExcelWriteOptions(sheetName=" + var10000 + ", includeHeader=" + this.isIncludeHeader() + ", customHeaders=" + String.valueOf(this.getCustomHeaders()) + ", password=" + this.getPassword() + ", autoSizeColumn=" + this.isAutoSizeColumn() + ")";
   }
}
