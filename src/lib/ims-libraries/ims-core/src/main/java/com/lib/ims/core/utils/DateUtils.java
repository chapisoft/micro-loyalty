package com.lib.ims.core.utils;

import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

public class DateUtils {
   public static final String FORMAT_DATE_HH_MM_SS_DD_MM_YYYY = "HHmmssddMMyyyy";
   public static final String FORMAT_DATE_DD_MM_YYYY_HH_MM_SS = "dd-MM-yyyy HH:mm:ss";
   public static final String FORMAT_DATE_DD_MM_YYYY = "dd/MM/yyyy";
   public static final String FORMAT_DATE_DDMMYYYY = "ddMMyyyy";
   public static final String FORMAT_DATE_YY = "yy";
   public static final String FORMAT_DATE_YYYY = "yyyy";
   public static final String FORMAT_DATE_YYYY_MM_DD = "yyyy-MM-dd";
   public static final String FORMAT_DATE_YYYY_MM_DD_HH_MM_SS_Z = "yyyy-MM-dd'T'HH:mm:ss'Z'";
   public static final String FORMAT_DATE_YYYY_MM_DD_HH_MM_SS_SSSSSS = "yyyy-MM-dd HH:mm:ss.SSSSSS";
   public static final String FORMAT_DATE_HH_MM_DD_MM_YYYY = "HH:mm dd/MM/yyyy";
   public static final String FORMAT_DATE_YY_MM_DD_HH_MM = "yyMMddHHmm";
   public static final String FORMAT_DATE_YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd HH:mm:ss";
   public static final String FORMAT_DATE_DD_MM_YYYY_HH_MM = "dd/MM/yyyy HH:mm";
   public static final String FORMAT_DATE_DD_MM_YYYY_HH_MM_SS_SSS = "dd/MM/yyyy HH:mm:ss.SSS";
   public static final String FORMAT_DATE_YYYYMMDD_HHMMSS = "yyyyMMdd_HHmmss";
   public static final String FORMAT_DATE_YYYYMMDD = "yyyyMMdd";
   public static final String FORMAT_DATE_YYYY_MM = "yyyy-MM";
   public static final String FORMAT_DATE_MM_YYYY = "MM/yyyy";
   public static final String FORMAT_DATE_MM_DD_YYYY = "MM/dd/yyyy";
   public static final String FORMAT_DATE_DD_MM_YYYY_HHMMSS = "dd-MM-yyyy HHmmss";
   public static final String FORMAT_DATE_DDMMYYYY_HHMMSS = "ddMMyyyy HHmmss";
   public static final String FORMAT_DATE_DDMMYYYY_HHMM = "ddMMyyyy HHmm";
   public static final String FORMAT_DATE_DDMMYYYY_HHMMSS_SSS = "ddMMyyyy HHmmss.SSS";
   public static final String FORMAT_DATE_DDMMYYYY_HHMMSS_SSSSSS = "ddMMyyyy HHmmss.SSSSSS";
   public static final String FORMAT_DATE_DDMMYYYY_HHMMSS_Z = "ddMMyyyy'T'HHmmss'Z'";
   public static final String FORMAT_DATE_DDMMYYYY_HHMMSS_SSSZ = "ddMMyyyy'T'HHmmss.SSS'Z'";
   public static final String FORMAT_DATE_DDMMYYYY_HHMMSS_SSSSSSZ = "ddMMyyyy'T'HHmmss.SSSSSS'Z'";

   public static Date convertStringToDate(String date, String formatPattern) throws ParseException {
      if (date != null && !date.isEmpty()) {
         String pattern = formatPattern == null ? "dd/MM/yyyy" : formatPattern;
         SimpleDateFormat dateFormat = new SimpleDateFormat(pattern);
         return dateFormat.parse(date);
      } else {
         return null;
      }
   }

   public static String convertDateToStringFormat(Date date, String format) {
      SimpleDateFormat dateFormat = new SimpleDateFormat(format);
      return dateFormat.format(date);
   }

   public static String convertLocalDateToStringFormat(LocalDate localDate, String format) {
      DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
      return localDate.format(formatter);
   }

   public static String convertLocalDateTimeToStringFormat(LocalDateTime dateTime, String format) {
      DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
      return dateTime.format(formatter);
   }

   public static LocalDateTime convertDateToLocalDateTime(Date date) {
      if (date == null) {
         return null;
      } else {
         Instant instant = date.toInstant();
         return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
      }
   }

   public static String formatDateToString(LocalDate date) {
      return date == null ? null : convertLocalDateToStringFormat(date, "dd/MM/yyyy");
   }

   public static String convertDateToString(Date date) {
      return date == null ? "" : (new SimpleDateFormat("dd/MM/yyyy")).format(date);
   }

   public static String convertTimestampToString(Timestamp date) {
      return date == null ? "" : (new SimpleDateFormat("dd/MM/yyyy")).format(date);
   }
}
