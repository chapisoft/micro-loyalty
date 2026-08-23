package com.lib.ims.file.service.impl;

import com.lib.ims.core.exceptions.ApplicationException;
import com.lib.ims.file.config.FileStorageProperties;
import com.lib.ims.file.model.FileStorageInfoResponse;
import com.lib.ims.file.model.LogicalPathResponse;
import com.lib.ims.file.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.nio.file.CopyOption;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.OpenOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.Map.Entry;
import java.util.stream.Stream;
import lombok.Generated;
import org.apache.commons.lang3.StringUtils;
import org.apache.tika.Tika;
import org.apache.tika.metadata.Metadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


@Service
@SuppressWarnings({"unchecked", "rawtypes"})
public class FileStorageServiceImpl implements FileStorageService {
   @Generated
   private static final Logger log = LoggerFactory.getLogger(FileStorageServiceImpl.class);
   private final FileStorageProperties fileStorageProperties;
   private final Tika tika = new Tika();
   @Value("${file.storage.default-nas-location}")
   private String defaultNasLocation;
   private Path defaultFileStorageLocation;
   private final Map<String, Path> fileStorageLocations = new HashMap();

   @PostConstruct
   public void init() {
      try {
         this.defaultFileStorageLocation = Paths.get(this.defaultNasLocation).toAbsolutePath().normalize();
         Files.createDirectories(this.defaultFileStorageLocation);
         log.info("Khởi tạo NAS mặc định: {}", this.defaultFileStorageLocation);
         Map<String, String> nasLocations = this.fileStorageProperties.getNasLocations();
         if (nasLocations != null && !nasLocations.isEmpty()) {
            Iterator var2 = nasLocations.entrySet().iterator();

            while(var2.hasNext()) {
               Entry<String, String> entry = (Entry)var2.next();
               String nasName = (String)entry.getKey();
               String nasPath = (String)entry.getValue();
               Path nasLocation = Paths.get(nasPath).toAbsolutePath().normalize();
               if (nasLocation.equals(this.defaultFileStorageLocation)) {
                  log.info("NAS [{}] trùng với default NAS, bỏ qua.", nasName);
               } else {
                  Files.createDirectories(nasLocation);
                  this.fileStorageLocations.put(nasName, nasLocation);
                  log.info("Khởi tạo NAS [{}]: {}", nasName, nasLocation);
               }
            }
         }

      } catch (IOException var7) {
         log.error("Không thể khởi tạo thư mục lưu trữ file", var7);
         throw new ApplicationException("Không thể khởi tạo thư mục lưu trữ file");
      }
   }

   public String getContentType(MultipartFile file) {
      try {
         Metadata metadata = new Metadata();
         metadata.set("resourceName", file.getOriginalFilename());
         BufferedInputStream is = new BufferedInputStream(file.getInputStream());

         String var5;
         try {
            is.mark(16384);
            String detected = this.tika.detect(is, metadata);
            log.info("detected: {}", detected);
            var5 = detected;
         } catch (Throwable var7) {
            try {
               is.close();
            } catch (Throwable var6) {
               var7.addSuppressed(var6);
            }

            throw var7;
         }

         is.close();
         return var5;
      } catch (IOException var8) {
         log.error("Không thể xác định loại nội dung của file: {}", file.getOriginalFilename(), var8);
         return file.getContentType();
      }
   }

