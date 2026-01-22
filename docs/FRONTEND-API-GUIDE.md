# 🔐 Guía API para Frontend - Multi-Tenant

## Configuración Base

```
Base URL: http://localhost:3000/api
Swagger: http://localhost:3000/api/docs
```

---

## 🏢 Tenants Disponibles

| Empresa | Slug | RUT |
|---------|------|-----|
| Empresa Demo S.A. | `empresa-demo-sa` | 76.123.456-7 |
| Otra Empresa Ltda. | `otra-empresa-ltda` | 77.987.654-3 |
| Aureolab Innovación S.A. | `aureolab` | 78.555.123-4 |

---

## 🔑 Autenticación

### Login

```http
POST /api/auth/login
Content-Type: application/json
X-Tenant-Slug: {slug}
```

**Headers requeridos:**
- `Content-Type: application/json`
- `X-Tenant-Slug: {slug}` ← **Obligatorio en TODAS las peticiones**

---

## 👥 Usuarios de Prueba

### Tenant: Empresa Demo (`empresa-demo-sa`)

| Email | Password | Rol |
|-------|----------|-----|
| admin@empresademo.cl | Admin123! | Tenant Admin |

### Tenant: Aureolab (`aureolab`)

| Email | Password | Rol |
|-------|----------|-----|
| directora@aureolab.cl | Admin123! | Tenant Admin |
| diego.morales@aureolab.cl | Password123! | RRHH |
| elena.investigadora@aureolab.cl | Password123! | Investigador |
| roberto.dev@aureolab.cl | Password123! | Empleado |
| carmen.design@aureolab.cl | Password123! | Empleado |
| fernando.analista@aureolab.cl | Password123! | Investigador |
| patricia.marketing@aureolab.cl | Password123! | Empleado |
| miguel.gerente@aureolab.cl | Password123! | Investigador |

---

## 📝 Ejemplos de Peticiones

### 1. Login Empresa Demo

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': 'empresa-demo-sa'
  },
  body: JSON.stringify({
    email: 'admin@empresademo.cl',
    password: 'Admin123!'
  })
})
```

### 2. Login Aureolab

```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': 'aureolab'
  },
  body: JSON.stringify({
    email: 'directora@aureolab.cl',
    password: 'Admin123!'
  })
})
```

### 3. Petición Autenticada (después del login)

```javascript
fetch('http://localhost:3000/api/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': 'aureolab',
    'Authorization': 'Bearer {access_token}'
  }
})
```

---

## 📦 Respuesta de Login Exitoso

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "...",
      "first_name": "Sofia",
      "last_name": "Directora",
      "full_name": "Sofia Directora",
      "email": "directora@aureolab.cl",
      "role": "Tenant Admin",
      "department": "Dirección General"
    },
    "tenant": {
      "id": "...",
      "name": "Aureolab Innovación S.A.",
      "slug": "aureolab",
      "branding": {
        "logo_url": "https://...",
        "primary_color": "#4A90E2",
        "secondary_color": "#F5A623"
      }
    },
    "tokens": {
      "access_token": "eyJhbGci...",
      "refresh_token": "eyJhbGci...",
      "expires_in": "7d"
    }
  }
}
```

---

## ⚠️ Errores Comunes

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | Header X-Tenant-Slug es requerido | Falta el header |
| 400 | Formato de tenant slug inválido | Slug con caracteres inválidos |
| 401 | Tenant no encontrado o inactivo | Slug incorrecto |
| 401 | Credenciales inválidas | Email o password incorrectos |

---

## 🔧 cURL para Testing

```bash
# Login Empresa Demo
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: empresa-demo-sa" \
  -d '{"email":"admin@empresademo.cl","password":"Admin123!"}'

# Login Aureolab
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: aureolab" \
  -d '{"email":"directora@aureolab.cl","password":"Admin123!"}'
```

---

## 📌 Notas Importantes

1. **El header `X-Tenant-Slug` es obligatorio** en todas las peticiones
2. El slug debe ser **lowercase** y solo contener `a-z`, `0-9` y `-`
3. El token expira en **7 días**
4. Usar `refresh_token` para renovar el `access_token`

