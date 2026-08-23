package com.lib.ims.excel.model.export;

import com.lib.ims.excel.DataProvider;
import java.util.Map;
import lombok.Generated;


@SuppressWarnings({"unchecked", "rawtypes"})
public class SheetExportConfig<T> {
   private Integer sheetIndex;
   private String sheetName;
   private Class<T> dtoClass;
   private DataProvider<T> dataProvider;
   private Map<String, Object> headerData;
   private int titleLineNumber;
   private int batchSize;
   private boolean multipleSheets;
   private int maxRowsPerSheet;

   @Generated
   private static <T> Integer $default$sheetIndex() {
      return 0;
   }

   @Generated
   private static <T> int $default$titleLineNumber() {
      return 0;
   }

   @Generated
   private static <T> int $default$batchSize() {
      return 1000;
   }

   @Generated
   private static <T> boolean $default$multipleSheets() {
      return false;
   }

   @Generated
   private static <T> int $default$maxRowsPerSheet() {
      return 1000000;
   }

   @Generated
   public static <T> SheetExportConfig.SheetExportConfigBuilder<T> builder() {
      return new SheetExportConfig.SheetExportConfigBuilder();
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
   public Class<T> getDtoClass() {
      return this.dtoClass;
   }

   @Generated
   public DataProvider<T> getDataProvider() {
      return this.dataProvider;
   }

   @Generated
   public Map<String, Object> getHeaderData() {
      return this.headerData;
   }

   @Generated
   public int getTitleLineNumber() {
      return this.titleLineNumber;
   }

   @Generated
   public int getBatchSize() {
      return this.batchSize;
   }

   @Generated
   public boolean isMultipleSheets() {
      return this.multipleSheets;
   }

   @Generated
   public int getMaxRowsPerSheet() {
      return this.maxRowsPerSheet;
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
   public void setDtoClass(Class<T> dtoClass) {
      this.dtoClass = dtoClass;
   }

   @Generated
   public void setDataProvider(DataProvider<T> dataProvider) {
      this.dataProvider = dataProvider;
   }

   @Generated
   public void setHeaderData(Map<String, Object> headerData) {
      this.headerData = headerData;
   }

   @Generated
   public void setTitleLineNumber(int titleLineNumber) {
      this.titleLineNumber = titleLineNumber;
   }

   @Generated
   public void setBatchSize(int batchSize) {
      this.batchSize = batchSize;
   }

   @Generated
   public void setMultipleSheets(boolean multipleSheets) {
      this.multipleSheets = multipleSheets;
   }

   @Generated
   public void setMaxRowsPerSheet(int maxRowsPerSheet) {
      this.maxRowsPerSheet = maxRowsPerSheet;
   }

   @Generated
   public SheetExportConfig() {
      this.sheetIndex = $default$sheetIndex();
      this.titleLineNumber = $default$titleLineNumber();
      this.batchSize = $default$batchSize();
      this.multipleSheets = $default$multipleSheets();
      this.maxRowsPerSheet = $default$maxRowsPerSheet();
   }

   @Generated
   public SheetExportConfig(Integer sheetIndex, String sheetName, Class<T> dtoClass, DataProvider<T> dataProvider, Map<String, Object> headerData, int titleLineNumber, int batchSize, boolean multipleSheets, int maxRowsPerSheet) {
      this.sheetIndex = sheetIndex;
      this.sheetName = sheetName;
      this.dtoClass = dtoClass;
      this.dataProvider = dataProvider;
      this.headerData = headerData;
      this.titleLineNumber = titleLineNumber;
      this.batchSize = batchSize;
      this.multipleSheets = multipleSheets;
      this.maxRowsPerSheet = maxRowsPerSheet;
   }

   @Generated
   public static class SheetExportConfigBuilder<T> {
      @Generated
      private boolean sheetIndex$set;
      @Generated
      private Integer sheetIndex$value;
      @Generated
      private String sheetName;
      @Generated
      private Class<T> dtoClass;
      @Generated
      private DataProvider<T> dataProvider;
      @Generated
      private Map<String, Object> headerData;
      @Generated
      private boolean titleLineNumber$set;
      @Generated
      private int titleLineNumber$value;
      @Generated
      private boolean batchSize$set;
      @Generated
      private int batchSize$value;
      @Generated
      private boolean multipleSheets$set;
      @Generated
      private boolean multipleSheets$value;
      @Generated
      private boolean maxRowsPerSheet$set;
      @Generated
      private int maxRowsPerSheet$value;

      @Generated
      SheetExportConfigBuilder() {
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> sheetIndex(Integer sheetIndex) {
         this.sheetIndex$value = sheetIndex;
         this.sheetIndex$set = true;
         return this;
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> sheetName(String sheetName) {
         this.sheetName = sheetName;
         return this;
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> dtoClass(Class<T> dtoClass) {
         this.dtoClass = dtoClass;
         return this;
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> dataProvider(DataProvider<T> dataProvider) {
         this.dataProvider = dataProvider;
         return this;
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> headerData(Map<String, Object> headerData) {
         this.headerData = headerData;
         return this;
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> titleLineNumber(int titleLineNumber) {
         this.titleLineNumber$value = titleLineNumber;
         this.titleLineNumber$set = true;
         return this;
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> batchSize(int batchSize) {
         this.batchSize$value = batchSize;
         this.batchSize$set = true;
         return this;
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> multipleSheets(boolean multipleSheets) {
         this.multipleSheets$value = multipleSheets;
         this.multipleSheets$set = true;
         return this;
      }

      @Generated
      public SheetExportConfig.SheetExportConfigBuilder<T> maxRowsPerSheet(int maxRowsPerSheet) {
         this.maxRowsPerSheet$value = maxRowsPerSheet;
         this.maxRowsPerSheet$set = true;
         return this;
      }

      @Generated
      public SheetExportConfig<T> build() {
         Integer sheetIndex$value = this.sheetIndex$value;
         if (!this.sheetIndex$set) {
            sheetIndex$value = SheetExportConfig.$default$sheetIndex();
         }

         int titleLineNumber$value = this.titleLineNumber$value;
         if (!this.titleLineNumber$set) {
            titleLineNumber$value = SheetExportConfig.$default$titleLineNumber();
         }

         int batchSize$value = this.batchSize$value;
         if (!this.batchSize$set) {
            batchSize$value = SheetExportConfig.$default$batchSize();
         }

         boolean multipleSheets$value = this.multipleSheets$value;
         if (!this.multipleSheets$set) {
            multipleSheets$value = SheetExportConfig.$default$multipleSheets();
         }

         int maxRowsPerSheet$value = this.maxRowsPerSheet$value;
         if (!this.maxRowsPerSheet$set) {
            maxRowsPerSheet$value = SheetExportConfig.$default$maxRowsPerSheet();
         }

         return new SheetExportConfig(sheetIndex$value, this.sheetName, this.dtoClass, this.dataProvider, this.headerData, titleLineNumber$value, batchSize$value, multipleSheets$value, maxRowsPerSheet$value);
      }

      @Generated
      public String toString() {
         Integer var10000 = this.sheetIndex$value;
         return "SheetExportConfig.SheetExportConfigBuilder(sheetIndex$value=" + var10000 + ", sheetName=" + this.sheetName + ", dtoClass=" + String.valueOf(this.dtoClass) + ", dataProvider=" + String.valueOf(this.dataProvider) + ", headerData=" + String.valueOf(this.headerData) + ", titleLineNumber$value=" + this.titleLineNumber$value + ", batchSize$value=" + this.batchSize$value + ", multipleSheets$value=" + this.multipleSheets$value + ", maxRowsPerSheet$value=" + this.maxRowsPerSheet$value + ")";
      }
   }
}