   public String getContentType(Resource file) {
      if (file != null && file.exists()) {
         String probed;
         try {
            Metadata metadata = new Metadata();
            metadata.set("resourceName", file.getFilename());
            BufferedInputStream is = new BufferedInputStream(file.getInputStream());

            try {
               is.mark(16384);
               String detected = this.tika.detect(is, metadata);
               log.debug("Tika detected type for [{}]: {}", file.getFilename(), detected);
               probed = detected;
            } catch (Throwable var8) {
               try {
                  is.close();
               } catch (Throwable var7) {
                  var8.addSuppressed(var7);
               }

               throw var8;
            }

            is.close();
            return probed;
         } catch (IOException var9) {
            log.warn("Tika không xác định được loại nội dung của file [{}], fallback probeContentType", file.getFilename(), var9);

            try {
               if (file instanceof FileSystemResource) {
                  FileSystemResource fsr = (FileSystemResource)file;
                  Path path = fsr.getFile().toPath();
                  probed = Files.probeContentType(path);
                  if (probed != null) {
                     return probed;
                  }
               }
            } catch (IOException var6) {
            }

            log.error("Không xác định được mineType");
            return "application/octet-stream";
         }
      } else {
         log.warn("File không tồn tại hoặc null");
         return "application/octet-stream";
      }
   }

   public boolean checkFileExistsInNas(String filePath, String storageZone) {
      String zone = StringUtils.isNotBlank(storageZone) ? storageZone : "default";

      try {
         Path storageLocation = this.getStorageLocation(zone);
         Path targetLocation = this.safeResolve(storageLocation, filePath);
         log.debug("Kiểm tra file trên NAS [{}]: {}", zone, targetLocation);
         boolean exists = Files.exists(targetLocation, new LinkOption[0]) && Files.isRegularFile(targetLocation, new LinkOption[0]) && Files.isReadable(targetLocation);
         if (!exists) {
            log.warn("File không tồn tại hoặc không đọc được trên NAS [{}]: {}", zone, targetLocation);
         }

         return exists;
      } catch (Exception var7) {
         log.error("Lỗi khi kiểm tra file trên NAS [{}]: {}", new Object[]{zone, filePath, var7});
         return false;
      }
   }

   public FileStorageInfoResponse storeFile(MultipartFile file, String folderPath) throws IOException {
      return this.storeFile(file, folderPath, (String)null);
   }

   public FileStorageInfoResponse storeFile(MultipartFile file, String folderPath, String storageZone) throws IOException {
      if (file != null && !file.isEmpty()) {
         String originalFileName = file.getOriginalFilename();
         this.validateAndSanitizeFileName(originalFileName);
         LocalDate now = LocalDate.now();
         folderPath = String.format("%04d/%02d/%02d/%s", now.getYear(), now.getMonthValue(), now.getDayOfMonth(), folderPath);
         String sanitizedFolderPath = this.validateAndSanitizeFilePath(folderPath);
         Path templateDir = this.createTemplateDirectory(sanitizedFolderPath, storageZone);
         String fileExtension = "";
         if (originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            if (fileExtension.length() > 10 || !fileExtension.matches("^\\.[a-zA-Z0-9]+$")) {
               throw new ApplicationException("Phần mở rộng file không hợp lệ");
            }
         }

         String var10000 = String.valueOf(UUID.randomUUID());
         String fileName = var10000 + fileExtension;
         Path targetLocation = templateDir.resolve(fileName);
         Path storageLocation = this.getStorageLocation(storageZone);
         if (!targetLocation.startsWith(storageLocation.toAbsolutePath().normalize())) {
            throw new ApplicationException("Đường dẫn đích không hợp lệ");
         } else {
            Files.copy(file.getInputStream(), targetLocation, new CopyOption[]{StandardCopyOption.REPLACE_EXISTING});
            String relativePath = Paths.get(sanitizedFolderPath).resolve(fileName).toString();
            log.debug("Đã lưu file [{}] vào NAS [{}]: {}", new Object[]{fileName, storageLocation.normalize(), targetLocation});
            String logicalPath = this.buildLogicalPath(storageZone, this.fileStorageProperties.getApplicationName(), relativePath);
            return new FileStorageInfoResponse(originalFileName, relativePath, logicalPath);
         }
      } else {
         throw new ApplicationException("File không được để trống");
      }
   }

   public List<FileStorageInfoResponse> storeFiles(List<MultipartFile> files, String folderPath) throws IOException {
      return this.storeFiles(files, folderPath, (String)null);
   }

