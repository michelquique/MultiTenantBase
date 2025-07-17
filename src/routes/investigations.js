const express = require("express");
const { validationResult } = require("express-validator");
const InvestigationController = require("../controllers/investigationController");
const {
  createInvestigationValidator,
  updateInvestigationValidator,
  addEvidenceValidator,
  addInterviewValidator,
  addFindingValidator,
  completeInvestigationValidator,
  queryValidator,
  paramIdValidator,
} = require("../validators/investigationValidators");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Investigation:
 *       type: object
 *       required:
 *         - complaint_id
 *         - investigator_id
 *         - estimated_completion_date
 *         - scope
 *         - objectives
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único de la investigación
 *         complaint_id:
 *           type: string
 *           description: ID de la denuncia asociada
 *         investigator_id:
 *           type: string
 *           description: ID del investigador asignado
 *         assigned_by:
 *           type: string
 *           description: ID del usuario que asignó la investigación
 *         status:
 *           type: string
 *           enum: [pending, in_progress, evidence_review, interviews_pending, analysis, report_draft, completed, suspended, cancelled]
 *           description: Estado actual de la investigación
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           description: Prioridad de la investigación
 *         estimated_completion_date:
 *           type: string
 *           format: date
 *           description: Fecha estimada de finalización
 *         actual_completion_date:
 *           type: string
 *           format: date
 *           description: Fecha real de finalización
 *         investigation_type:
 *           type: string
 *           enum: [formal, informal, preliminary, follow_up]
 *           description: Tipo de investigación
 *         methodology:
 *           type: string
 *           enum: [interviews, document_review, observation, mixed]
 *           description: Metodología de investigación
 *         scope:
 *           type: string
 *           description: Alcance de la investigación
 *         objectives:
 *           type: array
 *           items:
 *             type: string
 *           description: Objetivos de la investigación
 *         confidentiality_level:
 *           type: string
 *           enum: [public, internal, confidential, highly_confidential]
 *           description: Nivel de confidencialidad
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *
 *     Evidence:
 *       type: object
 *       required:
 *         - type
 *         - title
 *         - source
 *       properties:
 *         type:
 *           type: string
 *           enum: [document, interview, email, photo, video, other]
 *           description: Tipo de evidencia
 *         title:
 *           type: string
 *           description: Título de la evidencia
 *         description:
 *           type: string
 *           description: Descripción de la evidencia
 *         source:
 *           type: string
 *           description: Fuente de la evidencia
 *         relevance:
 *           type: string
 *           enum: [high, medium, low]
 *           description: Relevancia de la evidencia
 *         filename:
 *           type: string
 *           description: Nombre del archivo
 *         url:
 *           type: string
 *           description: URL del archivo
 *
 *     Interview:
 *       type: object
 *       required:
 *         - interviewee_id
 *         - interview_date
 *         - type
 *         - summary
 *       properties:
 *         interviewee_id:
 *           type: string
 *           description: ID del entrevistado
 *         interview_date:
 *           type: string
 *           format: date-time
 *           description: Fecha de la entrevista
 *         duration_minutes:
 *           type: number
 *           description: Duración en minutos
 *         location:
 *           type: string
 *           description: Ubicación de la entrevista
 *         type:
 *           type: string
 *           enum: [witness, complainant, accused, expert, other]
 *           description: Tipo de entrevista
 *         summary:
 *           type: string
 *           description: Resumen de la entrevista
 *         key_points:
 *           type: array
 *           items:
 *             type: string
 *           description: Puntos clave de la entrevista
 *         follow_up_required:
 *           type: boolean
 *           description: Si requiere seguimiento
 *
 *     Finding:
 *       type: object
 *       required:
 *         - category
 *         - description
 *         - severity
 *       properties:
 *         category:
 *           type: string
 *           enum: [factual, policy_violation, procedural, behavioral]
 *           description: Categoría del hallazgo
 *         description:
 *           type: string
 *           description: Descripción del hallazgo
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Severidad del hallazgo
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *           description: Recomendaciones basadas en el hallazgo
 *
 *     InvestigationConclusion:
 *       type: object
 *       required:
 *         - outcome
 *         - summary
 *       properties:
 *         outcome:
 *           type: string
 *           enum: [substantiated, unsubstantiated, partially_substantiated, inconclusive, unfounded]
 *           description: Resultado de la investigación
 *         summary:
 *           type: string
 *           description: Resumen de la conclusión
 *         recommendations:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [disciplinary, training, policy, procedural, other]
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 */

