# @todo fix all

FROM node:20-slim
LABEL maintainer="B24Sdk <github.com/bitrix24>"

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN corepack enable

# @todo remove tis
RUN apt-get update && apt-get install -y \
    curl \
    dnsutils \
    iputils-ping \
    netcat-openbsd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
