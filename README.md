# @bitrix24/app-template-automation-rules

This project is a fully deployable application template featuring a library of Bitrix24 automation rules. It’s designed to work both as a local solution and as a scalable application for the Bitrix24 Marketplace.

You’re getting a complete package here: the frontend is built with the [Bitrix24 UI Kit](https://bitrix24.github.io/b24ui/) and [B24JsSDK](https://bitrix24.github.io/b24jssdk/), while the backend is set up so you can simply add your own automation rule implementations without having to dig into architectural complexities. No need to reinvent the wheel — just take the foundation and customize it to fit your needs.

You can implement your automation rules either on server-side Node.js using the B24JsSDK, or on PHP with the B24PHPSDK — there are examples for both approaches included in the project. In essence, all you need to do is develop a handler and provide a user-facing description for your automation rule. Everything else — both the user interface and the system logic — is already handled for you.

**What does your end user get?**

- An intuitive interface displaying a catalog of automation rules, organized by topic.
- Fast search and filtering to find the right rule in seconds.
- In-depth descriptions of each automation rule, accessible right in the app.
- One-click installation or removal of automation rules from their Bitrix24 account.
- Seamless use of installed automation rules in CRM pipelines and Smart Scenarios.

The architecture is built for scale and high load: the app uses an inbound queue powered by RabbitMQ to process requests from Bitrix24. All handler calls go into the queue, so the app responds instantly and won’t drop a single request—even under heavy traffic. Dedicated worker-consumers asynchronously process the queue and execute your business logic. Each worker-consumer essentially is an automation rule: it doesn’t respond to direct Bitrix24 calls, but instead picks up data from the queue. Want to speed up processing? Just increase the number of consumers in the settings—no rocket science required.

## Core Components

- **Consumers**:
  - `nodejs-pdf-from-html`: Generates PDF invoices from HTML using deal/lead data
  - `php-crm-entity-task-calc`: Calculates task durations for deals/leads
- **Required scopes**: `crm,catalog,bizproc,placement,user_brief,task,documentgenerator`

## 📁 Project Structure

```plaintext
/frontend
  /app          # Application pages (Nuxt3)
  /server       # API and event handlers
  /prisma       # Database models (PostgreSQL)
  /content      # Markdown descriptions of automation rules
  /i18n         # Localization
  /tools        # Translation scripts
/consumers
  /activities   # Action consumers
    /nodejs-pdf-from-html        # PDF generator
    /php-crm-entity-task-calc    # Task calculator
/chrome         # Chrome configuration for rendering (used by NodeJS example consumer)
```

## 🐳 Docker Installation

- [Docker](https://docs.docker.com/compose/install/)
- [Docker Compose](https://docs.docker.com/compose/install/linux/)

```shell
# 1. Install Docker and Docker Compose
# 2. Create network

make network

# 3. Launch core services

make server-up
```

### 🔧 Development (Dev)

![Docker Dev](./.github/assets/docker__dev.jpg)

Configure environment variables:

```shell
cp .env.dev.example .env.dev
```

```shell
# Start
make dev-up

# DB migration
make dev-migrate

# Stop
make dev-down
```

**Container management:**

```shell
# Logs
make dev-logs
make dev-logs-pdf
make dev-logs-php

# Consumer scaling
make dev-scale-php
make dev-scale-pdf

# Restart
make dev-down && make dev-up

# Container debugging
make dev-bash
make dev-debug-pdf
make dev-debug-php

# @memo dbuser && dbapp see in .env.xxx
make dev-psql
# For psql:
# dbapp# select "memberId", "userId", "domain" from "B24App";
```

### 🚀 Production (Prod)

![Docker Prod](./.github/assets/docker__prod.jpg)

Configure environment variables:

```shell
cp .env.prod.example .env.prod
```

```shell
# Start
make prod-up

# DB migration
make prod-migrate

# Stop
make prod-down
```

**Container management:**

```shell
# Logs
make prod-logs
make prod-logs-pdf
make prod-logs-php
make prod-logs-db

## Rebuild migration
make prod-migrate-rebuild

# Consumer scaling
make prod-scale-php
make prod-scale-pdf

# Container debugging
make prod-bash
make prod-debug-pdf
make prod-debug-php
# @memo dbuser && dbapp see in .env.xxx
make prod-psql
# For psql:
# dbapp# select "memberId", "userId", "domain" from "B24App";
```

### 🔍 Monitoring

```shell
make prod-stats
make prod-ps
make prod-ps-chrome
make prod-watch-ps
make prod-watch-stats

sudo systemctl status docker
sudo ss -tuln | grep 2376

make prod-top
make dev-top
```

### 🧹 Cleanup

```shell
# Delete all stopped containers
make docker-prune-containers

# Remove all unused images
make docker-prune-images

# Delete unused volumes
make docker-prune-volumes

make docker-list-volumes
make docker-rm-volumes

# Delete EVERYTHING unused (including volumes and images)
make docker-prune-all
```

## Application

![Frontend public](./.github/assets/frontend__app.jpg)

Application pages in `frontend/app/pages`:

- `install.client.vue` - installation handler
- `index.client.vue` - main page redirects to `activity-list.client.vue`
- `activity-list.client.vue` - shows actions list and app settings
- `pages/setting/[code].client.vue` - `placement` handler for BP action parameters (requires customization)

Special page `render/invoice-by-entity/[entityTypeId]-[entityId].server.vue` generates invoices. Server-side only, used by `CrmEntityTaskCalc`.

![Frontend server](./.github/assets/frontend__server.jpg)

Server scripts in `frontend/server`:

- `rabbitmq.config.ts` configures RabbitMQ connections

Event handlers:

- `api/event/onAppInstall.post.ts` - app installation (stores tokens in DB)
- `api/event/onAppUninstall.post.ts` - app removal (deletes tokens)

Business process action handlers:

- `api/activities/[code].post.ts` - receives calls, finds `memberId`, publishes to 'activities.v1' exchange [`producer`].

## Automation Rule

Automation rule settings are in `frontend/app/activity.config.ts`. Descriptions are in `frontend/content/activities/xx/yyyy.md`.

### How to create new Automation Rule using NodeJS

Example code: `NewDemoActivity`

Steps:

1. Configure in `frontend/app/activity.config.ts`:

```typescript
export const activitiesConfig: ActivityOrRobotConfig[] = [
  // ...
  {
    type: 'robot',
    CODE: 'NewDemoActivity',
    FILTER: { /*...*/ },
    PROPERTIES: { /*...*/ },
    RETURN_PROPERTIES: { /*...*/ }
  }
]
```

2. Add description: `frontend/content/activities/en/NewDemoActivity.md`

```markdown
---
title: Title for new activity
description: Description for new activity
categories: 
  - 'category_1'
  - 'category_2'
badges: 
  - 'badge_1'
  - 'badge_2'
avatar: '/activities/NewDemoActivity.webp'
---
```

3. Add icon: `frontend/public/activities/NewDemoActivity.webp`
4. Install the automation rule into Bitrix24 account
5. Create consumer in `consumers/activities/new-demo-activity` handling queue `activity.NewDemoActivity.v1`
6. Configure in `docker-compose.*.yml` files

### `PdfFromHtml` Example

![Consumer NodeJs PdfFromHtml](./.github/assets/consumer__nodejs-pdf-from-html.jpg)

- NodeJS-based (`consumers/activities/nodejs-pdf-from-html`)
- Main file: `app/consumer.ts` (`processMessage()` logic)
- Renders page: `frontend/app/pages/render/invoice-by-entity/[entityTypeId]-[entityId].server.vue`
- RabbitMQ config: `app.config.ts`

Workflow:

1. Gets auth data from message → verifies in DB
2. Creates JWT token (5min TTL) with oAuth params
3. Calls Chrome-rendered page `render/invoice-by-entity/[entityTypeId]-[entityId]`
4. Page script validates JWT → fetches deal/lead data from Bitrix24
5. Generates HTML invoice → converts to PDF via Chrome
6. Sends PDF to Bitrix24

### `CrmEntityTaskCalc` Example

![Consumer php CrmEntityTaskCalc](./.github/assets/consumer__php-crm-entity-task-calc.jpg)

- PHP-based (`consumers/activities/php-crm-entity-task-calc`)
- Main file: `consumer.php` (logic in `src/Processor.php`)
- RabbitMQ config: `src/ConfigRabbitMQ.php`

Workflow:

1. Fetches/renews auth from DB via `memberId`
2. Retrieves all entity tasks from Bitrix24 (admin rights)
3. Calculates task durations
4. Returns results to waiting Bitrix24 business process

## 🔌 RabbitMQ Architecture

![RabbitMq theory](./.github/assets/rabbitmq__theory.jpg)
> `v1` = version tag for routing organization

Implementation:

- **producer** → **exchange** `activities.v1`
- Service **exchange** `activities.service.v1`
- Dead-letter **queue** `activities.failed.v1`
- Per-action queues: `activity.activityCode.v1` + `activity.activityCode.delayed.6000.v1`
- Failure handling:
  - (1) Consumer crash → message requeued
  - (2) Success → message removed
  - (3) Processing failure:
    - First 4 attempts → `delayed.6000` (6sec) → retry
    - 5th attempt → `failed.v1` (manual handling required)

## 🛠 Development Tools

AI-powered translation via DeepSeek (scripts in `frontend/tools`):

```shell
# Translate action descriptions
pnpm run translate-content

# Translate UI phrases
pnpm run translate-ui
```

## 🔮 Roadmap

- [OpenTelemetry](https://opentelemetry.io/) integration
- Dead-letter queue (`activities.failed.v1`) processing system
- RabbitMQ optimizations for NodeJS/PHP
- Bitrix24 Market publication assets
