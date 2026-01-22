const express = require("express");
const router = express.Router();

// Controladores
const ComplaintController = require("../controllers/complaintController");

// Middlewares
const { authenticate } = require("../middleware/auth");
const { generalRateLimit } = require("../middleware");

// Validaciones
const {
  createComplaintValidation,
  getComplaintsValidation,
  getComplaintByIdValidation,
  updateStatusValidation,
  assignInvestigatorValidation,
  addEvidenceValidation,
  resolveComplaintValidation,
  getTimelineValidation,
} = require("../validators/complaintValidators");

/**
 * @swagger
 * components:
 *   schemas:
 *     Complaint:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único de la denuncia
 *           example: "60d5ecb54b24a820f8d1c3a3"
 *         tenant_id:
 *           type: string
 *           description: ID del tenant
 *           example: "60d5ecb54b24a820f8d1c3a2"
 *         complainant_id:
 *           $ref: '#/components/schemas/User'
 *         accused_id:
 *           $ref: '#/components/schemas/User'
 *         type:
 *           type: string
 *           enum: ["sexual", "psychological", "discrimination", "other"]
 *           description: Tipo de acoso
 *           example: "psychological"
 *         severity:
 *           type: string
 *           enum: ["low", "medium", "high", "critical"]
 *           description: Severidad del incidente
 *           example: "medium"
 *         status:
 *           type: string
 *           enum: ["draft", "submitted", "under_review", "investigating", "resolved", "closed"]
 *           description: Estado actual de la denuncia
 *           example: "submitted"
 *         title:
 *           type: string
 *           description: Título de la denuncia
 *           example: "Acoso psicológico en el área de trabajo"
 *         description:
 *           type: string
 *           description: Descripción detallada del incidente
 *           example: "He experimentado comentarios despectivos y presión constante..."
 *         location:
 *           type: string
 *           description: Ubicación donde ocurrió el incidente
 *           example: "Oficina 3er piso, área de ventas"
 *         incident_date:
 *           type: string
 *           format: date-time
 *           description: Fecha del incidente
 *           example: "2024-06-15T10:30:00.000Z"
 *         reported_date:
 *           type: string
 *           format: date-time
 *           description: Fecha de reporte
 *           example: "2024-06-20T14:00:00.000Z"
 *         assigned_to:
 *           $ref: '#/components/schemas/User'
 *         assigned_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de asignación
 *           example: "2024-06-21T09:00:00.000Z"
 *         priority:
 *           type: string
 *           enum: ["low", "normal", "high", "urgent"]
 *           description: Prioridad de la denuncia
 *           example: "normal"
 *         is_confidential:
 *           type: boolean
 *           description: Si la denuncia es confidencial
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *           example: "2024-06-20T14:00:00.000Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2024-06-21T09:00:00.000Z"
 *     CreateComplaintRequest:
 *       type: object
 *       required: ["accused_id", "type", "title", "description", "incident_date"]
 *       properties:
 *         accused_id:
 *           type: string
 *           description: ID del usuario denunciado
 *           example: "60d5ecb54b24a820f8d1c3a4"
 *         type:
 *           type: string
 *           enum: ["sexual", "psychological", "discrimination", "other"]
 *           description: Tipo de acoso
 *           example: "psychological"
 *         severity:
 *           type: string
 *           enum: ["low", "medium", "high", "critical"]
 *           description: Severidad del incidente
 *           example: "medium"
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 200
 *           description: Título de la denuncia
 *           example: "Acoso psicológico en el área de trabajo"
 *         description:
 *           type: string
 *           minLength: 20
 *           maxLength: 5000
 *           description: Descripción detallada del incidente
 *           example: "He experimentado comentarios despectivos y presión constante por parte de mi supervisor..."
 *         location:
 *           type: string
 *           maxLength: 300
 *           description: Ubicación donde ocurrió el incidente
 *           example: "Oficina 3er piso, área de ventas"
 *         incident_date:
 *           type: string
 *           format: date-time
 *           description: Fecha del incidente
 *           example: "2024-06-15T10:30:00.000Z"
 *         is_confidential:
 *           type: boolean
 *           description: Si la denuncia es confidencial
 *           example: true
 *         priority:
 *           type: string
 *           enum: ["low", "normal", "high", "urgent"]
 *           description: Prioridad de la denuncia
 *           example: "normal"
 *     UpdateStatusRequest:
 *       type: object
 *       required: ["status"]
 *       properties:
 *         status:
 *           type: string
 *           enum: ["draft", "submitted", "under_review", "investigating", "resolved", "closed"]
 *           description: Nuevo estado de la denuncia
 *           example: "submitted"
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Notas sobre el cambio de estado
 *           example: "Denuncia enviada para revisión inicial"
 *     AssignInvestigatorRequest:
 *       type: object
 *       required: ["investigator_id"]
 *       properties:
 *         investigator_id:
 *           type: string
 *           description: ID del investigador asignado
 *           example: "60d5ecb54b24a820f8d1c3a5"
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: Notas sobre la asignación
 *           example: "Asignado para investigación completa"
 *     AddEvidenceRequest:
 *       type: object
 *       required: ["type", "filename", "original_name", "url", "size"]
 *       properties:
 *         type:
 *           type: string
 *           enum: ["document", "image", "video", "audio"]
 *           description: Tipo de evidencia
 *           example: "document"
 *         filename:
 *           type: string
 *           description: Nombre del archivo en el servidor
 *           example: "evidence_123.pdf"
 *         original_name:
 *           type: string
 *           description: Nombre original del archivo
 *           example: "captura_pantalla.pdf"
 *         url:
 *           type: string
 *           format: uri
 *           description: URL para acceder al archivo
 *           example: "https://storage.example.com/evidence_123.pdf"
 *         size:
 *           type: integer
 *           description: Tamaño del archivo en bytes
 *           example: 1024000
 *     ResolveComplaintRequest:
 *       type: object
 *       required: ["outcome", "actions_taken"]
 *       properties:
 *         outcome:
 *           type: string
 *           enum: ["founded", "unfounded", "partially_founded", "insufficient_evidence"]
 *           description: Resultado de la investigación
 *           example: "founded"
 *         actions_taken:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *           description: Acciones tomadas
 *           example: ["Capacitación obligatoria", "Advertencia escrita"]
 *         notes:
 *           type: string
 *           maxLength: 2000
 *           description: Notas de resolución
 *           example: "Se encontró evidencia suficiente de acoso psicológico"
 *     ComplaintStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de denuncias
 *           example: 25
 *         status_counts:
 *           type: object
 *           properties:
 *             draft:
 *               type: integer
 *               example: 3
 *             submitted:
 *               type: integer
 *               example: 8
 *             under_review:
 *               type: integer
 *               example: 5
 *             investigating:
 *               type: integer
 *               example: 4
 *             resolved:
 *               type: integer
 *               example: 3
 *             closed:
 *               type: integer
 *               example: 2
 *         type_counts:
 *           type: object
 *           properties:
 *             sexual:
 *               type: integer
 *               example: 5
 *             psychological:
 *               type: integer
 *               example: 12
 *             discrimination:
 *               type: integer
 *               example: 6
 *             other:
 *               type: integer
 *               example: 2
 *         severity_counts:
 *           type: object
 *           properties:
 *             low:
 *               type: integer
 *               example: 8
 *             medium:
 *               type: integer
 *               example: 10
 *             high:
 *               type: integer
 *               example: 5
 *             critical:
 *               type: integer
 *               example: 2
 */

