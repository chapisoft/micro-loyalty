package com.lib.ims.core.log;

import java.util.Arrays;
import lombok.Generated;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;



@Component
@ConfigurationProperties(
   prefix = "ims.logbook"
)
public class LogbookCustomProperties {
   private String applicationName;
   private String[] skipBodyPaths;

   @Generated
   public String getApplicationName() {
      return this.applicationName;
   }

   @Generated
   public String[] getSkipBodyPaths() {
      return this.skipBodyPaths;
   }

   @Generated
   public void setApplicationName(String applicationName) {
      this.applicationName = applicationName;
   }

   @Generated
   public void setSkipBodyPaths(String[] skipBodyPaths) {
      this.skipBodyPaths = skipBodyPaths;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof LogbookCustomProperties)) {
         return false;
      } else {
         LogbookCustomProperties other = (LogbookCustomProperties)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$applicationName = this.getApplicationName();
            Object other$applicationName = other.getApplicationName();
            if (this$applicationName == null) {
               if (other$applicationName == null) {
                  return Arrays.deepEquals(this.getSkipBodyPaths(), other.getSkipBodyPaths());
               }
            } else if (this$applicationName.equals(other$applicationName)) {
               return Arrays.deepEquals(this.getSkipBodyPaths(), other.getSkipBodyPaths());
            }

            return false;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof LogbookCustomProperties;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $applicationName = this.getApplicationName();
      result = result * 59 + ($applicationName == null ? 43 : $applicationName.hashCode());
      result = result * 59 + Arrays.deepHashCode(this.getSkipBodyPaths());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getApplicationName();
      return "LogbookCustomProperties(applicationName=" + var10000 + ", skipBodyPaths=" + Arrays.deepToString(this.getSkipBodyPaths()) + ")";
   }
}
