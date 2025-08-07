# 🧪 Comandos de Test para Recursos

## Tests Disponibles

### Test Simple (Recomendado para verificación rápida)

```bash
npm run test:resources:simple
```

### Test Completo con Jest

```bash
npm run test:resources
```

### Todos los Tests

```bash
npm test
```

## Requisitos Previos

1. **Datos poblados**:

```bash
npm run seed
```

2. **Servidor corriendo** (en otra terminal):

```bash
npm run dev
```

## Ejemplos de Uso Manual

### 1. Login para obtener token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: empresademo" \
  -d '{
    "email": "admin@empresademo.cl",
    "password": "Admin123!"
  }'
```

### 2. Obtener todos los recursos

```bash
curl -X GET http://localhost:3000/api/resources \
  -H "X-Tenant-Slug: empresademo" \
  -H "Authorization: Bearer {TOKEN_AQUI}"
```

### 3. Obtener tipos de denuncia

```bash
curl -X GET http://localhost:3000/api/resources/complaint_types \
  -H "X-Tenant-Slug: empresademo" \
  -H "Authorization: Bearer {TOKEN_AQUI}"
```

### 4. Validar una clave

```bash
curl -X GET http://localhost:3000/api/resources/complaint_types/sexual/validate \
  -H "X-Tenant-Slug: empresademo" \
  -H "Authorization: Bearer {TOKEN_AQUI}"
```

### 5. Crear nuevo recurso (solo Tenant Admin)

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: empresademo" \
  -H "Authorization: Bearer {TOKEN_AQUI}" \
  -d '{
    "category": "complaint_types",
    "key": "violence",
    "label": "Violencia Física",
    "description": "Denuncias por violencia física",
    "sort_order": 5
  }'
```

## Swagger UI

Para probar interactivamente:

1. Abrir: http://localhost:3000/api/docs
2. Buscar sección "Resources"
3. Probar los endpoints
