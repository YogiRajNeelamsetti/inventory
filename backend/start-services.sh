#!/bin/sh
set -eu

: "${ML_SERVICE_URL:=http://127.0.0.1:8000}"
export ML_SERVICE_URL

python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --app-dir /app/ml-service &
ML_PID=$!

java \
  -XX:+UseContainerSupport \
  -XX:MaxRAMPercentage=75.0 \
  -Djava.security.egd=file:/dev/./urandom \
  -jar /app/app.jar &
JAVA_PID=$!

cleanup() {
  kill "$JAVA_PID" "$ML_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

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
