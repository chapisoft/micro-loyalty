package com.lib.ims.excel.model;

import java.util.ArrayList;
import java.util.List;
import lombok.Generated;


@SuppressWarnings({"unchecked", "rawtypes"})
public class ExcelLineResult<T> {
   private Integer row;
   private T target;
   private String description;
   private List<ImportErrorBean> importErrorBeanList;

   public void setImportErrorBeanList(List<ImportErrorBean> importErrorBeanList) {
      if (importErrorBeanList != null && !importErrorBeanList.isEmpty()) {
         if (this.importErrorBeanList == null) {
            this.importErrorBeanList = new ArrayList();
         }

         this.importErrorBeanList.addAll(importErrorBeanList);
      }

   }

   @Generated
   ExcelLineResult(Integer row, T target, String description, List<ImportErrorBean> importErrorBeanList) {
      this.row = row;
      this.target = target;
      this.description = description;
      this.importErrorBeanList = importErrorBeanList;
   }

   @Generated
   public static <T> ExcelLineResult.ExcelLineResultBuilder<T> builder() {
      return new ExcelLineResult.ExcelLineResultBuilder();
   }

   @Generated
   public Integer getRow() {
      return this.row;
   }

   @Generated
   public T getTarget() {
      return this.target;
   }

   @Generated
   public String getDescription() {
      return this.description;
   }

   @Generated
   public List<ImportErrorBean> getImportErrorBeanList() {
      return this.importErrorBeanList;
   }

   @Generated
   public void setRow(Integer row) {
      this.row = row;
   }

   @Generated
   public void setTarget(T target) {
      this.target = target;
   }

   @Generated
   public void setDescription(String description) {
      this.description = description;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof ExcelLineResult)) {
         return false;
      } else {
         ExcelLineResult<?> other = (ExcelLineResult)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            label59: {
               Object this$row = this.getRow();
               Object other$row = other.getRow();
               if (this$row == null) {
                  if (other$row == null) {
                     break label59;
                  }
               } else if (this$row.equals(other$row)) {
                  break label59;
               }

               return false;
            }

            Object this$target = this.getTarget();
            Object other$target = other.getTarget();
            if (this$target == null) {
               if (other$target != null) {
                  return false;
               }
            } else if (!this$target.equals(other$target)) {
               return false;
            }

            Object this$description = this.getDescription();
            Object other$description = other.getDescription();
            if (this$description == null) {
               if (other$description != null) {
                  return false;
               }
            } else if (!this$description.equals(other$description)) {
               return false;
            }

            Object this$importErrorBeanList = this.getImportErrorBeanList();
            Object other$importErrorBeanList = other.getImportErrorBeanList();
            if (this$importErrorBeanList == null) {
               if (other$importErrorBeanList != null) {
                  return false;
               }
            } else if (!this$importErrorBeanList.equals(other$importErrorBeanList)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof ExcelLineResult;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $row = this.getRow();
      result = result * 59 + ($row == null ? 43 : $row.hashCode());
      Object $target = this.getTarget();
      result = result * 59 + ($target == null ? 43 : $target.hashCode());
      Object $description = this.getDescription();
      result = result * 59 + ($description == null ? 43 : $description.hashCode());
      Object $importErrorBeanList = this.getImportErrorBeanList();
      result = result * 59 + ($importErrorBeanList == null ? 43 : $importErrorBeanList.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      Integer var10000 = this.getRow();
      return "ExcelLineResult(row=" + var10000 + ", target=" + String.valueOf(this.getTarget()) + ", description=" + this.getDescription() + ", importErrorBeanList=" + String.valueOf(this.getImportErrorBeanList()) + ")";
   }

   @Generated
   public static class ExcelLineResultBuilder<T> {
      @Generated
      private Integer row;
      @Generated
      private T target;
      @Generated
      private String description;
      @Generated
      private List<ImportErrorBean> importErrorBeanList;

      @Generated
      ExcelLineResultBuilder() {
      }

      @Generated
      public ExcelLineResult.ExcelLineResultBuilder<T> row(Integer row) {
         this.row = row;
         return this;
      }

      @Generated
      public ExcelLineResult.ExcelLineResultBuilder<T> target(T target) {
         this.target = target;
         return this;
      }

      @Generated
      public ExcelLineResult.ExcelLineResultBuilder<T> description(String description) {
         this.description = description;
         return this;
      }

      @Generated
      public ExcelLineResult.ExcelLineResultBuilder<T> importErrorBeanList(List<ImportErrorBean> importErrorBeanList) {
         this.importErrorBeanList = importErrorBeanList;
         return this;
      }

      @Generated
      public ExcelLineResult<T> build() {
         return new ExcelLineResult(this.row, this.target, this.description, this.importErrorBeanList);
      }

      @Generated
      public String toString() {
         Integer var10000 = this.row;
         return "ExcelLineResult.ExcelLineResultBuilder(row=" + var10000 + ", target=" + String.valueOf(this.target) + ", description=" + this.description + ", importErrorBeanList=" + String.valueOf(this.importErrorBeanList) + ")";
      }
   }
}