   public List<FileStorageInfoResponse> storeFiles(List<MultipartFile> files, String folderPath, String storageZone) throws IOException {
      List<FileStorageInfoResponse> storedFilePaths = new ArrayList();
      Iterator var5 = files.iterator();

      while(var5.hasNext()) {
         MultipartFile file = (MultipartFile)var5.next();
         storedFilePaths.add(this.storeFile(file, folderPath, storageZone));
      }

      return storedFilePaths;
   }

   public FileStorageInfoResponse storeFile(byte[] fileData, String fileName, String mimeType, String folderPath, String storageZone) throws IOException {
      if (fileData != null && fileData.length != 0) {
         if (fileName != null && !fileName.trim().isEmpty()) {
            if (mimeType != null && !mimeType.trim().isEmpty()) {
               this.validateAndSanitizeFileName(fileName);
               LocalDate now = LocalDate.now();
               folderPath = String.format("%04d/%02d/%02d/%s", now.getYear(), now.getMonthValue(), now.getDayOfMonth(), folderPath);
               String sanitizedFolderPath = this.validateAndSanitizeFilePath(folderPath);
               Path templateDir = this.createTemplateDirectory(sanitizedFolderPath, storageZone);
               String extension = "";
               int lastDotIndex = fileName.lastIndexOf(46);
               if (lastDotIndex != -1 && lastDotIndex < fileName.length() - 1) {
                  extension = fileName.substring(lastDotIndex);
               }

               String var10000 = String.valueOf(UUID.randomUUID());
               String fileNewName = var10000 + extension;
               Path targetLocation = templateDir.resolve(fileNewName);
               Path storageLocation = this.getStorageLocation(storageZone);
               if (!targetLocation.startsWith(storageLocation.toAbsolutePath().normalize())) {
                  throw new ApplicationException("Đường dẫn đích không hợp lệ");
               } else {
                  Files.write(targetLocation, fileData, new OpenOption[0]);
                  String relativePath = Paths.get(sanitizedFolderPath).resolve(fileNewName).toString();
                  log.debug("Đã lưu file [{}] vào NAS [{}]: {}", new Object[]{fileName, storageLocation.normalize(), targetLocation});
                  String logicalPath = this.buildLogicalPath(storageZone, this.fileStorageProperties.getApplicationName(), relativePath);
                  return new FileStorageInfoResponse(fileName, relativePath, logicalPath);
               }
            } else {
               throw new ApplicationException("Loại MIME không được để trống");
            }
         } else {
            throw new ApplicationException("Tên file không được để trống");
         }
      } else {
         throw new ApplicationException("File không được để trống");
      }
   }

   public Resource getResourceFileFromNas(String filePath) {
      return this.getResourceFileFromNas(filePath, (String)null);
   }

   public Resource getResourceFileFromNas(String filePath, String storageZone) {
      try {
         Path storageLocation = this.getStorageLocation(storageZone);
         Path targetLocation = this.safeResolve(storageLocation, filePath);
         log.debug("Đọc file từ NAS [{}]: {}", StringUtils.isNotBlank(storageZone) ? storageZone : "default", targetLocation);
         if (!Files.exists(targetLocation, new LinkOption[0])) {
            log.error("File không tồn tại trên NAS [{}]: {}", StringUtils.isNotBlank(storageZone) ? storageZone : "default", targetLocation);
            throw new IOException("File không tồn tại trên NAS: " + filePath);
         } else {
            return new FileSystemResource(targetLocation);
         }
      } catch (IOException var5) {
         log.error("Lỗi không lấy được file từ NAS [{}]: {}", new Object[]{StringUtils.isNotBlank(storageZone) ? storageZone : "default", filePath, var5});
         throw new ApplicationException("Không thể lấy file từ NAS");
      }
   }