/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Crear nueva denuncia
 *     description: Crea una nueva denuncia de acoso laboral
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComplaintRequest'
 *           examples:
 *             psychological:
 *               summary: Denuncia de acoso psicológico
 *               value:
 *                 accused_id: "60d5ecb54b24a820f8d1c3a4"
 *                 type: "psychological"
 *                 severity: "medium"
 *                 title: "Acoso psicológico por supervisor"
 *                 description: "Mi supervisor ha estado haciendo comentarios despectivos sobre mi trabajo y presionándome constantemente para que renuncie. Esto ha estado ocurriendo durante los últimos 3 meses."
 *                 location: "Oficina 3er piso, área de ventas"
 *                 incident_date: "2024-06-15T10:30:00.000Z"
 *                 is_confidential: true
 *                 priority: "normal"
 *     responses:
 *       201:
 *         description: Denuncia creada exitosamente
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
 *                   example: "Denuncia creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Usuario denunciado no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Usuario denunciado no encontrado"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  "/",
  generalRateLimit,
  authenticate,
  createComplaintValidation,
  ComplaintController.create
);

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: Obtener lista de denuncias
 *     description: Obtiene lista paginada de denuncias con filtros según el rol del usuario
 *     tags: [Complaints]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["draft", "submitted", "under_review", "investigating", "resolved", "closed"]
 *         description: Filtrar por estado
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ["sexual", "psychological", "discrimination", "other"]
 *         description: Filtrar por tipo
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: ["low", "medium", "high", "critical"]
 *         description: Filtrar por severidad
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ["low", "normal", "high", "urgent"]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: string
 *         description: Filtrar por investigador asignado
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: ["created_at", "updated_at", "incident_date", "reported_date", "title", "status", "priority", "severity"]
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
 *         description: Lista de denuncias obtenida exitosamente
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
 *                   example: "Denuncias obtenidas exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
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
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get(
  "/",
  generalRateLimit,
  authenticate,
  getComplaintsValidation,
  ComplaintController.getAll
);

