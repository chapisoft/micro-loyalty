package com.lib.ims.excel.model;

public record ImportErrorRow(int row, String description) {
   public ImportErrorRow(int row, String description) {
      this.row = row;
      this.description = description;
   }

   public int row() {
      return this.row;
   }

   public String description() {
      return this.description;
   }
}
