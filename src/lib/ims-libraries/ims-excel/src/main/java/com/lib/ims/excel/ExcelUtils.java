package com.lib.ims.excel;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.ExcelReader;
import com.alibaba.excel.ExcelWriter;
import com.alibaba.excel.read.metadata.ReadSheet;
import com.alibaba.excel.write.builder.ExcelWriterSheetBuilder;
import com.alibaba.excel.write.metadata.WriteSheet;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lib.ims.core.exceptions.ApplicationException;
import com.lib.ims.core.exceptions.FileException;
import com.lib.ims.core.exceptions.StreamFileException;
import com.lib.ims.core.utils.DateUtils;
import com.lib.ims.core.utils.IMSUtils;
import com.lib.ims.excel.model.BaseImport;
import com.lib.ims.excel.model.ExcelLineResult;
import com.lib.ims.excel.model.ExportConfig;
import com.lib.ims.excel.model.ImportConfig;
import com.lib.ims.excel.model.ImportData;
import com.lib.ims.excel.model.ReplaceCustomHeader;
import com.lib.ims.excel.model.SheetImportConfig;
import com.lib.ims.excel.model.SheetModel;
import com.lib.ims.excel.model.export.SheetExportConfig;
import jakarta.validation.Validator;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@SuppressWarnings({"unchecked", "rawtypes", "null"})
public class ExcelUtils {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(ExcelUtils.class);
   private static final ExecutorService dataProcessingExecutor = Executors.newFixedThreadPool(Math.max(2, Runtime.getRuntime().availableProcessors() / 2));
   private static final ExecutorService errorWritingExecutor = Executors.newSingleThreadExecutor();

   public static Workbook getWorkbookFromInputStream(boolean useStreaming, InputStream files) {
      log.debug("Creating workbook from InputStream. Streaming: {}", useStreaming);
      return createWorkbook(useStreaming, files);
   }

   public static Workbook getWorkbookFromSystemFile(boolean useStreaming, String path) {
      try {
         InputStream files = getInputStreamClassPath(path);

         Workbook var3;
         try {
            var3 = createWorkbook(useStreaming, files);
         } catch (Throwable var6) {
            if (files != null) {
               try {
                  files.close();
               } catch (Throwable var5) {
                  var6.addSuppressed(var5);
               }
            }

            throw var6;
         }

         if (files != null) {
            files.close();
         }

         return var3;
      } catch (IOException var7) {
         log.error("Có lỗi trong quá trình xử lý file excel {}", var7.getMessage());
         throw new ApplicationException("Có lỗi trong quá trình xử lý file excel");
      }
   }

   private static Workbook createWorkbook(boolean useStreaming, InputStream files) {
      try {
         XSSFWorkbook xssfWorkbook = new XSSFWorkbook(files);
         return (Workbook)(useStreaming ? new SXSSFWorkbook(xssfWorkbook, 100) : xssfWorkbook);
      } catch (IOException var3) {
         log.error("Có lỗi trong quá trình xử lý file excel {}", var3.getMessage());
         throw new ApplicationException("Có lỗi trong quá trình xử lý file excel");
      }
   }

   public static ImportConfig readFileConfig(String path) {
      return (ImportConfig)readConfig(path, ImportConfig.class);
   }

   public static ExportConfig readFileConfigExport(String path) {
      return (ExportConfig)readConfig(path, ExportConfig.class);
   }

   private static <T> T readConfig(String path, Class<T> configClass) {
      ObjectMapper mapper = new ObjectMapper();

      try (InputStream inputStream = getInputStreamClassPath(path)) {
         return mapper.readValue(inputStream, configClass);

      } catch (IOException e) {
         log.error("Error reading file config: {}", e.getMessage(), e);
         throw new ApplicationException("error.read.file.config.excel");
      }
   }


   public static InputStream getInputStreamClassPath(String path) {
      InputStream input = ExcelUtils.class.getClassLoader().getResourceAsStream(path);
      if (input == null) {
         log.error("Error [getFileClassPath]: {} is null", path);
         throw new ApplicationException("error.file.not.exists");
      } else {
         return input;
      }
   }

