#!/bin/sh

mkdir -p /var/lib/nginx/tmp/client_body 2>/dev/null
mkdir -p /var/lib/nginx/logs 2>/dev/null

# @memo We close our eyes to the mistakes of D-BUS
export DBUS_SESSION_BUS_ADDRESS="disabled:"
export DBUS_SYSTEM_BUS_ADDRESS="disabled:"

chromium-browser \
  --no-sandbox \
  --headless=new \
  --disable-gpu \
  --disable-extensions \
  --disable-dev-shm-usage \
  --hide-scrollbars \
  --mute-audio \
  --no-first-run \
  --ignore-certificate-errors \
  --disable-software-rasterizer \
  --disable-setuid-sandbox \
  --disable-background-networking \
  --disable-default-apps \
  --disable-sync \
  --disable-translate \
  --metrics-recording-only \
  --enable-features=ConversionMeasurement,AttributionReportingCrossAppWeb \
  --enable-chrome-browser-cloud-management \
  --remote-debugging-address=0.0.0.0 \
  --remote-debugging-port=9221 \
  --enable-logging=stderr --v=0 \
  "$@" &

nginx -g "daemon off; error_log /dev/stderr info;" &

wait -n