   public Resource getResourceFileFromShare(String logicalPath) {
      if (StringUtils.isBlank(logicalPath)) {
         throw new ApplicationException("Logical path không được để trống");
      } else {
         String path;
         try {
            int doubleSlashIndex = logicalPath.indexOf("//");
            if (doubleSlashIndex == -1) {
               log.error("Định dạng path không hợp lệ, thiếu '//': {}", logicalPath);
               throw new ApplicationException("Định dạng path không hợp lệ. Vui lòng thử lại");
            } else {
               path = logicalPath.substring(doubleSlashIndex + 2);
               log.debug("Lấy file từ grc-share với path: {}", path);
               return this.getResourceFileFromNas(path, "grc-share");
            }
         } catch (Exception var4) {
            path = "Không thể lấy file từ path: " + var4.getMessage();
            log.error("{} - {}", new Object[]{path, logicalPath, var4});
            throw new ApplicationException("Không thể lấy file từ vùng share, vui lòng thử lại");
         }
      }
   }

   public Map<String, FileStorageInfoResponse> copyFile(String filePath, String sourceNas, String targetNas, String folderPath) {
      if (StringUtils.isBlank(filePath)) {
         throw new ApplicationException("Đường dẫn file trống, không thể copy");
      } else {
         try {
            String sanitizedFolderPath = this.validateAndSanitizeFilePath(folderPath);
            Path basePath = this.getStorageLocation((String)StringUtils.defaultIfBlank(sourceNas, (CharSequence)null));
            String sanitizedFilePath = this.validateAndSanitizeFilePath(filePath);
            Path pathObj = Paths.get(sanitizedFilePath);
            if (pathObj.isAbsolute()) {
               pathObj = pathObj.subpath(0, pathObj.getNameCount());
            }

            Path sourceFilePath = this.safeResolve(basePath, pathObj.toString());
            if (Files.notExists(sourceFilePath, new LinkOption[0])) {
               throw new ApplicationException("File nguồn không tồn tại: " + String.valueOf(sourceFilePath));
            } else {
               Path targetLocation = this.createTemplateDirectory(sanitizedFolderPath, targetNas);
               String fileName = sourceFilePath.getFileName().toString();
               Path targetFilePath = targetLocation.resolve(fileName);
               Files.createDirectories(targetFilePath.getParent());
               Files.copy(sourceFilePath, targetFilePath, StandardCopyOption.REPLACE_EXISTING);
               log.info("Đã copy file thành công từ [{}] sang [{}]: {}", new Object[]{sourceFilePath, StringUtils.defaultIfBlank(targetNas, "default"), targetFilePath});
               String relativePathString = sanitizedFolderPath.endsWith("/") ? sanitizedFolderPath + fileName : sanitizedFolderPath + "/" + fileName;
               String logicalPath = this.buildLogicalPath(targetNas, this.fileStorageProperties.getApplicationName(), relativePathString);
               return Map.of(filePath, new FileStorageInfoResponse(fileName, relativePathString, logicalPath));
            }
         } catch (IOException var15) {
            log.error("Lỗi khi copy file [{}] sang NAS [{}]", new Object[]{filePath, StringUtils.defaultIfBlank(targetNas, "default"), var15});
            throw new ApplicationException("Lỗi khi copy file: " + filePath);
         }
      }
   }

   public Map<String, FileStorageInfoResponse> copyFiles(List<String> filePaths, String sourceNas, String targetNas, String folderPath) {
      Map<String, FileStorageInfoResponse> resultMap = new LinkedHashMap();
      if (filePaths != null && !filePaths.isEmpty()) {
         int successCount = 0;
         Set<String> processedPaths = new HashSet();
         Iterator var8 = filePaths.iterator();

         while(var8.hasNext()) {
            String filePath = (String)var8.next();

            try {
               if (processedPaths.contains(filePath)) {
                  log.warn("Bỏ qua file trùng lặp: {}", filePath);
               } else {
                  Map<String, FileStorageInfoResponse> result = this.copyFile(filePath, sourceNas, targetNas, folderPath);
                  resultMap.putAll(result);
                  processedPaths.add(filePath);
                  ++successCount;
               }
            } catch (ApplicationException var11) {
               log.error("Không thể copy file [{}]: {}", filePath, var11.getMessage());
            }
         }

         if (successCount != processedPaths.size()) {
            throw new ApplicationException("Có lỗi khi copy files. Thành công: " + successCount + "/" + filePaths.size());
         } else {
            log.info("Đã copy thành công {}/{} files sang NAS [{}]", new Object[]{successCount, filePaths.size(), StringUtils.isNotBlank(targetNas) ? targetNas : "default"});
            return resultMap;
         }
      } else {
         return resultMap;
      }
   }

