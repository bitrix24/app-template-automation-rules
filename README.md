# @bitrix24/b24ui-playground-nuxt-starter-bp-activity

Look at docs to learn more:

- [Nuxt](https://nuxt.com/docs/getting-started/introduction)
- [@bitrix24/b24ui-nuxt](https://bitrix24.github.io/b24ui/)
- [@bitrix24/b24style](https://bitrix24.github.io/b24style/)
- [@bitrix24/b24icons](https://bitrix24.github.io/b24icons/)
- [@bitrix24/b24jssdk](https://bitrix24.github.io/b24jssdk/)

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

---

# App config

> These are experimental settings for using B24.
> Still in early Alpha

## scopes

- crm
- bizproc
- placement
- user_brief

---

# tuna.am
> Blocked request. This host ("7z5n5j-146-120-15---.--.tuna.am") is not allowed.
> To allow this host, add "7z5n5j-146-120-15---.--.tuna.am" to `server.allowedHosts` in vite.config.js.


# @todo

> [!WARNING]  
> These are experimental settings
> 
> Still in early Alpha

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

# Useful resources

- SSL Server Test [Qualys](https://www.ssllabs.com/ssltest/index.html)
