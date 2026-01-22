# Despliegue en Cloudflare Workers

## Requisitos Previos

1. Cuenta de Cloudflare
2. MongoDB Atlas con Data API habilitado
3. Wrangler CLI instalado

## Configuración

### 1. Habilitar MongoDB Atlas Data API

1. Ve a MongoDB Atlas → App Services
2. Crea una nueva aplicación
3. Habilita "Data API"
4. Genera una API Key

### 2. Configurar Secrets en Cloudflare

```bash
wrangler secret put JWT_SECRET
wrangler secret put MONGODB_DATA_API_KEY
wrangler secret put MONGODB_APP_ID
wrangler secret put MONGODB_DATASOURCE
wrangler secret put MONGODB_DATABASE
```

### 3. Desplegar

```bash
npm install
npm run deploy:cf
```

### 4. Desarrollo Local

```bash
npm run dev:cf
```

## Diferencias con versión Node.js

| Feature | Node.js | Cloudflare Workers |
|---------|---------|-------------------|
| Framework | Express | Hono |
| DB Driver | Mongoose | MongoDB Data API |
| Crypto | bcryptjs | Web Crypto API |
| JWT | jsonwebtoken | Web Crypto API |

## Estructura de Archivos CF

```
src/
├── worker.js          # Entry point
├── lib/
│   ├── mongodb-atlas.js
│   └── crypto-cf.js
├── routes-cf/
│   ├── auth.js
│   ├── users.js
│   ├── complaints.js
│   ├── investigations.js
│   └── resources.js
└── middleware-cf/
    └── auth.js
```
