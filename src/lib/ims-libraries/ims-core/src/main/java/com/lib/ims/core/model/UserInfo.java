package com.lib.ims.core.model;

import lombok.Generated;



public class UserInfo {
   private String userId;
   private String username;
   private String empCode;
   private String email;
   private Integer isTracing;
   private Integer isLocked;
   private String reasonLock;
   private Integer isInternal;
   private String fullName;
   private String mobile;
   private Long jobId;
   private String jobCode;
   private String jobName;
   private Long orgId;
   private String orgCode;
   private String orgName;
   private String orgCodeManage;
   private String orgNameManage;
   private String orgCodeLevel1;
   private String orgNameLevel1;
   private String orgCodeLevel2;
   private String orgNameLevel2;
   private String orgCodeLevel3;
   private String orgNameLevel3;
   private String orgCodeLevel4;
   private String orgNameLevel4;

   @Generated
   public static UserInfo.UserInfoBuilder builder() {
      return new UserInfo.UserInfoBuilder();
   }

   @Generated
   public String getUserId() {
      return this.userId;
   }

   @Generated
   public String getUsername() {
      return this.username;
   }

   @Generated
   public String getEmpCode() {
      return this.empCode;
   }

   @Generated
   public String getEmail() {
      return this.email;
   }

   @Generated
   public Integer getIsTracing() {
      return this.isTracing;
   }

   @Generated
   public Integer getIsLocked() {
      return this.isLocked;
   }

   @Generated
   public String getReasonLock() {
      return this.reasonLock;
   }

   @Generated
   public Integer getIsInternal() {
      return this.isInternal;
   }

   @Generated
   public String getFullName() {
      return this.fullName;
   }

   @Generated
   public String getMobile() {
      return this.mobile;
   }

   @Generated
   public Long getJobId() {
      return this.jobId;
   }

   @Generated
   public String getJobCode() {
      return this.jobCode;
   }

   @Generated
   public String getJobName() {
      return this.jobName;
   }

   @Generated
   public Long getOrgId() {
      return this.orgId;
   }

   @Generated
   public String getOrgCode() {
      return this.orgCode;
   }

   @Generated
   public String getOrgName() {
      return this.orgName;
   }

   @Generated
   public String getOrgCodeManage() {
      return this.orgCodeManage;
   }

   @Generated
   public String getOrgNameManage() {
      return this.orgNameManage;
   }

   @Generated
   public String getOrgCodeLevel1() {
      return this.orgCodeLevel1;
   }

   @Generated
   public String getOrgNameLevel1() {
      return this.orgNameLevel1;
   }

   @Generated
   public String getOrgCodeLevel2() {
      return this.orgCodeLevel2;
   }

   @Generated
   public String getOrgNameLevel2() {
      return this.orgNameLevel2;
   }

   @Generated
   public String getOrgCodeLevel3() {
      return this.orgCodeLevel3;
   }

   @Generated
   public String getOrgNameLevel3() {
      return this.orgNameLevel3;
   }

   @Generated
   public String getOrgCodeLevel4() {
      return this.orgCodeLevel4;
   }

   @Generated
   public String getOrgNameLevel4() {
      return this.orgNameLevel4;
   }

   @Generated
   public void setUserId(String userId) {
      this.userId = userId;
   }

   @Generated
   public void setUsername(String username) {
      this.username = username;
   }

   @Generated
   public void setEmpCode(String empCode) {
      this.empCode = empCode;
   }

   @Generated
   public void setEmail(String email) {
      this.email = email;
   }

   @Generated
   public void setIsTracing(Integer isTracing) {
      this.isTracing = isTracing;
   }

   @Generated
   public void setIsLocked(Integer isLocked) {
      this.isLocked = isLocked;
   }

   @Generated
   public void setReasonLock(String reasonLock) {
      this.reasonLock = reasonLock;
   }

   @Generated
   public void setIsInternal(Integer isInternal) {
      this.isInternal = isInternal;
   }

   @Generated
   public void setFullName(String fullName) {
      this.fullName = fullName;
   }

   @Generated
   public void setMobile(String mobile) {
      this.mobile = mobile;
   }

   @Generated
   public void setJobId(Long jobId) {
      this.jobId = jobId;
   }

   @Generated
   public void setJobCode(String jobCode) {
      this.jobCode = jobCode;
   }

   @Generated
   public void setJobName(String jobName) {
      this.jobName = jobName;
   }

   @Generated
   public void setOrgId(Long orgId) {
      this.orgId = orgId;
   }

