FROM maven:3.9-eclipse-temurin-21 AS backend-build

WORKDIR /app/backend

COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

COPY backend/src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv build-essential curl \
  && rm -rf /var/lib/apt/lists/*

COPY ml-service/requirements.txt /app/ml-service/requirements.txt
RUN pip3 install --no-cache-dir -r /app/ml-service/requirements.txt

COPY ml-service /app/ml-service
COPY --from=backend-build /app/backend/target/*.jar /app/app.jar
COPY backend/start-services.sh /app/start-services.sh
RUN chmod +x /app/start-services.sh

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=75s --retries=3 \
  CMD curl -fsS http://localhost:5000/actuator/health >/dev/null \
  && curl -fsS http://localhost:8000/health >/dev/null \
  || exit 1

ENTRYPOINT ["/app/start-services.sh"]
