package com.natcash.loyalty.util;

import java.io.File;
import java.util.List;

/**
 * Tiện ích giải quyết đường dẫn tệp tin cấu hình linh hoạt trong thư mục etc.
 * Hỗ trợ tự động dò tìm cấu hình khi chạy từ nhiều thư mục làm việc khác nhau:
 * - Khi chạy trực tiếp tại module: ./etc/{relativePath}
 * - Khi chạy qua script trong target/module hoặc thư mục cha: ../etc/{relativePath}
 * - Khi chạy từ thư mục gốc repository: ./src/service/cms-service/etc/{relativePath}
 * - Khi chạy trong container Docker: /app/etc/{relativePath} hoặc /app/config/{relativePath}
 */
public final class ConfigPathResolver {

    private static final List<String> ETC_SEARCH_PREFIXES = List.of(
            "./etc/",
            "../etc/",
            "../../service/cms-service/etc/",
            "./src/service/cms-service/etc/",
            "/app/etc/",
            "/app/config/"
    );

    private static final String DEFAULT_SPRING_CONFIG_LOCATIONS =
            "optional:classpath:/,optional:file:./etc/,optional:file:../etc/,optional:file:../../service/cms-service/etc/,optional:file:./src/service/cms-service/etc/,optional:file:/app/etc/";

    private ConfigPathResolver() {
    }

    /**
     * Xác định đường dẫn tệp tin cấu hình trong thư mục etc theo thứ tự ưu tiên.
     *
     * @param relativePath Đường dẫn tương đối bên trong thư mục etc (ví dụ: "application.yml" hoặc "log4j2.xml")
     * @return Chuỗi đường dẫn tệp tin thực tế
     */
    public static String resolveEtcPath(String relativePath) {
        String cleanPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
        for (String prefix : ETC_SEARCH_PREFIXES) {
            File candidate = new File(prefix + cleanPath);
            if (candidate.exists()) {
                return candidate.getPath();
            }
        }
        return "./etc/" + cleanPath;
    }

    /**
     * Trả về đối tượng File tương ứng với đường dẫn etc được tìm thấy.
     *
     * @param relativePath Đường dẫn tương đối bên trong thư mục etc
     * @return Đối tượng File
     */
    public static File resolveEtcFile(String relativePath) {
        return new File(resolveEtcPath(relativePath));
    }

    /**
     * Thiết lập đường dẫn nạp tệp cấu hình Spring Boot từ thư mục etc nếu chưa được chỉ định tường minh.
     */
    public static void configureSpringConfigLocation() {
        String configLocation = System.getProperty("spring.config.location");
        if (configLocation == null || configLocation.trim().isEmpty()) {
            System.setProperty("spring.config.location", DEFAULT_SPRING_CONFIG_LOCATIONS);
        }
    }

    /**
     * Thiết lập đường dẫn tệp cấu hình Log4j2 từ thư mục etc nếu chưa được chỉ định tường minh.
     */
    public static void configureLoggingLocation() {
        String loggingConfig = System.getProperty("logging.config");
        if (loggingConfig == null || loggingConfig.trim().isEmpty()) {
            File logFile = resolveEtcFile("log4j2.xml");
            if (logFile.exists()) {
                System.setProperty("logging.config", "file:" + logFile.getAbsolutePath());
            }
        }
    }
}
