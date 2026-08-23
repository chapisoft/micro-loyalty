package com.lib.ims.file.config;

import java.util.HashMap;
import java.util.Map;
import lombok.Generated;
import org.springframework.boot.context.properties.ConfigurationProperties;


@ConfigurationProperties(
   prefix = "file.storage"
)
@SuppressWarnings({"unchecked", "rawtypes"})
public class FileStorageProperties {
   private String applicationName;
   private Map<String, String> nasLocations = new HashMap();

   @Generated
   public String getApplicationName() {
      return this.applicationName;
   }

   @Generated
   public Map<String, String> getNasLocations() {
      return this.nasLocations;
   }

   @Generated
   public void setApplicationName(String applicationName) {
      this.applicationName = applicationName;
   }

   @Generated
   public void setNasLocations(Map<String, String> nasLocations) {
      this.nasLocations = nasLocations;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof FileStorageProperties)) {
         return false;
      } else {
         FileStorageProperties other = (FileStorageProperties)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$applicationName = this.getApplicationName();
            Object other$applicationName = other.getApplicationName();
            if (this$applicationName == null) {
               if (other$applicationName != null) {
                  return false;
               }
            } else if (!this$applicationName.equals(other$applicationName)) {
               return false;
            }

            Object this$nasLocations = this.getNasLocations();
            Object other$nasLocations = other.getNasLocations();
            if (this$nasLocations == null) {
               if (other$nasLocations != null) {
                  return false;
               }
            } else if (!this$nasLocations.equals(other$nasLocations)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof FileStorageProperties;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $applicationName = this.getApplicationName();
      result = result * 59 + ($applicationName == null ? 43 : $applicationName.hashCode());
      Object $nasLocations = this.getNasLocations();
      result = result * 59 + ($nasLocations == null ? 43 : $nasLocations.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getApplicationName();
      return "FileStorageProperties(applicationName=" + var10000 + ", nasLocations=" + String.valueOf(this.getNasLocations()) + ")";
   }
}
