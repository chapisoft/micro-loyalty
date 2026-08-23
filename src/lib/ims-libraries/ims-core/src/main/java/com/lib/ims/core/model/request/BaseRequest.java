package com.lib.ims.core.model.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.lib.ims.core.deserializer.TrimToNullString;
import com.lib.ims.core.model.validates.annotation.ExcludeField;
import java.util.List;
import java.util.Set;
import lombok.Generated;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.domain.Sort.Order;
import org.springframework.util.CollectionUtils;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;



@JsonInclude(Include.NON_NULL)
@JsonIgnoreProperties(
   ignoreUnknown = true
)
public class BaseRequest {
   @ExcludeField
   public Integer page;
   @ExcludeField
   protected Integer size;
   @ExcludeField
   @JsonDeserialize(
      using = TrimToNullString.class
   )
   private String sortBy;
   private List<BaseRequest.SortDto> sorts;
   @ExcludeField
   @JsonDeserialize(
      using = TrimToNullString.class
   )
   private String search;

   public Pageable toPageable(Set<String> allowedSortFields) {
      int page = this.page != null && this.page >= 0 ? this.page : 0;
      int size = this.size != null && this.size > 0 ? Math.min(this.size, 200) : 200;
      if (allowedSortFields != null && !allowedSortFields.isEmpty() && !CollectionUtils.isEmpty(this.sorts)) {
         List<Order> orders = this.sorts.stream().filter((s) -> {
            return allowedSortFields.contains(s.field());
         }).map((s) -> {
            return new Order("DESC".equalsIgnoreCase(s.direction()) ? Direction.DESC : Direction.ASC, s.field());
         }).toList();
         Sort sort = orders.isEmpty() ? Sort.unsorted() : Sort.by(orders);
         return PageRequest.of(page, size, sort);
      } else {
         return PageRequest.of(page, size);
      }
   }

   public Pageable toPageable() {
      int page = this.page != null && this.page >= 0 ? this.page : 0;
      int size = this.size != null && this.size > 0 ? Math.min(this.size, 200) : 200;
      return PageRequest.of(page, size);
   }

   @Generated
   protected BaseRequest(BaseRequest.BaseRequestBuilder<?, ?> b) {
      this.page = b.page;
      this.size = b.size;
      this.sortBy = b.sortBy;
      this.sorts = b.sorts;
      this.search = b.search;
   }

   @Generated
   public static BaseRequest.BaseRequestBuilder<?, ?> builder() {
      return new BaseRequest.BaseRequestBuilderImpl();
   }

   @Generated
   public Integer getPage() {
      return this.page;
   }

   @Generated
   public Integer getSize() {
      return this.size;
   }

   @Generated
   public String getSortBy() {
      return this.sortBy;
   }

   @Generated
   public List<BaseRequest.SortDto> getSorts() {
      return this.sorts;
   }

   @Generated
   public String getSearch() {
      return this.search;
   }

   @Generated
   public void setPage(Integer page) {
      this.page = page;
   }

   @Generated
   public void setSize(Integer size) {
      this.size = size;
   }

   @Generated
   public void setSortBy(String sortBy) {
      this.sortBy = sortBy;
   }

   @Generated
   public void setSorts(List<BaseRequest.SortDto> sorts) {
      this.sorts = sorts;
   }

   @Generated
   public void setSearch(String search) {
      this.search = search;
   }

