#!/bin/sh
set -eu

: "${ML_SERVICE_URL:=http://127.0.0.1:8000}"
export ML_SERVICE_URL

APP_PORT="${PORT:-${SERVER_PORT:-5000}}"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/actuator/health"

java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -Djava.security.egd=file:/dev/./urandom \
  -jar /app/app.jar &
JAVA_PID=$!

cleanup() {
  if [ -n "${JAVA_PID:-}" ]; then
    kill "$JAVA_PID" 2>/dev/null || true
  fi
  if [ -n "${ML_PID:-}" ]; then
    kill "$ML_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

# Keep ML internal and start it only after Spring health is reachable.
ATTEMPT=0
MAX_ATTEMPTS="${JAVA_HEALTH_MAX_ATTEMPTS:-120}"
while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
  if ! kill -0 "$JAVA_PID" 2>/dev/null; then
    wait "$JAVA_PID"
    exit $?
  fi
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 1
done

if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
  echo "Spring health check not ready at ${HEALTH_URL}" >&2
  kill "$JAVA_PID" 2>/dev/null || true
  wait "$JAVA_PID" 2>/dev/null || true
  exit 1
fi

python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir /app/ml-service &
ML_PID=$!

while kill -0 "$JAVA_PID" 2>/dev/null && kill -0 "$ML_PID" 2>/dev/null; do
  sleep 2
done

if ! kill -0 "$JAVA_PID" 2>/dev/null; then
  if wait "$JAVA_PID"; then
    STATUS=0
  else
    STATUS=$?
  fi
else
  if wait "$ML_PID"; then
    STATUS=0
  else
    STATUS=$?
  fi
fi

cleanup
wait "$JAVA_PID" 2>/dev/null || true
wait "$ML_PID" 2>/dev/null || true
exit "$STATUS"
