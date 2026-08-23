package com.lib.ims.core.constants;

public class IMSConstants {
   public static final String CHARACTER_PERCENT = "%";
   public static final char DEFAULT_ESCAPE_CHAR = '&';
   public static final String FILE_PATH = "file";
   public static final String MESSAGE_DEFAULT_PATH = "classpath:messages";
   public static final String DEFAULT_COLON = ":";
   public static final String DOT = ".";
   public static final String COMMA = ",";
   public static final String SINGLE_QUOTE = "'";
   public static final String API_BEARER = "Bearer %s";
   public static final String CONTENT_LENGTH = "Content-Length";
   public static final String MARK = "******";
   public static final String LANGUAGE_VI = "vi";
   public static final String ATT_SCOPE = "scope";
   public static final String ADMIN_GLOBAL = "ADMIN_GLOBAL";
   public static final String DURATION = "duration";
   public static final String UNKNOWN = "unknown";
   public static final int PAGE_DEFAULT = 0;
   public static final int SIZE_DEFAULT = 15;
   public static final int SIZE_MAX = 200;
   public static final Integer NOT_DELETED = 0;
   public static final Integer DELETED = 1;
   public static final Integer ACTIVE = 1;
   public static final Integer INACTIVE = 0;

   protected IMSConstants() {
   }

   public static class MimeTypeConstants {
      public static final String EXCEL_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      public static final String EXCEL_XLS = "application/vnd.ms-excel";
      public static final String CSV = "text/csv";
      public static final String WORD_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      public static final String WORD_DOC = "application/msword";
      public static final String PDF = "application/pdf";
      public static final String IMAGE_PNG = "image/png";
      public static final String IMAGE_JPEG = "image/jpeg";
      public static final String IMAGE_GIF = "image/gif";
      public static final String TEXT_PLAIN = "text/plain";
      public static final String TEXT_HTML = "text/html";
      public static final String APPLICATION_JSON = "application/json";
      public static final String APPLICATION_XML = "application/xml";
      public static final String ZIP = "application/zip";
      public static final String OCTET_STREAM = "application/octet-stream";

      private MimeTypeConstants() {
         throw new UnsupportedOperationException("Cannot instantiate constants class");
      }
   }

   public static class FileExtensions {
      public static final String PDF = "pdf";
      public static final String XLS = "xls";
      public static final String XLSX = "xlsx";
      public static final String DOC = "doc";
      public static final String DOCX = "docx";
      public static final String JPG = "jpg";
      public static final String JPEG = "jpeg";
      public static final String PNG = "png";
      public static final String XML = "xml";
      public static final String HEIC = "heic";
      public static final String PPT = "ppt";
      public static final String PPTX = "pptx";
      public static final String RAR = "rar";
      public static final String ZIP = "zip";
      public static final String WAV = "wav";
      public static final String BMP = "bmp";
      public static final String GIF = "gif";
      public static final String MSG = "msg";
      public static final String CSV = "csv";
      public static final String TXT = "txt";
      public static final String WEBP = "webp";
      public static final String MP3 = "mp3";
      public static final String MP4 = "mp4";
      public static final String M4A = "m4a";

      private FileExtensions() {
         throw new UnsupportedOperationException("Cannot instantiate constants class");
      }
   }

   public static class TypeSize {
      public static final String APPLICATION_ZIP = "ZIP";
      public static final String APPLICATION_PDF = "application/pdf";
      public static final String APPLICATION_JPG = "JPG";
      public static final String APPLICATION_JPEG = "JPEG";
      public static final String APPLICATION_PNG = "PNG";
      public static final String APPLICATION_XLSX = "application/xlsx";
      public static final String APPLICATION_XLS = "application/xls";
      public static final String APPLICATION_DOCX = "application/docx";
      public static final String APPLICATION_DOC = "application/doc";

      private TypeSize() {
      }
   }

   public static class HttpMonitoringInterceptor {
      public static final String CLIENT_MESSAGE_ID = "clientMessageId";
      public static final String TRANSACTION_ID = "transactionId";
      public static final String LOG_TYPE = "logType";
      public static final String DURATION = "duration";
      public static final String RESPONSE_CODE = "responseCode";
      public static final String STATUS = "status";
      public static final String START_TIME = "startTime";
      public static final String SOURCE_APP = "sourceApp";
      public static final String SOURCE_APP_IP = "sourceAppIp";
      public static final String SOURCE_IP_ADDRESS = "sourceIpAddress";
      public static final String IP_SERVER = "ipServer";
      public static final String DESTINATION_APP_IP = "destinationAppIp";
      public static final String DESTINATION_APP_PORT = "destinationAppPort";
      public static final String URL_PATH = "urlPath";
      public static final String SERVICE_PATH = "servicePath";
      public static final String SERVICE_PATH_PATTERN = "servicePathPattern";
      public static final String METHOD = "method";
      public static final String TYPE_SYSTEM = "typeSystem";
      public static final String URL = "url";
      public static final String USER_AGENT = "userAgent";
      public static final String HOST = "host";
      public static final String ORIGIN = "origin";
      public static final String CONTENT_TYPE = "contentType";
      public static final String CONTENT_LENGTH = "contentLength";
      public static final String USER_ID = "userId";
      public static final String USER_REQUEST = "userRequest";
      public static final String USER_NAME = "userName";
      public static final String USER_INFO = "x-user-info";
      public static final String SERVICE_HEADER = "serviceHeader";
      public static final String SERVICE_MESSAGE_ID = "serviceMessageId";
      public static final String AUTHORIZATION = "Authorization";
      public static final String APP_ID = "SourceAppId";
      public static final String APPLICATION = "application";
      public static final String SERVER_ID = "serverId";
      public static final String CODE = "code";
      public static final String HTTP_REQUEST = "http-request";
      public static final String HTTP_RESPONSE = "http-response";

      protected HttpMonitoringInterceptor() {
      }
   }

   public static final class HeaderRequest {
      public static final String X_USER_INFO = "x-user-info";
      public static final String AUTHORIZATION = "Authorization";
      public static final String CLIENT_MESSAGE_ID = "clientMessageId";
      public static final String X_FORWARDED_FOR = "x-forwarded-for";
      public static final String X_ORIGINAL_FORWARDED_FOR = "x-original-forwarded-for";
      public static final String X_SOURCE = "X-Source";
      public static final String USER_AGENT = "User-Agent";
      public static final String HOST = "Host";
      public static final String ORIGIN = "Origin";
      public static final String CONTENT_TYPE = "Content-Type";
      public static final String SERVICE_HEADER = "serviceHeader";

      private HeaderRequest() {
      }
   }
}