   public static Map<String, Object> parameters(Object obj) {
      Map<String, Object> map = new HashMap();
      if (obj == null) {
         return map;
      } else {
         Field[] var2 = obj.getClass().getDeclaredFields();
         int var3 = var2.length;

         for(int var4 = 0; var4 < var3; ++var4) {
            Field field = var2[var4];
            field.setAccessible(true);

            try {
               map.put(field.getName(), field.get(obj));
            } catch (Exception var7) {
               log.warn("Could not access field '{}' of object {}: {}", new Object[]{field.getName(), obj.getClass().getSimpleName(), var7.getMessage()});
            }
         }

         log.trace("Extracted parameters from object {}: {}", obj.getClass().getSimpleName(), map);
         return map;
      }
   }

   private static CellStyle setCellStyle(Workbook workbook, SheetModel sheetModel) {
      CellStyle cellStyle = workbook.createCellStyle();
      if (sheetModel.getBorder()) {
         cellStyle.setBorderTop(BorderStyle.THIN);
         cellStyle.setBorderBottom(BorderStyle.THIN);
         cellStyle.setBorderLeft(BorderStyle.THIN);
         cellStyle.setBorderRight(BorderStyle.THIN);
      }

      cellStyle.setWrapText(true);
      return cellStyle;
   }

