package com.lib.ims.core.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.util.List;
import lombok.Generated;


@JsonInclude(Include.NON_NULL)
@SuppressWarnings({"unchecked", "rawtypes"})
public class PageResponse<T> {
   private List<T> items;
   private long totalItems;
   private int totalPages;
   private int currentPage;
   private int pageSize;
   private boolean hasNext;
   private boolean hasPrevious;

   @Generated
   public static <T> PageResponse.PageResponseBuilder<T> builder() {
      return new PageResponse.PageResponseBuilder();
   }

   @Generated
   public List<T> getItems() {
      return this.items;
   }

   @Generated
   public long getTotalItems() {
      return this.totalItems;
   }

   @Generated
   public int getTotalPages() {
      return this.totalPages;
   }

   @Generated
   public int getCurrentPage() {
      return this.currentPage;
   }

   @Generated
   public int getPageSize() {
      return this.pageSize;
   }

   @Generated
   public boolean isHasNext() {
      return this.hasNext;
   }

   @Generated
   public boolean isHasPrevious() {
      return this.hasPrevious;
   }

   @Generated
   public void setItems(List<T> items) {
      this.items = items;
   }

   @Generated
   public void setTotalItems(long totalItems) {
      this.totalItems = totalItems;
   }

   @Generated
   public void setTotalPages(int totalPages) {
      this.totalPages = totalPages;
   }

   @Generated
   public void setCurrentPage(int currentPage) {
      this.currentPage = currentPage;
   }

   @Generated
   public void setPageSize(int pageSize) {
      this.pageSize = pageSize;
   }

   @Generated
   public void setHasNext(boolean hasNext) {
      this.hasNext = hasNext;
   }

   @Generated
   public void setHasPrevious(boolean hasPrevious) {
      this.hasPrevious = hasPrevious;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof PageResponse)) {
         return false;
      } else {
         PageResponse<?> other = (PageResponse)o;
         if (!other.canEqual(this)) {
            return false;
         } else if (this.getTotalItems() != other.getTotalItems()) {
            return false;
         } else if (this.getTotalPages() != other.getTotalPages()) {
            return false;
         } else if (this.getCurrentPage() != other.getCurrentPage()) {
            return false;
         } else if (this.getPageSize() != other.getPageSize()) {
            return false;
         } else if (this.isHasNext() != other.isHasNext()) {
            return false;
         } else if (this.isHasPrevious() != other.isHasPrevious()) {
            return false;
         } else {
            Object this$items = this.getItems();
            Object other$items = other.getItems();
            if (this$items == null) {
               if (other$items != null) {
                  return false;
               }
            } else if (!this$items.equals(other$items)) {
               return false;
            }

            return true;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof PageResponse;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      long $totalItems = this.getTotalItems();
      result = result * 59 + (int)($totalItems >>> 32 ^ $totalItems);
      result = result * 59 + this.getTotalPages();
      result = result * 59 + this.getCurrentPage();
      result = result * 59 + this.getPageSize();
      result = result * 59 + (this.isHasNext() ? 79 : 97);
      result = result * 59 + (this.isHasPrevious() ? 79 : 97);
      Object $items = this.getItems();
      result = result * 59 + ($items == null ? 43 : $items.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      String var10000 = String.valueOf(this.getItems());
      return "PageResponse(items=" + var10000 + ", totalItems=" + this.getTotalItems() + ", totalPages=" + this.getTotalPages() + ", currentPage=" + this.getCurrentPage() + ", pageSize=" + this.getPageSize() + ", hasNext=" + this.isHasNext() + ", hasPrevious=" + this.isHasPrevious() + ")";
   }

   @Generated
   public PageResponse() {
   }

   @Generated
   public PageResponse(List<T> items, long totalItems, int totalPages, int currentPage, int pageSize, boolean hasNext, boolean hasPrevious) {
      this.items = items;
      this.totalItems = totalItems;
      this.totalPages = totalPages;
      this.currentPage = currentPage;
      this.pageSize = pageSize;
      this.hasNext = hasNext;
      this.hasPrevious = hasPrevious;
   }

   @Generated
   public static class PageResponseBuilder<T> {
      @Generated
      private List<T> items;
      @Generated
      private long totalItems;
      @Generated
      private int totalPages;
      @Generated
      private int currentPage;
      @Generated
      private int pageSize;
      @Generated
      private boolean hasNext;
      @Generated
      private boolean hasPrevious;

      @Generated
      PageResponseBuilder() {
      }

      @Generated
      public PageResponse.PageResponseBuilder<T> items(List<T> items) {
         this.items = items;
         return this;
      }

      @Generated
      public PageResponse.PageResponseBuilder<T> totalItems(long totalItems) {
         this.totalItems = totalItems;
         return this;
      }

      @Generated
      public PageResponse.PageResponseBuilder<T> totalPages(int totalPages) {
         this.totalPages = totalPages;
         return this;
      }

      @Generated
      public PageResponse.PageResponseBuilder<T> currentPage(int currentPage) {
         this.currentPage = currentPage;
         return this;
      }

      @Generated
      public PageResponse.PageResponseBuilder<T> pageSize(int pageSize) {
         this.pageSize = pageSize;
         return this;
      }

      @Generated
      public PageResponse.PageResponseBuilder<T> hasNext(boolean hasNext) {
         this.hasNext = hasNext;
         return this;
      }

      @Generated
      public PageResponse.PageResponseBuilder<T> hasPrevious(boolean hasPrevious) {
         this.hasPrevious = hasPrevious;
         return this;
      }

      @Generated
      public PageResponse<T> build() {
         return new PageResponse(this.items, this.totalItems, this.totalPages, this.currentPage, this.pageSize, this.hasNext, this.hasPrevious);
      }

      @Generated
      public String toString() {
         String var10000 = String.valueOf(this.items);
         return "PageResponse.PageResponseBuilder(items=" + var10000 + ", totalItems=" + this.totalItems + ", totalPages=" + this.totalPages + ", currentPage=" + this.currentPage + ", pageSize=" + this.pageSize + ", hasNext=" + this.hasNext + ", hasPrevious=" + this.hasPrevious + ")";
      }
   }
}
