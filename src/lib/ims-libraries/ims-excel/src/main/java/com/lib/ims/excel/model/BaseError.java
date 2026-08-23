package com.lib.ims.excel.model;

import lombok.Generated;



public class BaseError {
   private String errors;

   @Generated
   public String getErrors() {
      return this.errors;
   }

   @Generated
   public void setErrors(String errors) {
      this.errors = errors;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof BaseError)) {
         return false;
      } else {
         BaseError other = (BaseError)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$errors = this.getErrors();
            Object other$errors = other.getErrors();
            if (this$errors == null) {
               if (other$errors != null) {
                  return false;
               }
            } else if (!this$errors.equals(other$errors)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof BaseError;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $errors = this.getErrors();
      result = result * 59 + ($errors == null ? 43 : $errors.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      return "BaseError(errors=" + this.getErrors() + ")";
   }
}
