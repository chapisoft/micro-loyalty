package com.natcash.loyalty.cms.service;

import com.natcash.loyalty.cms.dto.MediaUploadResponse;
import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.domain.enums.MediaFolder;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.util.MessageUtils;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Stores and serves uploaded loyalty media assets on the configured server filesystem.
 */
@Slf4j
@Service
public class MediaStorageService {

    private static final DateTimeFormatter YEAR_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyyMM");
    private static final Pattern YEAR_MONTH_PATTERN = Pattern.compile("^\\d{6}$");
    private static final Pattern SAFE_FILENAME_PATTERN = Pattern.compile(
            "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\\.(png|jpg|gif|webp)$");
    private static final long DEFAULT_MAX_FILE_SIZE_BYTES = 5_242_880L;
    private static final String DEFAULT_STORAGE_DIR = "./uploads";
    private static final String DEFAULT_PUBLIC_URL_PREFIX = "/loyalty/v1/media";

    private final LoyaltyProperties loyaltyProperties;

    public MediaStorageService(LoyaltyProperties loyaltyProperties) {
        this.loyaltyProperties = loyaltyProperties;
    }

    /**
     * Validates an image upload by bounded size and magic bytes, then writes it to disk.
     *
     * @param file multipart image upload
     * @param folderParam optional folder name matching {@link MediaFolder}
     * @return stored file metadata including public relative URL
     */
    public MediaUploadResponse storeImage(MultipartFile file, String folderParam) {
        if (file == null || file.isEmpty()) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("media.file.empty"));
        }

        long maxSizeBytes = resolveMaxFileSizeBytes();
        if (file.getSize() > maxSizeBytes) {
            throw new LoyaltyException(
                    ErrorCode.VALIDATION_ERROR,
                    MessageUtils.getMessage("media.file.too_large", maxSizeBytes));
        }

        MediaFolder folder = MediaFolder.fromCodeOrDefault(folderParam);
        byte[] content = readBoundedBytes(file, maxSizeBytes);
        if (content.length == 0) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("media.file.empty"));
        }

        ImageFormat format = detectImageFormat(content);
        String yearMonth = YearMonth.now(ZoneOffset.UTC).format(YEAR_MONTH_FORMAT);
        String filename = UUID.randomUUID() + format.extension;

        Path rootPath = resolveRootPath();
        Path targetDir = rootPath.resolve(folder.getCode()).resolve(yearMonth).normalize();
        if (!targetDir.startsWith(rootPath)) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("media.path.invalid"));
        }

        Path targetFile = targetDir.resolve(filename).normalize();
        if (!targetFile.startsWith(targetDir)) {
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("media.path.invalid"));
        }

        try {
            Files.createDirectories(targetDir);
            Files.write(targetFile, content);
        } catch (IOException ex) {
            log.error("[MEDIA-STORE-ERROR] target={}, error={}", targetFile, ex.getMessage(), ex);
            throw new LoyaltyException(ErrorCode.SYSTEM_ERROR, MessageUtils.getMessage("media.store.failed"));
        }

        String publicUrl = resolvePublicUrlPrefix() + "/" + folder.getCode() + "/" + yearMonth + "/" + filename;
        log.info("[MEDIA-UPLOAD] folder={}, file={}, size={}, contentType={}",
                folder.getCode(), filename, content.length, format.mimeType);

        return MediaUploadResponse.builder()
                .url(publicUrl)
                .filename(filename)
                .folder(folder.getCode())
                .contentType(format.mimeType)
                .size(content.length)
                .build();
    }

    /**
     * Loads a previously uploaded image if the path matches safe naming and stays inside the storage root.
     *
     * @param folderParam validated {@link MediaFolder} code
     * @param yearMonth yyyyMM directory name
     * @param filename UUID filename with allowed image extension
     * @return resource holder if found and readable
     */
    public Optional<StoredMediaResource> loadImage(String folderParam, String yearMonth, String filename) {
        if (folderParam == null || folderParam.isBlank()
                || yearMonth == null || !YEAR_MONTH_PATTERN.matcher(yearMonth).matches()
                || filename == null) {
            return Optional.empty();
        }

        Optional<MediaFolder> folderOpt = findAllowedFolder(folderParam);
        if (folderOpt.isEmpty()) {
            return Optional.empty();
        }

        String normalizedFilename = filename.trim().toLowerCase(Locale.ROOT);
        if (!SAFE_FILENAME_PATTERN.matcher(normalizedFilename).matches()) {
            return Optional.empty();
        }

        Path rootPath = resolveRootPath();
        Path target = rootPath.resolve(folderOpt.get().getCode())
                .resolve(yearMonth)
                .resolve(normalizedFilename)
                .normalize();

        if (!target.startsWith(rootPath) || !Files.isRegularFile(target) || !Files.isReadable(target)) {
            return Optional.empty();
        }

        try {
            long size = Files.size(target);
            MediaType mediaType = mediaTypeForFilename(normalizedFilename);
            return Optional.of(new StoredMediaResource(new FileSystemResource(target), mediaType, size));
        } catch (IOException ex) {
            log.warn("[MEDIA-READ-ERROR] target={}, error={}", target, ex.getMessage());
            return Optional.empty();
        }
    }

    private byte[] readBoundedBytes(MultipartFile file, long maxSizeBytes) {
        try (InputStream in = file.getInputStream();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            long total = 0L;
            int read;
            while ((read = in.read(buffer)) != -1) {
                total += read;
                if (total > maxSizeBytes) {
                    throw new LoyaltyException(
                            ErrorCode.VALIDATION_ERROR,
                            MessageUtils.getMessage("media.file.too_large", maxSizeBytes));
                }
                out.write(buffer, 0, read);
            }
            return out.toByteArray();
        } catch (LoyaltyException ex) {
            throw ex;
        } catch (IOException ex) {
            log.warn("[MEDIA-READ-STREAM-ERROR] {}", ex.getMessage());
            throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("media.file.unreadable"));
        }
    }

    private ImageFormat detectImageFormat(byte[] data) {
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (data.length >= 8
                && data[0] == (byte) 0x89
                && data[1] == 0x50
                && data[2] == 0x4E
                && data[3] == 0x47
                && data[4] == 0x0D
                && data[5] == 0x0A
                && data[6] == 0x1A
                && data[7] == 0x0A) {
            return ImageFormat.PNG;
        }
        // JPEG: FF D8 FF
        if (data.length >= 3
                && data[0] == (byte) 0xFF
                && data[1] == (byte) 0xD8
                && data[2] == (byte) 0xFF) {
            return ImageFormat.JPEG;
        }
        // GIF87a / GIF89a
        if (data.length >= 6) {
            String header = new String(data, 0, 6, StandardCharsets.US_ASCII);
            if ("GIF87a".equals(header) || "GIF89a".equals(header)) {
                return ImageFormat.GIF;
            }
        }
        // WEBP: RIFF....WEBP
        if (data.length >= 12) {
            String riff = new String(data, 0, 4, StandardCharsets.US_ASCII);
            String webp = new String(data, 8, 4, StandardCharsets.US_ASCII);
            if ("RIFF".equals(riff) && "WEBP".equals(webp)) {
                return ImageFormat.WEBP;
            }
        }
        throw new LoyaltyException(ErrorCode.VALIDATION_ERROR, MessageUtils.getMessage("media.invalid_format"));
    }

    private Optional<MediaFolder> findAllowedFolder(String raw) {
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        for (MediaFolder folder : MediaFolder.values()) {
            if (folder.getCode().equals(normalized)) {
                return Optional.of(folder);
            }
        }
        return Optional.empty();
    }

    private MediaType mediaTypeForFilename(String filename) {
        if (filename.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (filename.endsWith(".jpg")) {
            return MediaType.IMAGE_JPEG;
        }
        if (filename.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        }
        if (filename.endsWith(".webp")) {
            return MediaType.valueOf("image/webp");
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    private Path resolveRootPath() {
        LoyaltyProperties.Media media = loyaltyProperties != null && loyaltyProperties.getMedia() != null
                ? loyaltyProperties.getMedia()
                : new LoyaltyProperties.Media();
        String configuredDir = media.getStorageDir() != null && !media.getStorageDir().isBlank()
                ? media.getStorageDir().trim()
                : DEFAULT_STORAGE_DIR;
        return Paths.get(configuredDir).toAbsolutePath().normalize();
    }

    private long resolveMaxFileSizeBytes() {
        LoyaltyProperties.Media media = loyaltyProperties != null ? loyaltyProperties.getMedia() : null;
        return media != null && media.getMaxFileSizeBytes() > 0
                ? media.getMaxFileSizeBytes()
                : DEFAULT_MAX_FILE_SIZE_BYTES;
    }

    private String resolvePublicUrlPrefix() {
        LoyaltyProperties.Media media = loyaltyProperties != null ? loyaltyProperties.getMedia() : null;
        String raw = media != null && media.getPublicUrlPrefix() != null && !media.getPublicUrlPrefix().isBlank()
                ? media.getPublicUrlPrefix().trim()
                : DEFAULT_PUBLIC_URL_PREFIX;
        while (raw.endsWith("/")) {
            raw = raw.substring(0, raw.length() - 1);
        }
        return raw.startsWith("/") ? raw : "/" + raw;
    }

    private enum ImageFormat {
        PNG("image/png", ".png"),
        JPEG("image/jpeg", ".jpg"),
        GIF("image/gif", ".gif"),
        WEBP("image/webp", ".webp");

        private final String mimeType;
        private final String extension;

        ImageFormat(String mimeType, String extension) {
            this.mimeType = mimeType;
            this.extension = extension;
        }
    }

    @Getter
    public static class StoredMediaResource {
        private final Resource resource;
        private final MediaType mediaType;
        private final long contentLength;

        public StoredMediaResource(Resource resource, MediaType mediaType, long contentLength) {
            this.resource = resource;
            this.mediaType = mediaType;
            this.contentLength = contentLength;
        }
    }
}