/**
 * @swagger
 * /api/investigations:
 *   post:
 *     summary: Crear una nueva investigación
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - complaint_id
 *               - investigator_id
 *               - estimated_completion_date
 *               - scope
 *               - objectives
 *             properties:
 *               complaint_id:
 *                 type: string
 *                 description: ID de la denuncia a investigar
 *               investigator_id:
 *                 type: string
 *                 description: ID del investigador asignado
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *               estimated_completion_date:
 *                 type: string
 *                 format: date
 *               investigation_type:
 *                 type: string
 *                 enum: [formal, informal, preliminary, follow_up]
 *                 default: formal
 *               methodology:
 *                 type: string
 *                 enum: [interviews, document_review, observation, mixed]
 *                 default: mixed
 *               scope:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               objectives:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 500
 *                 minItems: 1
 *               confidentiality_level:
 *                 type: string
 *                 enum: [public, internal, confidential, highly_confidential]
 *                 default: confidential
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       201:
 *         description: Investigación creada exitosamente
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
 *                   example: "Investigación creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Investigation'
 *       400:
 *         description: Errores de validación
 *       404:
 *         description: Denuncia o investigador no encontrado
 *       403:
 *         description: Sin permisos suficientes
 */
router.post(
  "/",
  authenticate,
  authorize(["RRHH", "Tenant Admin"]),
  createInvestigationValidator,
  handleValidationErrors,
  InvestigationController.create
);

/**
 * @swagger
 * /api/investigations:
 *   get:
 *     summary: Obtener lista de investigaciones
 *     tags: [Investigations]
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
 *           enum: [pending, in_progress, evidence_review, interviews_pending, analysis, report_draft, completed, suspended, cancelled]
 *         description: Filtrar por estado
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: investigator_id
 *         schema:
 *           type: string
 *         description: Filtrar por investigador
 *       - in: query
 *         name: complaint_id
 *         schema:
 *           type: string
 *         description: Filtrar por denuncia
 *       - in: query
 *         name: overdue_only
 *         schema:
 *           type: boolean
 *         description: Solo investigaciones vencidas
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, estimated_completion_date, priority, status]
 *           default: created_at
 *         description: Campo para ordenar
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de investigaciones obtenida exitosamente
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
 *                   example: "Investigaciones obtenidas exitosamente"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Investigation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get(
  "/",
  authenticate,
  authorize(["Investigador", "RRHH", "Tenant Admin"]),
  queryValidator,
  handleValidationErrors,
  InvestigationController.getAll
);

/**
 * @swagger
 * /api/investigations/stats:
 *   get:
 *     summary: Obtener estadísticas de investigaciones
 *     tags: [Investigations]
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
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         in_progress:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         overdue:
 *                           type: integer
 *                         avg_duration:
 *                           type: number
 *                     by_status:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     by_priority:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 */
router.get(
  "/stats",
  authenticate,
  authorize(["Investigador", "RRHH", "Tenant Admin"]),
  InvestigationController.getStats
);

/**
 * @swagger
 * /api/investigations/{id}:
 *   get:
 *     summary: Obtener una investigación específica
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la investigación
 *     responses:
 *       200:
 *         description: Investigación obtenida exitosamente
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
 *                   example: "Investigación obtenida exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Investigation'
 *       404:
 *         description: Investigación no encontrada
 *       403:
 *         description: Sin permisos para ver esta investigación
 */
router.get(
  "/:id",
  authenticate,
  authorize(["Investigador", "RRHH", "Tenant Admin"]),
  paramIdValidator,
  handleValidationErrors,
  InvestigationController.getById
);

/**
 * @swagger
 * /api/investigations/{id}:
 *   put:
 *     summary: Actualizar una investigación
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la investigación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, evidence_review, interviews_pending, analysis, report_draft, completed, suspended, cancelled]
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               estimated_completion_date:
 *                 type: string
 *                 format: date
 *               scope:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *               objectives:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 500
 *                 minItems: 1
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *     responses:
 *       200:
 *         description: Investigación actualizada exitosamente
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
 *                   example: "Investigación actualizada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Investigation'
 *       404:
 *         description: Investigación no encontrada
 *       403:
 *         description: Sin permisos para actualizar esta investigación
 */
