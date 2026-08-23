package com.lib.ims.word.model;

import lombok.Generated;
import org.docx4j.wml.SdtElement;



public class ContentControlInfo {
   private SdtElement sdtElement;
   private String tag;
   private String currentValue;
   private String tableName;
   private Integer rowIndex;
   private boolean isInTable;
   private boolean hasNestedTable;
   private String parentBlockTag;
   private String nestedTableName;
   private String path;

   @Generated
   ContentControlInfo(SdtElement sdtElement, String tag, String currentValue, String tableName, Integer rowIndex, boolean isInTable, boolean hasNestedTable, String parentBlockTag, String nestedTableName, String path) {
      this.sdtElement = sdtElement;
      this.tag = tag;
      this.currentValue = currentValue;
      this.tableName = tableName;
      this.rowIndex = rowIndex;
      this.isInTable = isInTable;
      this.hasNestedTable = hasNestedTable;
      this.parentBlockTag = parentBlockTag;
      this.nestedTableName = nestedTableName;
      this.path = path;
   }

   @Generated
   public static ContentControlInfo.ContentControlInfoBuilder builder() {
      return new ContentControlInfo.ContentControlInfoBuilder();
   }

   @Generated
   public SdtElement getSdtElement() {
      return this.sdtElement;
   }

   @Generated
   public String getTag() {
      return this.tag;
   }

   @Generated
   public String getCurrentValue() {
      return this.currentValue;
   }

   @Generated
   public String getTableName() {
      return this.tableName;
   }

   @Generated
   public Integer getRowIndex() {
      return this.rowIndex;
   }

   @Generated
   public boolean isInTable() {
      return this.isInTable;
   }

   @Generated
   public boolean isHasNestedTable() {
      return this.hasNestedTable;
   }

   @Generated
   public String getParentBlockTag() {
      return this.parentBlockTag;
   }

   @Generated
   public String getNestedTableName() {
      return this.nestedTableName;
   }

   @Generated
   public String getPath() {
      return this.path;
   }

   @Generated
   public void setSdtElement(SdtElement sdtElement) {
      this.sdtElement = sdtElement;
   }

   @Generated
   public void setTag(String tag) {
      this.tag = tag;
   }

   @Generated
   public void setCurrentValue(String currentValue) {
      this.currentValue = currentValue;
   }

   @Generated
   public void setTableName(String tableName) {
      this.tableName = tableName;
   }

   @Generated
   public void setRowIndex(Integer rowIndex) {
      this.rowIndex = rowIndex;
   }

   @Generated
   public void setInTable(boolean isInTable) {
      this.isInTable = isInTable;
   }

   @Generated
   public void setHasNestedTable(boolean hasNestedTable) {
      this.hasNestedTable = hasNestedTable;
   }

   @Generated
   public void setParentBlockTag(String parentBlockTag) {
      this.parentBlockTag = parentBlockTag;
   }

   @Generated
   public void setNestedTableName(String nestedTableName) {
      this.nestedTableName = nestedTableName;
   }