   public boolean deleteFile(String filePath) {
      return this.deleteFile(filePath, (String)null);
   }

   public boolean deleteFile(String filePath, String nasName) {
      if (filePath != null && !filePath.isEmpty()) {
         try {
            Path storageLocation = this.getStorageLocation(nasName);
            Path targetLocation = this.safeResolve(storageLocation, filePath);
            boolean result = Files.deleteIfExists(targetLocation);
            if (result) {
               log.debug("Đã xóa file thành công từ NAS [{}]: {}", StringUtils.isNotBlank(nasName) ? nasName : "default", filePath);
            } else {
               log.warn("File không tồn tại trên NAS [{}]: {}", StringUtils.isNotBlank(nasName) ? nasName : "default", filePath);
            }

            return result;
         } catch (IOException var6) {
            log.error("Không thể xóa file từ NAS [{}]: {}", new Object[]{StringUtils.isNotBlank(nasName) ? nasName : "default", filePath, var6});
            return false;
         }
      } else {
         log.warn("Đường dẫn file trống, bỏ qua thao tác xóa");
         return false;
      }
   }

   public int deleteFiles(List<String> filePaths) {
      return this.deleteFiles(filePaths, (String)null);
   }

   public int deleteFiles(List<String> filePaths, String nasName) {
      if (filePaths != null && !filePaths.isEmpty()) {
         int successCount = 0;
         Iterator var4 = filePaths.iterator();

         while(var4.hasNext()) {
            String filePath = (String)var4.next();
            if (this.deleteFile(filePath, nasName)) {
               ++successCount;
            }
         }

         return successCount;
      } else {
         return 0;
      }
   }

   public Path createTemplateDirectory(String folderPath) throws IOException {
      return this.createTemplateDirectory(folderPath, (String)null);
   }

   public Path createTemplateDirectory(String folderPath, String storageZone) throws IOException {
      Path storageLocation = this.getStorageLocation(storageZone);
      Path templateDir = this.safeResolve(storageLocation, folderPath);
      if (!Files.exists(templateDir, new LinkOption[0])) {
         Files.createDirectories(templateDir);
         log.debug("Đã tạo thư mục template [{}] trên NAS [{}]: {}", new Object[]{folderPath, StringUtils.isNotBlank(storageZone) ? storageZone : "default", templateDir});
      }

      return templateDir;
   }

   public boolean deleteDirectory(String directoryPath) {
      return this.deleteDirectory(directoryPath, (String)null);
   }

   public boolean deleteDirectory(String directoryPath, String nasName) {
      if (directoryPath != null && !directoryPath.isEmpty()) {
         try {
            Path storageLocation = this.getStorageLocation(nasName);
            Path targetLocation = this.safeResolve(storageLocation, directoryPath);
            if (!Files.exists(targetLocation, new LinkOption[0])) {
               log.warn("Thư mục không tồn tại trên NAS [{}]: {}", StringUtils.isNotBlank(nasName) ? nasName : "default", directoryPath);
               return false;
            } else {
               boolean result = this.deleteDirectoryRecursively(targetLocation);
               if (result) {
                  log.info("Đã xóa thư mục thành công từ NAS [{}]: {}", StringUtils.isNotBlank(nasName) ? nasName : "default", directoryPath);
               }

               return result;
            }
         } catch (Exception var6) {
            log.error("Không thể xóa thư mục từ NAS [{}]: {}", new Object[]{StringUtils.isNotBlank(nasName) ? nasName : "default", directoryPath, var6});
            return false;
         }
      } else {
         log.warn("Đường dẫn thư mục trống, bỏ qua thao tác xóa");
         return false;
      }
   }

