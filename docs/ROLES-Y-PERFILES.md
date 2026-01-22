# 👥 Roles y Perfiles del Sistema

## Roles Disponibles

El sistema define **4 roles** con permisos diferenciados:

| Rol            | Propósito Principal              |
| -------------- | -------------------------------- |
| `Empleado`     | Usuario estándar (default)       |
| `RRHH`         | Gestión de recursos humanos      |
| `Investigador` | Conducción de investigaciones    |
| `Tenant Admin` | Administrador de la organización |

---

## 1. 👤 Empleado

**Rol por defecto** para todos los usuarios nuevos.

### Capacidades

- ✅ Crear denuncias propias
- ✅ Ver estado de sus denuncias
- ✅ Subir evidencia en sus casos
- ✅ Consultar recursos/materiales

### Restricciones

- ❌ No puede ver denuncias de otros
- ❌ No puede gestionar usuarios
- ❌ No puede acceder a investigaciones

---

## 2. 🧑‍💼 RRHH

Personal de **Recursos Humanos** con acceso ampliado.

### Capacidades

- ✅ Ver **todas** las denuncias del tenant
- ✅ Asignar investigadores a casos
- ✅ Gestionar usuarios del tenant
- ✅ Cambiar estados de denuncias

### Restricciones

- ❌ No puede eliminar investigaciones
- ❌ No puede modificar configuración del tenant

---

## 3. 🔍 Investigador

Profesional que conduce **investigaciones formales**.

### Capacidades

- ✅ Acceder a denuncias asignadas
- ✅ Crear y gestionar investigaciones
- ✅ Registrar entrevistas
- ✅ Documentar hallazgos y evidencia
- ✅ Emitir conclusiones y recomendaciones

### Restricciones

- ❌ Solo accede a casos asignados
- ❌ No puede asignar otros investigadores

---

## 4. 🛡️ Tenant Admin

**Administrador total** de la organización.

### Capacidades

- ✅ **Acceso completo** a todos los recursos
- ✅ Configurar branding (logo, colores)
- ✅ Gestionar licencias
- ✅ Crear usuarios con cualquier rol
- ✅ Ver estadísticas y reportes

### Restricciones

- ⚠️ Limitado a su propio tenant
- ⚠️ Sujeto a límites de licencias contratadas

---

## 🔐 Seguridad de Cuentas

### Bloqueo Automático

- **5 intentos fallidos** → cuenta bloqueada
- **Duración del bloqueo:** 30 minutos
- Reset automático tras login exitoso

### Propiedades de Usuario

| Campo                   | Descripción                     |
| ----------------------- | ------------------------------- |
| `is_active`             | Cuenta habilitada/deshabilitada |
| `last_login_at`         | Último acceso                   |
| `failed_login_attempts` | Contador de fallos              |
| `account_locked_until`  | Fecha de desbloqueo             |

---

## 📊 Matriz de Permisos - Denuncias

| Acción                  | Empleado | RRHH | Investigador | Admin |
| ----------------------- | :------: | :--: | :----------: | :---: |
| Ver propia denuncia     |    ✅    |  ✅  |      ✅      |  ✅   |
| Ver todas las denuncias |    ❌    |  ✅  |      ❌      |  ✅   |
| Ver casos asignados     |    -     |  -   |      ✅      |  ✅   |
| Asignar investigador    |    ❌    |  ✅  |      ❌      |  ✅   |
| Resolver caso           |    ❌    |  ✅  |      ✅      |  ✅   |

---

## 🏢 Límites por Tenant

Cada organización tiene restricciones basadas en su plan:

| Característica             | Descripción                            |
| -------------------------- | -------------------------------------- |
| `licenses.total`           | Máximo de usuarios permitidos          |
| `licenses.in_use`          | Usuarios actuales                      |
| `subscription_plan.status` | Estado: `active`, `trial`, `suspended` |
| Planes disponibles         | `Basic`, `Standard`, `Premium`         |

---

## 🏭 Ejemplos de Tenants

### Tenant 1: Empresa Minera del Norte S.A.

```json
{
  "name": "Minera del Norte S.A.",
  "slug": "minera-norte",
  "rut": "76.543.210-K",
  "subscription_plan": { "type": "Premium", "status": "active" },
  "licenses": { "total": 500, "in_use": 342 }
}
```

**Usuarios ejemplo:**
| Usuario | Rol | Departamento |
|---------|-----|--------------|
| Carlos Pérez | Tenant Admin | Gerencia General |
| María González | RRHH | Recursos Humanos |
| Juan Silva | Investigador | Cumplimiento |
| Ana López | Empleado | Operaciones |

---

### Tenant 2: Constructora Los Andes Ltda.

```json
{
  "name": "Constructora Los Andes Ltda.",
  "slug": "constructora-andes",
  "rut": "78.901.234-5",
  "subscription_plan": { "type": "Standard", "status": "active" },
  "licenses": { "total": 100, "in_use": 87 }
}
```

**Usuarios ejemplo:**
| Usuario | Rol | Departamento |
|---------|-----|--------------|
| Roberto Muñoz | Tenant Admin | Administración |
| Paula Vera | RRHH | Personal |
| Diego Torres | Empleado | Construcción |

---

### Tenant 3: Retail Express SpA (Trial)

