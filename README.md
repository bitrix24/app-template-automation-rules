# @bitrix24/app-template-automation-rules

> [!WARNING]  
> These are experimental
> Still in early Alpha

Look at docs to learn more:

- [@bitrix24/b24ui-nuxt](https://bitrix24.github.io/b24ui/)
- [@bitrix24/b24jssdk](https://bitrix24.github.io/b24jssdk/)
- [@bitrix24/b24icons](https://bitrix24.github.io/b24icons/)
- [@bitrix24/b24style](https://bitrix24.github.io/b24style/)
- [Nuxt](https://nuxt.com/docs/getting-started/introduction)
- SSL Server Test [Qualys](https://www.ssllabs.com/ssltest/index.html)

## Folder Structure

```plaintext
/acme
/certs
/html
/logs
/frontend
  /app
  /content
  /i18n
  /public
  /server
  /template
  /tools
  package.json
  nuxt.config.ts
  i18n.options.ts
  i18n.map.ts
  content.config.ts
  eslint.config.mjs
  tsconfig.json
  Dockerfile
  entrypoint.sh
/chrome
  entrypoint.sh
  Dockerfile_dev
  nginx_dev.conf
  Dockerfile_prod
  nginx_prod.conf
.gitignore
.dockerignore
.editorconfig
.env.dev
.env.prod
docker-compose.dev.yml
docker-compose.prod.yml
docker-compose.server.yml
```

## App config
### scopes

- crm
- catalog
- bizproc
- placement
- user_brief

---

## Ngrok

[ngrok.com](https://ngrok.com/)

```shell
ngrok http 3000
```

## Tuna

[Tuna](https://tuna.am/en/docs/)

```shell
tuna http 3000
```

---

## psql

```shell
psql \! chcp 1251
```

## Docker

### Status

```shell
docker stats
docker ps
docker ps -a | grep chrome
watch -n 2 docker ps

sudo systemctl status docker
sudo ss -tuln | grep 2376

watch -n 5 "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}'"

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules top
docker compose -f docker-compose.dev.yml -p prod__app-template-automation-rules top
```

### Server
```shell
# create network
docker network create proxy-net

# up server
docker compose -f docker-compose.server.yml -p server__global up -d --build
docker compose -f docker-compose.server.yml -p server__global up -d

docker compose -f docker-compose.server.yml -p server__global top

docker compose -f docker-compose.server.yml -p server__global build

# down server
docker compose -f docker-compose.server.yml -p server__global down
docker compose -f docker-compose.server.yml -p server__global stop

# LOG
docker logs -f server
docker logs -f letsencrypt

docker exec -it server sh -c "cat /etc/nginx/conf.d/default.conf"

docker exec -it server sh
```

### Dev
```shell

# RESTART
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules build --no-cache && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build

# STOP
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down


# START
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules build
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d
# OR
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build

# DB migrate
# docker exec -it dev-frontend sh -c "pnpx prisma migrate reset"
docker exec -it dev-frontend sh -c "pnpm run prisma:migrate-deploy"

# LOG
docker logs -f dev-frontend
docker logs -f dev__app-template-automation-rules-consumer-nodejs-pdf-from-html-1
docker logs -f dev__app-template-automation-rules-consumer-php-crm-entity-task-calc-1
docker logs -f dev-db

# commands
docker exec -it dev-frontend sh -c "pnpm install"

# consumer restart
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down consumer-php-crm-entity-task-calc && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build consumer-php-crm-entity-task-calc
 
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down consumer-php-crm-entity-task-calc && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --scale consumer-php-crm-entity-task-calc=2
 
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down consumer-nodejs-pdf-from-html && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build consumer-nodejs-pdf-from-html
```

```shell
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules top

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules build

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build chrome
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build frontend
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build consumer-nodejs-pdf-from-html

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down --volumes --rmi all --remove-orphans

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules stop
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules stop chrome
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules start chrome
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules stop frontend
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules start frontend

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down chrome && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build chrome

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down frontend && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build frontend
 
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down frontend && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d frontend 

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down consumer-nodejs-pdf-from-html && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build consumer-nodejs-pdf-from-html
 
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build --scale consumer-nodejs-pdf-from-html=2
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --scale consumer-nodejs-pdf-from-html=2
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d consumer-nodejs-pdf-from-html

docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules down consumer-php-crm-entity-task-calc && \
 docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules up -d --build consumer-php-crm-entity-task-calc
 
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules logs 
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules logs chrome
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules logs -f chrome
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules logs frontend
docker compose -f docker-compose.dev.yml --env-file .env.dev -p dev__app-template-automation-rules logs -f frontend

docker logs -f dev-chrome
docker logs -f dev-frontend
docker logs -f dev-consumer-AIandMachineLearning
docker logs -f dev__app-template-automation-rules-consumer-nodejs-pdf-from-html-1

```

### Prod
```shell

docker compose -f docker-compose.prod.yml --env-file .env.prod -p prod__app-template-automation-rules down && \
 docker compose -f docker-compose.prod.yml --env-file .env.prod -p prod__app-template-automation-rules up -d --build

docker compose -f docker-compose.prod.yml --env-file .env.prod -p prod__app-template-automation-rules build

# STOP
docker compose -f docker-compose.prod.yml --env-file .env.prod -p prod__app-template-automation-rules down

# START
docker compose -f docker-compose.prod.yml --env-file .env.prod -p prod__app-template-automation-rules up -d --build

# DB migrate
# docker exec -it prod-frontend sh -c "npx prisma migrate reset"
docker exec -it prod-frontend sh -c "npx prisma migrate deploy"

# LOG
docker logs -f prod-frontend
docker logs -f prod__app-template-automation-rules-consumer-nodejs-pdf-from-html-1
docker logs -f prod__app-template-automation-rules-consumer-php-crm-entity-task-calc-1
docker logs -f prod-db
```

```shell
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules build
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build prod-chrome
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build prod-frontend

docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down --volumes --rmi all --remove-orphans

docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules stop
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules stop prod-chrome
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules stop prod-frontend

docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down && \
 docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build

docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down prod-chrome && \
 docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build prod-chrome

docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down frontend && \
 docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build frontend
 
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rule logs -f prod-chrome
docker compose -f docker-compose.prod.yml -p prod__app-template-automation-rule logs -f prod-frontend

docker compose -f docker-compose.prod.yml --env-file .env.prod -p prod__app-template-automation-rules down consumer-php-crm-entity-task-calc && \
 docker compose -f docker-compose.prod.yml --env-file .env.prod -p prod__app-template-automation-rules up -d --scale consumer-php-crm-entity-task-calc=3
 
docker logs -f prod-chrome
docker logs -f prod-frontend

```

@todo -> add all info to example
```shell
cp .env.dev.example .env.dev
```

### Check

```shell
# network
docker network inspect internal-net
docker network inspect inner
docker network inspect inner | grep -A 10 Containers

# postgres
docker logs dev-db | grep -i 'password'
docker exec dev-db env | grep POSTGRES

docker exec dev-frontend sh -c "pnpx prisma migrate dev --name create_b24app_table"

# chrome
docker inspect dev-chrome
docker exec -it dev-chrome wget -qO- http://0.0.0.0:9223/json/version
docker exec -it dev-chrome wget -qO- http://dev-frontend:3000/

docker exec -it prod-chrome wget -qO- http://prod-frontend:80/render/invoice-by-deal/1058/

docker exec -it dev-chrome netstat -tulpn | grep 9222
docker exec -it dev-chrome ping -c 4 frontend

docker exec -it chrome sh -c "
  dbus-send --system \
  --dest=org.freedesktop.DBus \
  --type=method_call \
  --print-reply \
  /org/freedesktop/DBus \
  org.freedesktop.DBus.ListNames
"

# frontend
docker exec dev-frontend env | grep DATABASE_URL
docker inspect dev-frontend
docker exec -it dev-frontend wget -qO- http://dev-chrome:9223/json/version

docker exec -it prod-frontend wget -qO- http://prod-chrome:9223/json/version

docker exec -it dev-frontend nc -zv chrome 9223
docker exec -it dev-frontend ping -c 4 chrome
docker exec -it dev-frontend nslookup chrome
docker exec -it dev-frontend sh -c "whoami && id" # check user at container

docker exec -it dev-consumer-AIandMachineLearning wget -qO- http://dev-chrome:9223/json/version
docker exec -it dev-consumer-AIandMachineLearning wget -qO- http://dev-frontend:3000/render/invoice-by-deal/1058/
```

### Log

```shell
# chrome
docker compose logs -f chrome
docker logs chrome

# frontend
docker compose logs -f frontend
# server
docker compose logs -f server
# letsencrypt
docker compose logs -f letsencrypt
```

### Connect

```shell
# chrome
docker exec -it chrome /bin/bash
docker exec -it chrome /bin/bash
docker exec -it chrome /bin/sh

docker exec -it chrome netstat -tulpn

# frontend
docker exec -it frontend /bin/bash
docker exec -it dev-frontend /bin/bash
docker exec -it dev__app-template-automation-rules-consumer-nodejs-pdf-from-html-1 /bin/bash
docker exec -it dev__app-template-automation-rules-consumer-nodejs-pdf-from-html-1 /bin/sh
docker exec -it 
# server
docker exec -it server /bin/bash

# letsencrypt
docker exec -it letsencrypt /bin/bash
```

### Clear

> Delete all data in volumes (including DB)
>
> Require rebuilding images on next startup
>
> Irreversibly delete information
> Should not be used in **production** **without understanding** the consequences

Disc size
```shell
df -h
du -sh /var/lib/docker
```

```shell
# Delete all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Delete unused volumes
docker volume prune
docker volume prune -a
docker volume ls
docker volume rm xxx xxx xxx

# Delete EVERYTHING unused (including volumes and images)
docker system prune -a --volumes
```

@todo add clear docker log
