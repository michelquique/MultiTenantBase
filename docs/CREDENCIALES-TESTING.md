# 🔑 Credenciales de Testing

> ⚠️ **IMPORTANTE:** Este documento contiene credenciales de desarrollo/testing. NO usar en producción.

---

## 🏢 Tenants Disponibles

| Tenant | Slug | RUT | Plan | Licencias |
|--------|------|-----|------|-----------|
| Empresa Demo S.A. | `empresademo` | 76.123.456-7 | Premium | 100 |
| Otra Empresa Ltda. | `otraempresa` | 77.987.654-3 | Standard | 50 |
| Aureolab Innovación S.A. | `aureolab` | 78.555.123-4 | Premium | 200 |

---

## 🏭 Tenant 1: Empresa Demo S.A.

**Header requerido:** `X-Tenant-ID: empresademo`

| Usuario | Email | Contraseña | Rol | Departamento |
|---------|-------|------------|-----|--------------|
| Admin Sistema | `admin@empresademo.cl` | `Admin123!` | Tenant Admin | Administración |
| Ana García | `ana.garcia@empresademo.cl` | `Password123!` | RRHH | Recursos Humanos |
| Carlos López | `carlos.lopez@empresademo.cl` | `Password123!` | Investigador | Legal |
| Laura Martínez | `laura.martinez@empresademo.cl` | `Password123!` | Investigador | Legal |
| María Rodríguez | `maria.rodriguez@empresademo.cl` | `Password123!` | Empleado | Ventas |
| Juan Pérez | `juan.perez@empresademo.cl` | `Password123!` | Empleado | Marketing |

### Datos de prueba incluidos:
- 4 denuncias (varios estados)
- 2 investigaciones

---

## 🏭 Tenant 2: Otra Empresa Ltda.

**Header requerido:** `X-Tenant-ID: otraempresa`

| Usuario | Email | Contraseña | Rol | Departamento |
|---------|-------|------------|-----|--------------|
| Super Admin | `admin@otraempresa.cl` | `Admin123!` | Tenant Admin | Administración |

### Datos de prueba incluidos:
- Solo el usuario admin (tenant limpio para testing de aislamiento)

---

## 🏭 Tenant 3: Aureolab Innovación S.A.

**Header requerido:** `X-Tenant-ID: aureolab`

| Usuario | Email | Contraseña | Rol | Departamento |
|---------|-------|------------|-----|--------------|
| Sofia Directora | `directora@aureolab.cl` | `Admin123!` | Tenant Admin | Dirección General |
| Diego Morales | `diego.morales@aureolab.cl` | `Password123!` | RRHH | Recursos Humanos |
| Elena Investigadora | `elena.investigadora@aureolab.cl` | `Password123!` | Investigador | Compliance |
| Fernando Analista | `fernando.analista@aureolab.cl` | `Password123!` | Investigador | Compliance |
| Miguel Gerente | `miguel.gerente@aureolab.cl` | `Password123!` | Investigador | Proyectos |
| Roberto Desarrollador | `roberto.dev@aureolab.cl` | `Password123!` | Empleado | Tecnología |
| Carmen Diseñadora | `carmen.design@aureolab.cl` | `Password123!` | Empleado | Diseño UX/UI |
| Patricia Marketing | `patricia.marketing@aureolab.cl` | `Password123!` | Empleado | Marketing Digital |

### Datos de prueba incluidos:
- 5 denuncias (varios estados)
- 2 investigaciones

---

## 🔐 Resumen de Contraseñas

| Tipo de Usuario | Contraseña |
|-----------------|------------|
| Tenant Admin | `Admin123!` |
| Todos los demás roles | `Password123!` |

---

## 📊 Usuarios por Rol (Total)

| Rol | Cantidad | Tenants |
|-----|----------|---------|
| Tenant Admin | 3 | empresademo, otraempresa, aureolab |
| RRHH | 2 | empresademo, aureolab |
| Investigador | 5 | empresademo (2), aureolab (3) |
| Empleado | 5 | empresademo (2), aureolab (3) |

---

## 🚀 Ejemplo de Login

```bash
# Login como Admin de Empresa Demo
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: empresademo" \
  -d '{
    "email": "admin@empresademo.cl",
    "password": "Admin123!"
  }'

# Login como RRHH de Aureolab
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: aureolab" \
  -d '{
    "email": "diego.morales@aureolab.cl",
    "password": "Password123!"
  }'
```

---

## 🌱 Comandos de Seed

```bash
# Seed datos generales (Empresa Demo + Otra Empresa)
npm run seed

# Seed solo Aureolab
node runSeedAureolab.js
```

---

## ⚠️ Notas de Seguridad

- Las cuentas se bloquean tras **5 intentos fallidos** por 30 minutos
- El token JWT expira (configurar en `.env`)
- Cada usuario solo puede acceder a datos de su propio tenant

