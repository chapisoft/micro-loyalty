package com.lib.ims.excel;

import com.lib.ims.core.constants.IMSConstants;

public class ExcelBaseConst extends IMSConstants {
   public static final String ATTACHMENT = "attachment";

   public static class SheetNumber {
      public static final int EXCEL_SHEET_FIRST = 0;
      public static final int EXCEL_SHEET_SECOND = 1;
      public static final int EXCEL_SHEET_THIRD = 2;
      public static final int EXCEL_SHEET_FOURTH = 3;
      public static final int EXCEL_SHEET_FIFTH = 4;
      public static final int EXCEL_SHEET_SIXTH = 5;
      public static final int EXCEL_SHEET_SEVENTH = 6;
      public static final int EXCEL_SHEET_EIGHTH = 7;
      public static final int EXCEL_SHEET_NINTH = 8;
      public static final int EXCEL_SHEET_TENTH = 9;

      private SheetNumber() {
      }
   }

   public static class I18 {
      public static final String ERROR_READ_FILE_EMPTY_EXCEL = "error.read.file.empty.excel";
      public static final String ERROR_READ_FILE_CONFIG_EXCEL = "error.read.file.config.excel";
      public static final String ERROR_FILE_NOT_EXISTS = "error.file.not.exists";

      private I18() {
      }
   }
}
