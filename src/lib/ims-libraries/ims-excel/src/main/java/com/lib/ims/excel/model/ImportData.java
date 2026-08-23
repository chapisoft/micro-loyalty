package com.lib.ims.excel.model;

import lombok.Generated;



public class ImportData {
   private String title;
   private String format;
   private Long type;
   private Integer stt;
   private Integer length;
   private boolean nullable;
   private String regex;
   private boolean unique;
   private boolean flagStatus;
   private boolean upperCase;
   private boolean trim;

   @Generated
   public String getTitle() {
      return this.title;
   }

   @Generated
   public String getFormat() {
      return this.format;
   }

   @Generated
   public Long getType() {
      return this.type;
   }

   @Generated
   public Integer getStt() {
      return this.stt;
   }

   @Generated
   public Integer getLength() {
      return this.length;
   }

   @Generated
   public boolean isNullable() {
      return this.nullable;
   }

   @Generated
   public String getRegex() {
      return this.regex;
   }

   @Generated
   public boolean isUnique() {
      return this.unique;
   }

   @Generated
   public boolean isFlagStatus() {
      return this.flagStatus;
   }

   @Generated
   public boolean isUpperCase() {
      return this.upperCase;
   }

   @Generated
   public boolean isTrim() {
      return this.trim;
   }

   @Generated
   public void setTitle(String title) {
      this.title = title;
   }

   @Generated
   public void setFormat(String format) {
      this.format = format;
   }

   @Generated
   public void setType(Long type) {
      this.type = type;
   }

   @Generated
   public void setStt(Integer stt) {
      this.stt = stt;
   }

   @Generated
   public void setLength(Integer length) {
      this.length = length;
   }

   @Generated
   public void setNullable(boolean nullable) {
      this.nullable = nullable;
   }

   @Generated
   public void setRegex(String regex) {
      this.regex = regex;
   }

   @Generated
   public void setUnique(boolean unique) {
      this.unique = unique;
   }

   @Generated
   public void setFlagStatus(boolean flagStatus) {
      this.flagStatus = flagStatus;
   }

   @Generated
   public void setUpperCase(boolean upperCase) {
      this.upperCase = upperCase;
   }

   @Generated
   public void setTrim(boolean trim) {
      this.trim = trim;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ImportData)) {
         return false;
      } else {
         ImportData other = (ImportData)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.isNullable() != other.isNullable()) {
            return false;
         } else if (this.isUnique() != other.isUnique()) {
            return false;
         } else if (this.isFlagStatus() != other.isFlagStatus()) {
            return false;
         } else if (this.isUpperCase() != other.isUpperCase()) {
            return false;
         } else if (this.isTrim() != other.isTrim()) {
            return false;
         } else {
            Object this$type = this.getType();
            Object other$type = other.getType();
            if (this$type == null) {
               if (other$type != null) {
                  return false;
               }
            } else if (!this$type.equals(other$type)) {
               return false;
            }

            label88: {
               Object this$stt = this.getStt();
               Object other$stt = other.getStt();
               if (this$stt == null) {
                  if (other$stt == null) {
                     break label88;
                  }
               } else if (this$stt.equals(other$stt)) {
                  break label88;
               }

               return false;
            }

            label81: {
               Object this$length = this.getLength();
               Object other$length = other.getLength();
               if (this$length == null) {
                  if (other$length == null) {
                     break label81;
                  }
               } else if (this$length.equals(other$length)) {
                  break label81;
               }

               return false;
            }

            Object this$title = this.getTitle();
            Object other$title = other.getTitle();
            if (this$title == null) {
               if (other$title != null) {
                  return false;
               }
            } else if (!this$title.equals(other$title)) {
               return false;
            }

            Object this$format = this.getFormat();
            Object other$format = other.getFormat();
            if (this$format == null) {
               if (other$format != null) {
                  return false;
               }
            } else if (!this$format.equals(other$format)) {
               return false;
            }

            Object this$regex = this.getRegex();
            Object other$regex = other.getRegex();
            if (this$regex == null) {
               if (other$regex != null) {
                  return false;
               }
            } else if (!this$regex.equals(other$regex)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ImportData;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + (this.isNullable() ? 79 : 97);
      result = result * 59 + (this.isUnique() ? 79 : 97);
      result = result * 59 + (this.isFlagStatus() ? 79 : 97);
      result = result * 59 + (this.isUpperCase() ? 79 : 97);
      result = result * 59 + (this.isTrim() ? 79 : 97);
      Object $type = this.getType();
      result = result * 59 + ($type == null ? 43 : $type.hashCode());
      Object $stt = this.getStt();
      result = result * 59 + ($stt == null ? 43 : $stt.hashCode());
      Object $length = this.getLength();
      result = result * 59 + ($length == null ? 43 : $length.hashCode());
      Object $title = this.getTitle();
      result = result * 59 + ($title == null ? 43 : $title.hashCode());
      Object $format = this.getFormat();
      result = result * 59 + ($format == null ? 43 : $format.hashCode());
      Object $regex = this.getRegex();
      result = result * 59 + ($regex == null ? 43 : $regex.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getTitle();
      return "ImportData(title=" + var10000 + ", format=" + this.getFormat() + ", type=" + this.getType() + ", stt=" + this.getStt() + ", length=" + this.getLength() + ", nullable=" + this.isNullable() + ", regex=" + this.getRegex() + ", unique=" + this.isUnique() + ", flagStatus=" + this.isFlagStatus() + ", upperCase=" + this.isUpperCase() + ", trim=" + this.isTrim() + ")";
   }
}
