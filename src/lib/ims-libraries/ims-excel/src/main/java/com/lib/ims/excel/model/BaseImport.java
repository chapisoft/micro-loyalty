package com.lib.ims.excel.model;

import com.alibaba.excel.annotation.ExcelIgnore;
import lombok.Generated;



public class BaseImport {
   @ExcelIgnore
   private Integer row;

   @Generated
   public Integer getRow() {
      return this.row;
   }

   @Generated
   public void setRow(Integer row) {
      this.row = row;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof BaseImport)) {
         return false;
      } else {
         BaseImport other = (BaseImport)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$row = this.getRow();
            Object other$row = other.getRow();
            if (this$row == null) {
               if (other$row != null) {
                  return false;
               }
            } else if (!this$row.equals(other$row)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof BaseImport;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $row = this.getRow();
      result = result * 59 + ($row == null ? 43 : $row.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      return "BaseImport(row=" + this.getRow() + ")";
   }
}
