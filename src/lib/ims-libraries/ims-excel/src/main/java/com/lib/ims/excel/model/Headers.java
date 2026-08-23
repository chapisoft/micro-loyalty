package com.lib.ims.excel.model;

import java.util.List;
import lombok.Generated;



public class Headers {
   private List<ReplaceCustomHeader> replaceCustom;

   @Generated
   public List<ReplaceCustomHeader> getReplaceCustom() {
      return this.replaceCustom;
   }

   @Generated
   public void setReplaceCustom(List<ReplaceCustomHeader> replaceCustom) {
      this.replaceCustom = replaceCustom;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof Headers)) {
         return false;
      } else {
         Headers other = (Headers)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$replaceCustom = this.getReplaceCustom();
            Object other$replaceCustom = other.getReplaceCustom();
            if (this$replaceCustom == null) {
               if (other$replaceCustom != null) {
                  return false;
               }
            } else if (!this$replaceCustom.equals(other$replaceCustom)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof Headers;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $replaceCustom = this.getReplaceCustom();
      result = result * 59 + ($replaceCustom == null ? 43 : $replaceCustom.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      return "Headers(replaceCustom=" + String.valueOf(this.getReplaceCustom()) + ")";
   }
}