   @Generated
   public boolean equals(Object o) {
      if (o == this) {
         return true;
      } else if (!(o instanceof BaseRequest)) {
         return false;
      } else {
         BaseRequest other = (BaseRequest)o;
         if (!other.canEqual(this)) {
            return false;
         } else {
            label71: {
               Object this$page = this.getPage();
               Object other$page = other.getPage();
               if (this$page == null) {
                  if (other$page == null) {
                     break label71;
                  }
               } else if (this$page.equals(other$page)) {
                  break label71;
               }

               return false;
            }

            Object this$size = this.getSize();
            Object other$size = other.getSize();
            if (this$size == null) {
               if (other$size != null) {
                  return false;
               }
            } else if (!this$size.equals(other$size)) {
               return false;
            }

            label57: {
               Object this$sortBy = this.getSortBy();
               Object other$sortBy = other.getSortBy();
               if (this$sortBy == null) {
                  if (other$sortBy == null) {
                     break label57;
                  }
               } else if (this$sortBy.equals(other$sortBy)) {
                  break label57;
               }

               return false;
            }

            Object this$sorts = this.getSorts();
            Object other$sorts = other.getSorts();
            if (this$sorts == null) {
               if (other$sorts != null) {
                  return false;
               }
            } else if (!this$sorts.equals(other$sorts)) {
               return false;
            }

            Object this$search = this.getSearch();
            Object other$search = other.getSearch();
            if (this$search == null) {
               if (other$search == null) {
                  return true;
               }
            } else if (this$search.equals(other$search)) {
               return true;
            }

            return false;
         }
      }
   }

   @Generated
   protected boolean canEqual(Object other) {
      return other instanceof BaseRequest;
   }

   @Generated
   public int hashCode() {
      int result = 1;
      Object $page = this.getPage();
      result = result * 59 + ($page == null ? 43 : $page.hashCode());
      Object $size = this.getSize();
      result = result * 59 + ($size == null ? 43 : $size.hashCode());
      Object $sortBy = this.getSortBy();
      result = result * 59 + ($sortBy == null ? 43 : $sortBy.hashCode());
      Object $sorts = this.getSorts();
      result = result * 59 + ($sorts == null ? 43 : $sorts.hashCode());
      Object $search = this.getSearch();
      result = result * 59 + ($search == null ? 43 : $search.hashCode());
      return result;
   }

   @Generated
   public String toString() {
      Integer var10000 = this.getPage();
      return "BaseRequest(page=" + var10000 + ", size=" + this.getSize() + ", sortBy=" + this.getSortBy() + ", sorts=" + String.valueOf(this.getSorts()) + ", search=" + this.getSearch() + ")";
   }

   @Generated
   public BaseRequest() {
   }

   @Generated
   public BaseRequest(Integer page, Integer size, String sortBy, List<BaseRequest.SortDto> sorts, String search) {
      this.page = page;
      this.size = size;
      this.sortBy = sortBy;
      this.sorts = sorts;
      this.search = search;
   }

   @Generated
   public abstract static class BaseRequestBuilder<C extends BaseRequest, B extends BaseRequest.BaseRequestBuilder<C, B>> {
      @Generated
      private Integer page;
      @Generated
      private Integer size;
      @Generated
      private String sortBy;
      @Generated
      private List<BaseRequest.SortDto> sorts;
      @Generated
      private String search;

      @Generated
      public B page(Integer page) {
         this.page = page;
         return this.self();
      }

      @Generated
      public B size(Integer size) {
         this.size = size;
         return this.self();
      }

      @Generated
      public B sortBy(String sortBy) {
         this.sortBy = sortBy;
         return this.self();
      }

      @Generated
      public B sorts(List<BaseRequest.SortDto> sorts) {
         this.sorts = sorts;
         return this.self();
      }

      @Generated
      public B search(String search) {
         this.search = search;
         return this.self();
      }

      @Generated
      protected abstract B self();

      @Generated
      public abstract C build();

      @Generated
      public String toString() {
         Integer var10000 = this.page;
         return "BaseRequest.BaseRequestBuilder(page=" + var10000 + ", size=" + this.size + ", sortBy=" + this.sortBy + ", sorts=" + String.valueOf(this.sorts) + ", search=" + this.search + ")";
      }
   }

   @Generated
   private static final class BaseRequestBuilderImpl extends BaseRequest.BaseRequestBuilder<BaseRequest, BaseRequest.BaseRequestBuilderImpl> {
      @Generated
      protected BaseRequest.BaseRequestBuilderImpl self() {
         return this;
      }

      @Generated
      public BaseRequest build() {
         return new BaseRequest(this);
      }
   }

   static record SortDto(String field, String direction) {
      SortDto(String field, String direction) {
         this.field = field;
         this.direction = direction;
      }

      public String field() {
         return this.field;
      }

      public String direction() {
         return this.direction;
      }
   }
}
