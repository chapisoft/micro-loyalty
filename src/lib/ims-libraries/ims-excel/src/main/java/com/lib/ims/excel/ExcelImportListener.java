package com.lib.ims.excel;

import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.context.AnalysisContext;
import com.alibaba.excel.enums.CellDataTypeEnum;
import com.alibaba.excel.exception.ExcelDataConvertException;
import com.alibaba.excel.metadata.Cell;
import com.alibaba.excel.metadata.data.ReadCellData;
import com.alibaba.excel.metadata.data.WriteCellData;
import com.alibaba.excel.read.listener.ReadListener;
import com.alibaba.excel.util.ConverterUtils;
import com.alibaba.excel.util.StringUtils;
import com.alibaba.excel.write.metadata.WriteSheet;
import com.alibaba.excel.write.metadata.style.WriteCellStyle;
import com.lib.ims.core.exceptions.ApplicationException;
import com.lib.ims.excel.model.BaseImport;
import com.lib.ims.excel.model.ExcelErrorFillHandler;
import com.lib.ims.excel.model.ExcelLineResult;
import com.lib.ims.excel.model.ImportErrorBean;
import com.lib.ims.excel.model.annotation.ValidUniqueField;
import com.lib.ims.i18n.config.I18n;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Map.Entry;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.Generated;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@SuppressWarnings({"unchecked", "rawtypes", "null"})
public class ExcelImportListener<T extends BaseImport> implements ReadListener<T> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(ExcelImportListener.class);
   private final Class<T> dtoClass;
   private final Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer;
   private final Validator validator;
   private final Map<String, Integer> fieldMap;
   private final Integer titleLineNumber;
   private final ExcelWriter excelWriter;
   private final AtomicBoolean hasErrors;
   private final WriteSheet writeSheet;
   private final ExecutorService dataProcessingExecutor;
   private final List<CompletableFuture<Void>> futures = new ArrayList();
   private final Map<String, Set<String>> duplicateCheck = new ConcurrentHashMap();
   private final Map<String, List<Integer>> duplicateRows = new ConcurrentHashMap();
   private final Map<Class<?>, List<Field>> uniqueFieldsCache = new ConcurrentHashMap();
   private final Map<Field, String> fieldNameCache = new ConcurrentHashMap();
   private Map<Integer, String> excelHeader = new HashMap();
   private final List<ExcelImportListener.BatchItem<T>> currentBatch = Collections.synchronizedList(new ArrayList());
   private final Map<Integer, List<List<WriteCellData<?>>>> completedBatches = new ConcurrentHashMap();
   private volatile int nextBatchToWrite = 0;
   private final AtomicInteger currentBatchId = new AtomicInteger(0);
   private Integer indexError = 0;

   public ExcelImportListener(Class<T> dtoClass, Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer, Validator validator, Map<String, Integer> fieldMap, Integer titleLineNumber, ExcelWriter excelWriter, AtomicBoolean hasErrors, WriteSheet writeSheet, ExecutorService dataProcessingExecutor) {
      this.dtoClass = dtoClass;
      this.dbValidationConsumer = dbValidationConsumer;
      this.validator = validator;
      this.fieldMap = fieldMap;
      this.titleLineNumber = titleLineNumber;
      this.excelWriter = excelWriter;
      this.hasErrors = hasErrors;
      this.writeSheet = writeSheet;
      this.dataProcessingExecutor = dataProcessingExecutor;
   }

   public void invokeHead(Map<Integer, ReadCellData<?>> headMap, AnalysisContext context) {
      this.excelHeader = ConverterUtils.convertToStringMap(headMap, context);
      this.indexError = this.excelHeader.size();
      log.info("Excel header invoked. Header size: {}", this.indexError);
      this.writeSheet.setCustomWriteHandlerList(List.of(new ExcelErrorFillHandler(this.indexError)));
   }

   public void invoke(T target, AnalysisContext context) {
      int rowNumber = context.readRowHolder().getRowIndex();
      List<WriteCellData<?>> rowData = this.createRowData(context, Collections.emptyList());
      target.setRow(rowNumber);
      List<ImportErrorBean> basicErrors = new ArrayList();
      boolean hasDuplicate = this.checkUniqueFields(target, rowNumber, basicErrors);
      if (!hasDuplicate) {
         Set<ConstraintViolation<T>> violations = this.validator.validate(target, new Class[0]);
         boolean hasBasicValidationErrors = !violations.isEmpty();
         if (hasBasicValidationErrors) {
            violations.forEach((violation) -> {
               basicErrors.add(this.createErrorBean(rowNumber, violation));
            });
         }
      }

      ExcelImportListener.BatchItem<T> batchItem = new ExcelImportListener.BatchItem(ExcelLineResult.builder().row(rowNumber).target(target).build(), rowData, basicErrors);
      this.currentBatch.add(batchItem);
      if (this.currentBatch.size() >= 1000) {
         this.processBatch();
      }

   }

   public void onException(Exception exception, AnalysisContext context) {
      this.hasErrors.set(true);
      int rowNumber = context.readRowHolder().getRowIndex();
      List<ImportErrorBean> errorBeans = new ArrayList();
      if (exception instanceof ExcelDataConvertException) {
         ExcelDataConvertException ex = (ExcelDataConvertException)exception;
         Map var10000 = this.excelHeader;
         Integer var10001 = ex.getColumnIndex();
         int var10002 = ex.getColumnIndex();
         String columnName = (String)var10000.getOrDefault(var10001, "Column " + (var10002 + 1));
         errorBeans.add(new ImportErrorBean(rowNumber, ex.getColumnIndex() + 1, (String)null, String.format("Lỗi convert dữ liệu tại cột '%s'", columnName), ex.getCellData() != null ? ex.getCellData().toString() : null));
      } else {
         errorBeans.add(new ImportErrorBean(rowNumber, 0, (String)null, "Lỗi xử lý dữ liệu", (Object)null));
      }

      List<WriteCellData<?>> rowData = this.createRowData(context, errorBeans);
      this.writeErrorRowDirectly(rowData);
   }

   public void doAfterAllAnalysed(AnalysisContext context) {
      log.debug("Finished analyzing all Excel rows.");
      if (!this.currentBatch.isEmpty()) {
         this.processBatch();
      }

      CompletableFuture.allOf((CompletableFuture[])this.futures.toArray(new CompletableFuture[0])).join();
      this.writeCompletedBatchesInOrder();
      log.debug("All asynchronous tasks completed for this listener.");
   }

   private void processBatch() {
      if (!this.currentBatch.isEmpty()) {
         List<ExcelImportListener.BatchItem<T>> currentBatchCopy = new ArrayList(this.currentBatch);
         this.currentBatch.clear();
         int batchId = this.currentBatchId.getAndIncrement();
         CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            try {
               List<ExcelImportListener.BatchItem<T>> validItems = new ArrayList();
               Map<Integer, List<WriteCellData<?>>> rowDataMap = new HashMap();
               Iterator var5 = currentBatchCopy.iterator();

               while(var5.hasNext()) {
                  ExcelImportListener.BatchItem<T> itemx = (ExcelImportListener.BatchItem)var5.next();
                  int rowIndexx = itemx.getLineResult().getRow();
                  if (itemx.getBasicErrors().isEmpty()) {
                     validItems.add(itemx);
                  } else {
                     this.hasErrors.set(true);
                     List<WriteCellData<?>> rowData = new ArrayList(itemx.getRowData());
                     String error = this.addErrorInfoToRow(itemx.getBasicErrors());
                     WriteCellData<String> errorCell = new WriteCellData(error);
                     rowData.add(errorCell);
                     rowDataMap.put(rowIndexx, rowData);
                  }
               }

               List allRowsToWrite;
               if (!validItems.isEmpty()) {
                  allRowsToWrite = (List)validItems.stream().map(ExcelImportListener.BatchItem::getLineResult).collect(Collectors.toList());
                  List<ExcelLineResult<T>> dbValidatedResults = (List)this.dbValidationConsumer.apply(allRowsToWrite);
                  Map<Integer, ExcelLineResult<T>> resultMap = (Map)dbValidatedResults.stream().collect(Collectors.toMap(ExcelLineResult::getRow, Function.identity()));

                  ArrayList rowDatax;
                  int rowIndex;
                  for(Iterator var21 = validItems.iterator(); var21.hasNext(); rowDataMap.put(rowIndex, rowDatax)) {
                     ExcelImportListener.BatchItem<T> item = (ExcelImportListener.BatchItem)var21.next();
                     rowIndex = item.getLineResult().getRow();
                     ExcelLineResult<T> dbResult = (ExcelLineResult)resultMap.get(rowIndex);
                     rowDatax = new ArrayList(item.getRowData());
                     if (dbResult != null && dbResult.getImportErrorBeanList() != null && !dbResult.getImportErrorBeanList().isEmpty()) {
                        this.hasErrors.set(true);
                        List<ImportErrorBean> allErrors = new ArrayList(item.getBasicErrors());
                        allErrors.addAll(dbResult.getImportErrorBeanList());
                        String errorx = this.addErrorInfoToRow(allErrors);
                        WriteCellData<String> errorCellxx = new WriteCellData(errorx);
                        rowDatax.add(errorCellxx);
                     } else {
                        WriteCellData<String> errorCellx = new WriteCellData("");
                        rowDatax.add(errorCellx);
                     }
                  }
               }

               allRowsToWrite = (List)rowDataMap.entrySet().stream().sorted(Entry.comparingByKey()).map(Entry::getValue).collect(Collectors.toList());
               this.completedBatches.put(batchId, allRowsToWrite);
               this.writeCompletedBatchesInOrder();
               log.debug("Processed batch {} with {} items", batchId, currentBatchCopy.size());
            } catch (Exception var16) {
               log.error("Error processing batch {}: {}", new Object[]{batchId, var16.getMessage(), var16});
               this.hasErrors.set(true);
               List<List<WriteCellData<?>>> errorRows = this.createErrorRowsForException(currentBatchCopy, var16);
               this.completedBatches.put(batchId, errorRows);
               this.writeCompletedBatchesInOrder();
            }

         }, this.dataProcessingExecutor);
         this.futures.add(future);
      }
   }

   private synchronized void writeCompletedBatchesInOrder() {
      for(; this.completedBatches.containsKey(this.nextBatchToWrite); ++this.nextBatchToWrite) {
         List<List<WriteCellData<?>>> batchData = (List)this.completedBatches.remove(this.nextBatchToWrite);
         if (!batchData.isEmpty()) {
            this.writeToExcelSequentially(batchData);
         }
      }

   }

   private List<List<WriteCellData<?>>> createErrorRowsForException(List<ExcelImportListener.BatchItem<T>> items, Exception exception) {
      List<List<WriteCellData<?>>> errorRows = new ArrayList();
      Iterator var4 = items.iterator();

      while(var4.hasNext()) {
         ExcelImportListener.BatchItem<T> item = (ExcelImportListener.BatchItem)var4.next();
         List<WriteCellData<?>> rowData = new ArrayList(item.getRowData());
         List<ImportErrorBean> errors = Collections.singletonList(new ImportErrorBean(item.getLineResult().getRow(), 0, (String)null, "Lỗi xử lý: " + exception.getMessage(), (Object)null));
         String error = this.addErrorInfoToRow(errors);
         WriteCellData<String> errorCell = new WriteCellData(error);
         rowData.add(errorCell);
         errorRows.add(rowData);
      }

      return errorRows;
   }

   private void writeErrorRowDirectly(List<WriteCellData<?>> rowData) {
      int batchId = this.currentBatchId.getAndIncrement();
      List<List<WriteCellData<?>>> singleRowBatch = Collections.singletonList(rowData);
      this.completedBatches.put(batchId, singleRowBatch);
      this.writeCompletedBatchesInOrder();
   }

   private synchronized void writeToExcelSequentially(List<List<WriteCellData<?>>> data) {
      try {
         this.excelWriter.write(data, this.writeSheet);
         log.debug("Written {} rows to Excel", data.size());
      } catch (Exception var3) {
         log.error("Error writing to Excel: {}", var3.getMessage(), var3);
         throw new ApplicationException("Failed to write Excel data");
      }
   }

   private List<WriteCellData<?>> createRowData(AnalysisContext context, List<ImportErrorBean> errors) {
      Map<Integer, Cell> cellMap = context.readRowHolder().getCellMap();
      List<WriteCellData<?>> rowData = new ArrayList();
      int columnCount = this.excelHeader.size();
      if (columnCount == 0 && !cellMap.isEmpty()) {
         columnCount = (Integer)cellMap.keySet().stream().max(Integer::compareTo).orElse(0) + 1;
      }

      for(int i = 0; i < columnCount; ++i) {
         Cell cell = (Cell)cellMap.get(i);
         WriteCellData writeCell;
         if (cell instanceof ReadCellData) {
            ReadCellData<?> readCell = (ReadCellData)cell;
            CellDataTypeEnum type = readCell.getType();
            switch(type) {
            case NUMBER:
               writeCell = new WriteCellData(readCell.getNumberValue());
               break;
            case BOOLEAN:
               writeCell = new WriteCellData(readCell.getBooleanValue());
               break;
            case EMPTY:
               writeCell = new WriteCellData("");
               break;
            default:
               writeCell = new WriteCellData(readCell.getStringValue());
            }

            WriteCellStyle style = writeCell.getOrCreateStyle();
            style.setDataFormatData(readCell.getDataFormatData());
            writeCell.setWriteCellStyle(style);
         } else {
            writeCell = new WriteCellData("");
         }

         rowData.add(writeCell);
      }

      if (!errors.isEmpty()) {
         String errorInfo = this.addErrorInfoToRow(errors);
         rowData.add(new WriteCellData(errorInfo));
      }

      return rowData;
   }

   private String addErrorInfoToRow(List<ImportErrorBean> errors) {
      String errorInfo = (String)errors.stream().map((error) -> {
         return "- " + error.getDescription();
      }).collect(Collectors.joining("\n"));
      if (errorInfo.length() > 3000) {
         errorInfo = errorInfo.substring(0, 3000) + "...";
      }

      return errorInfo;
   }

   private boolean checkUniqueFields(T target, int row, List<ImportErrorBean> errors) {
      boolean hasError = false;
      Iterator var5 = this.getUniqueFields(this.dtoClass).iterator();

      while(var5.hasNext()) {
         Field field = (Field)var5.next();
         String fieldName = this.getFieldName(field);
         String value = this.getFieldValue(target, field);
         if (!StringUtils.isBlank(value)) {
            String key = fieldName + "_" + value;
            Set<String> existingRows = (Set)this.duplicateCheck.computeIfAbsent(key, (k) -> {
               return ConcurrentHashMap.newKeySet();
            });
            if (!existingRows.add(String.valueOf(row + 1))) {
               List<Integer> duplicateList = (List)this.duplicateRows.computeIfAbsent(key, (k) -> {
                  return new ArrayList();
               });
               duplicateList.add(row + 1);
               ValidUniqueField annotation = (ValidUniqueField)field.getAnnotation(ValidUniqueField.class);
               if (annotation != null) {
                  errors.add(new ImportErrorBean(row + 1, (Integer)this.fieldMap.get(fieldName), (String)null, this.getDuplicateErrorMessage(annotation, duplicateList), value));
               }

               hasError = true;
            }
         }
      }

      return hasError;
   }

   private List<Field> getUniqueFields(Class<?> clazz) {
      return (List)this.uniqueFieldsCache.computeIfAbsent(clazz, (c) -> {
         return Arrays.stream(c.getDeclaredFields()).filter((f) -> {
            return f.isAnnotationPresent(ValidUniqueField.class);
         }).peek((f) -> {
            f.setAccessible(true);
         }).toList();
      });
   }

   private String getFieldName(Field field) {
      return (String)this.fieldNameCache.computeIfAbsent(field, Field::getName);
   }

   private String getFieldValue(Object target, Field field) {
      try {
         Object value = field.get(target);
         return value != null ? value.toString() : "";
      } catch (IllegalAccessException var4) {
         log.error("Cannot access field '{}'", field.getName(), var4);
         return "";
      }
   }

   private String getDuplicateErrorMessage(ValidUniqueField annotation, List<Integer> duplicateRows) {
      String duplicateValue = this.formatDuplicateRows(duplicateRows);
      return StringUtils.isNotBlank(annotation.message()) ? annotation.message().replace("{0}", duplicateValue) : I18n.get("common.error.import.duplicate", new Object[]{duplicateValue});
   }

   private String formatDuplicateRows(List<Integer> rows) {
      if (rows.size() <= 10) {
         return (String)rows.stream().map(String::valueOf).collect(Collectors.joining(","));
      } else {
         String var10000 = (String)rows.subList(0, 9).stream().map(String::valueOf).collect(Collectors.joining(","));
         return var10000 + ",...," + String.valueOf(rows.get(rows.size() - 1));
      }
   }

   private ImportErrorBean createErrorBean(int row, ConstraintViolation<T> violation) {
      return new ImportErrorBean(row, (Integer)this.fieldMap.getOrDefault(violation.getPropertyPath().toString(), 0), (String)null, violation.getMessage(), violation.getInvalidValue());
   }

   @Generated
   public Class<T> getDtoClass() {
      return this.dtoClass;
   }

   @Generated
   public Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> getDbValidationConsumer() {
      return this.dbValidationConsumer;
   }

   @Generated
   public Validator getValidator() {
      return this.validator;
   }

   @Generated
   public Map<String, Integer> getFieldMap() {
      return this.fieldMap;
   }

   @Generated
   public Integer getTitleLineNumber() {
      return this.titleLineNumber;
   }

   @Generated
   public ExcelWriter getExcelWriter() {
      return this.excelWriter;
   }

   @Generated
   public AtomicBoolean getHasErrors() {
      return this.hasErrors;
   }

   @Generated
   public WriteSheet getWriteSheet() {
      return this.writeSheet;
   }

   @Generated
   public ExecutorService getDataProcessingExecutor() {
      return this.dataProcessingExecutor;
   }

   @Generated
   public List<CompletableFuture<Void>> getFutures() {
      return this.futures;
   }

   @Generated
   public Map<String, Set<String>> getDuplicateCheck() {
      return this.duplicateCheck;
   }

   @Generated
   public Map<String, List<Integer>> getDuplicateRows() {
      return this.duplicateRows;
   }

   @Generated
   public Map<Class<?>, List<Field>> getUniqueFieldsCache() {
      return this.uniqueFieldsCache;
   }

   @Generated
   public Map<Field, String> getFieldNameCache() {
      return this.fieldNameCache;
   }

   @Generated
   public Map<Integer, String> getExcelHeader() {
      return this.excelHeader;
   }

   @Generated
   public List<ExcelImportListener.BatchItem<T>> getCurrentBatch() {
      return this.currentBatch;
   }

   @Generated
   public Map<Integer, List<List<WriteCellData<?>>>> getCompletedBatches() {
      return this.completedBatches;
   }

   @Generated
   public int getNextBatchToWrite() {
      return this.nextBatchToWrite;
   }

   @Generated
   public AtomicInteger getCurrentBatchId() {
      return this.currentBatchId;
   }

   @Generated
   public Integer getIndexError() {
      return this.indexError;
   }

   private static class BatchItem<T> {
      private final ExcelLineResult<T> lineResult;
      private final List<WriteCellData<?>> rowData;
      private final List<ImportErrorBean> basicErrors;
      private List<ImportErrorBean> dbErrors;

      public BatchItem(ExcelLineResult<T> lineResult, List<WriteCellData<?>> rowData, List<ImportErrorBean> basicErrors) {
         this.lineResult = lineResult;
         this.rowData = new ArrayList(rowData);
         this.basicErrors = new ArrayList(basicErrors);
      }

      @Generated
      public ExcelLineResult<T> getLineResult() {
         return this.lineResult;
      }

      @Generated
      public List<WriteCellData<?>> getRowData() {
         return this.rowData;
      }

      @Generated
      public List<ImportErrorBean> getBasicErrors() {
         return this.basicErrors;
      }

      @Generated
      public List<ImportErrorBean> getDbErrors() {
         return this.dbErrors;
      }

      @Generated
      public void setDbErrors(List<ImportErrorBean> dbErrors) {
         this.dbErrors = dbErrors;
      }
   }
}
