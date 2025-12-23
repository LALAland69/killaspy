# KillaSpy External Scraper

Scraper serverless para coleta de anúncios da Facebook Ad Library, pronto para deploy no **Render** ou **Railway**.

## 📐 Arquitetura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Render/Railway │────▶│  Scraper Webhook │────▶│    Supabase     │
│    (Scraper)    │     │  (Edge Function) │     │    Database     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                                                │
        │ Puppeteer Stealth                             │
        ▼                                                ▼
┌─────────────────┐                             ┌─────────────────┐
│ Facebook Ads    │                             │    KillaSpy     │
│    Library      │                             │    Dashboard    │
└─────────────────┘                             └─────────────────┘
```

---

## 🚀 Deploy Rápido no Render

### 1. Preparar o Repositório

Clone o projeto e navegue para a pasta do scraper:

```bash
git clone <seu-repo>
cd docs/external-scraper
```

### 2. Criar Web Service no Render

1. Acesse [render.com](https://render.com) e crie uma conta
2. Clique em **New > Web Service**
3. Conecte seu repositório GitHub
4. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `killaspy-scraper` |
| **Root Directory** | `docs/external-scraper` |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Starter` (512 MB RAM - suficiente para Puppeteer) |

### 3. Configurar Variáveis de Ambiente

No painel do Render, vá em **Environment** e adicione:

```env
WEBHOOK_URL=https://unucjuxitmawvmvvzxqq.supabase.co/functions/v1/scraper-webhook
WEBHOOK_SECRET=seu_harvest_cron_secret_aqui
SCRAPER_ID=render-scraper-01
```

> ⚠️ **IMPORTANTE**: O `WEBHOOK_SECRET` deve ser o mesmo valor configurado como `HARVEST_CRON_SECRET` no Supabase.

### 4. Configurar Cron Job (Opcional)

Para execução automática, adicione um **Cron Job** no Render:
- Schedule: `0 */6 * * *` (a cada 6 horas)
- Command: `npm run scrape -- --term="fitness" --country="US" --limit=50`

---

## 🚂 Deploy no Railway

### 1. Criar Projeto

1. Acesse [railway.app](https://railway.app)
2. Clique em **New Project > Deploy from GitHub repo**
3. Selecione seu repositório

### 2. Configurar

```bash
# Root Directory
docs/external-scraper

# Build Command  
npm install && npm run build

# Start Command
npm start
```

### 3. Variáveis de Ambiente

Adicione as mesmas variáveis do Render.

---

## 💻 Uso Local

### Instalação

```bash
cd docs/external-scraper
npm install
```

### Executar Scraper

```bash
# Testar conexão com webhook
npm run scrape -- --ping

# Scrape por termo de busca
npm run scrape -- --term="dropshipping" --country="BR" --limit=100

# Scrape por termo nos EUA
npm run scrape -- --term="supplements" --country="US" --limit=200

# Scrape por Page ID específico
npm run scrape -- --page-id="123456789" --limit=50

# Múltiplos países
npm run scrape -- --term="skincare" --country="US,BR,GB" --limit=150
```

### Variáveis de Ambiente (.env)

```env
# Webhook do KillaSpy (obrigatório)
WEBHOOK_URL=https://unucjuxitmawvmvvzxqq.supabase.co/functions/v1/scraper-webhook

# Secret para autenticação (obrigatório em produção)
WEBHOOK_SECRET=seu_harvest_cron_secret

# ID único deste scraper
SCRAPER_ID=local-dev-scraper

# Proxy (opcional - recomendado para produção)
PROXY_URL=http://user:pass@proxy.example.com:8080
```

---

## 📡 API do Webhook

### Ping (Health Check)

```bash
curl -X POST https://unucjuxitmawvmvvzxqq.supabase.co/functions/v1/scraper-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEU_SECRET" \
  -d '{"action": "ping"}'
```

Resposta:
```json
{
  "success": true,
  "message": "pong",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Import Único

```bash
curl -X POST https://unucjuxitmawvmvvzxqq.supabase.co/functions/v1/scraper-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEU_SECRET" \
  -d '{
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
  }'
```

### Import em Lote

```bash
curl -X POST https://unucjuxitmawvmvvzxqq.supabase.co/functions/v1/scraper-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: SEU_SECRET" \
  -d '{
    "action": "batch_import",
    "scraper_id": "render-scraper-01",
    "ads": [
      {
        "ad_library_id": "ad_001",
        "page_name": "Advertiser 1",
        "headline": "Great Product",
        "countries": ["US"]
      },
      {
        "ad_library_id": "ad_002", 
        "page_name": "Advertiser 2",
        "headline": "Amazing Deal",
        "countries": ["BR"]
      }
    ]
  }'
```

Resposta:
```json
{
  "success": true,
  "total": 2,
  "imported": 2,
  "updated": 0,
  "errors": 0,
  "details": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🛡️ Configuração de Segurança

### 1. Configurar HARVEST_CRON_SECRET no Supabase

O secret deve ser configurado nas Edge Functions do Supabase:

1. Acesse seu projeto Supabase
2. Vá em **Settings > Edge Functions**
3. Adicione a variável: `HARVEST_CRON_SECRET=seu_secret_seguro_aqui`

### 2. Gerar Secret Seguro

```bash
# Linux/Mac
openssl rand -hex 32

# Ou use qualquer gerador de senhas seguras
```

---

## 🔄 Estratégias de Scraping

### Rotação de Termos

Crie um script para variar os termos automaticamente:

```javascript
// cron-scrape.js
const terms = [
  { term: 'fitness', country: 'US' },
  { term: 'skincare', country: 'BR' },
  { term: 'supplements', country: 'GB' },
  { term: 'dropshipping', country: 'US' },
];

const randomTerm = terms[Math.floor(Math.random() * terms.length)];
console.log(`Scraping: ${randomTerm.term} in ${randomTerm.country}`);
```

### Proxies Rotativos (Recomendado)

Para evitar bloqueios em produção:

```env
# Serviços recomendados:
# - Bright Data (brightdata.com)
# - Oxylabs (oxylabs.io)
# - SmartProxy (smartproxy.com)

PROXY_URL=http://user:pass@residential-proxy.example.com:8080
```

---

## 📊 Monitoramento

### Logs no Render

Acesse **Logs** no painel do Render para ver:
- Conexões com webhook
- Quantidade de ads coletados
- Erros de scraping

### Dashboard KillaSpy

Os anúncios importados aparecem automaticamente em:
- `/spy` - Ad Intelligence
- `/ads` - Lista completa de anúncios
- `/data-sources` - Status das fontes de dados

---

## 🐛 Troubleshooting

### "Cannot connect to webhook"

1. Verifique se `WEBHOOK_URL` está correto
2. Confirme que `WEBHOOK_SECRET` é igual ao `HARVEST_CRON_SECRET` do Supabase
3. Teste com `npm run scrape -- --ping`

### "No ads found"

1. O Facebook pode estar bloqueando IPs do datacenter
2. Use proxies residenciais
3. Aumente o delay entre requests no código

### "Puppeteer crash"

1. Verifique se tem memória suficiente (mínimo 512MB)
2. No Render, use instância "Starter" ou maior
3. Adicione flags ao Puppeteer: `--disable-dev-shm-usage`

---

## 📁 Estrutura do Projeto

```
docs/external-scraper/
├── src/
│   ├── index.ts      # Classe principal do scraper
│   └── cli.ts        # Interface de linha de comando
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 🔗 Links Úteis

- [Facebook Ad Library](https://www.facebook.com/ads/library/)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Puppeteer Stealth Plugin](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth)
