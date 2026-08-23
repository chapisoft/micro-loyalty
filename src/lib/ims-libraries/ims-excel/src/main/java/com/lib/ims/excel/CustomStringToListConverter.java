package com.lib.ims.excel;

import com.alibaba.excel.converters.Converter;
import com.alibaba.excel.converters.ReadConverterContext;
import com.alibaba.excel.enums.CellDataTypeEnum;
import com.alibaba.excel.metadata.data.ReadCellData;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@SuppressWarnings({"unchecked", "rawtypes", "null"})
public class CustomStringToListConverter implements Converter<List<String>> {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(CustomStringToListConverter.class);

   public Class<?> supportJavaTypeKey() {
      return String.class;
   }

   public CellDataTypeEnum supportExcelTypeKey() {
      return CellDataTypeEnum.STRING;
   }

   public List<String> convertToJavaData(ReadConverterContext<?> context) {
      ReadCellData<?> readCellData = context.getReadCellData();
      CellDataTypeEnum type = readCellData.getType();
      String data;
      if (type.equals(CellDataTypeEnum.STRING)) {
         data = readCellData.getStringValue();

         try {
            return Arrays.stream(data.split(",")).filter(StringUtils::isNotBlank).map(String::trim).toList();
         } catch (Exception var6) {
            log.error("ERROR convertToJavaData {} {} {}", new Object[]{data, var6, var6.getMessage()});
         }
      } else if (type.equals(CellDataTypeEnum.NUMBER)) {
         data = readCellData.getNumberValue().toString();
         return List.of(data);
      }

      return new ArrayList();
   }
}
