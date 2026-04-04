#!/bin/sh
set -eu

: "${ML_SERVICE_URL:=http://127.0.0.1:8000}"
export ML_SERVICE_URL
: "${JAVA_MAX_RAM_PERCENTAGE:=45.0}"

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
  -XX:MaxRAMPercentage=${JAVA_MAX_RAM_PERCENTAGE} \
  -Djava.security.egd=file:/dev/./urandom \
  -Dserver.port="${APP_PORT}" \
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
  echo "Spring health check not ready at ${HEALTH_URL}; starting ML while backend continues startup." >&2
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
