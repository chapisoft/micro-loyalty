package com.lib.ims.excel.model;

import com.alibaba.excel.metadata.Head;
import com.alibaba.excel.metadata.data.WriteCellData;
import com.alibaba.excel.write.handler.CellWriteHandler;
import com.alibaba.excel.write.metadata.holder.WriteSheetHolder;
import com.alibaba.excel.write.metadata.holder.WriteTableHolder;
import java.util.List;
import lombok.Generated;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Workbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExcelErrorFillHandler implements CellWriteHandler {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(ExcelErrorFillHandler.class);
   private final Integer errIndex;
   private CellStyle cachedStyle;

   private void setCellStyle(Cell cell) {
      if (this.cachedStyle == null) {
         Workbook workbook = cell.getSheet().getWorkbook();
         this.cachedStyle = workbook.createCellStyle();
         this.cachedStyle.setWrapText(true);
         Font font = workbook.createFont();
         if (font != null) {
            this.cachedStyle.setFont(font);
            font.setColor(IndexedColors.RED.getIndex());
            cell.setCellStyle(this.cachedStyle);
         }
      }

      cell.setCellStyle(this.cachedStyle);
   }

   public void afterCellDispose(WriteSheetHolder writeSheetHolder, WriteTableHolder writeTableHolder, List<WriteCellData<?>> cellDataList, Cell cell, Head head, Integer relativeRowIndex, Boolean isHead) {
      if (!isHead && cell.getColumnIndex() == this.errIndex) {
         this.setCellStyle(cell);
      }

   }

   @Generated
   public ExcelErrorFillHandler(Integer errIndex) {
      this.errIndex = errIndex;
   }
}
