# ===== Makefile for Bitrix24 App Automation Rules =====

DEV_ENV_FILE=.env.dev
PROD_ENV_FILE=.env.prod
PROD_PROJECT=prod__app-template-automation-rules
DEV_PROJECT=dev__app-template-automation-rules

# ========== NETWORK ==========
network: ## Create docker network proxy-net (if not exists)
	docker network create proxy-net || true

# ========== SERVER ==========
server-up: network ## Start nginx-proxy + letsencrypt (reverse proxy)
	docker compose -f docker-compose.server.yml -p server__global up -d

server-down: ## Stop nginx-proxy + letsencrypt
	docker compose -f docker-compose.server.yml -p server__global down

# ========== DEV ==============
dev-up: ## Start dev environment
	docker compose -f docker-compose.dev.yml --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT) up -d --build

dev-down: ## Stop dev environment
	docker compose -f docker-compose.dev.yml --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT) down

dev-build: ## Build dev containers
	docker compose -f docker-compose.dev.yml --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT) build

dev-logs: ## Show logs of all dev environment services
	docker compose -f docker-compose.dev.yml --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT) logs -f

dev-bash: ## Open shell in dev-frontend
	docker exec -it dev-frontend sh

dev-psql: ## Open psql to dev-db
	docker exec -it dev-db psql -U dbuser -d dbapp

dev-migrate: ## Run migrations in dev-frontend
	docker exec -it dev-frontend sh -c "pnpm run prisma:migrate-deploy"

dev-logs-pdf: ## Show logs of pdf-consumer in dev
	docker logs -f $(DEV_PROJECT)-consumer-nodejs-pdf-from-html-1

dev-logs-php: ## Show logs of php-consumer in dev
	docker logs -f $(DEV_PROJECT)-consumer-php-crm-entity-task-calc-1

dev-debug-pdf: ## Open shell in pdf-consumer dev
	docker exec -it $(DEV_PROJECT)-consumer-nodejs-pdf-from-html-1 sh

dev-debug-php: ## Open shell in php-consumer dev
	docker exec -it $(DEV_PROJECT)-consumer-php-crm-entity-task-calc-1 sh

dev-scale-pdf: ## Scale pdf-consumer to 2 containers in dev
	docker compose -f docker-compose.dev.yml --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT) down consumer-nodejs-pdf-from-html || true ; \
	docker compose -f docker-compose.dev.yml --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT) up -d --build --scale consumer-nodejs-pdf-from-html=2

dev-scale-php: ## Scale php-consumer to 2 containers in dev
	docker compose -f docker-compose.dev.yml --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT) down consumer-php-crm-entity-task-calc || true ; \
	docker compose -f docker-compose.dev.yml --env-file $(DEV_ENV_FILE) -p $(DEV_PROJECT) up -d --build --scale consumer-php-crm-entity-task-calc=2

# ========== PROD ==============
prod-up: ## Start prod environment
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) up -d --build

prod-down: ## Stop prod environment
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) down

prod-build: ## Build prod containers
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) build

prod-logs: ## Show logs of all prod environment services
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) logs -f

prod-bash: ## Open shell in prod-frontend
	docker exec -it prod-frontend sh

prod-psql: ## Open psql to prod-db
	docker exec -it prod-db psql -U dbuser -d dbapp

prod-migrate: ## Run migrations in prod (migrator container)
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) --profile migrate up migrator

prod-rebuild-migrate: ## Rebuild and re-run migrations in prod
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) --profile migrate down migrator || true ; \
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) --profile migrate up --build migrator

prod-logs-pdf: ## Show logs of pdf-consumer in prod
	docker logs -f $(PROD_PROJECT)-consumer-nodejs-pdf-from-html-1

prod-logs-php: ## Show logs of php-consumer in prod
	docker logs -f $(PROD_PROJECT)-consumer-php-crm-entity-task-calc-1

prod-debug-pdf: ## Open shell in pdf-consumer prod
	docker exec -it $(PROD_PROJECT)-consumer-nodejs-pdf-from-html-1 sh

prod-debug-php: ## Open shell in php-consumer prod
	docker exec -it $(PROD_PROJECT)-consumer-php-crm-entity-task-calc-1 sh

prod-scale-pdf: ## Scale pdf-consumer to 2 containers in prod
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) down consumer-nodejs-pdf-from-html || true ; \
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) up -d --build --scale consumer-nodejs-pdf-from-html=2

prod-scale-php: ## Scale php-consumer to 2 containers in prod
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) down consumer-php-crm-entity-task-calc || true ; \
	docker compose -f docker-compose.prod.yml --env-file $(PROD_ENV_FILE) -p $(PROD_PROJECT) up -d --build --scale consumer-php-crm-entity-task-calc=2

# ========== MONITORING & CLEANUP ==========
stats: ## Show live resource stats of containers
	docker stats

ps: ## Show list of running containers
	docker ps

watch-ps: ## Watch list of containers (every 2 sec)
	watch -n 2 docker ps

watch-stats: ## Watch stats with formatting (every 5 sec)
	watch -n 5 "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'"

prune: ## Remove all unused docker resources
	docker system prune -a --volumes -f

# ========== HELP ==========
help: ## Show list of all commands and their description
	@echo ""
	@echo "🚀 Bitrix24 App Automation Rules Makefile — commands:"
	@echo ""
	@grep -E '^[a-zA-Z0-9_\-]+:.*?## ' Makefile | sort | awk 'BEGIN {FS = "## "}; {printf "\033[36m%-24s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make dev-up             # Start dev environment"
	@echo "  make prod-up            # Start prod environment"
	@echo "  make server-up          # Start nginx-proxy + letsencrypt"
	@echo "  make dev-bash           # Shell in dev-frontend"
	@echo "  make prod-migrate       # Migrations prod"
	@echo "  make dev-scale-pdf      # Scale pdf-consumer (dev) x2"
	@echo "  make prune              # Docker cleanup"
	@echo ""

.DEFAULT_GOAL := help