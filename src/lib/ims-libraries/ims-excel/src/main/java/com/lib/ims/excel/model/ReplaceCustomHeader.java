package com.lib.ims.excel.model;

import lombok.Generated;



public class ReplaceCustomHeader {
   private String key;
   private String position;

   @Generated
   public String getKey() {
      return this.key;
   }

   @Generated
   public String getPosition() {
      return this.position;
   }

   @Generated
   public void setKey(String key) {
      this.key = key;
   }

   @Generated
   public void setPosition(String position) {
      this.position = position;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ReplaceCustomHeader)) {
         return false;
      } else {
         ReplaceCustomHeader other = (ReplaceCustomHeader)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$key = this.getKey();
            Object other$key = other.getKey();
            if (this$key == null) {
               if (other$key != null) {
                  return false;
               }
            } else if (!this$key.equals(other$key)) {
               return false;
            }

            Object this$position = this.getPosition();
            Object other$position = other.getPosition();
            if (this$position == null) {
               if (other$position != null) {
                  return false;
               }
            } else if (!this$position.equals(other$position)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ReplaceCustomHeader;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $key = this.getKey();
      result = result * 59 + ($key == null ? 43 : $key.hashCode());
      Object $position = this.getPosition();
      result = result * 59 + ($position == null ? 43 : $position.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getKey();
      return "ReplaceCustomHeader(key=" + var10000 + ", position=" + this.getPosition() + ")";
   }
}
