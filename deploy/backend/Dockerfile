# Multi-service Spring Boot 3.3 / Java 21 JRE Runtime Dockerfile
FROM eclipse-temurin:21-jre-alpine

# Set timezone to Asia/Ho_Chi_Minh
RUN apk add --no-cache tzdata curl \
    && cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime \
    && echo "Asia/Ho_Chi_Minh" > /etc/timezone

WORKDIR /app

ARG JAR_FILE
COPY ${JAR_FILE} app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080 8081 8082 8085

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
