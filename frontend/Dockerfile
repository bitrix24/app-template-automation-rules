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

FROM node:20-slim
LABEL maintainer="B24Sdk <github.com/bitrix24>"

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


# Installing Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    curl \
    # dbus \
    # dbus-user-session \
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

RUN mkdir -p /tmp/chromium && \
    chmod 1777 /tmp /tmp/chromium

COPY . /app
COPY entrypoint.sh ./
RUN chmod +x /entrypoint.sh

WORKDIR /app

#COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm install --frozen-lockfile

EXPOSE 3000

# Launching Chromium and Nuxt via Script
CMD ["pnpm", "run", "docker:dev"]
