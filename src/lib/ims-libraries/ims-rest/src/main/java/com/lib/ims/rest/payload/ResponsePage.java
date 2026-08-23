package com.lib.ims.rest.payload;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.io.Serializable;
import java.util.List;
import lombok.Generated;



@JsonIgnoreProperties(
   ignoreUnknown = true
)
public class ResponsePage<T> implements Serializable {
   private static final long serialVersionUID = 1L;
   private List<T> content;

   @Generated
   public List<T> getContent() {
      return this.content;
   }

   @Generated
   public void setContent(List<T> content) {
      this.content = content;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ResponsePage)) {
         return false;
      } else {
         ResponsePage<?> other = (ResponsePage<?>)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
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
      return other instanceof ResponsePage;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $content = this.getContent();
      result = result * 59 + ($content == null ? 43 : $content.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      return "ResponsePage(content=" + String.valueOf(this.getContent()) + ")";
   }
}
