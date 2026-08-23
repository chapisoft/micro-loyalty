package com.lib.ims.file.model;

import lombok.Generated;



public class LogicalPathResponse {
   private String zone;
   private String service;
   private String path;

   @Generated
   public String getZone() {
      return this.zone;
   }

   @Generated
   public String getService() {
      return this.service;
   }

   @Generated
   public String getPath() {
      return this.path;
   }

   @Generated
   public void setZone(String zone) {
      this.zone = zone;
   }

   @Generated
   public void setService(String service) {
      this.service = service;
   }

   @Generated
   public void setPath(String path) {
      this.path = path;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof LogicalPathResponse)) {
         return false;
      } else {
         LogicalPathResponse other = (LogicalPathResponse)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            label47: {
               Object this$zone = this.getZone();
               Object other$zone = other.getZone();
               if (this$zone == null) {
                  if (other$zone == null) {
                     break label47;
                  }
               } else if (this$zone.equals(other$zone)) {
                  break label47;
               }

               return false;
            }

            Object this$service = this.getService();
            Object other$service = other.getService();
            if (this$service == null) {
               if (other$service != null) {
                  return false;
               }
            } else if (!this$service.equals(other$service)) {
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
      return other instanceof LogicalPathResponse;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $zone = this.getZone();
      result = result * 59 + ($zone == null ? 43 : $zone.hashCode());
      Object $service = this.getService();
      result = result * 59 + ($service == null ? 43 : $service.hashCode());
      Object $path = this.getPath();
      result = result * 59 + ($path == null ? 43 : $path.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getZone();
      return "LogicalPathResponse(zone=" + var10000 + ", service=" + this.getService() + ", path=" + this.getPath() + ")";
   }
}
