package com.lib.ims.core.model;

import lombok.Generated;



public class BaseServiceHeader {
   protected String sourceAppIp;
   protected String destAppIp;
   protected int destAppPort;
   protected String httpPath;
   protected String httpMethod;

   @Generated
   protected BaseServiceHeader(BaseServiceHeader.BaseServiceHeaderBuilder<?, ?> b) {
      this.sourceAppIp = b.sourceAppIp;
      this.destAppIp = b.destAppIp;
      this.destAppPort = b.destAppPort;
      this.httpPath = b.httpPath;
      this.httpMethod = b.httpMethod;
   }

   @Generated
   public static BaseServiceHeader.BaseServiceHeaderBuilder<?, ?> builder() {
      return new BaseServiceHeader.BaseServiceHeaderBuilderImpl();
   }

   @Generated
   public String getSourceAppIp() {
      return this.sourceAppIp;
   }

   @Generated
   public String getDestAppIp() {
      return this.destAppIp;
   }

   @Generated
   public int getDestAppPort() {
      return this.destAppPort;
   }

   @Generated
   public String getHttpPath() {
      return this.httpPath;
   }

   @Generated
   public String getHttpMethod() {
      return this.httpMethod;
   }

   @Generated
   public void setSourceAppIp(String sourceAppIp) {
      this.sourceAppIp = sourceAppIp;
   }

   @Generated
   public void setDestAppIp(String destAppIp) {
      this.destAppIp = destAppIp;
   }

   @Generated
   public void setDestAppPort(int destAppPort) {
      this.destAppPort = destAppPort;
   }

   @Generated
   public void setHttpPath(String httpPath) {
      this.httpPath = httpPath;
   }

   @Generated
   public void setHttpMethod(String httpMethod) {
      this.httpMethod = httpMethod;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof BaseServiceHeader)) {
         return false;
      } else {
         BaseServiceHeader other = (BaseServiceHeader)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.getDestAppPort() != other.getDestAppPort()) {
            return false;
         } else {
            label61: {
               Object this$sourceAppIp = this.getSourceAppIp();
               Object other$sourceAppIp = other.getSourceAppIp();
               if (this$sourceAppIp == null) {
                  if (other$sourceAppIp == null) {
                     break label61;
                  }
               } else if (this$sourceAppIp.equals(other$sourceAppIp)) {
                  break label61;
               }

               return false;
            }

            label54: {
               Object this$destAppIp = this.getDestAppIp();
               Object other$destAppIp = other.getDestAppIp();
               if (this$destAppIp == null) {
                  if (other$destAppIp == null) {
                     break label54;
                  }
               } else if (this$destAppIp.equals(other$destAppIp)) {
                  break label54;
               }

               return false;
            }

            Object this$httpPath = this.getHttpPath();
            Object other$httpPath = other.getHttpPath();
            if (this$httpPath == null) {
               if (other$httpPath != null) {
                  return false;
               }
            } else if (!this$httpPath.equals(other$httpPath)) {
               return false;
            }

            Object this$httpMethod = this.getHttpMethod();
            Object other$httpMethod = other.getHttpMethod();
            if (this$httpMethod == null) {
               if (other$httpMethod != null) {
                  return false;
               }
            } else if (!this$httpMethod.equals(other$httpMethod)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof BaseServiceHeader;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      result = result * 59 + this.getDestAppPort();
      Object $sourceAppIp = this.getSourceAppIp();
      result = result * 59 + ($sourceAppIp == null ? 43 : $sourceAppIp.hashCode());
      Object $destAppIp = this.getDestAppIp();
      result = result * 59 + ($destAppIp == null ? 43 : $destAppIp.hashCode());
      Object $httpPath = this.getHttpPath();
      result = result * 59 + ($httpPath == null ? 43 : $httpPath.hashCode());
      Object $httpMethod = this.getHttpMethod();
      result = result * 59 + ($httpMethod == null ? 43 : $httpMethod.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getSourceAppIp();
      return "BaseServiceHeader(sourceAppIp=" + var10000 + ", destAppIp=" + this.getDestAppIp() + ", destAppPort=" + this.getDestAppPort() + ", httpPath=" + this.getHttpPath() + ", httpMethod=" + this.getHttpMethod() + ")";
   }

   @Generated
   public BaseServiceHeader(String sourceAppIp, String destAppIp, int destAppPort, String httpPath, String httpMethod) {
      this.sourceAppIp = sourceAppIp;
      this.destAppIp = destAppIp;
      this.destAppPort = destAppPort;
      this.httpPath = httpPath;
      this.httpMethod = httpMethod;
   }

   @Generated
   public BaseServiceHeader() {
   }

   @Generated
   public abstract static class BaseServiceHeaderBuilder<C extends BaseServiceHeader, B extends BaseServiceHeader.BaseServiceHeaderBuilder<C, B>> {
      @Generated
      private String sourceAppIp;
      @Generated
      private String destAppIp;
      @Generated
      private int destAppPort;
      @Generated
      private String httpPath;
      @Generated
      private String httpMethod;

      @Generated
      public B sourceAppIp(String sourceAppIp) {
         this.sourceAppIp = sourceAppIp;
         return this.self();
      }

      @Generated
      public B destAppIp(String destAppIp) {
         this.destAppIp = destAppIp;
         return this.self();
      }

      @Generated
      public B destAppPort(int destAppPort) {
         this.destAppPort = destAppPort;
         return this.self();
      }

      @Generated
      public B httpPath(String httpPath) {
         this.httpPath = httpPath;
         return this.self();
      }

      @Generated
      public B httpMethod(String httpMethod) {
         this.httpMethod = httpMethod;
         return this.self();
      }

      @Generated
      protected abstract B self();

      @Generated
      public abstract C build();

      @Generated
      public String toString() {
         return "BaseServiceHeader.BaseServiceHeaderBuilder(sourceAppIp=" + this.sourceAppIp + ", destAppIp=" + this.destAppIp + ", destAppPort=" + this.destAppPort + ", httpPath=" + this.httpPath + ", httpMethod=" + this.httpMethod + ")";
      }
   }

   @Generated
   private static final class BaseServiceHeaderBuilderImpl extends BaseServiceHeader.BaseServiceHeaderBuilder<BaseServiceHeader, BaseServiceHeader.BaseServiceHeaderBuilderImpl> {
      @Generated
      protected BaseServiceHeader.BaseServiceHeaderBuilderImpl self() {
         return this;
      }

      @Generated
      public BaseServiceHeader build() {
         return new BaseServiceHeader(this);
      }
   }
}
