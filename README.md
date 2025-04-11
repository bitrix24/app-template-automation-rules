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

@todo -> add all info to example
```shell
cp .env.dev.example .env.dev
```

### Status

```shell
sudo systemctl status docker
sudo ss -tuln | grep 2376


docker ps
docker-compose --env-file .env.dev top
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

****
```shell
# All
docker-compose down && docker-compose --env-file .env.dev up -d --build
# frontend
docker-compose down frontend && docker-compose --env-file .env.dev up -d --build frontend

# no-cache
docker-compose down && docker-compose --env-file .env.dev build --no-cache && docker-compose --env-file .env.dev up
# no-cache frontend
docker-compose down frontend && docker-compose --env-file .env.dev up -d --build frontend
docker-compose down frontend && docker-compose --env-file .env.dev up -d --build --force-recreate frontend
docker-compose --env-file .env.dev build --no-cache && docker-compose --env-file .env.dev up frontend
```

### Start

```shell
# all
docker-compose --env-file .env.dev up -d --build
# frontend
docker-compose --env-file .env.dev up -d --build frontend
# server
docker-compose --env-file .env.dev up -d --build server
# letsencrypt
docker-compose --env-file .env.dev up -d --build letsencrypt

# check user at container
docker exec -it frontend sh -c "whoami && id"

```

### Connect

```shell
# frontend
docker exec -it frontend /bin/bash
# server
docker exec -it server /bin/bash
# letsencrypt
docker exec -it letsencrypt /bin/bash
```

### Log

```shell
# frontend
docker-compose logs -f frontend
# server
docker-compose logs -f server
# letsencrypt
docker-compose logs -f letsencrypt
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
# @todo add info
docker-compose down --volumes --rmi all --remove-orphans

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
