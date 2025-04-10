# @todo
# FROM node:lts-alpine
# For production:
# - Add health-check for Chromium
# - Limit container memory
# - Set up separate volumes for /tmp
# Docker image optimization:
# - Use multi-stage build
# - Remove unnecessary dependencies
# Logging:
# - Set up log rotation for Chromium
# - Add error monitoring

FROM node:lts-slim

LABEL maintainer="B24Sdk <github.com/bitrix24>"

# Installing Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    curl \
    dbus \
    dbus-user-session \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Setting environment variables for Chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=$CHROME_PATH
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN mkdir -p /tmp/chromium && \
    chmod 1777 /tmp /tmp/chromium && \
    chown -R node:node /tmp/chromium

# USER node

EXPOSE 3000

# Launching Chromium and Nuxt via Script
ENTRYPOINT [ "/app/entrypoint.sh" ]
# CMD ["npm", "run", "dev"]
