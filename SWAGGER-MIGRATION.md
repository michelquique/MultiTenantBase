# 📖 Guía de Migración - Swagger Actualizado

Esta guía documenta los cambios realizados en la documentación Swagger para el nuevo formato de login con `X-Tenant-Slug`.

## 🔄 Cambios Principales

### **1. Formato de Login Actualizado**

#### **❌ Formato Anterior (Deprecated)**

```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@empresademo.cl",
  "password": "Admin123!",
  "tenant_rut": "76.123.456-7"
}
```

#### **✅ Formato Nuevo (Actual)**

```json
POST /api/auth/login
Content-Type: application/json
X-Tenant-Slug: empresademo

{
  "email": "admin@empresademo.cl",
  "password": "Admin123!"
}
```

### **2. Cambios en Schemas**

#### **LoginRequest Schema**

```yaml
# Antes
LoginRequest:
  required: ["email", "password", "tenant_rut"]
  properties:
    email: { type: string, format: email }
    password: { type: string, minLength: 6 }
    tenant_rut: { type: string, pattern: "^\\d{1,2}\\.\\d{3}\\.\\d{3}-[\\dkK]$" }

# Ahora
LoginRequest:
  required: ["email", "password"]
  properties:
    email: { type: string, format: email }
    password: { type: string, minLength: 6 }
```

#### **Tenant Schema** - Campo `slug` agregado

```yaml
Tenant:
  properties:
    id: { type: string }
    name: { type: string }
    slug: { type: string, pattern: "^[a-z0-9-]+$" } # NUEVO
    branding: { ... }
    subscription_plan: { ... }
```

### **3. Nuevos Parámetros y Respuestas**

#### **Header Parameter**

```yaml
components:
  parameters:
    TenantSlugHeader:
      name: X-Tenant-Slug
      in: header
      required: true
      schema:
        type: string
        pattern: "^[a-z0-9-]+$"
        example: "empresademo"
      description: "Slug único del tenant para identificar la organización"
```

#### **Nueva Respuesta de Error**

```yaml
components:
  responses:
    TenantHeaderError:
      description: "Header X-Tenant-Slug requerido o inválido"
      content:
        application/json:
          examples:
            missing_header:
              value:
                success: false
                message: "Header X-Tenant-Slug es requerido"
            invalid_format:
              value:
                success: false
                message: "Formato de tenant slug inválido"
```

## 🎯 Cómo Usar en Swagger UI

### **Paso 1: Acceder a Swagger**

```
http://localhost:3000/api/docs
```

### **Paso 2: Probar Login**

1. **Expandir** el endpoint `POST /api/auth/login`
2. **Hacer clic** en "Try it out"
3. **Completar el header**:
   - `X-Tenant-Slug`: `empresademo`
4. **Completar el body**:
   ```json
   {
     "email": "admin@empresademo.cl",
     "password": "Admin123!"
   }
   ```
5. **Ejecutar** la request

### **Paso 3: Usar Token**

1. **Copiar** el `access_token` de la respuesta
2. **Hacer clic** en el botón "Authorize" 🔒 (arriba)
3. **Pegar** el token en el campo "Value"
4. **Hacer clic** en "Authorize"
5. **Cerrar** el modal

Ahora todos los endpoints con 🔒 usarán automáticamente tu token.

## 📋 Ejemplos Actualizados

### **Usuarios Disponibles para Testing**

#### **Tenant: empresademo**

```yaml
Tenant Admin:
  email: "admin@empresademo.cl"
  password: "Admin123!"
  header: "X-Tenant-Slug: empresademo"

RRHH:
  email: "ana.garcia@empresademo.cl"
  password: "Password123!"
  header: "X-Tenant-Slug: empresademo"

Investigador:
  email: "carlos.lopez@empresademo.cl"
  password: "Password123!"
  header: "X-Tenant-Slug: empresademo"

Empleado:
  email: "maria.rodriguez@empresademo.cl"
  password: "Password123!"
  header: "X-Tenant-Slug: empresademo"
```

#### **Tenant: otraempresa**

```yaml
Tenant Admin:
  email: "admin@otraempresa.cl"
  password: "Admin123!"
  header: "X-Tenant-Slug: otraempresa"
```

