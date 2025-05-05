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

## Docker

### Status

```shell
docker ps
docker ps -a | grep chrome
watch -n 2 docker ps

docker stats

sudo systemctl status docker
sudo ss -tuln | grep 2376

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules top
docker compose -f docker-compose.dev.yml -p prod__app-template-automation-rules top
```

### Server
```shell
docker network create proxy-net

docker compose -f docker-compose.server.yml -p server__global up -d

docker compose -f docker-compose.server.yml -p server__global top

docker compose -f docker-compose.server.yml -p server__global build

docker compose -f docker-compose.server.yml -p server__global up -d --build

docker compose -f docker-compose.server.yml -p server__global down
docker compose -f docker-compose.server.yml -p server__global stop

docker compose -f docker-compose.server.yml -p server__global logs -f server
docker compose -f docker-compose.server.yml -p server__global logs -f letsencrypt
docker logs -f server
docker logs -f letsencrypt
```

### Dev
```shell
docker logs -f dev-frontend
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down -v
```

```shell
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules top

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules build

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build chrome
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build frontend

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down --volumes --rmi all --remove-orphans

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules stop
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules stop chrome
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules start chrome
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules stop frontend
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules start frontend

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down && \
 docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down chrome && \
 docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build chrome

docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down frontend && \
 docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build frontend
 
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down frontend && \
 docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d frontend
 
 
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs 
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs chrome
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs -f chrome
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs frontend
docker compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs -f frontend

docker logs -f dev-chrome
docker logs -f dev-frontend
```

### Prod
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
docker network inspect inner
docker network inspect inner | grep -A 10 Containers

# chrome
docker inspect dev-chrome
docker exec -it dev-chrome wget -qO- http://localhost:9222/json/version
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
docker inspect dev-frontend
docker exec -it dev-frontend wget -qO- http://dev-chrome:9223/json/version

docker exec -it prod-frontend wget -qO- http://prod-chrome:9223/json/version

docker exec -it dev-frontend nc -zv chrome 9223
docker exec -it dev-frontend ping -c 4 chrome
docker exec -it dev-frontend nslookup chrome
docker exec -it dev-frontend sh -c "whoami && id" # check user at container
```

### Stop

```shell
# All
docker compose --env-file .env.dev stop
# frontend
docker stop frontend
docker compose --env-file .env.dev stop frontend
# server
docker compose --env-file .env.dev stop server
# letsencrypt
docker compose --env-file .env.dev stop letsencrypt
```

### Restart

```shell
# All
docker compose down && docker compose --env-file .env.dev up -d --build
# chrome
docker compose down chrome && docker compose --env-file .env.dev up -d --build chrome
# frontend
docker compose down frontend && docker compose --env-file .env.dev up -d --build frontend
docker compose down frontend && docker compose --env-file .env.dev up --build frontend

# no-cache
docker compose down && docker compose --env-file .env.dev build --no-cache && docker compose --env-file .env.dev up
# no-cache frontend
docker compose down frontend && docker compose --env-file .env.dev up -d --build frontend
docker compose down frontend && docker compose --env-file .env.dev up -d --build --force-recreate frontend
docker compose --env-file .env.dev build --no-cache && docker compose --env-file .env.dev up frontend

# server
docker compose down server && docker compose --env-file .env.dev up -d --build server
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

# Delete EVERYTHING unused (including volumes and images)
docker system prune -a --volumes
```

@todo add clear docker log


# Test Events

@todo fix this

```shell
curl -X POST http://localhost:3000/api/bitrix-webhook \
  -H "X-Bitrix-Auth-Token: your_secret_token" \
  -H "Content-Type: application/json" \
  -d '{"event":"ONCOMPANYADD","data":{"FIELDS":{"ID":123}}}'
```