   private boolean deleteDirectoryRecursively(Path directory) {
      if (!Files.exists(directory, new LinkOption[0])) {
         return true;
      } else {
         try {
            Stream paths = Files.list(directory);

            try {
               Iterator var3 = paths.toList().iterator();

               while(var3.hasNext()) {
                  Path path = (Path)var3.next();
                  if (Files.isDirectory(path, new LinkOption[0])) {
                     this.deleteDirectoryRecursively(path);
                  } else {
                     try {
                        Files.delete(path);
                     } catch (IOException var8) {
                        log.error("Lỗi khi xóa file: {}", path, var8);
                     }
                  }
               }
            } catch (Throwable var9) {
               if (paths != null) {
                  try {
                     paths.close();
                  } catch (Throwable var6) {
                     var9.addSuppressed(var6);
                  }
               }

               throw var9;
            }

            if (paths != null) {
               paths.close();
            }
         } catch (IOException var10) {
            log.error("Lỗi khi liệt kê thư mục: {}", directory, var10);
            return false;
         }

         try {
            Files.delete(directory);
            return true;
         } catch (IOException var7) {
            log.error("Lỗi khi xóa thư mục: {}", directory, var7);
            return false;
         }
      }
   }

   private Path getStorageLocation(String storageZone) {
      if (!StringUtils.isNotBlank(storageZone)) {
         return this.defaultFileStorageLocation;
      } else {
         Path nasLocation = (Path)this.fileStorageLocations.get(storageZone);
         if (nasLocation == null) {
            log.warn("NAS [{}] không tồn tại, sử dụng NAS mặc định", storageZone);
            return this.defaultFileStorageLocation;
         } else {
            return nasLocation;
         }
      }
   }

   private String validateAndSanitizeFilePath(String filePath) {
      if (filePath != null && !filePath.trim().isEmpty()) {
         filePath = filePath.trim();
         if (filePath.contains("\u0000")) {
            throw new ApplicationException("Đường dẫn file chứa ký tự không hợp lệ");
         } else if (!filePath.contains("..") && !filePath.contains("./") && !filePath.contains(".\\/") && !filePath.startsWith("\\") && !filePath.contains("~")) {
            if (filePath.matches("^[a-zA-Z]:.*")) {
               throw new ApplicationException("Đường dẫn file không được chứa ký hiệu ổ đĩa");
            } else {
               String[] suspiciousPatterns = new String[]{"%2e%2e", "%2f", "%5c", "..%2f", "..%5c", "%252e", "%255c"};
               String lowerPath = filePath.toLowerCase();
               String[] var4 = suspiciousPatterns;
               int var5 = suspiciousPatterns.length;

               for(int var6 = 0; var6 < var5; ++var6) {
                  String pattern = var4[var6];
                  if (lowerPath.contains(pattern)) {
                     throw new ApplicationException("Đường dẫn file chứa ký tự không hợp lệ");
                  }
               }

               return filePath;
            }
         } else {
            throw new ApplicationException("Đường dẫn file không được chứa ký tự điều hướng (.., /, \\, ~)");
         }
      } else {
         throw new ApplicationException("Đường dẫn file không được để trống");
      }
   }

   private Path safeResolve(Path storageLocation, String filePath) throws IOException {
      String sanitizedPath = this.validateAndSanitizeFilePath(filePath);
      Path resolvedPath = storageLocation.resolve(sanitizedPath).toAbsolutePath().normalize();
      if (!resolvedPath.startsWith(storageLocation.toAbsolutePath().normalize())) {
         throw new ApplicationException("Đường dẫn file vượt ra ngoài thư mục cho phép");
      } else {
         return resolvedPath;
      }
   }

