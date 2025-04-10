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

# @todo
# rm -rf /tmp/chromium/Singleton*
# rm -rf /tmp/chromium/*

/usr/bin/chromium \
  --headless=new \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
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

# Launch Nuxt DEV
# @todo move 0.0.0.0 to docker-compose.yml
npm run dev -- --host 0.0.0.0
