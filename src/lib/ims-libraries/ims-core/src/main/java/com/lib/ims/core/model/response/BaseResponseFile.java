package com.lib.ims.core.model.response;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Objects;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

public record BaseResponseFile(byte[] bytes, String path, InputStream inputStream, StreamingResponseBody streamingResponseBody, String fileName, String mineType) {
   public BaseResponseFile(byte[] bytes, String fileName, String mineType) {
      this(bytes, (String)null, (InputStream)null, (StreamingResponseBody)null, fileName, mineType);
   }

   public BaseResponseFile(String path, String fileName, String mineType) {
      this((byte[])null, path, (InputStream)null, (StreamingResponseBody)null, fileName, mineType);
   }

   public BaseResponseFile(InputStream inputStream, String fileName, String mineType) {
      this((byte[])null, (String)null, inputStream, (StreamingResponseBody)null, fileName, mineType);
   }

   public BaseResponseFile(StreamingResponseBody streamingResponseBody, String fileName, String mineType) {
      this((byte[])null, (String)null, (InputStream)null, streamingResponseBody, fileName, mineType);
   }

   public BaseResponseFile(byte[] bytes, String path, InputStream inputStream, StreamingResponseBody streamingResponseBody, String fileName, String mineType) {
      this.bytes = bytes;
      this.path = path;
      this.inputStream = inputStream;
      this.streamingResponseBody = streamingResponseBody;
      this.fileName = fileName;
      this.mineType = mineType;
   }

   public boolean equals(Object o) {
      if (o != null && this.getClass() == o.getClass()) {
         BaseResponseFile that = (BaseResponseFile)o;
         return Objects.equals(this.path, that.path) && Objects.deepEquals(this.bytes, that.bytes) && Objects.equals(this.fileName, that.fileName) && Objects.equals(this.mineType, that.mineType);
      } else {
         return false;
      }
   }

   public int hashCode() {
      return Objects.hash(new Object[]{Arrays.hashCode(this.bytes), this.path, this.fileName, this.mineType});
   }

   @NonNull
   public String toString() {
      return "BaseResponseFile{bytes=notShow, path='" + this.path + "', fileName='" + this.fileName + "', mimeType='" + this.mineType + "'}";
   }

   public byte[] bytes() {
      return this.bytes;
   }

   public String path() {
      return this.path;
   }

   public InputStream inputStream() {
      return this.inputStream;
   }

   public StreamingResponseBody streamingResponseBody() {
      return this.streamingResponseBody;
   }

   public String fileName() {
      return this.fileName;
   }

   public String mineType() {
      return this.mineType;
   }
}
