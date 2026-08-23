package com.lib.ims.excel;

import java.util.List;
import java.util.function.Consumer;


@SuppressWarnings({"unchecked", "rawtypes"})
public interface DataProvider<T> {
   Long getTotalCount();

   List<T> getData(int var1, int var2);

   default void streamData(int batchSize, Consumer<List<T>> processor) {
      Long totalCount = this.getTotalCount();
      this.streamData(totalCount, batchSize, processor);
   }

   default void streamData(Long totalCount, int batchSize, Consumer<List<T>> processor) {
      int offset = 0;
      List batch;
      if (totalCount != null && totalCount > 0L) {
         while((long)offset < totalCount) {
            batch = this.getData(offset, batchSize);
            if (batch == null || batch.isEmpty()) {
               break;
            }

            processor.accept(batch);
            if (batch.size() < batchSize) {
               break;
            }

            offset += batchSize;
         }
      } else {
         while(true) {
            batch = this.getData(offset, batchSize);
            if (batch == null || batch.isEmpty()) {
               break;
            }

            processor.accept(batch);
            if (batch.size() < batchSize) {
               break;
            }

            offset += batchSize;
         }
      }

   }

   default void streamAllData(Consumer<List<T>> processor) {
      this.streamData((Long)null, Integer.MAX_VALUE, processor);
   }
}
