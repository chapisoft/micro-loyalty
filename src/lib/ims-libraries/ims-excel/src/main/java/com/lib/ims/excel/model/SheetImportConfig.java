package com.lib.ims.excel.model;

import java.util.List;
import java.util.function.Function;
import lombok.Generated;


@SuppressWarnings({"unchecked", "rawtypes"})
public class SheetImportConfig<T extends BaseImport> {
   private Integer sheetIndex;
   private String sheetName;
   private int titleLineNumber;
   private Class<T> dtoClass;
   private Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer;
   private Integer errorColumnIndex;

   public static <T extends BaseImport> SheetImportConfig<T> of(int sheetIndex, Class<T> dtoClass, Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer) {
      return new SheetImportConfig(sheetIndex, dtoClass, dbValidationConsumer);
   }

   public static <T extends BaseImport> SheetImportConfig<T> of(String sheetName, Class<T> dtoClass, Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer) {
      return new SheetImportConfig(sheetName, dtoClass, dbValidationConsumer);
   }

   public SheetImportConfig(int sheetIndex, Class<T> dtoClass, Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer) {
      this(sheetIndex, (String)null, 1, dtoClass, dbValidationConsumer, (Integer)null);
   }

   public SheetImportConfig(int sheetIndex, Class<T> dtoClass, int titleLineNumber, Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer) {
      this(sheetIndex, (String)null, titleLineNumber, dtoClass, dbValidationConsumer, (Integer)null);
   }

   public SheetImportConfig(String sheetName, Class<T> dtoClass, Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer) {
      this((Integer)null, sheetName, 1, dtoClass, dbValidationConsumer, (Integer)null);
   }

   public SheetImportConfig(String sheetName, Class<T> dtoClass, int titleLineNumber, Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer) {
      this((Integer)null, sheetName, titleLineNumber, dtoClass, dbValidationConsumer, (Integer)null);
   }

   public SheetImportConfig(Integer sheetIndex, String sheetName, int titleLineNumber, Class<T> dtoClass, Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer, Integer errorColumnIndex) {
      this.sheetIndex = sheetIndex;
      this.sheetName = sheetName;
      this.titleLineNumber = titleLineNumber;
      this.dtoClass = dtoClass;
      this.dbValidationConsumer = dbValidationConsumer;
      this.errorColumnIndex = errorColumnIndex;
   }

   @Generated
   public Integer getSheetIndex() {
      return this.sheetIndex;
   }

   @Generated
   public String getSheetName() {
      return this.sheetName;
   }

   @Generated
   public int getTitleLineNumber() {
      return this.titleLineNumber;
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
   public Integer getErrorColumnIndex() {
      return this.errorColumnIndex;
   }

   @Generated
   public void setSheetIndex(Integer sheetIndex) {
      this.sheetIndex = sheetIndex;
   }

   @Generated
   public void setSheetName(String sheetName) {
      this.sheetName = sheetName;
   }

   @Generated
   public void setTitleLineNumber(int titleLineNumber) {
      this.titleLineNumber = titleLineNumber;
   }

   @Generated
   public void setDtoClass(Class<T> dtoClass) {
      this.dtoClass = dtoClass;
   }

   @Generated
   public void setDbValidationConsumer(Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer) {
      this.dbValidationConsumer = dbValidationConsumer;
   }

   @Generated
   public void setErrorColumnIndex(Integer errorColumnIndex) {
      this.errorColumnIndex = errorColumnIndex;
   }
}
