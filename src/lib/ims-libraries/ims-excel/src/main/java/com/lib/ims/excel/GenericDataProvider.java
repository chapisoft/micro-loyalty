package com.lib.ims.excel;

import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Supplier;


@SuppressWarnings({"unchecked", "rawtypes"})
public class GenericDataProvider<T> implements DataProvider<T> {
   private final Supplier<Long> totalCountSupplier;
   private final BiFunction<Integer, Integer, List<T>> dataFetcher;

   public GenericDataProvider(Supplier<Long> totalCountSupplier, BiFunction<Integer, Integer, List<T>> dataFetcher) {
      this.totalCountSupplier = totalCountSupplier;
      this.dataFetcher = dataFetcher;
   }

   public Long getTotalCount() {
      return (Long)this.totalCountSupplier.get();
   }

   public List<T> getData(int offset, int limit) {
      return (List)this.dataFetcher.apply(offset, limit);
   }
}
