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

# App config
## scopes

- crm
- bizproc
- placement
- user_brief

---

## Ngrok

[ngrok.com](https://ngrok.com/)

```bash
ngrok http 3000
```

## Tuna

[Tuna](https://tuna.am/en/docs/)

```bash
tuna http 3000
```

---

## Docker

@todo -> add all info to example
```bash
cp .env.dev.example .env.dev
```

### Clear

> Delete all data in volumes (including DB)
> 
> Require rebuilding images on next startup
> 
> Irreversibly delete information
> Should not be used in **production** **without understanding** the consequences

```bash
df -h
du -sh /var/lib/docker
```

```bash
docker-compose down --volumes --rmi all --remove-orphans
```

```bash
# Delete all stopped containers
docker container prune

# Delete EVERYTHING unused (including volumes and images)
docker system prune -a --volumes

# Delete all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Delete unused volumes
docker volume prune
```

@todo add clear docker log

### Status
```bash
docker ps
docker-compose --env-file .env.dev top
```

### Stop

**All**
```bash
docker-compose --env-file .env.dev stop
```

**frontend**
```bash
docker-compose --env-file .env.dev stop frontend
```

### Restart
**All**
```bash
docker-compose down && docker-compose --env-file .env.dev up -d --build
```

**no-cache**
```bash
docker-compose down && docker-compose --env-file .env.dev build --no-cache && docker-compose --env-file .env.dev up
```

### Start

**All**
```bash
docker-compose --env-file .env.dev up -d --build
```

**frontend**
```bash
docker-compose --env-file .env.dev up -d --build frontend
```

```bash
docker-compose --env-file .env.dev up --build frontend
```

```bash
docker-compose --env-file .env.dev up --build server
docker-compose --env-file .env.dev up --build letsencrypt
```

### Connect

```bash
docker exec -it frontend /bin/bash
```

### Log

```bash
docker-compose logs -f frontend
docker-compose logs -f server
docker-compose logs -f letsencrypt
```