   public static <T> Workbook addListToGetSheetAtExcel(List<T> data, Workbook workbook, ExportConfig exportConfig, int sheetAt) {
      SheetModel sheetModel = (SheetModel)exportConfig.getSheet().get(sheetAt);
      CellStyle cellStyle = setCellStyle(workbook, sheetModel);
      List<ImportData> sheet = sheetModel.getData();
      Long sheetStartTime = System.currentTimeMillis();
      Sheet dataSheet = workbook.getSheetAt(sheetAt);
      Map<String, CellStyle> cellStyleMap = (Map)sheet.stream().map(ImportData::getFormat).distinct().collect(Collectors.toMap((format) -> {
         return format;
      }, (format) -> {
         CellStyle cellStyleFormat = workbook.createCellStyle();
         cellStyleFormat.cloneStyleFrom(cellStyle);
         if (StringUtils.isNotBlank(format)) {
            cellStyleFormat.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat(format));
         }

         return cellStyleFormat;
      }));
      Map<String, Integer> columnMap = (Map)IntStream.range(0, sheet.size()).boxed().collect(Collectors.toMap((j) -> {
         return ((ImportData)sheet.get(j)).getTitle();
      }, (j) -> {
         return j;
      }, (a, b) -> {
         return b;
      }));
      AtomicInteger i = new AtomicInteger();
      data.forEach((item) -> {
         Row row = dataSheet.createRow(sheetModel.getStartDataRow() + i.get());
         Map<String, Object> cellValue = parameters(item);
         Iterator var10 = cellValue.entrySet().iterator();

         while(var10.hasNext()) {
            Entry<String, Object> entry = (Entry)var10.next();
            String key = (String)entry.getKey();
            Integer columnIndex = (Integer)columnMap.get(key);
            if (columnIndex != null) {
               if ("stt".equals(key)) {
                  createCell(row, columnIndex, i.get() + 1, cellStyle);
               } else {
                  String format = ((ImportData)sheet.get(columnIndex)).getFormat();
                  if (StringUtils.isNotBlank(format)) {
                     CellStyle style = (CellStyle)cellStyleMap.get(format);
                     createCell(row, columnIndex, entry.getValue(), style);
                  } else {
                     createCell(row, columnIndex, entry.getValue(), cellStyle);
                  }
               }
            }
         }

         i.getAndIncrement();
      });
      Long endSheetTime = System.currentTimeMillis();
      log.info("Total sheet generation time for sheet {} : {} ms.", sheetAt, endSheetTime - sheetStartTime);
      return workbook;
   }

   public static void setHeadersCustom(Map<String, String> map, Workbook workbook, ExportConfig exportConfig, int sheetAt) {
      SheetModel sheetModel = (SheetModel)exportConfig.getSheet().get(sheetAt);
      List<ReplaceCustomHeader> customHeaders = sheetModel.getHeaders().getReplaceCustom();
      Sheet dataSheet = workbook.getSheetAt(sheetAt);
      log.debug("Setting custom headers for sheet at index {}. Found {} custom headers.", sheetAt, customHeaders.size());

      for(int i = 0; i < customHeaders.size(); ++i) {
         ReplaceCustomHeader replaceCustomHeader = (ReplaceCustomHeader)customHeaders.get(i);
         CellReference cellRef = new CellReference(replaceCustomHeader.getPosition());
         Row row = dataSheet.getRow(cellRef.getRow());
         if (row == null) {
            log.warn("Row at index {} not found for custom header replacement.", cellRef.getRow());
         } else {
            Cell cell = row.getCell(cellRef.getCol());
            if (cell == null) {
               log.warn("Cell at position {} not found for custom header replacement in row {}.", replaceCustomHeader.getPosition(), cellRef.getRow());
            } else {
               String value = cell.getStringCellValue();
               if (StringUtils.isNotBlank(value)) {
                  String data = (String)map.get(replaceCustomHeader.getKey().toUpperCase());
                  if (data != null) {
                     String replacedString = value.replaceAll("\\$\\{" + (i + 1) + "\\}", data);
                     cell.setCellValue(replacedString);
                     log.debug("Replaced custom header at {} with value '{}'.", replaceCustomHeader.getPosition(), data);
                  } else {
                     log.debug("No data found for custom header key '{}'.", replaceCustomHeader.getKey());
                  }
               } else {
                  log.debug("Cell at {} is blank, skipping custom header replacement.", replaceCustomHeader.getPosition());
               }
            }
         }
      }

   }

   public static SXSSFWorkbook convertXSSFWorkbookToSXSSFWorkbook(Workbook workbook) {
      log.debug("Converting XSSFWorkbook to SXSSFWorkbook.");

      try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {
         workbook.write(byteArrayOutputStream);
         byte[] bytes = byteArrayOutputStream.toByteArray();
         workbook.close();
         ByteArrayInputStream input = new ByteArrayInputStream(bytes);
         XSSFWorkbook xssfWorkbook = new XSSFWorkbook(input);
         SXSSFWorkbook sSXSSFWorkbook = new SXSSFWorkbook(xssfWorkbook, 100);
         log.info("Successfully converted XSSFWorkbook to SXSSFWorkbook.");
         return sSXSSFWorkbook;
      } catch (IOException e) {
         log.error("Failed to convert Excel to byte array during XSSF to SXSSF conversion: {}", e.getMessage(), e);
         throw new ApplicationException("Failed to convert Excel to byte array: " + e.getMessage());
      }
   }

   public static void hideColumn(Workbook workbook, int sheetAt, int columnIndex) {
      Sheet sheet = workbook.getSheetAt(sheetAt);
      if (sheet != null) {
         sheet.setColumnHidden(columnIndex, true);
         log.debug("Column {} hidden in sheet at index {}.", columnIndex, sheetAt);
      } else {
         log.warn("Sheet at index {} not found, cannot hide column {}.", sheetAt, columnIndex);
      }

   }

   public static byte[] getValues(Workbook workbook) {
      long startTime = System.currentTimeMillis();
      log.info("Starting getBytes for Excel workbook.");

      try {
         ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();

         byte[] bytes;
         try {
            workbook.write(byteArrayOutputStream);
            bytes = byteArrayOutputStream.toByteArray();
            workbook.close();
            log.info("Successfully converted Excel to byte array. Time taken: {} ms.", System.currentTimeMillis() - startTime);
         } catch (Throwable var8) {
            try {
               byteArrayOutputStream.close();
            } catch (Throwable var7) {
               var8.addSuppressed(var7);
            }

            throw var8;
         }

         byteArrayOutputStream.close();
         return bytes;
      } catch (IOException var9) {
         log.error("Failed to convert Excel to byte array: {}", var9.getMessage(), var9);
         throw new ApplicationException("Failed to convert Excel to byte array: " + var9.getMessage());
      }
   }

   public static void createCell(Row row, int colNum, Object value, CellStyle cellStyle) {
      Cell cell = row.createCell(colNum);

      if (cellStyle != null) {
         cell.setCellStyle(cellStyle);
      }

      if (value == null) {
         cell.setCellValue("");
         return;
      }

      if (value instanceof String s) {
         cell.setCellValue("null".equals(s) ? "" : s);

      } else if (value instanceof Integer i) {
         cell.setCellValue(i.doubleValue());

      } else if (value instanceof Long l) {
         cell.setCellValue(l.doubleValue());

      } else if (value instanceof Double d) {
         cell.setCellValue(d);

      } else if (value instanceof Boolean b) {
         cell.setCellValue(b ? "Có" : "Không");

      } else if (value instanceof Date d) {
         cell.setCellValue(DateUtils.convertDateToString(d));

      } else {
         cell.setCellValue(String.valueOf(value));
      }

      log.trace("Created cell at R{}C{} with value: {}", row.getRowNum(), colNum, value);
   }


   public static <T> Map<String, Integer> convertToMap(Class<T> clazz) {
      Map<String, Integer> fieldMap = new LinkedHashMap();
      int index = 0;
      List<Field> fields = IMSUtils.getFields(clazz);
      Iterator var4 = fields.iterator();

      while(var4.hasNext()) {
         Field field = (Field)var4.next();
         fieldMap.put(field.getName(), index++);
      }

      log.debug("Converted class {} fields to map: {}", clazz.getSimpleName(), fieldMap);
      return fieldMap;
   }

   private static String sanitizeFileName(String originalFilename) {
      String safeName;
      if (originalFilename != null && !originalFilename.isBlank()) {
         safeName = Paths.get(originalFilename).getFileName().toString();
      } else {
         safeName = "file";
         log.warn("Original filename was null or blank, defaulting to 'file'.");
      }

      safeName = safeName.replaceAll("[^a-zA-Z0-9._-]", "_");
      int dotIndex = safeName.lastIndexOf(".");
      String namePart;
      String extensionPart;
      if (dotIndex > 0) {
         namePart = safeName.substring(0, dotIndex);
         extensionPart = safeName.substring(dotIndex);
      } else {
         namePart = safeName;
         extensionPart = "";
      }

      if (namePart.length() > 40) {
         namePart = namePart.substring(0, 40);
         log.debug("Sanitized filename truncated to 40 characters: {}", namePart);
      }

      namePart = namePart + "_error";
      log.debug("Added suffix '{}' to sanitized filename. Result: {}", "_error", namePart);
      String finalFileName = namePart + extensionPart;
      log.debug("Sanitized filename from '{}' to '{}' with suffix '{}'.", new Object[]{originalFilename, finalFileName, "_error"});
      return finalFileName;
   }

   public static StreamingResponseBody write(String templatePath, SheetExportConfig<?> config) {
      log.debug("Preparing streaming response body for single sheet export using template path: {}", templatePath);
      return (outputStream) -> {
         InputStream templateInputStream = getInputStreamClassPath(templatePath);

         try {
            writeMultiExcel(outputStream, templateInputStream, Collections.singletonList(config));
         } finally {
            if (Collections.singletonList(templateInputStream).get(0) != null) {
               templateInputStream.close();
            }

         }

      };
   }

   public static StreamingResponseBody write(InputStream templateInputStream, SheetExportConfig<?> config) {
      log.debug("Preparing streaming response body for single sheet export using InputStream template.");
      return (outputStream) -> {
         writeMultiExcel(outputStream, templateInputStream, Collections.singletonList(config));
      };
   }

   public static StreamingResponseBody writeMultiExcel(String templatePath, List<SheetExportConfig<?>> sheetExportConfigs) {
      log.debug("Preparing streaming response body for multi-sheet export using template path: {}", templatePath);
      return (outputStream) -> {
         InputStream templateInputStream = getInputStreamClassPath(templatePath);

         try {
            writeMultiExcel(outputStream, templateInputStream, sheetExportConfigs);
         } finally {
            if (Collections.singletonList(templateInputStream).get(0) != null) {
               templateInputStream.close();
            }

         }

      };
   }

   public static StreamingResponseBody writeMultiExcel(InputStream inputStream, List<SheetExportConfig<?>> sheetExportConfigs) {
      log.debug("Preparing streaming response body for multi-sheet export using InputStream template.");
      return (outputStream) -> {
         writeMultiExcel(outputStream, inputStream, sheetExportConfigs);
      };
   }

   private static void writeMultiExcel(OutputStream outputStream, InputStream templateInputStream, List<SheetExportConfig<?>> sheetExportConfigs) {
      log.info("Starting multi-sheet Excel export with {} sheets.", sheetExportConfigs.size());

      try {
         ExcelWriter excelWriter = EasyExcel.write(outputStream).withTemplate(templateInputStream).autoCloseStream(false).build();

         try {
            Iterator var4 = sheetExportConfigs.iterator();

            while(var4.hasNext()) {
               SheetExportConfig<?> config = (SheetExportConfig)var4.next();
               String sheetName = config.getSheetName() != null ? config.getSheetName() : String.valueOf(config.getSheetIndex());
               log.debug("Processing export sheet: {}", sheetName);
               WriteSheet writeSheet = config.getSheetName() != null && !config.getSheetName().isEmpty() ? ((ExcelWriterSheetBuilder)EasyExcel.writerSheet(config.getSheetName()).relativeHeadRowIndex(config.getTitleLineNumber())).build() : ((ExcelWriterSheetBuilder)EasyExcel.writerSheet(config.getSheetIndex()).relativeHeadRowIndex(config.getTitleLineNumber())).build();
               if (config.getHeaderData() != null && !config.getHeaderData().isEmpty()) {
                  excelWriter.fill(config.getHeaderData(), writeSheet);
               }

               if (config.getDataProvider() != null) {
                  config.getDataProvider().streamData(config.getBatchSize(), (data) -> {
                     excelWriter.write(data, writeSheet);
                     log.info("Wrote batch of {} items to sheet {}.", data.size(), writeSheet.getSheetName());
                  });
                  log.info("Finished processing data for sheet {}.", writeSheet.getSheetName());
               } else {
                  log.info("No data provider found for sheet {}, only filled header.", writeSheet.getSheetName());
               }
            }

            excelWriter.finish();
            log.info("Successfully finished multi-sheet Excel export.");
         } catch (Throwable var9) {
            if (excelWriter != null) {
               try {
                  excelWriter.close();
               } catch (Throwable var8) {
                  var9.addSuppressed(var8);
               }
            }

            throw var9;
         }

         if (excelWriter != null) {
            excelWriter.close();
         }

      } catch (Exception var10) {
         log.error("Error generating Excel: {}", var10.getMessage(), var10);
         throw new ApplicationException("Có lỗi trong quá trình ghi file excel");
      }
   }

   public static <T extends BaseImport> byte[] read(MultipartFile file, String pathTemplate, SheetImportConfig<T> config) {
      log.debug("Starting single sheet Excel read for file: {}", file.getOriginalFilename());
      List<SheetImportConfig<? extends BaseImport>> configList = Collections.singletonList(config);
      return readMultiSheets(file, pathTemplate, configList);
   }

   public static byte[] readMultiSheets(
           MultipartFile file,
           String pathTemplate,
           List<SheetImportConfig<? extends BaseImport>> sheetImportConfigs) {

      Path tempErrorFile = null;
      AtomicBoolean hasErrors = new AtomicBoolean(false);

      log.info("Starting multi-sheet Excel import for file: {}", file.getOriginalFilename());

      try {
         tempErrorFile = Files.createTempFile("excel_error_", ".xlsx");

         try (
                 InputStream inputStream = file.getInputStream();
                 FileOutputStream errorOutputStream = new FileOutputStream(tempErrorFile.toFile());
                 ExcelWriter excelErrorWriter = EasyExcel
                         .write(errorOutputStream)
                         .withTemplate(getInputStreamClassPath(pathTemplate))
                         .autoCloseStream(false)
                         .needHead(false)
                         .build();
                 ExcelReader excelReader = EasyExcel
                         .read(inputStream)
                         .autoTrim(true)
                         .build()
         ) {

            Validator validator = ApplicationContextHolder.getBean(Validator.class);

            List<ReadSheet> readSheets = new ArrayList<>();

            for (SheetImportConfig<? extends BaseImport> config : sheetImportConfigs) {

               Map<String, Integer> mapObj = convertToMap(config.getDtoClass());

               WriteSheet errorSheet = StringUtils.isBlank(config.getSheetName())
                       ? EasyExcel.writerSheet(config.getSheetIndex()).needHead(true).build()
                       : EasyExcel.writerSheet(config.getSheetName()).needHead(true).build();

               ExcelImportListener<? extends BaseImport> listener =
                       createListener(config, validator, mapObj,
                               excelErrorWriter, hasErrors, errorSheet);

               ReadSheet readSheet = StringUtils.isBlank(config.getSheetName())
                       ? EasyExcel.readSheet(config.getSheetIndex())
                       .head(config.getDtoClass())
                       .headRowNumber(config.getTitleLineNumber())
                       .registerReadListener(listener)
                       .build()
                       : EasyExcel.readSheet(config.getSheetName())
                       .head(config.getDtoClass())
                       .headRowNumber(config.getTitleLineNumber())
                       .registerReadListener(listener)
                       .build();

               readSheets.add(readSheet);
            }

            if (!readSheets.isEmpty()) {
               excelReader.read(readSheets);
            }

            excelErrorWriter.finish();

            if (hasErrors.get()) {
               String errorFileName = sanitizeFileName(file.getOriginalFilename());
               throw new StreamFileException(
                       tempErrorFile.toString(),
                       errorFileName,
                       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
               );
            }

            Files.deleteIfExists(tempErrorFile);
            return null;   // thành công, không trả file lỗi

         }

      } catch (StreamFileException e) {
         throw e;

      } catch (FileException e) {
         throw e;

      } catch (ApplicationException e) {
         throw e;

      } catch (Exception e) {
         log.error("ERROR reading excel", e);

         if (tempErrorFile != null) {
            try {
               Files.deleteIfExists(tempErrorFile);
            } catch (IOException ignore) {}
         }

         throw new ApplicationException("Có lỗi trong quá trình xử lý file excel");
      }
   }


   private static <T extends BaseImport> ExcelImportListener<T> createListener(SheetImportConfig<T> config, Validator validator, Map<String, Integer> mapObj, ExcelWriter excelErrorWriter, AtomicBoolean hasErrors, WriteSheet errorSheet) {
      Function<List<ExcelLineResult<T>>, List<ExcelLineResult<T>>> dbValidationConsumer = config.getDbValidationConsumer();
      return new ExcelImportListener(config.getDtoClass(), dbValidationConsumer, validator, mapObj, config.getTitleLineNumber(), excelErrorWriter, hasErrors, errorSheet, dataProcessingExecutor);
   }

   static {
      Runtime.getRuntime().addShutdownHook(new Thread(() -> {
         log.info("Shutting down data processing executor...");
         dataProcessingExecutor.shutdown();

         try {
            if (!dataProcessingExecutor.awaitTermination(60L, TimeUnit.SECONDS)) {
               dataProcessingExecutor.shutdownNow();
            }
         } catch (InterruptedException var2) {
            dataProcessingExecutor.shutdownNow();
            Thread.currentThread().interrupt();
         }

         log.info("Shutting down error writing executor...");
         errorWritingExecutor.shutdown();

         try {
            if (!errorWritingExecutor.awaitTermination(60L, TimeUnit.SECONDS)) {
               errorWritingExecutor.shutdownNow();
            }
         } catch (InterruptedException var1) {
            errorWritingExecutor.shutdownNow();
            Thread.currentThread().interrupt();
         }

         log.info("All Excel utility executors shut down.");
      }));
   }
}
