# ── Build stage ──
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw package -DskipTests -B

# ── Runtime stage ──
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S nagai && adduser -S nagai -G nagai
COPY --from=build /app/target/*.jar app.jar
RUN chown nagai:nagai /app/app.jar
USER nagai
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"]
