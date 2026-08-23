package com.lib.ims.excel.model;

import java.util.List;

public record ImportError(List<ImportErrorBean> errors, String fileExcelBase64, boolean isCheck) {
   public ImportError(List<ImportErrorBean> errors, String fileExcelBase64) {
      this(errors, fileExcelBase64, true);
   }

   public ImportError(List<ImportErrorBean> errors, String fileExcelBase64, boolean isCheck) {
      this.errors = errors;
      this.fileExcelBase64 = fileExcelBase64;
      this.isCheck = isCheck;
   }

   public List<ImportErrorBean> errors() {
      return this.errors;
   }

   public String fileExcelBase64() {
      return this.fileExcelBase64;
   }

   public boolean isCheck() {
      return this.isCheck;
   }
}
