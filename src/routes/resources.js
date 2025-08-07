const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const { authenticate } = require("../middleware/auth");
const { body, param } = require("express-validator");
const { validateRequest } = require("../middleware");

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Validaciones para crear/actualizar recursos
const resourceValidation = [
  body("category")
    .isIn([
      "complaint_types",
      "complaint_severity",
      "complaint_priority",
      "complaint_status",
      "user_roles",
      "evidence_types",
      "resolution_outcomes",
      "timeline_actions",
    ])
    .withMessage("Categoría inválida"),
  body("key")
    .isLength({ min: 1, max: 50 })
    .withMessage("La clave debe tener entre 1 y 50 caracteres")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "La clave solo puede contener letras, números, guiones y guiones bajos"
    ),
  body("label")
    .isLength({ min: 1, max: 100 })
    .withMessage("La etiqueta debe tener entre 1 y 100 caracteres"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder 500 caracteres"),
  body("sort_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El orden debe ser un número entero positivo"),
  validateRequest,
];

const categoryValidation = [
  param("category")
    .isIn([
      "complaint_types",
      "complaint_severity",
      "complaint_priority",
      "complaint_status",
      "user_roles",
      "evidence_types",
      "resolution_outcomes",
      "timeline_actions",
    ])
    .withMessage("Categoría inválida"),
  validateRequest,
];

const categoryKeyValidation = [
  ...categoryValidation,
  param("key")
    .isLength({ min: 1, max: 50 })
    .withMessage("La clave debe tener entre 1 y 50 caracteres")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "La clave solo puede contener letras, números, guiones y guiones bajos"
    ),
  validateRequest,
];

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Obtener todos los recursos agrupados por categoría
 *     description: |
 *       Obtiene todos los recursos del sistema organizados por categorías.
 *       Incluye tipos de denuncias, severidades, prioridades, estados, roles, etc.
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantSlugHeader'
 *       - name: active
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filtrar solo recursos activos (true) o incluir todos (false)
 *     responses:
 *       200:
 *         description: Recursos obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllResourcesResponse'
 *             example:
 *               success: true
 *               message: "Recursos obtenidos exitosamente"
 *               data:
 *                 complaint_types:
 *                   - key: "sexual"
 *                     label: "Acoso Sexual"
 *                     description: "Denuncias relacionadas con acoso sexual"
 *                     sort_order: 1
 *                     metadata: {}
 *                   - key: "psychological"
 *                     label: "Acoso Psicológico"
 *                     description: "Denuncias relacionadas con acoso psicológico"
 *                     sort_order: 2
 *                     metadata: {}
 *                 complaint_severity:
 *                   - key: "low"
 *                     label: "Baja"
 *                     description: "Incidentes menores"
 *                     sort_order: 1
 *                     metadata:
 *                       color: "#28a745"
 *                       priority_weight: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Rutas GET (solo lectura)
router.get("/", resourceController.getAllResources);

