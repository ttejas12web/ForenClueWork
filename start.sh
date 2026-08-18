#!/bin/bash
fuser -k 3000/tcp || true
fuser -k 24678/tcp || true
pkill -f "cloud_sql_proxy.*5433" || true
PROXY_CMD=$(ps aux | grep /app/cloud_sql_proxy | grep -v grep | head -n 1)
SA=$(echo "$PROXY_CMD" | grep -o 'service-[0-9]*@gcp-sa-run-ai.iam.gserviceaccount.com' | head -n 1)
INSTANCE="savvy-transit-dxctm:asia-southeast1:ai-studio-c44b02ec"
echo "Starting fixed proxy for $INSTANCE with SA $SA"

/app/cloud_sql_proxy $INSTANCE --port=5433 --sql-data --sql-data-endpoint=sqladmin.googleapis.com:443 --sqladmin-api-endpoint=https://sqladmin.googleapis.com --impersonate-service-account=$SA &
sleep 2

export SQL_HOST=127.0.0.1
export SQL_PORT=5433
unset PGHOST

echo "Starting server..."
exec npx tsx server.ts
