const express = require("express");
const router = express.Router();

// Controladores
const UserController = require("../controllers/userController");

// Middlewares
const { authenticate } = require("../middleware/auth");
const { generalRateLimit } = require("../middleware");

// Validaciones
const {
  getUsersValidation,
  getUserByIdValidation,
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  toggleUserStatusValidation,
} = require("../validators/userValidators");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único del usuario
 *           example: "60d5ecb54b24a820f8d1c3a3"
 *         tenant_id:
 *           type: string
 *           description: ID del tenant
 *           example: "60d5ecb54b24a820f8d1c3a2"
 *         first_name:
 *           type: string
 *           description: Nombre del usuario
 *           example: "Jhue"
 *         last_name:
 *           type: string
 *           description: Apellido del usuario
 *           example: "Castro"
 *         full_name:
 *           type: string
 *           description: Nombre completo del usuario
 *           example: "Jhue Castro"
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: "jhue.cristian.castro@empresa.cl"
 *         role:
 *           type: string
 *           enum: ["Empleado", "RRHH", "Investigador", "Tenant Admin"]
 *           description: Rol del usuario
 *           example: "Empleado"
 *         department:
 *           type: string
 *           description: Departamento del usuario
 *           example: "Ventas"
 *         is_active:
 *           type: boolean
 *           description: Si el usuario está activo
 *           example: true
 *         last_login_at:
 *           type: string
 *           format: date-time
 *           description: Última fecha de login
 *           example: "2024-06-20T14:00:00.000Z"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *           example: "2024-06-01T10:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2024-06-20T14:00:00.000Z"
 *     CreateUserRequest:
 *       type: object
 *       required: ["first_name", "last_name", "email", "password_hash", "role"]
 *       properties:
 *         first_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: Nombre del usuario
 *           example: "María"
 *         last_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: Apellido del usuario
 *           example: "González"
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: "maria3cgonzalez@empresa.cl"
 *         password_hash:
 *           type: string
 *           minLength: 6
 *           description: Contraseña del usuario
 *           example: "Password123!"
 *         role:
 *           type: string
 *           enum: ["Empleado", "RRHH", "Investigador", "Tenant Admin"]
 *           description: Rol del usuario
 *           example: "Empleado"
 *         department:
 *           type: string
 *           maxLength: 100
 *           description: Departamento del usuario
 *           example: "Marketing"
 *         is_active:
 *           type: boolean
 *           description: Si el usuario está activo
 *           example: true
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: Nombre del usuario
 *           example: "María"
 *         last_name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: Apellido del usuario
 *           example: "González"
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *           example: "maria3c.gonzalez@empresa.cl"
 *         role:
 *           type: string
 *           enum: ["Empleado", "RRHH", "Investigador", "Tenant Admin"]
 *           description: Rol del usuario
 *           example: "RRHH"
 *         department:
 *           type: string
 *           maxLength: 100
 *           description: Departamento del usuario
 *           example: "Recursos Humanos"
 *         is_active:
 *           type: boolean
 *           description: Si el usuario está activo
 *           example: true
 *     UserStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de usuarios
 *           example: 25
 *         active:
 *           type: integer
 *           description: Usuarios activos
 *           example: 23
 *         inactive:
 *           type: integer
 *           description: Usuarios inactivos
 *           example: 2
 *         licenses:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total de licencias
 *               example: 100
 *             in_use:
 *               type: integer
 *               description: Licencias en uso
 *               example: 25
 *             available:
 *               type: integer
 *               description: Licencias disponibles
 *               example: 75
 *         roles:
 *           type: object
 *           description: Distribución por roles
 *           example:
 *             "Empleado": 15
 *             "RRHH": 3
 *             "Investigador": 2
 *             "Tenant Admin": 1
 *         departments:
 *           type: object
 *           description: Distribución por departamentos
 *           example:
 *             "Ventas": 8
 *             "Marketing": 5
 *             "Recursos Humanos": 3
 *             "Legal": 2
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener lista de usuarios
 *     description: Obtiene lista paginada de usuarios con filtros según el rol del usuario
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
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: ["Empleado", "RRHH", "Investigador", "Tenant Admin"]
 *         description: Filtrar por rol
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filtrar por departamento
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, email o departamento
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: ["created_at", "updated_at", "first_name", "last_name", "email", "role", "department", "last_login_at"]
 *           default: "created_at"
 *         description: Campo para ordenar
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: ["asc", "desc"]
 *           default: "desc"
 *         description: Orden de clasificación
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
 *                 message:
 *                   type: string
 *                   example: "Usuarios obtenidos exitosamente"
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
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get(
  "/",
  generalRateLimit,
  authenticate,
  getUsersValidation,
  UserController.getAll
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener usuario específico
 *     description: Obtiene los detalles completos de un usuario específico
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuario obtenido exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Usuario no encontrado"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Obtener estadísticas de usuarios
 *     description: Obtiene estadísticas de usuarios del tenant (solo Tenant Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Estadísticas obtenidas exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/UserStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permisos para ver estadísticas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get("/stats", generalRateLimit, authenticate, UserController.getStats);

router.get(
  "/:id",
  generalRateLimit,
  authenticate,
  getUserByIdValidation,
  UserController.getById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear nuevo usuario
 *     description: Crea un nuevo usuario en el tenant (solo Tenant Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuario creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos o límite de licencias alcanzado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidData:
 *                 value:
 *                   success: false
 *                   message: "Datos de entrada inválidos"
 *                   errors:
 *                     - field: "email"
 *                       message: "Email inválido"
 *               duplicateEmail:
 *                 value:
 *                   success: false
 *                   message: "Ya existe un usuario con ese email en este tenant"
 *               licenseLimit:
 *                 value:
 *                   success: false
 *                   message: "Se ha alcanzado el límite de licencias del tenant"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permisos para crear usuarios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No tienes permisos para crear usuarios"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  "/",
  generalRateLimit,
  authenticate,
  createUserValidation,
  UserController.create
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     description: Actualiza los datos de un usuario existente (solo Tenant Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuario actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos o email duplicado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permisos para actualizar usuarios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.put(
  "/:id",
  generalRateLimit,
  authenticate,
  updateUserValidation,
  UserController.update
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     description: Elimina un usuario del sistema (solo Tenant Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuario eliminado exitosamente"
 *       400:
 *         description: No puedes eliminar tu propia cuenta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permisos para eliminar usuarios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.delete(
  "/:id",
  generalRateLimit,
  authenticate,
  deleteUserValidation,
  UserController.delete
);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Cambiar estado de usuario
 *     description: Activa o desactiva un usuario (solo Tenant Admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Estado de usuario cambiado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuario activado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: No puedes desactivar tu propia cuenta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permisos para cambiar el estado de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.patch(
  "/:id/status",
  generalRateLimit,
  authenticate,
  toggleUserStatusValidation,
  UserController.toggleStatus
);

module.exports = router;
