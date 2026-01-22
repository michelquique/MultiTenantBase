# 🏢 Harassment Platform Backend

## Descripción

API REST multi-tenant para la gestión de denuncias de acoso laboral. Permite a múltiples empresas (tenants) gestionar denuncias, investigaciones, usuarios y recursos de forma aislada.

## 🛠️ Stack Tecnológico

- **Node.js + Express** - Servidor web
- **MongoDB + Mongoose** - Base de datos NoSQL
- **JWT** - Autenticación
- **Swagger** - Documentación API
- **Winston** - Logging
- **Jest** - Testing

## 📁 Estructura

```
src/
├── controllers/    # Lógica de negocio
├── models/         # Esquemas MongoDB (User, Tenant, Complaint, Investigation, Resource)
├── routes/         # Endpoints API
├── middleware/     # Auth, tenant extractor, seguridad
├── validators/     # Validación de requests
└── config/         # DB, logger, swagger
```

## 🔗 Endpoints Principales

| Ruta | Descripción |
|------|-------------|
| `/api/auth` | Autenticación (login/registro) |
| `/api/users` | Gestión de usuarios |
| `/api/complaints` | Denuncias |
| `/api/investigations` | Investigaciones |
| `/api/resources` | Recursos/materiales |
| `/api/docs` | Documentación Swagger |

## 🚀 Inicio Rápido

```bash
npm install
npm run seed      # Datos de prueba
npm run dev       # Desarrollo
```

## 🔐 Multi-Tenancy

Cada tenant (empresa) tiene datos aislados. El header `X-Tenant-ID` identifica el tenant en cada request.

## 📄 Documentación

- Swagger UI: `http://localhost:3000/api/docs`
- Guía Frontend: `docs/FRONTEND-API-GUIDE.md`

