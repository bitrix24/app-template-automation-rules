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
/certs
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
/nginx
  default.conf
  Dockerfile
  entrypoint.sh
/letsencrypt
  Dockerfile
  entrypoint.sh
/log
.gitignore
.dockerignore
.env.dev
.env.prod
docker-compose.yml
```

## App config
### scopes

- crm
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

**SERVER**
```shell
docker network create proxy-net

docker-compose -f docker-compose.server.yml -p server__global top

docker-compose -f docker-compose.server.yml -p server__global build
docker-compose -f docker-compose.server.yml -p server__global up -d
docker-compose -f docker-compose.server.yml -p server__global up -d --build
docker-compose -f docker-compose.server.yml -p server__global down
docker-compose -f docker-compose.server.yml -p server__global stop

docker-compose -f docker-compose.server.yml -p server__global logs -f server
docker-compose -f docker-compose.server.yml -p server__global logs -f letsencrypt
docker logs -f server
docker logs -f letsencrypt
```

**DEV**
```shell
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules top

docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules build
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build chrome
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build frontend

docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down --volumes --rmi all --remove-orphans

docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules stop
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules stop chrome
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules start dev-chrome
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules stop frontend
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules start frontend

docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down && \
 docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build

docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down chrome && \
 docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build chrome

docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules down frontend && \
 docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules up -d --build frontend
 
 
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs 
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs chrome
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs -f chrome
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs frontend
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules logs -f frontend

docker logs -f chrome
docker logs -f frontend

```

**PROD**
```shell
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules build
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build prod-chrome
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build prod-frontend

docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down --volumes --rmi all --remove-orphans

docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules stop
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules stop prod-chrome
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules stop prod-frontend

docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down && \
 docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build

docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down prod-chrome && \
 docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build prod-chrome

docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules down prod-frontend && \
 docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rules up -d --build prod-frontend
 
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rule logs -f prod-chrome
docker-compose -f docker-compose.prod.yml -p prod__app-template-automation-rule logs -f prod-frontend
docker logs -f prod-chrome
docker logs -f prod-frontend

```

@todo -> add all info to example
```shell
cp .env.dev.example .env.dev
```

### Status

```shell
sudo systemctl status docker
sudo ss -tuln | grep 2376


docker ps
docker ps -a | grep chrome
docker-compose -f docker-compose.dev.yml -p dev__app-template-automation-rules top
docker-compose -f docker-compose.dev.yml -p prod__app-template-automation-rules top

# network
docker network inspect inner
docker network inspect inner | grep -A 10 Containers

# chrome
docker inspect chrome
docker exec -it chrome wget -qO- http://localhost:9222/json/version
docker exec -it chrome netstat -tulpn | grep 9222
docker exec -it chrome ping -c 4 frontend

docker exec -it chrome sh -c "
  dbus-send --system \
  --dest=org.freedesktop.DBus \
  --type=method_call \
  --print-reply \
  /org/freedesktop/DBus \
  org.freedesktop.DBus.ListNames
"

# frontend
docker inspect frontend
docker exec -it frontend wget -qO- http://chrome:9222/json/version
docker exec -it frontend nc -zv chrome 9222
docker exec -it frontend ping -c 4 chrome
docker exec -it frontend nslookup chrome
docker exec -it frontend sh -c "whoami && id" # check user at container
```

### Start
```shell
# all
docker-compose --env-file .env.dev up -d --build
# chrome
docker-compose --env-file .env.dev up -d --build chrome
# frontend
docker-compose --env-file .env.dev up -d --build frontend
# server
docker-compose --env-file .env.dev up -d --build server
# letsencrypt
docker-compose --env-file .env.dev up -d --build letsencrypt
```

### Stop

```shell
# All
docker-compose --env-file .env.dev stop
# frontend
docker stop frontend
docker-compose --env-file .env.dev stop frontend
# server
docker-compose --env-file .env.dev stop server
# letsencrypt
docker-compose --env-file .env.dev stop letsencrypt
```

### Restart

```shell
# All
docker-compose down && docker-compose --env-file .env.dev up -d --build
# chrome
docker-compose down chrome && docker-compose --env-file .env.dev up -d --build chrome
# frontend
docker-compose down frontend && docker-compose --env-file .env.dev up -d --build frontend
docker-compose down frontend && docker-compose --env-file .env.dev up --build frontend

# no-cache
docker-compose down && docker-compose --env-file .env.dev build --no-cache && docker-compose --env-file .env.dev up
# no-cache frontend
docker-compose down frontend && docker-compose --env-file .env.dev up -d --build frontend
docker-compose down frontend && docker-compose --env-file .env.dev up -d --build --force-recreate frontend
docker-compose --env-file .env.dev build --no-cache && docker-compose --env-file .env.dev up frontend

# server
docker-compose down server && docker-compose --env-file .env.dev up -d --build server
```

### Log

```shell
# chrome
docker-compose logs -f chrome
docker logs chrome

# frontend
docker-compose logs -f frontend
# server
docker-compose logs -f server
# letsencrypt
docker-compose logs -f letsencrypt
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
