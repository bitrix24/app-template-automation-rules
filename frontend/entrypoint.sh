#!/bin/bash
# Run Chromium in the background with a WebSocket server
# @todo chromium.log
# @todo remote-debugging-port
#
# For production environments, need:
# @todo - Use a separate volume for /tmp
# @todo - Configure memory limits
# @todo - Add health-check for Chromium
# @todo - Implement restart on crash

echo "* Clear chromium ..."
# rm -rf /tmp/chromium/Singleton*
 rm -rf /tmp/chromium/*
 rm -rf /tmp/.org.chromium.Chromium*

echo "* Starting chromium..."
/usr/bin/chromium \
  --headless=new \
  --no-sandbox \
  --disable-gpu \
  --disable-software-rasterizer \
  --disable-dev-shm-usage \
  --disable-font-subpixel-positioning \
  --deterministic-mode \
  --font-render-hinting=none \
  --enable-quic \
  --enable-tcp-fast-open \
  --ignore-certificate-errors \
  --metrics-recording-only \
  --mute-audio \
  --no-default-browser-check \
  --no-first-run \
  --no-pings \
  --no-zygote \
  --single-process \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --user-data-dir=/tmp/chromium \
  --enable-logging \
  --v=1 \
  > /tmp/chromium.log 2>&1 &

# Waiting for Chromium to launch
while ! curl -s http://127.0.0.1:9222/json/version >/dev/null; do
  sleep 0.2
done
echo "* Chromium launch"

# Launch Nuxt DEV
echo "* Starting nuxt app [dev]..."