/**
 * @swagger
 * /api/resources/{category}:
 *   get:
 *     summary: Obtener recursos por categoría específica
 *     description: |
 *       Obtiene todos los recursos de una categoría específica.
 *       Las categorías disponibles son: complaint_types, complaint_severity,
 *       complaint_priority, complaint_status, user_roles, evidence_types,
 *       resolution_outcomes, timeline_actions.
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantSlugHeader'
 *       - name: category
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [
 *             "complaint_types",
 *             "complaint_severity",
 *             "complaint_priority",
 *             "complaint_status",
 *             "user_roles",
 *             "evidence_types",
 *             "resolution_outcomes",
 *             "timeline_actions"
 *           ]
 *         description: Categoría de recursos a obtener
 *         example: "complaint_types"
 *       - name: active
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filtrar solo recursos activos
 *     responses:
 *       200:
 *         description: Recursos de la categoría obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResourcesResponse'
 *             example:
 *               success: true
 *               message: "Recursos de complaint_types obtenidos exitosamente"
 *               data:
 *                 - key: "sexual"
 *                   label: "Acoso Sexual"
 *                   description: "Denuncias relacionadas con acoso sexual"
 *                   sort_order: 1
 *                   metadata: {}
 *                 - key: "psychological"
 *                   label: "Acoso Psicológico"
 *                   description: "Denuncias relacionadas con acoso psicológico"
 *                   sort_order: 2
 *                   metadata: {}
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No se encontraron recursos para la categoría
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No se encontraron recursos para la categoría: complaint_types"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:category",
  categoryValidation,
  resourceController.getResourcesByCategory
);

/**
 * @swagger
 * /api/resources/{category}/{key}/validate:
 *   get:
 *     summary: Validar si una clave existe en una categoría
 *     description: |
 *       Verifica si una clave específica existe y está activa en una categoría.
 *       Útil para validaciones en formularios o antes de crear relaciones.
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantSlugHeader'
 *       - name: category
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [
 *             "complaint_types",
 *             "complaint_severity",
 *             "complaint_priority",
 *             "complaint_status",
 *             "user_roles",
 *             "evidence_types",
 *             "resolution_outcomes",
 *             "timeline_actions"
 *           ]
 *         description: Categoría donde validar la clave
 *         example: "complaint_types"
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9_-]+$'
 *         description: Clave del recurso a validar
 *         example: "sexual"
 *     responses:
 *       200:
 *         description: Validación completada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidateKeyResponse'
 *             example:
 *               success: true
 *               message: "Clave válida"
 *               data:
 *                 category: "complaint_types"
 *                 key: "sexual"
 *                 is_valid: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:category/:key/validate",
  categoryKeyValidation,
  resourceController.validateKey
);

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Crear un nuevo recurso (Solo Tenant Admin)
 *     description: |
 *       Crea un nuevo recurso en una categoría específica.
 *       Solo los usuarios con rol "Tenant Admin" pueden crear recursos.
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantSlugHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateResourceRequest'
 *           examples:
 *             complaint_type:
 *               summary: Crear tipo de denuncia
 *               value:
 *                 category: "complaint_types"
 *                 key: "violence"
 *                 label: "Violencia Física"
 *                 description: "Denuncias por violencia física en el trabajo"
 *                 sort_order: 5
 *                 metadata: {}
 *             severity:
 *               summary: Crear nivel de severidad
 *               value:
 *                 category: "complaint_severity"
 *                 key: "emergency"
 *                 label: "Emergencia"
 *                 description: "Situaciones que requieren acción inmediata"
 *                 sort_order: 5
 *                 metadata:
 *                   color: "#ff0000"
 *                   priority_weight: 5
 *     responses:
 *       201:
 *         description: Recurso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResourceResponse'
 *             example:
 *               success: true
 *               message: "Recurso creado exitosamente"
 *               data:
 *                 key: "violence"
 *                 label: "Violencia Física"
 *                 description: "Denuncias por violencia física"
 *                 sort_order: 5
 *                 metadata: {}
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permisos para crear recursos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No tienes permisos para crear recursos"
 *       409:
 *         description: El recurso ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Ya existe un recurso con la clave 'violence' en la categoría 'complaint_types'"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// Rutas POST/PUT/DELETE (solo para Tenant Admin)
router.post("/", resourceValidation, resourceController.createResource);

/**
 * @swagger
 * /api/resources/{category}/{key}:
 *   put:
 *     summary: Actualizar un recurso existente (Solo Tenant Admin)
 *     description: |
 *       Actualiza un recurso existente. Solo los usuarios con rol "Tenant Admin"
 *       pueden actualizar recursos. No se puede cambiar la categoría o clave.
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantSlugHeader'
 *       - name: category
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [
 *             "complaint_types",
 *             "complaint_severity",
 *             "complaint_priority",
 *             "complaint_status",
 *             "user_roles",
 *             "evidence_types",
 *             "resolution_outcomes",
 *             "timeline_actions"
 *           ]
 *         description: Categoría del recurso
 *         example: "complaint_types"
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9_-]+$'
 *         description: Clave del recurso a actualizar
 *         example: "sexual"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateResourceRequest'
 *           examples:
 *             update_label:
 *               summary: Actualizar etiqueta
 *               value:
 *                 label: "Acoso Sexual Actualizado"
 *                 description: "Descripción actualizada del tipo de denuncia"
 *             update_metadata:
 *               summary: Actualizar metadata
 *               value:
 *                 metadata:
 *                   color: "#ff5722"
 *                   icon: "warning"
 *             deactivate:
 *               summary: Desactivar recurso
 *               value:
 *                 is_active: false
 *     responses:
 *       200:
 *         description: Recurso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateResourceResponse'
 *             example:
 *               success: true
 *               message: "Recurso actualizado exitosamente"
 *               data:
 *                 key: "sexual"
 *                 label: "Acoso Sexual Actualizado"
 *                 description: "Descripción actualizada"
 *                 sort_order: 1
 *                 metadata:
 *                   color: "#ff5722"
 *                 is_active: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permisos para actualizar recursos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Recurso no encontrado"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  "/:category/:key",
  categoryKeyValidation,
  resourceController.updateResource
);

/**
 * @swagger
 * /api/resources/{category}/{key}:
 *   delete:
 *     summary: Desactivar un recurso (Solo Tenant Admin)
 *     description: |
 *       Desactiva un recurso (soft delete). El recurso no se elimina físicamente,
 *       solo se marca como inactivo. Solo los usuarios con rol "Tenant Admin"
 *       pueden desactivar recursos.
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TenantSlugHeader'
 *       - name: category
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [
 *             "complaint_types",
 *             "complaint_severity",
 *             "complaint_priority",
 *             "complaint_status",
 *             "user_roles",
 *             "evidence_types",
 *             "resolution_outcomes",
 *             "timeline_actions"
 *           ]
 *         description: Categoría del recurso
 *         example: "complaint_types"
 *       - name: key
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-zA-Z0-9_-]+$'
 *         description: Clave del recurso a desactivar
 *         example: "sexual"
 *     responses:
 *       200:
 *         description: Recurso desactivado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Recurso desactivado exitosamente"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permisos para desactivar recursos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Recurso no encontrado"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  "/:category/:key",
  categoryKeyValidation,
  resourceController.deactivateResource
);

module.exports = router;