```json
{
  "name": "Retail Express SpA",
  "slug": "retail-express",
  "rut": "77.111.222-3",
  "subscription_plan": { "type": "Basic", "status": "trial" },
  "licenses": { "total": 20, "in_use": 5 }
}
```

---

## 📋 Escenarios de Ejemplo - Matriz de Permisos

### Escenario: Denuncia #DEN-2024-001

> **Denunciante:** Ana López (Empleado)  
> **Denunciado:** Pedro Ramírez (Supervisor)  
> **Investigador asignado:** Juan Silva  
> **Estado:** `investigating`

| Acción               |  Ana (Empleado)  | María (RRHH) | Juan (Investigador) | Carlos (Admin) | Diego (Otro Empleado) |
| -------------------- | :--------------: | :----------: | :-----------------: | :------------: | :-------------------: |
| Ver denuncia         |   ✅ Es autora   | ✅ Rol RRHH  |  ✅ Está asignado   |  ✅ Es Admin   |    ❌ Sin relación    |
| Editar denuncia      | ✅ Solo borrador |      ✅      |         ✅          |       ✅       |          ❌           |
| Subir evidencia      |        ✅        |      ✅      |         ✅          |       ✅       |          ❌           |
| Cambiar estado       |        ❌        |      ✅      |         ✅          |       ✅       |          ❌           |
| Asignar investigador |        ❌        |      ✅      |         ❌          |       ✅       |          ❌           |
| Ver investigación    |        ❌        |      ✅      |         ✅          |       ✅       |          ❌           |
| Cerrar caso          |        ❌        |      ✅      |         ✅          |       ✅       |          ❌           |

---

## 🔄 Flujo de Acceso por Rol

### Empleado crea denuncia:

```
Ana (Empleado) → Crea denuncia → Estado: "draft"
                              ↓
               Envía denuncia → Estado: "submitted"
                              ↓
         María (RRHH) revisa → Estado: "under_review"
                              ↓
    Asigna a Juan (Investigador) → Estado: "investigating"
                              ↓
       Juan documenta hallazgos → Crea Investigation
                              ↓
         Juan emite conclusión → Estado: "resolved"
                              ↓
            María cierra caso → Estado: "closed"
```

---

## 📊 Matriz Completa de Permisos por Recurso

### Denuncias (Complaints)

| Permiso                           |     Empleado     | RRHH | Investigador | Admin |
| --------------------------------- | :--------------: | :--: | :----------: | :---: |
| `POST /complaints`                |        ✅        |  ✅  |      ✅      |  ✅   |
| `GET /complaints` (propias)       |        ✅        |  ✅  |      ✅      |  ✅   |
| `GET /complaints` (todas)         |        ❌        |  ✅  |      ❌      |  ✅   |
| `GET /complaints/:id` (asignadas) |        ❌        |  ✅  |      ✅      |  ✅   |
| `PUT /complaints/:id`             | ⚠️ Solo borrador |  ✅  |      ✅      |  ✅   |
| `PATCH /complaints/:id/status`    |        ❌        |  ✅  |      ✅      |  ✅   |
| `POST /complaints/:id/evidence`   |        ✅        |  ✅  |      ✅      |  ✅   |
| `DELETE /complaints/:id`          |        ❌        |  ❌  |      ❌      |  ✅   |

### Investigaciones (Investigations)

| Permiso                                | Empleado | RRHH | Investigador | Admin |
| -------------------------------------- | :------: | :--: | :----------: | :---: |
| `POST /investigations`                 |    ❌    |  ✅  |      ✅      |  ✅   |
| `GET /investigations`                  |    ❌    |  ✅  | ⚠️ Asignadas |  ✅   |
| `PUT /investigations/:id`              |    ❌    |  ❌  |      ✅      |  ✅   |
| `POST /investigations/:id/interviews`  |    ❌    |  ❌  |      ✅      |  ✅   |
| `POST /investigations/:id/findings`    |    ❌    |  ❌  |      ✅      |  ✅   |
| `PATCH /investigations/:id/conclusion` |    ❌    |  ❌  |      ✅      |  ✅   |

### Usuarios (Users)

| Permiso             | Empleado | RRHH | Investigador | Admin |
| ------------------- | :------: | :--: | :----------: | :---: |
| `GET /users/me`     |    ✅    |  ✅  |      ✅      |  ✅   |
| `PUT /users/me`     |    ✅    |  ✅  |      ✅      |  ✅   |
| `GET /users`        |    ❌    |  ✅  |      ❌      |  ✅   |
| `POST /users`       |    ❌    |  ✅  |      ❌      |  ✅   |
| `PUT /users/:id`    |    ❌    |  ✅  |      ❌      |  ✅   |
| `DELETE /users/:id` |    ❌    |  ❌  |      ❌      |  ✅   |

---

## ⚠️ Reglas de Aislamiento Multi-Tenant

| Regla                    | Descripción                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| **Aislamiento de datos** | Un usuario NUNCA puede ver datos de otro tenant                    |
| **Validación de tenant** | Cada request valida `tenant_id` del usuario autenticado            |
| **Licencias**            | No se pueden crear usuarios si `licenses.in_use >= licenses.total` |
| **Suscripción**          | Acceso denegado si `subscription_plan.status !== 'active'`         |
| **Tenant inactivo**      | Error 403 si `tenant.status !== 'active'`                          |
