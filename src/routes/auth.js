const express = require("express");
const router = express.Router();

// Controladores
const AuthController = require("../controllers/authController");

// Middlewares
const { authenticate } = require("../middleware/auth");
const { authRateLimit } = require("../middleware");
const { extractTenant } = require("../middleware/tenantExtractor");

// Validaciones
const {
  loginValidation,
  refreshTokenValidation,
} = require("../validators/authValidators");
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de usuario
 *     description: Autentica un usuario con email y contraseña usando el tenant slug en header
 *     tags: [Authentication]
 *     parameters:
 *       - $ref: '#/components/parameters/TenantSlugHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Login como Tenant Admin
 *               value:
 *                 email: "admin@empresademo.cl"
 *                 password: "Admin123!"
 *             rrhh:
 *               summary: Login como RRHH
 *               value:
 *                 email: "ana.garcia@empresademo.cl"
 *                 password: "Password123!"
 *             employee:
 *               summary: Login como Empleado
 *               value:
 *                 email: "maria.rodriguez@empresademo.cl"
 *                 password: "Password123!"
 *             investigator:
 *               summary: Login como Investigador
 *               value:
 *                 email: "carlos.lopez@empresademo.cl"
 *                 password: "Password123!"
 *             second_tenant:
 *               summary: Login en segundo tenant
 *               value:
 *                 email: "admin@otraempresa.cl"
 *                 password: "Admin123!"
 *               description: "Usar con X-Tenant-Slug: otraempresa"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               success: true
 *               message: "Login exitoso"
 *               data:
 *                 user:
 *                   id: "60d5ecb54b24a820f8d1c3a1"
 *                   first_name: "Admin"
 *                   last_name: "Sistema"
 *                   full_name: "Admin Sistema"
 *                   email: "admin@empresademo.cl"
 *                   role: "Tenant Admin"
 *                   department: "Administración"
 *                 tenant:
 *                   id: "60d5ecb54b24a820f8d1c3a2"
 *                   name: "Empresa Demo S.A."
 *                   slug: "empresademo"
 *                   branding:
 *                     logo_url: "https://placehold.co/200x50/0056b3/fff?text=Demo+Corp"
 *                     primary_color: "#0056b3"
 *                     secondary_color: "#4CAF50"
 *                 tokens:
 *                   access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   expires_in: "24h"
 *       400:
 *         $ref: '#/components/responses/TenantHeaderError'
 *       401:
 *         description: Credenciales inválidas o tenant no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_credentials:
 *                 summary: Credenciales inválidas
 *                 value:
 *                   success: false
 *                   message: "Credenciales inválidas"
 *               tenant_not_found:
 *                 summary: Tenant no encontrado
 *                 value:
 *                   success: false
 *                   message: "Tenant no encontrado o inactivo"
 *               inactive_account:
 *                 summary: Cuenta inactiva
 *                 value:
 *                   success: false
 *                   message: "Cuenta inactiva"
 *       423:
 *         description: Cuenta bloqueada temporalmente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Cuenta temporalmente bloqueada. Intente más tarde."
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
/**
 * @route   POST /api/auth/login
 * @desc    Login de usuario
 * @access  Public
 * @headers X-Tenant-Slug (required)
 * @body    { email, password }
 */
router.post(
  "/login",
  authRateLimit,
  extractTenant,
  loginValidation,
  AuthController.login
);
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar access token
 *     description: Renueva el access token usando un refresh token válido
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       400:
 *         description: Refresh token requerido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Refresh token requerido"
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Refresh token inválido o expirado"
 *       403:
 *         description: Tenant inactivo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Tenant inactivo"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 * @body    { refresh_token }
 */
router.post(
  "/refresh",
  authRateLimit,
  refreshTokenValidation,
  AuthController.refreshToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout de usuario
 *     description: Cierra la sesión del usuario (invalidar token)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
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
 *                   example: "Logout exitoso"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
/**
 * @route   POST /api/auth/logout
 * @desc    Logout de usuario (invalidar token)
 * @access  Private
 */
router.post("/logout", authenticate, AuthController.logout);
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     description: Retorna la información completa del usuario autenticado y su tenant
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tenant:
 *                       $ref: '#/components/schemas/Tenant'
 *             example:
 *               success: true
 *               data:
 *                 user:
 *                   id: "60d5ecb54b24a820f8d1c3a1"
 *                   first_name: "Admin"
 *                   last_name: "Sistema"
 *                   full_name: "Admin Sistema"
 *                   email: "admin@empresademo.cl"
 *                   role: "Tenant Admin"
 *                   department: "Administración"
 *                   last_login_at: "2024-06-26T15:30:00.000Z"
 *                   created_at: "2024-01-15T10:00:00.000Z"
 *                 tenant:
 *                   id: "60d5ecb54b24a820f8d1c3a2"
 *                   name: "Empresa Demo S.A."
 *                   slug: "empresademo"
 *                   branding:
 *                     logo_url: "https://placehold.co/200x50/0056b3/fff?text=Demo+Corp"
 *                     primary_color: "#0056b3"
 *                     secondary_color: "#4CAF50"
 *                   subscription_plan:
 *                     type: "Premium"
 *                     status: "active"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Usuario no encontrado"
 */
/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Private
 */
router.get("/me", authenticate, AuthController.me);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar si el token es válido
 * @access  Private
 */
/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar validez del token
 *     description: Verifica si el token JWT es válido y retorna información básica del usuario
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
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
 *                   example: "Token válido"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       example: "60d5ecb54b24a820f8d1c3a1"
 *                     tenant_id:
 *                       type: string
 *                       example: "60d5ecb54b24a820f8d1c3a2"
 *                     role:
 *                       type: string
 *                       example: "Tenant Admin"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/verify", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token válido",
    data: {
      user_id: req.user._id,
      tenant_id: req.tenantId,
      role: req.user.role,
    },
  });
});

module.exports = router;