   @Generated
   public void setOrgCode(String orgCode) {
      this.orgCode = orgCode;
   }

   @Generated
   public void setOrgName(String orgName) {
      this.orgName = orgName;
   }

   @Generated
   public void setOrgCodeManage(String orgCodeManage) {
      this.orgCodeManage = orgCodeManage;
   }

   @Generated
   public void setOrgNameManage(String orgNameManage) {
      this.orgNameManage = orgNameManage;
   }

   @Generated
   public void setOrgCodeLevel1(String orgCodeLevel1) {
      this.orgCodeLevel1 = orgCodeLevel1;
   }

   @Generated
   public void setOrgNameLevel1(String orgNameLevel1) {
      this.orgNameLevel1 = orgNameLevel1;
   }

   @Generated
   public void setOrgCodeLevel2(String orgCodeLevel2) {
      this.orgCodeLevel2 = orgCodeLevel2;
   }

   @Generated
   public void setOrgNameLevel2(String orgNameLevel2) {
      this.orgNameLevel2 = orgNameLevel2;
   }

   @Generated
   public void setOrgCodeLevel3(String orgCodeLevel3) {
      this.orgCodeLevel3 = orgCodeLevel3;
   }

   @Generated
   public void setOrgNameLevel3(String orgNameLevel3) {
      this.orgNameLevel3 = orgNameLevel3;
   }

   @Generated
   public void setOrgCodeLevel4(String orgCodeLevel4) {
      this.orgCodeLevel4 = orgCodeLevel4;
   }