/**
 * @swagger
 * /api/complaints/stats:
 *   get:
 *     summary: Obtener estadísticas de denuncias
 *     description: Obtiene estadísticas generales de denuncias (solo RRHH y Tenant Admin)
 *     tags: [Complaints]
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
 *                   $ref: '#/components/schemas/ComplaintStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get(
  "/stats",
  generalRateLimit,
  authenticate,
  ComplaintController.getStats
);

/**
 * @swagger
 * /api/complaints/{id}:
 *   get:
 *     summary: Obtener denuncia específica
 *     description: Obtiene los detalles completos de una denuncia específica
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la denuncia
 *     responses:
 *       200:
 *         description: Denuncia obtenida exitosamente
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
 *                   example: "Denuncia obtenida exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Denuncia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Denuncia no encontrada"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get(
  "/:id",
  generalRateLimit,
  authenticate,
  getComplaintByIdValidation,
  ComplaintController.getById
);

/**
 * @swagger
 * /api/complaints/{id}/status:
 *   put:
 *     summary: Actualizar estado de denuncia
 *     description: Cambia el estado de una denuncia según el rol del usuario
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la denuncia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStatusRequest'
 *           examples:
 *             submit:
 *               summary: Enviar denuncia
 *               value:
 *                 status: "submitted"
 *                 notes: "Denuncia enviada para revisión inicial"
 *             review:
 *               summary: Pasar a revisión
 *               value:
 *                 status: "under_review"
 *                 notes: "Denuncia en revisión por RRHH"
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
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
 *                   example: "Estado de denuncia actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Denuncia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Denuncia no encontrada"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.put(
  "/:id/status",
  generalRateLimit,
  authenticate,
  updateStatusValidation,
  ComplaintController.updateStatus
);

/**
 * @swagger
 * /api/complaints/{id}/assign:
 *   post:
 *     summary: Asignar investigador
 *     description: Asigna un investigador a una denuncia (solo RRHH y Tenant Admin)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la denuncia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignInvestigatorRequest'
 *           examples:
 *             assign:
 *               summary: Asignar investigador
 *               value:
 *                 investigator_id: "60d5ecb54b24a820f8d1c3a5"
 *                 notes: "Asignado para investigación completa del caso"
 *     responses:
 *       200:
 *         description: Investigador asignado exitosamente
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
 *                   example: "Investigador asignado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Denuncia o investigador no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Investigador no encontrado o no válido"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  "/:id/assign",
  generalRateLimit,
  authenticate,
  assignInvestigatorValidation,
  ComplaintController.assignInvestigator
);

/**
 * @swagger
 * /api/complaints/{id}/evidence:
 *   post:
 *     summary: Agregar evidencia
 *     description: Agrega evidencia digital a una denuncia
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la denuncia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddEvidenceRequest'
 *           examples:
 *             document:
 *               summary: Agregar documento
 *               value:
 *                 type: "document"
 *                 filename: "evidence_123.pdf"
 *                 original_name: "captura_pantalla.pdf"
 *                 url: "https://storage.example.com/evidence_123.pdf"
 *                 size: 1024000
 *     responses:
 *       200:
 *         description: Evidencia agregada exitosamente
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
 *                   example: "Evidencia agregada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Denuncia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Denuncia no encontrada"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  "/:id/evidence",
  generalRateLimit,
  authenticate,
  addEvidenceValidation,
  ComplaintController.addEvidence
);

/**
 * @swagger
 * /api/complaints/{id}/resolve:
 *   post:
 *     summary: Resolver denuncia
 *     description: Marca una denuncia como resuelta con el resultado de la investigación
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la denuncia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResolveComplaintRequest'
 *           examples:
 *             founded:
 *               summary: Denuncia fundada
 *               value:
 *                 outcome: "founded"
 *                 actions_taken: ["Capacitación obligatoria", "Advertencia escrita", "Seguimiento mensual"]
 *                 notes: "Se encontró evidencia suficiente de acoso psicológico. Se implementarán medidas correctivas."
 *             unfounded:
 *               summary: Denuncia infundada
 *               value:
 *                 outcome: "unfounded"
 *                 actions_taken: ["Cierre del caso", "Comunicación a ambas partes"]
 *                 notes: "No se encontró evidencia suficiente para sustentar la denuncia."
 *     responses:
 *       200:
 *         description: Denuncia resuelta exitosamente
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
 *                   example: "Denuncia resuelta exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Denuncia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Denuncia no encontrada"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
  "/:id/resolve",
  generalRateLimit,
  authenticate,
  resolveComplaintValidation,
  ComplaintController.resolve
);

/**
 * @swagger
 * /api/complaints/{id}/timeline:
 *   get:
 *     summary: Obtener timeline de denuncia
 *     description: Obtiene el historial completo de acciones realizadas en una denuncia
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la denuncia
 *     responses:
 *       200:
 *         description: Timeline obtenido exitosamente
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
 *                   example: "Timeline obtenido exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                         example: "status_changed"
 *                       user_id:
 *                         $ref: '#/components/schemas/User'
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-06-21T09:00:00.000Z"
 *                       notes:
 *                         type: string
 *                         example: "Denuncia enviada para revisión"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Denuncia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Denuncia no encontrada"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.get(
  "/:id/timeline",
  generalRateLimit,
  authenticate,
  getTimelineValidation,
  ComplaintController.getTimeline
);

module.exports = router;
