# 📖 Swagger Documentation - Ejemplos y Configuración

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install swagger-ui-express swagger-jsdoc yamljs
npm install --save-dev @apidevtools/swagger-parser
```

### 2. Acceder a la documentación

Una vez que el servidor esté corriendo:

- **URL principal**: http://localhost:3000/api/docs
- **Redirección**: http://localhost:3000/docs (redirige a /api/docs)

## 🔧 Características implementadas

### ✅ Configuración completa de OpenAPI 3.0

- Información detallada de la API
- Servidores (desarrollo y producción)
- Esquemas de autenticación JWT
- Componentes reutilizables (schemas, responses)
- Tags organizados por funcionalidad

### ✅ Documentación de autenticación

- Login con ejemplos para diferentes roles
- Refresh token
- Logout
- Verificación de token
- Información del usuario actual

### ✅ Esquemas de datos completos

- User, Tenant, LoginRequest, LoginResponse
- ErrorResponse con validaciones
- HealthResponse

### ✅ Respuestas de error estandarizadas

- 400: Validation Error
- 401: Unauthorized Error
- 403: Forbidden Error
- 429: Rate Limit Error

### ✅ Ejemplos interactivos

- Múltiples ejemplos por endpoint
- Casos de uso reales con datos de prueba
- Try it out funcional

## 🎯 Usuarios de ejemplo incluidos en Swagger

### Tenant 1: Empresa Demo S.A. (76.123.456-7)

```json
{
  "admin": {
    "email": "admin@empresademo.cl",
    "password": "Admin123!",
    "role": "Tenant Admin"
  },
  "rrhh": {
    "email": "ana.garcia@empresademo.cl",
    "password": "Password123!",
    "role": "RRHH"
  },
  "employee": {
    "email": "maria.rodriguez@empresademo.cl",
    "password": "Password123!",
    "role": "Empleado"
  }
}
```

## 🛠️ Personalización de la UI

### Características habilitadas:

- **Explorer**: Navegación lateral por tags
- **Persist Authorization**: Mantiene token después de refresh
- **Display Request Duration**: Muestra tiempo de respuesta
- **Filter**: Búsqueda de endpoints
- **Try It Out**: Botones para probar endpoints

### CSS personalizado aplicado:

- Oculta la barra superior de Swagger
- Colores personalizados para el título
- Styling del esquema de autenticación

## 📝 Cómo agregar documentación a nuevos endpoints

### Ejemplo básico:

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener lista de usuarios
 *     description: Retorna lista paginada de usuarios del tenant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
```

## 🔐 Cómo usar la autenticación en Swagger

### Paso 1: Hacer login

1. Ve al endpoint `POST /api/auth/login`
2. Haz clic en "Try it out"
3. Usa uno de los ejemplos predefinidos
4. Ejecuta la request
5. Copia el `access_token` de la respuesta

### Paso 2: Autorizar en Swagger

1. Haz clic en el botón "Authorize" (🔒) en la parte superior
2. Pega el token en el campo "Value"
3. Haz clic en "Authorize"
4. Cierra el modal

### Paso 3: Probar endpoints protegidos

Ahora todos los endpoints con 🔒 usarán automáticamente tu token.

## 📊 Validación de la documentación

### Verificar que Swagger funciona:

```bash
# Instalar swagger-parser globalmente (opcional)
npm install -g @apidevtools/swagger-parser

# Validar la especificación (desde el directorio del proyecto)
swagger-parser validate src/config/swagger.js
```

## 🚀 Mejores prácticas implementadas

### ✅ Esquemas reutilizables

- Todos los modelos están en `components/schemas`
- Respuestas de error estandarizadas
- Referencias consistentes (`$ref`)

### ✅ Ejemplos realistas

- Datos de prueba reales
- Múltiples casos de uso por endpoint
- Nombres descriptivos para ejemplos

### ✅ Seguridad documentada

- JWT Bearer token claramente especificado
- Endpoints protegidos marcados con security
- Rate limiting documentado

### ✅ Organización por tags

- System: Health check, info
- Authentication: Login, logout, etc.
- Users, Complaints, etc.: Módulos futuros

### ✅ Metadatos completos

- Descripciones detalladas
- Información de contacto y licencia
- URLs de servidor por entorno

## 🔄 Próximos pasos

Una vez que implementes más módulos, puedes:

1. **Agregar nuevos schemas** en `swagger.js`
2. **Documentar nuevos endpoints** con comentarios JSDoc
3. **Crear ejemplos específicos** para cada caso de uso
4. **Agregar validaciones** en los schemas
5. **Incluir headers personalizados** si los necesitas

## 💡 Tips útiles

- **Usa referencias**: `$ref: '#/components/schemas/User'` en lugar de duplicar esquemas
- **Agrupa por funcionalidad**: Usa tags consistentes
- **Incluye ejemplos**: Facilita el testing para otros desarrolladores
- **Documenta errores**: Especifica todos los códigos de estado posibles
- **Valida regularmente**: Usa swagger-parser para verificar la sintaxis
