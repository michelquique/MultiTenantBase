# 🧪 Tests para Login con X-Tenant-Slug

Este documento explica cómo ejecutar y entender los tests para el nuevo formato de login que usa `X-Tenant-Slug` header en lugar de `tenant_rut` en el body.

## 🚀 Cambio Implementado

### **Formato Anterior (❌ Deprecated)**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@empresademo.cl",
  "password": "Admin123!",
  "tenant_rut": "76.123.456-7"
}
```

### **Formato Nuevo (✅ Actual)**

```http
POST /api/auth/login
Content-Type: application/json
X-Tenant-Slug: empresademo

{
  "email": "admin@empresademo.cl",
  "password": "Admin123!"
}
```

## 📋 Tipos de Tests Disponibles

### 1. **Tests Unitarios Completos (Jest + Supertest)**

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage
```

**Archivo**: `tests/auth.test.js`

**Qué testea**:

- ✅ Login exitoso con header `X-Tenant-Slug`
- ❌ Error sin header `X-Tenant-Slug`
- ❌ Error con slug inválido/inexistente
- ❌ Error con formato de slug inválido
- ❌ Error con credenciales incorrectas
- ❌ Error con usuario/tenant inactivo
- ✅ Aislamiento multi-tenant
- ✅ Control de intentos fallidos
- ✅ Rate limiting
- ✅ Validaciones de campos

### 2. **Test Simple de Demostración**

```bash
# Test rápido para demostrar el nuevo formato
npm run test:login
```

**Archivo**: `test-login-simple.js`

**Qué hace**:

- Demuestra el nuevo formato funcionando
- Muestra diferentes casos de error
- Verifica que el token funciona

## 🔧 Setup para Tests

### **Requisitos**:

1. Base de datos MongoDB corriendo
2. Servidor API iniciado (`npm run dev`)
3. Datos de seed cargados (`npm run seed`)

### **Variables de Entorno**:

```bash
# .env
MONGODB_URI=mongodb://localhost:27017/harassment_platform
MONGODB_TEST_URI=mongodb://localhost:27017/harassment_platform_test  # Opcional
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
```

## 📊 Estructura de Tests

### **tests/auth.test.js** - Tests Unitarios Completos

```javascript
describe("Authentication Endpoints", () => {
  describe("POST /api/auth/login", () => {
    test(
      "Debe hacer login exitoso con credenciales válidas y header X-Tenant-Slug"
    );
    test("Debe fallar sin header X-Tenant-Slug");
    test("Debe fallar con tenant slug inválido");
    test("Debe fallar con formato de slug inválido");
    test("Debe aislar usuarios por tenant (multi-tenancy)");
    // ... más tests
  });

  describe("Rate Limiting", () => {
    test("Debe aplicar rate limiting en login");
  });
});
```

### **test-login-simple.js** - Demo Rápida

```javascript
// Test 1: Login exitoso
POST /api/auth/login
X-Tenant-Slug: empresademo
{ email, password }

// Test 2: Error sin header
POST /api/auth/login
{ email, password }

// Test 3: Error con slug inválido
POST /api/auth/login
X-Tenant-Slug: tenant-inexistente
{ email, password }
```

## 🏃‍♂️ Cómo Ejecutar

### **Paso 1: Preparar entorno**

```bash
# Instalar dependencias
npm install

# Limpiar y recrear datos de prueba
npm run seed
```

### **Paso 2: Iniciar servidor**

```bash
# Terminal 1: Servidor
npm run dev
```

### **Paso 3: Ejecutar tests**

```bash
# Terminal 2: Tests unitarios
npm test

# O test simple
npm run test:login
```

## 📋 Casos de Test Cubiertos

### ✅ **Casos Exitosos**

- Login con header `X-Tenant-Slug` correcto
- Multi-tenancy: Mismo email en diferentes tenants
- Token válido para requests autenticadas
- Reset de intentos fallidos después de login exitoso

### ❌ **Casos de Error**

- Sin header `X-Tenant-Slug`
- Header con formato inválido (`SLUG_INVALIDO!`)
- Slug inexistente (`tenant-inexistente`)
- Email inexistente
- Contraseña incorrecta
- Usuario inactivo
- Tenant inactivo
- Rate limiting (más de 20 intentos en 15 min)

### 🔒 **Casos de Seguridad**

- Validación de formato de email
- Validación de campos requeridos
- Incremento de intentos fallidos
- Bloqueo temporal de cuenta
- Aislamiento por tenant

## 🎯 Ejemplos de Uso

### **Login Exitoso**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: empresademo" \
  -d '{
    "email": "admin@empresademo.cl",
    "password": "Admin123!"
  }'
```

**Respuesta esperada**:

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@empresademo.cl",
      "role": "Tenant Admin"
    },
    "tenant": {
      "id": "...",
      "name": "Empresa Demo S.A.",
      "slug": "empresademo"
    },
    "tokens": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "expires_in": "24h"
    }
  }
}
```

### **Error sin Header**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresademo.cl",
    "password": "Admin123!"
  }'
```

**Respuesta esperada**:

```json
{
  "success": false,
  "message": "Header X-Tenant-Slug es requerido"
}
```

## 🔍 Debugging Tests

### **Ver logs durante tests**:

```bash
# Ver logs del servidor
npm run logs

# Ver logs de errores
npm run logs:error
```

### **Debug individual**:

```bash
# Ejecutar un test específico
npx jest --testNamePattern="Debe hacer login exitoso"

