# KillaSpy External Scraper

Este é o código para um scraper serverless que pode ser deployado no Render, Railway, ou qualquer serviço que suporte Node.js.

## Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Render/Railway │────▶│  Scraper Webhook │────▶│    Supabase     │
│    (Scraper)    │     │  (Edge Function) │     │    Database     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                                │
        │ Puppeteer/Playwright                          │
        ▼                                                ▼
┌─────────────────┐                             ┌─────────────────┐
│ Facebook Ads    │                             │    KillaSpy     │
│    Library      │                             │    Dashboard    │
└─────────────────┘                             └─────────────────┘
```

## Setup

### 1. Variáveis de Ambiente

```env
WEBHOOK_URL=https://unucjuxitmawvmvvzxqq.supabase.co/functions/v1/scraper-webhook
WEBHOOK_SECRET=seu_harvest_cron_secret
SCRAPER_ID=render-scraper-01
```

### 2. Instalação

```bash
npm install
```

### 3. Deploy no Render

1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Deploy como Web Service ou Background Worker

## Uso

```bash
# Executar scraper
npm start

# Scrape por termo de busca
npm run scrape -- --term="skincare" --country="US" --limit=100

# Scrape por Page ID
npm run scrape -- --page-id="123456789" --limit=50
```

## API do Webhook

### Ping (Health Check)
```json
POST /scraper-webhook
{
  "action": "ping"
}
```

### Import Único
```json
POST /scraper-webhook
{
  "action": "single_import",
  "scraper_id": "render-scraper-01",
  "ad": {
    "ad_library_id": "123456789",
    "page_name": "Brand Name",
    "page_id": "987654321",
    "primary_text": "Ad text content",
    "headline": "Ad Headline",
    "media_url": "https://...",
    "media_type": "image",
    "start_date": "2024-01-01",
    "countries": ["US", "BR"]
  }
}
```

### Import em Lote
```json
POST /scraper-webhook
{
  "action": "batch_import",
  "scraper_id": "render-scraper-01",
  "ads": [
    { ... },
    { ... }
  ]
}
```
