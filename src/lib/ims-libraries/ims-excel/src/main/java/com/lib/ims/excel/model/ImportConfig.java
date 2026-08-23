package com.lib.ims.excel.model;

import java.util.List;
import lombok.Generated;



public class ImportConfig {
   private String tableName;
   private int firstDataRow;
   private int maxNumberOfRecord;
   private List<ImportData> data;

   @Generated
   public String getTableName() {
      return this.tableName;
   }

   @Generated
   public int getFirstDataRow() {
      return this.firstDataRow;
   }

   @Generated
   public int getMaxNumberOfRecord() {
      return this.maxNumberOfRecord;
   }

   @Generated
   public List<ImportData> getData() {
      return this.data;
   }

   @Generated
   public void setTableName(String tableName) {
      this.tableName = tableName;
   }

   @Generated
   public void setFirstDataRow(int firstDataRow) {
      this.firstDataRow = firstDataRow;
   }

   @Generated
   public void setMaxNumberOfRecord(int maxNumberOfRecord) {
      this.maxNumberOfRecord = maxNumberOfRecord;
   }

   @Generated
   public void setData(List<ImportData> data) {
      this.data = data;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ImportConfig)) {
         return false;
      } else {
         ImportConfig other = (ImportConfig)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.getFirstDataRow() != other.getFirstDataRow()) {
            return false;
         } else if (this.getMaxNumberOfRecord() != other.getMaxNumberOfRecord()) {
            return false;
         } else {
            label40: {
               Object this$tableName = this.getTableName();
               Object other$tableName = other.getTableName();
               if (this$tableName == null) {
                  if (other$tableName == null) {
                     break label40;
                  }
               } else if (this$tableName.equals(other$tableName)) {
                  break label40;
               }

               return false;
            }

            Object this$data = this.getData();
            Object other$data = other.getData();
            if (this$data == null) {
               if (other$data != null) {
                  return false;
               }
            } else if (!this$data.equals(other$data)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ImportConfig;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + this.getFirstDataRow();
      result = result * 59 + this.getMaxNumberOfRecord();
      Object $tableName = this.getTableName();
      result = result * 59 + ($tableName == null ? 43 : $tableName.hashCode());
      Object $data = this.getData();
      result = result * 59 + ($data == null ? 43 : $data.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getTableName();
      return "ImportConfig(tableName=" + var10000 + ", firstDataRow=" + this.getFirstDataRow() + ", maxNumberOfRecord=" + this.getMaxNumberOfRecord() + ", data=" + String.valueOf(this.getData()) + ")";
   }
}
