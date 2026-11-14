# Multi-service Spring Boot / Java 17 LTS Runtime Dockerfile (Thin-JAR + lib + etc)
FROM eclipse-temurin:17-jre-alpine

# Cấu hình múi giờ và công cụ kiểm tra sức khỏe
RUN apk add --no-cache tzdata curl \
    && cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime \
    && echo "Asia/Ho_Chi_Minh" > /etc/timezone \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Sao chép tầng thư viện và tài nguyên dùng chung trước ARG SERVICE_NAME để dùng chung Docker cache
RUN mkdir -p /app/module /app/lib /app/etc /app/config /app/locales /app/logs && chown -R appuser:appgroup /app

COPY --chown=appuser:appgroup lib/ /app/lib/
COPY --chown=appuser:appgroup etc/ /app/etc/

ENV JAVA_OPTS="-Xms128m -Xmx512m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"
ENV SPRING_CONFIG_ADDITIONAL_LOCATION="optional:file:/app/etc/,optional:file:/app/config/"
ARG SERVICE_NAME=cms-service
ENV SERVICE_NAME=${SERVICE_NAME}

# Chỉ đóng gói đúng Thin-JAR của Microservice mục tiêu
COPY --chown=appuser:appgroup module/${SERVICE_NAME}.jar /app/module/${SERVICE_NAME}.jar

USER appuser

EXPOSE 8081 8082 8083 8084 8085

ENTRYPOINT ["sh", "-c", "TARGET_NAME=\"${SPRING_APPLICATION_NAME:-${SERVICE_NAME}}\"; JAR_PATH=$(ls -1 /app/module/${TARGET_NAME}*.jar 2>/dev/null | head -n 1); [ -z \"$JAR_PATH\" ] && JAR_PATH=$(ls -1 /app/module/${SERVICE_NAME}*.jar 2>/dev/null | head -n 1); [ -z \"$JAR_PATH\" ] && JAR_PATH=$(ls -1 /app/module/*.jar | head -n 1); exec java $JAVA_OPTS -Dspring.config.additional-location=${SPRING_CONFIG_ADDITIONAL_LOCATION} -jar \"$JAR_PATH\""]
