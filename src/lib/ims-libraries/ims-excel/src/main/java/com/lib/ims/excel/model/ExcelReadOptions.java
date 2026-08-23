package com.lib.ims.excel.model;

import lombok.Generated;



public class ExcelReadOptions {
   private int sheetIndex = 0;
   private String sheetName;
   private int headerRowIndex = 0;
   private int dataRowIndex = 1;
   private boolean ignoreEmptyRow = true;
   private String password;

   @Generated
   public int getSheetIndex() {
      return this.sheetIndex;
   }

   @Generated
   public String getSheetName() {
      return this.sheetName;
   }

   @Generated
   public int getHeaderRowIndex() {
      return this.headerRowIndex;
   }

   @Generated
   public int getDataRowIndex() {
      return this.dataRowIndex;
   }

   @Generated
   public boolean isIgnoreEmptyRow() {
      return this.ignoreEmptyRow;
   }

   @Generated
   public String getPassword() {
      return this.password;
   }

   @Generated
   public void setSheetIndex(int sheetIndex) {
      this.sheetIndex = sheetIndex;
   }

   @Generated
   public void setSheetName(String sheetName) {
      this.sheetName = sheetName;
   }

   @Generated
   public void setHeaderRowIndex(int headerRowIndex) {
      this.headerRowIndex = headerRowIndex;
   }

   @Generated
   public void setDataRowIndex(int dataRowIndex) {
      this.dataRowIndex = dataRowIndex;
   }

   @Generated
   public void setIgnoreEmptyRow(boolean ignoreEmptyRow) {
      this.ignoreEmptyRow = ignoreEmptyRow;
   }

   @Generated
   public void setPassword(String password) {
      this.password = password;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ExcelReadOptions)) {
         return false;
      } else {
         ExcelReadOptions other = (ExcelReadOptions)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.getSheetIndex() != other.getSheetIndex()) {
            return false;
         } else if (this.getHeaderRowIndex() != other.getHeaderRowIndex()) {
            return false;
         } else if (this.getDataRowIndex() != other.getDataRowIndex()) {
            return false;
         } else if (this.isIgnoreEmptyRow() != other.isIgnoreEmptyRow()) {
            return false;
         } else {
            Object this$sheetName = this.getSheetName();
            Object other$sheetName = other.getSheetName();
            if (this$sheetName == null) {
               if (other$sheetName != null) {
                  return false;
               }
            } else if (!this$sheetName.equals(other$sheetName)) {
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
      return other instanceof ExcelReadOptions;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + this.getSheetIndex();
      result = result * 59 + this.getHeaderRowIndex();
      result = result * 59 + this.getDataRowIndex();
      result = result * 59 + (this.isIgnoreEmptyRow() ? 79 : 97);
      Object $sheetName = this.getSheetName();
      result = result * 59 + ($sheetName == null ? 43 : $sheetName.hashCode());
      Object $password = this.getPassword();
      result = result * 59 + ($password == null ? 43 : $password.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      int var10000 = this.getSheetIndex();
      return "ExcelReadOptions(sheetIndex=" + var10000 + ", sheetName=" + this.getSheetName() + ", headerRowIndex=" + this.getHeaderRowIndex() + ", dataRowIndex=" + this.getDataRowIndex() + ", ignoreEmptyRow=" + this.isIgnoreEmptyRow() + ", password=" + this.getPassword() + ")";
   }
}
