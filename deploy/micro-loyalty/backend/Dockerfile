# Multi-service Spring Boot / Java 17 LTS Runtime Dockerfile for Micro-Loyalty Backend
FROM eclipse-temurin:17-jre-alpine

RUN apk add --no-cache tzdata curl \
    && cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime \
    && echo "Asia/Ho_Chi_Minh" > /etc/timezone \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

RUN mkdir -p /app/config /app/locales /app/logs && chown -R appuser:appgroup /app

COPY backend/loyalty-service.jar app.jar
COPY config/backend/ /app/config/
COPY locales/ /app/locales/

RUN chown -R appuser:appgroup /app

USER appuser

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"
ENV SPRING_CONFIG_ADDITIONAL_LOCATION="file:/app/config/"

EXPOSE 8088

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dspring.config.additional-location=${SPRING_CONFIG_ADDITIONAL_LOCATION} -jar app.jar"]
