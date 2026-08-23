package com.lib.ims.excel.model;

import java.util.List;
import lombok.Generated;



public class SheetModel {
   private Integer stt;
   private Integer startDataRow;
   private Headers headers;
   private Boolean border = true;
   private List<ImportData> data;

   @Generated
   public Integer getStt() {
      return this.stt;
   }

   @Generated
   public Integer getStartDataRow() {
      return this.startDataRow;
   }

   @Generated
   public Headers getHeaders() {
      return this.headers;
   }

   @Generated
   public Boolean getBorder() {
      return this.border;
   }

   @Generated
   public List<ImportData> getData() {
      return this.data;
   }

   @Generated
   public void setStt(Integer stt) {
      this.stt = stt;
   }

   @Generated
   public void setStartDataRow(Integer startDataRow) {
      this.startDataRow = startDataRow;
   }

   @Generated
   public void setHeaders(Headers headers) {
      this.headers = headers;
   }

   @Generated
   public void setBorder(Boolean border) {
      this.border = border;
   }

   @Generated
   public void setData(List<ImportData> data) {
      this.data = data;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof SheetModel)) {
         return false;
      } else {
         SheetModel other = (SheetModel)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            label71: {
               Object this$stt = this.getStt();
               Object other$stt = other.getStt();
               if (this$stt == null) {
                  if (other$stt == null) {
                     break label71;
                  }
               } else if (this$stt.equals(other$stt)) {
                  break label71;
               }

               return false;
            }

            Object this$startDataRow = this.getStartDataRow();
            Object other$startDataRow = other.getStartDataRow();
            if (this$startDataRow == null) {
               if (other$startDataRow != null) {
                  return false;
               }
            } else if (!this$startDataRow.equals(other$startDataRow)) {
               return false;
            }

            label57: {
               Object this$border = this.getBorder();
               Object other$border = other.getBorder();
               if (this$border == null) {
                  if (other$border == null) {
                     break label57;
                  }
               } else if (this$border.equals(other$border)) {
                  break label57;
               }

               return false;
            }

            Object this$headers = this.getHeaders();
            Object other$headers = other.getHeaders();
            if (this$headers == null) {
               if (other$headers != null) {
                  return false;
               }
            } else if (!this$headers.equals(other$headers)) {
               return false;
            }

            Object this$data = this.getData();
            Object other$data = other.getData();
            if (this$data == null) {
               if (other$data == null) {
                  return true;
               }
            } else if (this$data.equals(other$data)) {
               return true;
            }

            return false;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof SheetModel;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $stt = this.getStt();
      result = result * 59 + ($stt == null ? 43 : $stt.hashCode());
      Object $startDataRow = this.getStartDataRow();
      result = result * 59 + ($startDataRow == null ? 43 : $startDataRow.hashCode());
      Object $border = this.getBorder();
      result = result * 59 + ($border == null ? 43 : $border.hashCode());
      Object $headers = this.getHeaders();
      result = result * 59 + ($headers == null ? 43 : $headers.hashCode());
      Object $data = this.getData();
      result = result * 59 + ($data == null ? 43 : $data.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      Integer var10000 = this.getStt();
      return "SheetModel(stt=" + var10000 + ", startDataRow=" + this.getStartDataRow() + ", headers=" + String.valueOf(this.getHeaders()) + ", border=" + this.getBorder() + ", data=" + String.valueOf(this.getData()) + ")";
   }
}
