# Nova Deployment

## Topology

- `frontend`: static Vite build served by Nginx on port `80`
- `backend`: FastAPI served by Uvicorn on port `8000`
- Nginx proxies `/api/*` and `/health` to the backend container

## Required files on the server

- repo checkout
- `backend/.env.local`

## Required secrets in `backend/.env.local`

- `GMI_API_BASE`
- `GMI_API_KEY`
- `GMI_MODEL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_FRONTEND_SUCCESS_URL`

Optional:

- SMTP settings if using SMTP send modes

## Deploy

```bash
docker compose -f docker-compose.nova.yml build
docker compose -f docker-compose.nova.yml up -d
```

## Smoke tests

```bash
curl http://127.0.0.1/health
curl -I http://127.0.0.1/
curl -H "Authorization: Bearer $GMI_API_KEY" https://api.gmi-serving.com/v1/models
curl -L https://tomlinsonsdev.myshopify.com/products/zignature-catfish-dog-food | grep 'Zignature Catfish Dry Dog Food'
```
