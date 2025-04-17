#!/bin/sh

#mkdir -p /var/run/dbus
dbus-daemon --system --fork
export DBUS_SESSION_BUS_ADDRESS="unix:path=/var/run/dbus/system_bus_socket"
export DBUS_SYSTEM_BUS_ADDRESS="unix:path=/var/run/dbus/system_bus_socket"

#export DBUS_SESSION_BUS_ADDRESS="disabled:"
#export DBUS_SYSTEM_BUS_ADDRESS="disabled:"

mkdir -p /var/lib/nginx/tmp/client_body 2>/dev/null
mkdir -p /var/lib/nginx/logs 2>/dev/null

#chromium-browser \
#  --no-sandbox \
#  --headless=new \
#  --disable-gpu \
#  --disable-extensions \
#  --disable-dev-shm-usage \
#  --hide-scrollbars \
#  --disable-software-rasterizer \
#  --no-zygote \
#  --disable-setuid-sandbox \
#  --disable-background-networking \
#  --disable-default-apps \
#  --disable-sync \
#  --disable-translate \
#  --metrics-recording-only \
#  --mute-audio \
#  --no-first-run \
#  --enable-chrome-browser-cloud-management \
#  --ignore-certificate-errors \
#  --remote-debugging-address=0.0.0.0 \
#  --remote-debugging-port=9221 \
#  --enable-logging=stderr \
#  "$@" &

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
  --enable-chrome-browser-cloud-management \
  --enable-features=ConversionMeasurement,AttributionReportingCrossAppWeb \
  --remote-debugging-address=0.0.0.0 \
  --remote-debugging-port=9221 \
  --enable-logging=stderr --v=0 \
  "$@" &

nginx -g "daemon off; error_log /dev/stderr info;" &

wait -n