   private void validateAndSanitizeFileName(String fileName) {
      if (fileName != null && !fileName.trim().isEmpty()) {
         fileName = fileName.trim();
         if (fileName.length() > 255) {
            throw new ApplicationException("Tên file quá dài");
         } else {
            String[] reservedNames = new String[]{"CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"};
            String baseFileName = fileName.contains(".") ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
            String[] var4 = reservedNames;
            int var5 = reservedNames.length;

            for(int var6 = 0; var6 < var5; ++var6) {
               String reserved = var4[var6];
               if (baseFileName.equalsIgnoreCase(reserved)) {
                  log.error("Tên file sử dụng từ khóa bảo lưu của hệ thống: {}", reserved);
                  throw new ApplicationException("Tên file sử dụng từ khóa bảo lưu của hệ thống: " + reserved);
               }
            }

            if (this.containsControlCharacters(fileName) || fileName.contains("..") || fileName.matches("[<>=#$%*?@!^/\\\\:\"|]")) {
               log.error("Tên file chứa ký tự không hợp lệ: {}", fileName);
               throw new ApplicationException("Tên file chứa ký tự không hợp lệ");
            }
         }
      } else {
         throw new ApplicationException("Tên file không được để trống");
      }
   }

   private boolean containsControlCharacters(String input) {
      char[] var2 = input.toCharArray();
      int var3 = var2.length;

      for(int var4 = 0; var4 < var3; ++var4) {
         char c = var2[var4];
         if (Character.isISOControl(c) && c != '\t' && c != '\n' && c != '\r') {
            return true;
         }
      }

      return false;
   }

   public String buildLogicalPath(String zone, String serviceName, String path) {
      String safeZone = (String)StringUtils.defaultIfBlank(zone, "default");
      return safeZone + ":" + serviceName + "//" + path;
   }

   public LogicalPathResponse parseLogicalPath(String logicalPath) {
      if (StringUtils.isBlank(logicalPath)) {
         throw new ApplicationException("Logical path không được để trống");
      } else {
         String[] parts = logicalPath.split(":", 2);
         if (parts.length != 2) {
            log.error("Lỗi xác định logical path: {}", logicalPath);
            throw new ApplicationException("Định dạng logical path không hợp lệ: " + logicalPath);
         } else {
            String zone = parts[0];
            String serviceAndPath = parts[1];
            String[] servicePathParts = serviceAndPath.split("//", 2);
            if (servicePathParts.length != 2) {
               log.error("Lỗi định dạng service và path: {}", serviceAndPath);
               throw new ApplicationException("Định dạng service và path không hợp lệ: " + serviceAndPath);
            } else {
               String service = servicePathParts[0];
               String path = servicePathParts[1];
               if (zone != null && !zone.isEmpty() && service != null && !service.isEmpty() && path != null && !path.isEmpty()) {
                  LogicalPathResponse response = new LogicalPathResponse();
                  response.setZone(zone);
                  response.setService(service);
                  response.setPath(path);
                  return response;
               } else {
                  log.error("Zone, service và path không được để trống");
                  throw new ApplicationException("Zone, service và path không được để trống");
               }
            }
         }
      }
   }

   public String logicalPathToServicePath(String logicalPath) {
      if (StringUtils.isBlank(logicalPath)) {
         throw new ApplicationException("Logical path không được để trống");
      } else {
         String[] parts = logicalPath.split(":", 2);
         if (parts.length != 2) {
            log.error("Lỗi xác định logical path: {}", logicalPath);
            throw new ApplicationException("Định dạng logical path không hợp lệ: " + logicalPath);
         } else {
            String serviceAndPath = parts[1];
            String[] servicePathParts = serviceAndPath.split("//", 2);
            if (servicePathParts.length != 2) {
               log.error("Lỗi định dạng service và path: {}", serviceAndPath);
               throw new ApplicationException("Định dạng service và path không hợp lệ: " + serviceAndPath);
            } else {
               String service = servicePathParts[0];
               String path = servicePathParts[1];
               return service + "/" + path;
            }
         }
      }
   }

   @Generated
   public FileStorageServiceImpl(FileStorageProperties fileStorageProperties) {
      this.fileStorageProperties = fileStorageProperties;
   }
}
