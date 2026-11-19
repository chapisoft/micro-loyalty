package com.natcash.loyalty.cms.service;

import com.natcash.loyalty.cms.dto.MediaUploadResponse;
import com.natcash.loyalty.config.LoyaltyProperties;
import com.natcash.loyalty.exception.LoyaltyException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MediaStorageServiceTest {

    @TempDir
    Path tempDir;

    private MediaStorageService createService(long maxBytes) {
        LoyaltyProperties props = new LoyaltyProperties();
        props.getMedia().setStorageDir(tempDir.toString());
        props.getMedia().setMaxFileSizeBytes(maxBytes);
        props.getMedia().setPublicUrlPrefix("/loyalty/v1/media");
        return new MediaStorageService(props);
    }

    private static byte[] pngHeaderBytes() {
        return new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
        };
    }

    private static byte[] jpegHeaderBytes() {
        return new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10 };
    }

    private static byte[] webpHeaderBytes() {
        return new byte[] { 'R', 'I', 'F', 'F', 0x24, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' ' };
    }

    @Test
    void storeAndLoadValidPng_succeeds() throws Exception {
        MediaStorageService service = createService(5_242_880L);
        MockMultipartFile file = new MockMultipartFile(
                "file", "banner.png", MediaType.IMAGE_PNG_VALUE, pngHeaderBytes());

        MediaUploadResponse res = service.storeImage(file, "vouchers");

        assertTrue(res.getUrl().startsWith("/loyalty/v1/media/vouchers/"));
        assertTrue(res.getFilename().endsWith(".png"));
        assertEquals("image/png", res.getContentType());
        assertEquals(pngHeaderBytes().length, res.getSize());

        String[] parts = res.getUrl().replace("/loyalty/v1/media/", "").split("/");
        assertEquals(3, parts.length);

        Optional<MediaStorageService.StoredMediaResource> loaded = service.loadImage(parts[0], parts[1], parts[2]);
        assertTrue(loaded.isPresent());
        assertEquals(MediaType.IMAGE_PNG, loaded.get().getMediaType());
        assertTrue(Files.exists(tempDir.resolve(parts[0]).resolve(parts[1]).resolve(parts[2])));
    }

    @Test
    void storeValidJpegAndWebp_detectsMimeAndExtensionByMagicBytes() {
        MediaStorageService service = createService(5_242_880L);

        MediaUploadResponse jpg = service.storeImage(
                new MockMultipartFile("file", "photo.bin", MediaType.APPLICATION_OCTET_STREAM_VALUE, jpegHeaderBytes()),
                "missions");
        assertTrue(jpg.getFilename().endsWith(".jpg"));
        assertEquals("image/jpeg", jpg.getContentType());

        MediaUploadResponse webp = service.storeImage(
                new MockMultipartFile("file", "hero.webp", "image/webp", webpHeaderBytes()),
                "banners");
        assertTrue(webp.getFilename().endsWith(".webp"));
        assertEquals("image/webp", webp.getContentType());
    }

    @Test
    void storeDisguisedSvgOrScript_throwsValidationError() {
        MediaStorageService service = createService(5_242_880L);
        byte[] svgBytes = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"
                .getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile("file", "evil.png", MediaType.IMAGE_PNG_VALUE, svgBytes);

        assertThrows(LoyaltyException.class, () -> service.storeImage(file, "vouchers"));
    }

    @Test
    void storeOversizedImage_throwsValidationError() {
        MediaStorageService service = createService(10L);
        MockMultipartFile file = new MockMultipartFile(
                "file", "too-big.png", MediaType.IMAGE_PNG_VALUE, pngHeaderBytes());

        assertThrows(LoyaltyException.class, () -> service.storeImage(file, "games"));
    }

    @Test
    void pathTraversalAttempts_areRejected() {
        MediaStorageService service = createService(5_242_880L);
        MockMultipartFile file = new MockMultipartFile(
                "file", "ok.png", MediaType.IMAGE_PNG_VALUE, pngHeaderBytes());

        assertThrows(LoyaltyException.class, () -> service.storeImage(file, "../etc"));
        assertTrue(service.loadImage("..", "202611", "00000000-0000-0000-0000-000000000000.png").isEmpty());
        assertTrue(service.loadImage("vouchers", "../..", "00000000-0000-0000-0000-000000000000.png").isEmpty());
        assertTrue(service.loadImage("vouchers", "202611", "../secret.png").isEmpty());
    }
}