   @Generated
   public void setPath(String path) {
      this.path = path;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ContentControlInfo)) {
         return false;
      } else {
         ContentControlInfo other = (ContentControlInfo)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.isInTable() != other.isInTable()) {
            return false;
         } else if (this.isHasNestedTable() != other.isHasNestedTable()) {
            return false;
         } else {
            label112: {
               Object this$rowIndex = this.getRowIndex();
               Object other$rowIndex = other.getRowIndex();
               if (this$rowIndex == null) {
                  if (other$rowIndex == null) {
                     break label112;
                  }
               } else if (this$rowIndex.equals(other$rowIndex)) {
                  break label112;
               }

               return false;
            }

            label105: {
               Object this$sdtElement = this.getSdtElement();
               Object other$sdtElement = other.getSdtElement();
               if (this$sdtElement == null) {
                  if (other$sdtElement == null) {
                     break label105;
                  }
               } else if (this$sdtElement.equals(other$sdtElement)) {
                  break label105;
               }

               return false;
            }

            Object this$tag = this.getTag();
            Object other$tag = other.getTag();
            if (this$tag == null) {
               if (other$tag != null) {
                  return false;
               }
            } else if (!this$tag.equals(other$tag)) {
               return false;
            }

            label91: {
               Object this$currentValue = this.getCurrentValue();
               Object other$currentValue = other.getCurrentValue();
               if (this$currentValue == null) {
                  if (other$currentValue == null) {
                     break label91;
                  }
               } else if (this$currentValue.equals(other$currentValue)) {
                  break label91;
               }

               return false;
            }

            Object this$tableName = this.getTableName();
            Object other$tableName = other.getTableName();
            if (this$tableName == null) {
               if (other$tableName != null) {
                  return false;
               }
            } else if (!this$tableName.equals(other$tableName)) {
               return false;
            }

            label77: {
               Object this$parentBlockTag = this.getParentBlockTag();
               Object other$parentBlockTag = other.getParentBlockTag();
               if (this$parentBlockTag == null) {
                  if (other$parentBlockTag == null) {
                     break label77;
                  }
               } else if (this$parentBlockTag.equals(other$parentBlockTag)) {
                  break label77;
               }

               return false;
            }

            label70: {
               Object this$nestedTableName = this.getNestedTableName();
               Object other$nestedTableName = other.getNestedTableName();
               if (this$nestedTableName == null) {
                  if (other$nestedTableName == null) {
                     break label70;
                  }
               } else if (this$nestedTableName.equals(other$nestedTableName)) {
                  break label70;
               }

               return false;
            }

            Object this$path = this.getPath();
            Object other$path = other.getPath();
            if (this$path == null) {
               if (other$path != null) {
                  return false;
               }
            } else if (!this$path.equals(other$path)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ContentControlInfo;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + (this.isInTable() ? 79 : 97);
      result = result * 59 + (this.isHasNestedTable() ? 79 : 97);
      Object $rowIndex = this.getRowIndex();
      result = result * 59 + ($rowIndex == null ? 43 : $rowIndex.hashCode());
      Object $sdtElement = this.getSdtElement();
      result = result * 59 + ($sdtElement == null ? 43 : $sdtElement.hashCode());
      Object $tag = this.getTag();
      result = result * 59 + ($tag == null ? 43 : $tag.hashCode());
      Object $currentValue = this.getCurrentValue();
      result = result * 59 + ($currentValue == null ? 43 : $currentValue.hashCode());
      Object $tableName = this.getTableName();
      result = result * 59 + ($tableName == null ? 43 : $tableName.hashCode());
      Object $parentBlockTag = this.getParentBlockTag();
      result = result * 59 + ($parentBlockTag == null ? 43 : $parentBlockTag.hashCode());
      Object $nestedTableName = this.getNestedTableName();
      result = result * 59 + ($nestedTableName == null ? 43 : $nestedTableName.hashCode());
      Object $path = this.getPath();
      result = result * 59 + ($path == null ? 43 : $path.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = String.valueOf(this.getSdtElement());
      return "ContentControlInfo(sdtElement=" + var10000 + ", tag=" + this.getTag() + ", currentValue=" + this.getCurrentValue() + ", tableName=" + this.getTableName() + ", rowIndex=" + this.getRowIndex() + ", isInTable=" + this.isInTable() + ", hasNestedTable=" + this.isHasNestedTable() + ", parentBlockTag=" + this.getParentBlockTag() + ", nestedTableName=" + this.getNestedTableName() + ", path=" + this.getPath() + ")";
   }

   @Generated
   public static class ContentControlInfoBuilder {
      @Generated
      private SdtElement sdtElement;
      @Generated
      private String tag;
      @Generated
      private String currentValue;
      @Generated
      private String tableName;
      @Generated
      private Integer rowIndex;
      @Generated
      private boolean isInTable;
      @Generated
      private boolean hasNestedTable;
      @Generated
      private String parentBlockTag;
      @Generated
      private String nestedTableName;
      @Generated
      private String path;

      @Generated
      ContentControlInfoBuilder() {
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder sdtElement(SdtElement sdtElement) {
         this.sdtElement = sdtElement;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder tag(String tag) {
         this.tag = tag;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder currentValue(String currentValue) {
         this.currentValue = currentValue;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder tableName(String tableName) {
         this.tableName = tableName;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder rowIndex(Integer rowIndex) {
         this.rowIndex = rowIndex;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder isInTable(boolean isInTable) {
         this.isInTable = isInTable;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder hasNestedTable(boolean hasNestedTable) {
         this.hasNestedTable = hasNestedTable;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder parentBlockTag(String parentBlockTag) {
         this.parentBlockTag = parentBlockTag;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder nestedTableName(String nestedTableName) {
         this.nestedTableName = nestedTableName;
         return this;
      }

      @Generated
      public ContentControlInfo.ContentControlInfoBuilder path(String path) {
         this.path = path;
         return this;
      }

      @Generated
      public ContentControlInfo build() {
         return new ContentControlInfo(this.sdtElement, this.tag, this.currentValue, this.tableName, this.rowIndex, this.isInTable, this.hasNestedTable, this.parentBlockTag, this.nestedTableName, this.path);
      }

      @Generated
      public String toString() {
         String var10000 = String.valueOf(this.sdtElement);
         return "ContentControlInfo.ContentControlInfoBuilder(sdtElement=" + var10000 + ", tag=" + this.tag + ", currentValue=" + this.currentValue + ", tableName=" + this.tableName + ", rowIndex=" + this.rowIndex + ", isInTable=" + this.isInTable + ", hasNestedTable=" + this.hasNestedTable + ", parentBlockTag=" + this.parentBlockTag + ", nestedTableName=" + this.nestedTableName + ", path=" + this.path + ")";
      }
   }
}
