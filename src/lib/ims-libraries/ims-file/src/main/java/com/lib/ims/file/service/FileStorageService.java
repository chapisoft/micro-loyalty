package com.lib.ims.file.service;

import com.lib.ims.file.model.FileStorageInfoResponse;
import com.lib.ims.file.model.LogicalPathResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
   String getContentType(MultipartFile var1);

   String getContentType(Resource var1);

   boolean checkFileExistsInNas(String var1, String var2);

   FileStorageInfoResponse storeFile(byte[] var1, String var2, String var3, String var4, String var5) throws IOException;

   FileStorageInfoResponse storeFile(MultipartFile var1, String var2) throws IOException;

   FileStorageInfoResponse storeFile(MultipartFile var1, String var2, String var3) throws IOException;

   List<FileStorageInfoResponse> storeFiles(List<MultipartFile> var1, String var2) throws IOException;

   List<FileStorageInfoResponse> storeFiles(List<MultipartFile> var1, String var2, String var3) throws IOException;

   String buildLogicalPath(String var1, String var2, String var3);

   LogicalPathResponse parseLogicalPath(String var1);

   String logicalPathToServicePath(String var1);

   Resource getResourceFileFromNas(String var1);

   Resource getResourceFileFromNas(String var1, String var2);

   Resource getResourceFileFromShare(String var1);

   Map<String, FileStorageInfoResponse> copyFile(String var1, String var2, String var3, String var4);

   Map<String, FileStorageInfoResponse> copyFiles(List<String> var1, String var2, String var3, String var4);

   boolean deleteFile(String var1);

   boolean deleteFile(String var1, String var2);

   int deleteFiles(List<String> var1);

   int deleteFiles(List<String> var1, String var2);
}
