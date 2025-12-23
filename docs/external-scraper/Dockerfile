# Dockerfile para deploy em containers (Railway, Fly.io, etc.)

FROM ghcr.io/puppeteer/puppeteer:21.5.0

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build do TypeScript
RUN npm run build

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Executar
CMD ["npm", "start"]
