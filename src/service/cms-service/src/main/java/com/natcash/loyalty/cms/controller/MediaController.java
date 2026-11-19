package com.natcash.loyalty.cms.controller;

import com.natcash.loyalty.cms.dto.MediaUploadResponse;
import com.natcash.loyalty.cms.service.MediaStorageService;
import com.natcash.loyalty.cms.service.MediaStorageService.StoredMediaResource;
import com.natcash.loyalty.constant.ErrorCode;
import com.natcash.loyalty.constant.SecurityConstants;
import com.natcash.loyalty.exception.LoyaltyException;
import com.natcash.loyalty.util.MessageUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Server-side image upload and public static delivery endpoints for CMS and Webview media assets.
 */
@RestController
@RequestMapping("/loyalty/v1/media")
@Tag(name = "Media Storage API", description = "Upload and serve loyalty image assets stored on server")
public class MediaController {

    private final MediaStorageService mediaStorageService;

    public MediaController(MediaStorageService mediaStorageService) {
        this.mediaStorageService = mediaStorageService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image file", description = "Stores a validated PNG/JPEG/WEBP/GIF image on server disk and returns its serving path")
    public ResponseEntity<MediaUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "general") String folder) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || SecurityConstants.PRINCIPAL_ANONYMOUS.equals(String.valueOf(auth.getPrincipal()))) {
            throw new LoyaltyException(ErrorCode.UNAUTHORIZED, MessageUtils.getMessage(ErrorCode.UNAUTHORIZED.getMessageKey()));
        }

        MediaUploadResponse uploaded = mediaStorageService.storeImage(file, folder);
        return ResponseEntity.ok(uploaded);
    }

    @GetMapping("/{folder}/{yearMonth}/{filename}")
    @Operation(summary = "Serve uploaded image", description = "Streams an uploaded image with immutable long-term cache headers")
    public ResponseEntity<Resource> serveImage(
            @PathVariable("folder") String folder,
            @PathVariable("yearMonth") String yearMonth,
            @PathVariable("filename") String filename) {
        Optional<StoredMediaResource> storedOpt = mediaStorageService.loadImage(folder, yearMonth, filename);
        if (storedOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        StoredMediaResource stored = storedOpt.get();
        return ResponseEntity.ok()
                .contentType(stored.getMediaType())
                .contentLength(stored.getContentLength())
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header("X-Content-Type-Options", "nosniff")
                .body(stored.getResource());
    }
}