router.put(
  "/:id",
  authenticate,
  authorize(["Investigador", "RRHH", "Tenant Admin"]),
  updateInvestigationValidator,
  handleValidationErrors,
  InvestigationController.update
);

/**
 * @swagger
 * /api/investigations/{id}/evidence:
 *   post:
 *     summary: Agregar evidencia a una investigación
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la investigación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Evidence'
 *     responses:
 *       201:
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
 *                   $ref: '#/components/schemas/Evidence'
 *       404:
 *         description: Investigación no encontrada
 *       403:
 *         description: Sin permisos para agregar evidencia
 */
router.post(
  "/:id/evidence",
  authenticate,
  authorize(["Investigador", "RRHH", "Tenant Admin"]),
  addEvidenceValidator,
  handleValidationErrors,
  InvestigationController.addEvidence
);

/**
 * @swagger
 * /api/investigations/{id}/interviews:
 *   post:
 *     summary: Agregar entrevista a una investigación
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la investigación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Interview'
 *     responses:
 *       201:
 *         description: Entrevista agregada exitosamente
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
 *                   example: "Entrevista agregada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Interview'
 *       404:
 *         description: Investigación no encontrada
 *       403:
 *         description: Sin permisos para agregar entrevistas
 */
router.post(
  "/:id/interviews",
  authenticate,
  authorize(["Investigador", "RRHH", "Tenant Admin"]),
  addInterviewValidator,
  handleValidationErrors,
  InvestigationController.addInterview
);

/**
 * @swagger
 * /api/investigations/{id}/findings:
 *   post:
 *     summary: Agregar hallazgo a una investigación
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la investigación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Finding'
 *     responses:
 *       201:
 *         description: Hallazgo agregado exitosamente
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
 *                   example: "Hallazgo agregado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Finding'
 *       404:
 *         description: Investigación no encontrada
 *       403:
 *         description: Sin permisos para agregar hallazgos
 */
router.post(
  "/:id/findings",
  authenticate,
  authorize(["Investigador", "RRHH", "Tenant Admin"]),
  addFindingValidator,
  handleValidationErrors,
  InvestigationController.addFinding
);

/**
 * @swagger
 * /api/investigations/{id}/complete:
 *   post:
 *     summary: Completar una investigación
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la investigación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvestigationConclusion'
 *     responses:
 *       200:
 *         description: Investigación completada exitosamente
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
 *                   example: "Investigación completada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Investigation'
 *       404:
 *         description: Investigación no encontrada
 *       403:
 *         description: Sin permisos para completar esta investigación
 *       400:
 *         description: La investigación ya está completada
 */
router.post(
  "/:id/complete",
  authenticate,
  authorize(["Investigador", "RRHH", "Tenant Admin"]),
  completeInvestigationValidator,
  handleValidationErrors,
  InvestigationController.complete
);

/**
 * @swagger
 * /api/investigations/{id}/suspend:
 *   post:
 *     summary: Suspender una investigación
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la investigación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón de la suspensión
 *     responses:
 *       200:
 *         description: Investigación suspendida exitosamente
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
 *                   example: "Investigación suspendida exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Investigation'
 *       404:
 *         description: Investigación no encontrada
 *       403:
 *         description: Sin permisos para suspender investigaciones
 */
router.post(
  "/:id/suspend",
  authenticate,
  authorize(["RRHH", "Tenant Admin"]),
  paramIdValidator,
  handleValidationErrors,
  InvestigationController.suspend
);

/**
 * @swagger
 * /api/investigations/{id}/cancel:
 *   post:
 *     summary: Cancelar una investigación
 *     tags: [Investigations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la investigación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón de la cancelación
 *     responses:
 *       200:
 *         description: Investigación cancelada exitosamente
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
 *                   example: "Investigación cancelada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Investigation'
 *       404:
 *         description: Investigación no encontrada
 *       403:
 *         description: Sin permisos para cancelar investigaciones
 */
router.post(
  "/:id/cancel",
  authenticate,
  authorize(["RRHH", "Tenant Admin"]),
  paramIdValidator,
  handleValidationErrors,
  InvestigationController.cancel
);

module.exports = router;