   @Generated
   public void setOrgNameLevel4(String orgNameLevel4) {
      this.orgNameLevel4 = orgNameLevel4;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof UserInfo)) {
         return false;
      } else {
         UserInfo other = (UserInfo)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            Object this$isTracing = this.getIsTracing();
            Object other$isTracing = other.getIsTracing();
            if (this$isTracing == null) {
               if (other$isTracing != null) {
                  return false;
               }
            } else if (!this$isTracing.equals(other$isTracing)) {
               return false;
            }

            Object this$isLocked = this.getIsLocked();
            Object other$isLocked = other.getIsLocked();
            if (this$isLocked == null) {
               if (other$isLocked != null) {
                  return false;
               }
            } else if (!this$isLocked.equals(other$isLocked)) {
               return false;
            }

            Object this$isInternal = this.getIsInternal();
            Object other$isInternal = other.getIsInternal();
            if (this$isInternal == null) {
               if (other$isInternal != null) {
                  return false;
               }
            } else if (!this$isInternal.equals(other$isInternal)) {
               return false;
            }

            label302: {
               Object this$jobId = this.getJobId();
               Object other$jobId = other.getJobId();
               if (this$jobId == null) {
                  if (other$jobId == null) {
                     break label302;
                  }
               } else if (this$jobId.equals(other$jobId)) {
                  break label302;
               }

               return false;
            }

            label295: {
               Object this$orgId = this.getOrgId();
               Object other$orgId = other.getOrgId();
               if (this$orgId == null) {
                  if (other$orgId == null) {
                     break label295;
                  }
               } else if (this$orgId.equals(other$orgId)) {
                  break label295;
               }

               return false;
            }

            Object this$userId = this.getUserId();
            Object other$userId = other.getUserId();
            if (this$userId == null) {
               if (other$userId != null) {
                  return false;
               }
            } else if (!this$userId.equals(other$userId)) {
               return false;
            }

            label281: {
               Object this$username = this.getUsername();
               Object other$username = other.getUsername();
               if (this$username == null) {
                  if (other$username == null) {
                     break label281;
                  }
               } else if (this$username.equals(other$username)) {
                  break label281;
               }

               return false;
            }

            label274: {
               Object this$empCode = this.getEmpCode();
               Object other$empCode = other.getEmpCode();
               if (this$empCode == null) {
                  if (other$empCode == null) {
                     break label274;
                  }
               } else if (this$empCode.equals(other$empCode)) {
                  break label274;
               }

               return false;
            }

            Object this$email = this.getEmail();
            Object other$email = other.getEmail();
            if (this$email == null) {
               if (other$email != null) {
                  return false;
               }
            } else if (!this$email.equals(other$email)) {
               return false;
            }

            Object this$reasonLock = this.getReasonLock();
            Object other$reasonLock = other.getReasonLock();
            if (this$reasonLock == null) {
               if (other$reasonLock != null) {
                  return false;
               }
            } else if (!this$reasonLock.equals(other$reasonLock)) {
               return false;
            }

            label253: {
               Object this$fullName = this.getFullName();
               Object other$fullName = other.getFullName();
               if (this$fullName == null) {
                  if (other$fullName == null) {
                     break label253;
                  }
               } else if (this$fullName.equals(other$fullName)) {
                  break label253;
               }

               return false;
            }

            label246: {
               Object this$mobile = this.getMobile();
               Object other$mobile = other.getMobile();
               if (this$mobile == null) {
                  if (other$mobile == null) {
                     break label246;
                  }
               } else if (this$mobile.equals(other$mobile)) {
                  break label246;
               }

               return false;
            }

            Object this$jobCode = this.getJobCode();
            Object other$jobCode = other.getJobCode();
            if (this$jobCode == null) {
               if (other$jobCode != null) {
                  return false;
               }
            } else if (!this$jobCode.equals(other$jobCode)) {
               return false;
            }

            label232: {
               Object this$jobName = this.getJobName();
               Object other$jobName = other.getJobName();
               if (this$jobName == null) {
                  if (other$jobName == null) {
                     break label232;
                  }
               } else if (this$jobName.equals(other$jobName)) {
                  break label232;
               }

               return false;
            }

            Object this$orgCode = this.getOrgCode();
            Object other$orgCode = other.getOrgCode();
            if (this$orgCode == null) {
               if (other$orgCode != null) {
                  return false;
               }
            } else if (!this$orgCode.equals(other$orgCode)) {
               return false;
            }

            label218: {
               Object this$orgName = this.getOrgName();
               Object other$orgName = other.getOrgName();
               if (this$orgName == null) {
                  if (other$orgName == null) {
                     break label218;
                  }
               } else if (this$orgName.equals(other$orgName)) {
                  break label218;
               }

               return false;
            }

            Object this$orgCodeManage = this.getOrgCodeManage();
            Object other$orgCodeManage = other.getOrgCodeManage();
            if (this$orgCodeManage == null) {
               if (other$orgCodeManage != null) {
                  return false;
               }
            } else if (!this$orgCodeManage.equals(other$orgCodeManage)) {
               return false;
            }

            Object this$orgNameManage = this.getOrgNameManage();
            Object other$orgNameManage = other.getOrgNameManage();
            if (this$orgNameManage == null) {
               if (other$orgNameManage != null) {
                  return false;
               }
            } else if (!this$orgNameManage.equals(other$orgNameManage)) {
               return false;
            }

            Object this$orgCodeLevel1 = this.getOrgCodeLevel1();
            Object other$orgCodeLevel1 = other.getOrgCodeLevel1();
            if (this$orgCodeLevel1 == null) {
               if (other$orgCodeLevel1 != null) {
                  return false;
               }
            } else if (!this$orgCodeLevel1.equals(other$orgCodeLevel1)) {
               return false;
            }

            label190: {
               Object this$orgNameLevel1 = this.getOrgNameLevel1();
               Object other$orgNameLevel1 = other.getOrgNameLevel1();
               if (this$orgNameLevel1 == null) {
                  if (other$orgNameLevel1 == null) {
                     break label190;
                  }
               } else if (this$orgNameLevel1.equals(other$orgNameLevel1)) {
                  break label190;
               }

               return false;
            }

            label183: {
               Object this$orgCodeLevel2 = this.getOrgCodeLevel2();
               Object other$orgCodeLevel2 = other.getOrgCodeLevel2();
               if (this$orgCodeLevel2 == null) {
                  if (other$orgCodeLevel2 == null) {
                     break label183;
                  }
               } else if (this$orgCodeLevel2.equals(other$orgCodeLevel2)) {
                  break label183;
               }

               return false;
            }

            Object this$orgNameLevel2 = this.getOrgNameLevel2();
            Object other$orgNameLevel2 = other.getOrgNameLevel2();
            if (this$orgNameLevel2 == null) {
               if (other$orgNameLevel2 != null) {
                  return false;
               }
            } else if (!this$orgNameLevel2.equals(other$orgNameLevel2)) {
               return false;
            }

            label169: {
               Object this$orgCodeLevel3 = this.getOrgCodeLevel3();
               Object other$orgCodeLevel3 = other.getOrgCodeLevel3();
               if (this$orgCodeLevel3 == null) {
                  if (other$orgCodeLevel3 == null) {
                     break label169;
                  }
               } else if (this$orgCodeLevel3.equals(other$orgCodeLevel3)) {
                  break label169;
               }

               return false;
            }

            label162: {
               Object this$orgNameLevel3 = this.getOrgNameLevel3();
               Object other$orgNameLevel3 = other.getOrgNameLevel3();
               if (this$orgNameLevel3 == null) {
                  if (other$orgNameLevel3 == null) {
                     break label162;
                  }
               } else if (this$orgNameLevel3.equals(other$orgNameLevel3)) {
                  break label162;
               }

               return false;
            }

            Object this$orgCodeLevel4 = this.getOrgCodeLevel4();
            Object other$orgCodeLevel4 = other.getOrgCodeLevel4();
            if (this$orgCodeLevel4 == null) {
               if (other$orgCodeLevel4 != null) {
                  return false;
               }
            } else if (!this$orgCodeLevel4.equals(other$orgCodeLevel4)) {
               return false;
            }

            Object this$orgNameLevel4 = this.getOrgNameLevel4();
            Object other$orgNameLevel4 = other.getOrgNameLevel4();
            if (this$orgNameLevel4 == null) {
               if (other$orgNameLevel4 != null) {
                  return false;
               }
            } else if (!this$orgNameLevel4.equals(other$orgNameLevel4)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof UserInfo;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $isTracing = this.getIsTracing();
      result = result * 59 + ($isTracing == null ? 43 : $isTracing.hashCode());
      Object $isLocked = this.getIsLocked();
      result = result * 59 + ($isLocked == null ? 43 : $isLocked.hashCode());
      Object $isInternal = this.getIsInternal();
      result = result * 59 + ($isInternal == null ? 43 : $isInternal.hashCode());
      Object $jobId = this.getJobId();
      result = result * 59 + ($jobId == null ? 43 : $jobId.hashCode());
      Object $orgId = this.getOrgId();
      result = result * 59 + ($orgId == null ? 43 : $orgId.hashCode());
      Object $userId = this.getUserId();
      result = result * 59 + ($userId == null ? 43 : $userId.hashCode());
      Object $username = this.getUsername();
      result = result * 59 + ($username == null ? 43 : $username.hashCode());
      Object $empCode = this.getEmpCode();
      result = result * 59 + ($empCode == null ? 43 : $empCode.hashCode());
      Object $email = this.getEmail();
      result = result * 59 + ($email == null ? 43 : $email.hashCode());
      Object $reasonLock = this.getReasonLock();
      result = result * 59 + ($reasonLock == null ? 43 : $reasonLock.hashCode());
      Object $fullName = this.getFullName();
      result = result * 59 + ($fullName == null ? 43 : $fullName.hashCode());
      Object $mobile = this.getMobile();
      result = result * 59 + ($mobile == null ? 43 : $mobile.hashCode());
      Object $jobCode = this.getJobCode();
      result = result * 59 + ($jobCode == null ? 43 : $jobCode.hashCode());
      Object $jobName = this.getJobName();
      result = result * 59 + ($jobName == null ? 43 : $jobName.hashCode());
      Object $orgCode = this.getOrgCode();
      result = result * 59 + ($orgCode == null ? 43 : $orgCode.hashCode());
      Object $orgName = this.getOrgName();
      result = result * 59 + ($orgName == null ? 43 : $orgName.hashCode());
      Object $orgCodeManage = this.getOrgCodeManage();
      result = result * 59 + ($orgCodeManage == null ? 43 : $orgCodeManage.hashCode());
      Object $orgNameManage = this.getOrgNameManage();
      result = result * 59 + ($orgNameManage == null ? 43 : $orgNameManage.hashCode());
      Object $orgCodeLevel1 = this.getOrgCodeLevel1();
      result = result * 59 + ($orgCodeLevel1 == null ? 43 : $orgCodeLevel1.hashCode());
      Object $orgNameLevel1 = this.getOrgNameLevel1();
      result = result * 59 + ($orgNameLevel1 == null ? 43 : $orgNameLevel1.hashCode());
      Object $orgCodeLevel2 = this.getOrgCodeLevel2();
      result = result * 59 + ($orgCodeLevel2 == null ? 43 : $orgCodeLevel2.hashCode());
      Object $orgNameLevel2 = this.getOrgNameLevel2();
      result = result * 59 + ($orgNameLevel2 == null ? 43 : $orgNameLevel2.hashCode());
      Object $orgCodeLevel3 = this.getOrgCodeLevel3();
      result = result * 59 + ($orgCodeLevel3 == null ? 43 : $orgCodeLevel3.hashCode());
      Object $orgNameLevel3 = this.getOrgNameLevel3();
      result = result * 59 + ($orgNameLevel3 == null ? 43 : $orgNameLevel3.hashCode());
      Object $orgCodeLevel4 = this.getOrgCodeLevel4();
      result = result * 59 + ($orgCodeLevel4 == null ? 43 : $orgCodeLevel4.hashCode());
      Object $orgNameLevel4 = this.getOrgNameLevel4();
      result = result * 59 + ($orgNameLevel4 == null ? 43 : $orgNameLevel4.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = this.getUserId();
      return "UserInfo(userId=" + var10000 + ", username=" + this.getUsername() + ", empCode=" + this.getEmpCode() + ", email=" + this.getEmail() + ", isTracing=" + this.getIsTracing() + ", isLocked=" + this.getIsLocked() + ", reasonLock=" + this.getReasonLock() + ", isInternal=" + this.getIsInternal() + ", fullName=" + this.getFullName() + ", mobile=" + this.getMobile() + ", jobId=" + this.getJobId() + ", jobCode=" + this.getJobCode() + ", jobName=" + this.getJobName() + ", orgId=" + this.getOrgId() + ", orgCode=" + this.getOrgCode() + ", orgName=" + this.getOrgName() + ", orgCodeManage=" + this.getOrgCodeManage() + ", orgNameManage=" + this.getOrgNameManage() + ", orgCodeLevel1=" + this.getOrgCodeLevel1() + ", orgNameLevel1=" + this.getOrgNameLevel1() + ", orgCodeLevel2=" + this.getOrgCodeLevel2() + ", orgNameLevel2=" + this.getOrgNameLevel2() + ", orgCodeLevel3=" + this.getOrgCodeLevel3() + ", orgNameLevel3=" + this.getOrgNameLevel3() + ", orgCodeLevel4=" + this.getOrgCodeLevel4() + ", orgNameLevel4=" + this.getOrgNameLevel4() + ")";
   }

   @Generated
   public UserInfo() {
   }

   @Generated
   public UserInfo(String userId, String username, String empCode, String email, Integer isTracing, Integer isLocked, String reasonLock, Integer isInternal, String fullName, String mobile, Long jobId, String jobCode, String jobName, Long orgId, String orgCode, String orgName, String orgCodeManage, String orgNameManage, String orgCodeLevel1, String orgNameLevel1, String orgCodeLevel2, String orgNameLevel2, String orgCodeLevel3, String orgNameLevel3, String orgCodeLevel4, String orgNameLevel4) {
      this.userId = userId;
      this.username = username;
      this.empCode = empCode;
      this.email = email;
      this.isTracing = isTracing;
      this.isLocked = isLocked;
      this.reasonLock = reasonLock;
      this.isInternal = isInternal;
      this.fullName = fullName;
      this.mobile = mobile;
      this.jobId = jobId;
      this.jobCode = jobCode;
      this.jobName = jobName;
      this.orgId = orgId;
      this.orgCode = orgCode;
      this.orgName = orgName;
      this.orgCodeManage = orgCodeManage;
      this.orgNameManage = orgNameManage;
      this.orgCodeLevel1 = orgCodeLevel1;
      this.orgNameLevel1 = orgNameLevel1;
      this.orgCodeLevel2 = orgCodeLevel2;
      this.orgNameLevel2 = orgNameLevel2;
      this.orgCodeLevel3 = orgCodeLevel3;
      this.orgNameLevel3 = orgNameLevel3;
      this.orgCodeLevel4 = orgCodeLevel4;
      this.orgNameLevel4 = orgNameLevel4;
   }

   @Generated
   public static class UserInfoBuilder {
      @Generated
      private String userId;
      @Generated
      private String username;
      @Generated
      private String empCode;
      @Generated
      private String email;
      @Generated
      private Integer isTracing;
      @Generated
      private Integer isLocked;
      @Generated
      private String reasonLock;
      @Generated
      private Integer isInternal;
      @Generated
      private String fullName;
      @Generated
      private String mobile;
      @Generated
      private Long jobId;
      @Generated
      private String jobCode;
      @Generated
      private String jobName;
      @Generated
      private Long orgId;
      @Generated
      private String orgCode;
      @Generated
      private String orgName;
      @Generated
      private String orgCodeManage;
      @Generated
      private String orgNameManage;
      @Generated
      private String orgCodeLevel1;
      @Generated
      private String orgNameLevel1;
      @Generated
      private String orgCodeLevel2;
      @Generated
      private String orgNameLevel2;
      @Generated
      private String orgCodeLevel3;
      @Generated
      private String orgNameLevel3;
      @Generated
      private String orgCodeLevel4;
      @Generated
      private String orgNameLevel4;

      @Generated
      UserInfoBuilder() {
      }

      @Generated
      public UserInfo.UserInfoBuilder userId(String userId) {
         this.userId = userId;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder username(String username) {
         this.username = username;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder empCode(String empCode) {
         this.empCode = empCode;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder email(String email) {
         this.email = email;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder isTracing(Integer isTracing) {
         this.isTracing = isTracing;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder isLocked(Integer isLocked) {
         this.isLocked = isLocked;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder reasonLock(String reasonLock) {
         this.reasonLock = reasonLock;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder isInternal(Integer isInternal) {
         this.isInternal = isInternal;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder fullName(String fullName) {
         this.fullName = fullName;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder mobile(String mobile) {
         this.mobile = mobile;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder jobId(Long jobId) {
         this.jobId = jobId;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder jobCode(String jobCode) {
         this.jobCode = jobCode;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder jobName(String jobName) {
         this.jobName = jobName;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgId(Long orgId) {
         this.orgId = orgId;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgCode(String orgCode) {
         this.orgCode = orgCode;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgName(String orgName) {
         this.orgName = orgName;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgCodeManage(String orgCodeManage) {
         this.orgCodeManage = orgCodeManage;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgNameManage(String orgNameManage) {
         this.orgNameManage = orgNameManage;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgCodeLevel1(String orgCodeLevel1) {
         this.orgCodeLevel1 = orgCodeLevel1;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgNameLevel1(String orgNameLevel1) {
         this.orgNameLevel1 = orgNameLevel1;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgCodeLevel2(String orgCodeLevel2) {
         this.orgCodeLevel2 = orgCodeLevel2;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgNameLevel2(String orgNameLevel2) {
         this.orgNameLevel2 = orgNameLevel2;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgCodeLevel3(String orgCodeLevel3) {
         this.orgCodeLevel3 = orgCodeLevel3;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgNameLevel3(String orgNameLevel3) {
         this.orgNameLevel3 = orgNameLevel3;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgCodeLevel4(String orgCodeLevel4) {
         this.orgCodeLevel4 = orgCodeLevel4;
         return this;
      }

      @Generated
      public UserInfo.UserInfoBuilder orgNameLevel4(String orgNameLevel4) {
         this.orgNameLevel4 = orgNameLevel4;
         return this;
      }

      @Generated
      public UserInfo build() {
         return new UserInfo(this.userId, this.username, this.empCode, this.email, this.isTracing, this.isLocked, this.reasonLock, this.isInternal, this.fullName, this.mobile, this.jobId, this.jobCode, this.jobName, this.orgId, this.orgCode, this.orgName, this.orgCodeManage, this.orgNameManage, this.orgCodeLevel1, this.orgNameLevel1, this.orgCodeLevel2, this.orgNameLevel2, this.orgCodeLevel3, this.orgNameLevel3, this.orgCodeLevel4, this.orgNameLevel4);
      }

      @Generated
      public String toString() {
         return "UserInfo.UserInfoBuilder(userId=" + this.userId + ", username=" + this.username + ", empCode=" + this.empCode + ", email=" + this.email + ", isTracing=" + this.isTracing + ", isLocked=" + this.isLocked + ", reasonLock=" + this.reasonLock + ", isInternal=" + this.isInternal + ", fullName=" + this.fullName + ", mobile=" + this.mobile + ", jobId=" + this.jobId + ", jobCode=" + this.jobCode + ", jobName=" + this.jobName + ", orgId=" + this.orgId + ", orgCode=" + this.orgCode + ", orgName=" + this.orgName + ", orgCodeManage=" + this.orgCodeManage + ", orgNameManage=" + this.orgNameManage + ", orgCodeLevel1=" + this.orgCodeLevel1 + ", orgNameLevel1=" + this.orgNameLevel1 + ", orgCodeLevel2=" + this.orgCodeLevel2 + ", orgNameLevel2=" + this.orgNameLevel2 + ", orgCodeLevel3=" + this.orgCodeLevel3 + ", orgNameLevel3=" + this.orgNameLevel3 + ", orgCodeLevel4=" + this.orgCodeLevel4 + ", orgNameLevel4=" + this.orgNameLevel4 + ")";
      }
   }
}
