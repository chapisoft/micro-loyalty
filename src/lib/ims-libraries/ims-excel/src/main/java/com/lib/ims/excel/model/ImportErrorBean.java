package com.lib.ims.excel.model;

import lombok.Generated;



public class ImportErrorBean {
   private int row;
   private int column;
   private String columnLabel;
   private String description;
   private Object content;

   public ImportErrorBean(int row, int column, String columnLabel, String description, Object content) {
      this.row = row + 1;
      this.column = column;
      this.columnLabel = columnLabel;
      this.description = description;
      this.content = content;
   }

   public ImportErrorBean(int row, String description, Object content) {
      this.row = row + 1;
      this.column = 0;
      this.columnLabel = null;
      this.description = description;
      this.content = content;
   }

   public ImportErrorBean(int row, String description) {
      this.row = row;
      this.description = description;
      this.column = 0;
      this.columnLabel = null;
      this.content = null;
   }

   @Generated
   public int getRow() {
      return this.row;
   }

   @Generated
   public int getColumn() {
      return this.column;
   }

   @Generated
   public String getColumnLabel() {
      return this.columnLabel;
   }

   @Generated
   public String getDescription() {
      return this.description;
   }

   @Generated
   public Object getContent() {
      return this.content;
   }

   @Generated
   public void setRow(int row) {
      this.row = row;
   }

   @Generated
   public void setColumn(int column) {
      this.column = column;
   }

   @Generated
   public void setColumnLabel(String columnLabel) {
      this.columnLabel = columnLabel;
   }

   @Generated
   public void setDescription(String description) {
      this.description = description;
   }

   @Generated
   public void setContent(Object content) {
      this.content = content;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ImportErrorBean)) {
         return false;
      } else {
         ImportErrorBean other = (ImportErrorBean)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.getRow() != other.getRow()) {
            return false;
         } else if (this.getColumn() != other.getColumn()) {
            return false;
         } else {
            label52: {
               Object this$columnLabel = this.getColumnLabel();
               Object other$columnLabel = other.getColumnLabel();
               if (this$columnLabel == null) {
                  if (other$columnLabel == null) {
                     break label52;
                  }
               } else if (this$columnLabel.equals(other$columnLabel)) {
                  break label52;
               }

               return false;
            }

            Object this$description = this.getDescription();
            Object other$description = other.getDescription();
            if (this$description == null) {
               if (other$description != null) {
                  return false;
               }
            } else if (!this$description.equals(other$description)) {
               return false;
            }

            Object this$content = this.getContent();
            Object other$content = other.getContent();
            if (this$content == null) {
               if (other$content != null) {
                  return false;
               }
            } else if (!this$content.equals(other$content)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ImportErrorBean;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + this.getRow();
      result = result * 59 + this.getColumn();
      Object $columnLabel = this.getColumnLabel();
      result = result * 59 + ($columnLabel == null ? 43 : $columnLabel.hashCode());
      Object $description = this.getDescription();
      result = result * 59 + ($description == null ? 43 : $description.hashCode());
      Object $content = this.getContent();
      result = result * 59 + ($content == null ? 43 : $content.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      int var10000 = this.getRow();
      return "ImportErrorBean(row=" + var10000 + ", column=" + this.getColumn() + ", columnLabel=" + this.getColumnLabel() + ", description=" + this.getDescription() + ", content=" + String.valueOf(this.getContent()) + ")";
   }
}