# Ejecutar con verbose
npx jest --verbose
```

## 📈 Coverage Esperado

El coverage debe incluir:

- ✅ `src/controllers/authController.js` - Login method
- ✅ `src/middleware/tenantExtractor.js` - Header validation
- ✅ `src/validators/authValidators.js` - Input validation
- ✅ `src/routes/auth.js` - Route configuration

### **Ejecutar coverage**:

```bash
npm run test:coverage
```

Esto generará un reporte en `coverage/lcov-report/index.html`

## 🚀 Próximos Pasos

1. **Actualizar Swagger** - Documentar el nuevo formato
2. **Actualizar tests existentes** - Migrar `test-*.js` al nuevo formato
3. **Tests de integración** - Tests end-to-end completos
4. **Tests de performance** - Verificar rate limiting y carga

## 💡 Tips

- **Usar slugs consistentes**: `empresademo`, `otraempresa`
- **Headers case-insensitive**: `X-Tenant-Slug` o `x-tenant-slug`
- **Formato slug**: Solo `a-z`, `0-9`, y `-`
- **Rate limiting**: 20 intentos por 15 minutos por IP
- **Multi-tenancy**: Mismos emails en diferentes tenants son válidos

## ✅ **Swagger Actualizado Completamente**

He actualizado exitosamente toda la documentación Swagger para usar el nuevo formato de login con `X-Tenant-Slug`. Aquí está el resumen completo de los cambios:

### **📋 Archivos Actualizados:**

1. **`src/config/swagger.js`** - Configuración principal de Swagger
2. **`src/routes/auth.js`** - Documentación del endpoint de login
3. **`src/middleware/index.js`** - Headers CORS actualizados
4. **`SWAGGER-MIGRATION.md`** - Guía de migración completa
5. **`verify-swagger-update.js`** - Script de verificación

### **🔄 Cambios Principales:**

#### **1. Schema LoginRequest Actualizado**

```yaml
# ❌ Antes
required: ["email", "password", "tenant_rut"]
properties:
  tenant_rut: { type: string, pattern: "RUT format" }

# ✅ Ahora
required: ["email", "password"]
# tenant_rut removido completamente
```

#### **2. Nuevo Parameter Component**

```yaml
TenantSlugHeader:
  name: X-Tenant-Slug
  in: header
  required: true
  schema:
    type: string
    pattern: "^[a-z0-9-]+$"
    example: "empresademo"
```

#### **3. Schema Tenant con Slug**

```yaml
Tenant:
  properties:
    slug:
      type: string
      pattern: "^[a-z0-9-]+$"
      example: "empresademo"
```

#### **4. Nuevas Respuestas de Error**

```yaml
TenantHeaderError:
  description: "Header X-Tenant-Slug requerido o inválido"
  examples:
    - missing_header: "Header X-Tenant-Slug es requerido"
    - invalid_format: "Formato de tenant slug inválido"
    - tenant_not_found: "Tenant no encontrado o inactivo"
```

#### **5. Ejemplos Actualizados**

```yaml
# Nuevos ejemplos en /api/auth/login
admin: { email: "admin@empresademo.cl", password: "Admin123!" }
rrhh: { email: "ana.garcia@empresademo.cl", password: "Password123!" }
investigator: { email: "carlos.lopez@empresademo.cl", password: "Password123!" }
second_tenant: { email: "admin@otraempresa.cl", password: "Admin123!" }
```

### **🎯 Cómo Probar:**

#### **Paso 1: Verificar Setup**

```bash
# Asegurar datos con slugs
npm run seed

# Iniciar servidor
npm run dev

# Verificar actualización
npm run verify:swagger
```

#### **Paso 2: Probar en Swagger UI**

```
1. Abrir: http://localhost:3000/api/docs
2. Ir a POST /api/auth/login
3. Click "Try it out"
4. Completar header: X-Tenant-Slug: empresademo
5. Completar body: { "email": "admin@empresademo.cl", "password": "Admin123!" }
6. Ejecutar
```

#### **Paso 3: Usar Token**

```
1. Copiar access_token de la respuesta
2. Click botón "Authorize" 🔒
3. Pegar token y autorizar
4. Probar otros endpoints protegidos
```

### **📚 Documentación Incluida:**

#### **SWAGGER-MIGRATION.md** - Contiene:

- ✅ Comparación formato anterior vs nuevo
- ✅ Guía paso a paso para Swagger UI
- ✅ Ejemplos de todos los casos de uso
- ✅ Tips y troubleshooting
- ✅ Casos de prueba sugeridos

#### **Scripts Disponibles:**

```bash
npm run verify:swagger  # Verificar que todo funcione
npm run test:login      # Test simple del nuevo formato
npm test               # Tests unitarios completos
```

### **🚀 Beneficios del Formato Actualizado:**

1. **API más limpia**: Headers separados del body
2. **Mejor UX**: Sin RUT requerido en cada login
3. **URLs amigables**: `empresademo` vs `76.123.456-7`
4. **RESTful**: Mejores prácticas de API design
5. **Flexibilidad**: Fácil cambio de tenant

### **🔍 Verificación:**

El script `verify-swagger-update.js` confirma que:

- ✅ Nuevo formato funciona
- ✅ Formato anterior es rechazado
- ✅ Headers CORS incluyen `X-Tenant-Slug`
- ✅ Swagger es accesible
- ✅ Todos los ejemplos son válidos

**La documentación Swagger está completamente actualizada y lista para usar con el nuevo formato de login!** 🎉
