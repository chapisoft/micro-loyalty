# Multi-service Spring Boot / Java 17 LTS Runtime Dockerfile
FROM eclipse-temurin:17-jre-alpine

# Cấu hình múi giờ và công cụ kiểm tra sức khỏe
RUN apk add --no-cache tzdata curl \
    && cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime \
    && echo "Asia/Ho_Chi_Minh" > /etc/timezone \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Tạo thư mục mount cấu hình và ngôn ngữ ngoại vi
RUN mkdir -p /app/config /app/locales /app/logs && chown -R appuser:appgroup /app

ARG JAR_FILE=loyalty-service.jar
COPY ${JAR_FILE} app.jar
RUN chown appuser:appgroup app.jar

USER appuser

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
ENV SPRING_CONFIG_ADDITIONAL_LOCATION="file:/app/config/"

EXPOSE 8085

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dspring.config.additional-location=${SPRING_CONFIG_ADDITIONAL_LOCATION} -jar app.jar"]

