#!/bin/sh
set -eu

: "${ML_SERVICE_URL:=http://127.0.0.1:8000}"
export ML_SERVICE_URL
: "${ENABLE_ML_SERVICE:=true}"
: "${JAVA_MAX_RAM_PERCENTAGE:=30.0}"
: "${JAVA_INITIAL_RAM_PERCENTAGE:=10.0}"
: "${JAVA_MAX_METASPACE_MB:=128}"
: "${JAVA_RESERVED_CODE_CACHE_MB:=64}"
: "${JAVA_THREAD_STACK_KB:=512}"

APP_PORT="${PORT:-${SERVER_PORT:-5000}}"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/actuator/health"

if [ -n "${DB_URL:-}" ] && printf '%s' "$DB_URL" | grep -qi 'pooler\.supabase\.com:5432'; then
  DB_URL="$(printf '%s' "$DB_URL" | sed 's/pooler\.supabase\.com:5432/pooler.supabase.com:6543/g')"
  case "$DB_URL" in
    *prepareThreshold=*|*preparethreshold=*) ;;
    *\?*) DB_URL="${DB_URL}&prepareThreshold=0" ;;
    *) DB_URL="${DB_URL}?prepareThreshold=0" ;;
  esac
  export DB_URL
  echo "Normalized DB_URL from Supabase session pooler (:5432) to transaction pooler (:6543)."
fi

java \
  -XX:+UseContainerSupport \
  -XX:+UseSerialGC \
  -XX:InitialRAMPercentage=${JAVA_INITIAL_RAM_PERCENTAGE} \
  -XX:MaxRAMPercentage=${JAVA_MAX_RAM_PERCENTAGE} \
  -XX:MaxMetaspaceSize=${JAVA_MAX_METASPACE_MB}m \
  -XX:ReservedCodeCacheSize=${JAVA_RESERVED_CODE_CACHE_MB}m \
  -Xss${JAVA_THREAD_STACK_KB}k \
  -Djava.security.egd=file:/dev/./urandom \
  -Dserver.port="${APP_PORT}" \
  -jar /app/app.jar &
JAVA_PID=$!

if [ "${ENABLE_ML_SERVICE}" != "true" ]; then
  echo "ML service startup disabled (ENABLE_ML_SERVICE=${ENABLE_ML_SERVICE})."
  wait "$JAVA_PID"
  exit $?
fi

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
MAX_ATTEMPTS="${JAVA_HEALTH_MAX_ATTEMPTS:-180}"
while true; do
  if ! kill -0 "$JAVA_PID" 2>/dev/null; then
    wait "$JAVA_PID"
    exit $?
  fi
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  if [ "$ATTEMPT" -eq "$MAX_ATTEMPTS" ]; then
    echo "Spring health still not ready at ${HEALTH_URL}; continuing to wait before starting ML to avoid memory spikes." >&2
  fi
  sleep 1
done

python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir /app/ml-service --no-access-log &
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