### **Respuestas Ejemplo**

#### **Login Exitoso**

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "60d5ecb54b24a820f8d1c3a1",
      "first_name": "Admin",
      "last_name": "Sistema",
      "email": "admin@empresademo.cl",
      "role": "Tenant Admin",
      "department": "Administración"
    },
    "tenant": {
      "id": "60d5ecb54b24a820f8d1c3a2",
      "name": "Empresa Demo S.A.",
      "slug": "empresademo",
      "branding": {
        "logo_url": "https://placehold.co/200x50/0056b3/fff?text=Demo+Corp",
        "primary_color": "#0056b3",
        "secondary_color": "#4CAF50"
      }
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": "24h"
    }
  }
}
```

#### **Error sin Header**

```json
{
  "success": false,
  "message": "Header X-Tenant-Slug es requerido"
}
```

#### **Error con Slug Inválido**

```json
{
  "success": false,
  "message": "Tenant no encontrado o inactivo"
}
```

## 🔍 Cambios en la Documentación

### **Descripción General Actualizada**

```markdown
## Autenticación:

1. Hacer login con email y password, usando header X-Tenant-Slug
2. Usar el access_token en el header Authorization: Bearer <token>
3. Renovar token usando refresh_token cuando expire

## Headers requeridos:

- **X-Tenant-Slug**: Slug único del tenant (formato: a-z, 0-9, guiones)

## Slugs de ejemplo disponibles:

- **empresademo**: Empresa Demo S.A.
- **otraempresa**: Otra Empresa Ltda.
```

### **Rate Limiting Actualizado**

```markdown
## Rate Limiting:

- Auth endpoints: 20 intentos por 15 minutos por IP (aumentado de 5)
- API general: 100 requests por 15 minutos por IP
- API específica: 30 requests por minuto por IP
```

## 🛠️ Cambios Técnicos

### **CORS Headers Actualizados**

```javascript
allowedHeaders: [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "X-Tenant-Slug", // NUEVO: Header personalizado para tenant
];
```

### **Validaciones Actualizadas**

```javascript
// Removido de authValidators.js
// body("tenant_rut")
//   .matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/)
//   .withMessage("RUT debe tener formato válido")

// La validación del X-Tenant-Slug se hace en el middleware extractTenant
```

## 🚀 Testing en Swagger

### **Casos de Prueba Sugeridos**

1. **✅ Login Exitoso**

   - Header: `X-Tenant-Slug: empresademo`
   - Body: Email y password válidos

2. **❌ Sin Header**

   - Sin header `X-Tenant-Slug`
   - Body: Email y password válidos

3. **❌ Header Inválido**

   - Header: `X-Tenant-Slug: SLUG_INVALIDO!`
   - Body: Email y password válidos

4. **❌ Tenant Inexistente**

   - Header: `X-Tenant-Slug: tenant-inexistente`
   - Body: Email y password válidos

5. **✅ Multi-tenancy**
   - Probar con diferentes slugs: `empresademo` vs `otraempresa`

## 💡 Tips para Uso

- **Headers case-insensitive**: `X-Tenant-Slug` o `x-tenant-slug` funcionan igual
- **Formato slug**: Solo caracteres `a-z`, `0-9`, y `-`
- **Persistencia**: Swagger mantendrá tu token después de refresh
- **Debugging**: Usar la consola del navegador para ver requests/responses
- **Rate limiting**: Si recibes 429, espera 15 minutos

## 🔄 Migración de APIs Existentes

Si tienes APIs o aplicaciones que usan el formato anterior:

1. **Agregar** el header `X-Tenant-Slug` a tus requests
2. **Remover** el campo `tenant_rut` del body
3. **Actualizar** la configuración CORS si es necesario
4. **Probar** con los nuevos endpoints

## 📈 Beneficios del Nuevo Formato

- **API más limpia**: Separación clara entre headers y body
- **Mejor UX**: No requiere RUT en cada login
- **URLs amigables**: Slugs legibles (`empresademo` vs `76.123.456-7`)
- **RESTful**: Sigue mejores prácticas de diseño de API
- **Flexibilidad**: Fácil cambio de tenant sin modificar credenciales
