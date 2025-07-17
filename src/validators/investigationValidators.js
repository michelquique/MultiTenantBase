const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

// Validador para crear investigación
const createInvestigationValidator = [
  body("complaint_id")
    .notEmpty()
    .withMessage("El ID de la denuncia es requerido")
    .isMongoId()
    .withMessage("El ID de la denuncia debe ser un ObjectId válido"),

  body("investigator_id")
    .notEmpty()
    .withMessage("El ID del investigador es requerido")
    .isMongoId()
    .withMessage("El ID del investigador debe ser un ObjectId válido"),

  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("La prioridad debe ser: low, normal, high, urgent"),

  body("estimated_completion_date")
    .notEmpty()
    .withMessage("La fecha estimada de finalización es requerida")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO8601")
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error("La fecha estimada debe ser futura");
      }
      return true;
    }),

  body("investigation_type")
    .optional()
    .isIn(["formal", "informal", "preliminary", "follow_up"])
    .withMessage("El tipo debe ser: formal, informal, preliminary, follow_up"),

  body("methodology")
    .optional()
    .isIn(["interviews", "document_review", "observation", "mixed"])
    .withMessage(
      "La metodología debe ser: interviews, document_review, observation, mixed"
    ),

  body("scope")
    .notEmpty()
    .withMessage("El alcance es requerido")
    .isLength({ min: 10, max: 1000 })
    .withMessage("El alcance debe tener entre 10 y 1000 caracteres")
    .trim(),

  body("objectives")
    .isArray({ min: 1 })
    .withMessage("Debe incluir al menos un objetivo")
    .custom((objectives) => {
      if (
        objectives.some(
          (obj) => typeof obj !== "string" || obj.trim().length === 0
        )
      ) {
        throw new Error("Todos los objetivos deben ser strings no vacíos");
      }
      if (objectives.some((obj) => obj.length > 500)) {
        throw new Error("Cada objetivo no puede exceder 500 caracteres");
      }
      return true;
    }),

  body("confidentiality_level")
    .optional()
    .isIn(["public", "internal", "confidential", "highly_confidential"])
    .withMessage(
      "El nivel de confidencialidad debe ser: public, internal, confidential, highly_confidential"
    ),

  body("notes")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Las notas no pueden exceder 2000 caracteres")
    .trim(),
];

// Validador para actualizar investigación
const updateInvestigationValidator = [
  param("id").isMongoId().withMessage("El ID debe ser un ObjectId válido"),

  body("status")
    .optional()
    .isIn([
      "pending",
      "in_progress",
      "evidence_review",
      "interviews_pending",
      "analysis",
      "report_draft",
      "completed",
      "suspended",
      "cancelled",
    ])
    .withMessage("Estado inválido"),

  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("La prioridad debe ser: low, normal, high, urgent"),

  body("estimated_completion_date")
    .optional()
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO8601")
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        const now = new Date();
        if (date <= now) {
          throw new Error("La fecha estimada debe ser futura");
        }
      }
      return true;
    }),

  body("scope")
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage("El alcance debe tener entre 10 y 1000 caracteres")
    .trim(),

  body("objectives")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Debe incluir al menos un objetivo")
    .custom((objectives) => {
      if (
        objectives &&
        objectives.some(
          (obj) => typeof obj !== "string" || obj.trim().length === 0
        )
      ) {
        throw new Error("Todos los objetivos deben ser strings no vacíos");
      }
      if (objectives && objectives.some((obj) => obj.length > 500)) {
        throw new Error("Cada objetivo no puede exceder 500 caracteres");
      }
      return true;
    }),

  body("notes")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Las notas no pueden exceder 2000 caracteres")
    .trim(),
];

// Validador para agregar evidencia
const addEvidenceValidator = [
  param("id").isMongoId().withMessage("El ID debe ser un ObjectId válido"),

  body("type")
    .notEmpty()
    .withMessage("El tipo de evidencia es requerido")
    .isIn(["document", "interview", "email", "photo", "video", "other"])
    .withMessage("Tipo de evidencia inválido"),

  body("title")
    .notEmpty()
    .withMessage("El título es requerido")
    .isLength({ min: 3, max: 200 })
    .withMessage("El título debe tener entre 3 y 200 caracteres")
    .trim(),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("La descripción no puede exceder 1000 caracteres")
    .trim(),

  body("source").notEmpty().withMessage("La fuente es requerida").trim(),

  body("relevance")
    .optional()
    .isIn(["high", "medium", "low"])
    .withMessage("La relevancia debe ser: high, medium, low"),

  body("filename").optional().trim(),

  body("url").optional().isURL().withMessage("La URL debe ser válida"),
];

// Validador para agregar entrevista
const addInterviewValidator = [
  param("id").isMongoId().withMessage("El ID debe ser un ObjectId válido"),

  body("interviewee_id")
    .notEmpty()
    .withMessage("El ID del entrevistado es requerido")
    .isMongoId()
    .withMessage("El ID del entrevistado debe ser un ObjectId válido"),

  body("interview_date")
    .notEmpty()
    .withMessage("La fecha de la entrevista es requerida")
    .isISO8601()
    .withMessage("La fecha debe estar en formato ISO8601"),

  body("duration_minutes")
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage("La duración debe ser entre 1 y 480 minutos"),

  body("location").optional().trim(),

  body("type")
    .notEmpty()
    .withMessage("El tipo de entrevista es requerido")
    .isIn(["witness", "complainant", "accused", "expert", "other"])
    .withMessage("Tipo de entrevista inválido"),

  body("summary")
    .notEmpty()
    .withMessage("El resumen es requerido")
    .isLength({ min: 10, max: 5000 })
    .withMessage("El resumen debe tener entre 10 y 5000 caracteres")
    .trim(),

  body("key_points")
    .optional()
    .isArray()
    .withMessage("Los puntos clave deben ser un array"),

  body("follow_up_required")
    .optional()
    .isBoolean()
    .withMessage("follow_up_required debe ser booleano"),

  body("follow_up_notes").optional().trim(),

  body("recording_url")
    .optional()
    .isURL()
    .withMessage("La URL de grabación debe ser válida"),

  body("transcript_url")
    .optional()
    .isURL()
    .withMessage("La URL del transcript debe ser válida"),
];

// Validador para agregar hallazgo
const addFindingValidator = [
  param("id").isMongoId().withMessage("El ID debe ser un ObjectId válido"),

  body("category")
    .notEmpty()
    .withMessage("La categoría es requerida")
    .isIn(["factual", "policy_violation", "procedural", "behavioral"])
    .withMessage("Categoría inválida"),

  body("description")
    .notEmpty()
    .withMessage("La descripción es requerida")
    .isLength({ min: 10, max: 2000 })
    .withMessage("La descripción debe tener entre 10 y 2000 caracteres")
    .trim(),

  body("severity")
    .notEmpty()
    .withMessage("La severidad es requerida")
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Severidad inválida"),

  body("recommendations")
    .optional()
    .isArray()
    .withMessage("Las recomendaciones deben ser un array"),
];

// Validador para completar investigación
const completeInvestigationValidator = [
  param("id").isMongoId().withMessage("El ID debe ser un ObjectId válido"),

  body("outcome")
    .notEmpty()
    .withMessage("El resultado es requerido")
    .isIn([
      "substantiated",
      "unsubstantiated",
      "partially_substantiated",
      "inconclusive",
      "unfounded",
    ])
    .withMessage("Resultado inválido"),

  body("summary")
    .notEmpty()
    .withMessage("El resumen es requerido")
    .isLength({ min: 50, max: 3000 })
    .withMessage("El resumen debe tener entre 50 y 3000 caracteres")
    .trim(),

  body("recommendations")
    .optional()
    .isArray()
    .withMessage("Las recomendaciones deben ser un array")
    .custom((recommendations) => {
      if (recommendations) {
        for (const rec of recommendations) {
          if (
            !rec.type ||
            ![
              "disciplinary",
              "training",
              "policy",
              "procedural",
              "other",
            ].includes(rec.type)
          ) {
            throw new Error("Tipo de recomendación inválido");
          }
          if (!rec.description || rec.description.trim().length === 0) {
            throw new Error("La descripción de la recomendación es requerida");
          }
          if (
            rec.priority &&
            !["low", "medium", "high", "urgent"].includes(rec.priority)
          ) {
            throw new Error("Prioridad de recomendación inválida");
          }
        }
      }
      return true;
    }),
];

// Validador para parámetros de consulta
const queryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número entero mayor a 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe ser entre 1 y 100"),

  query("status")
    .optional()
    .isIn([
      "pending",
      "in_progress",
      "evidence_review",
      "interviews_pending",
      "analysis",
      "report_draft",
      "completed",
      "suspended",
      "cancelled",
    ])
    .withMessage("Estado inválido"),

  query("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Prioridad inválida"),

  query("investigator_id")
    .optional()
    .isMongoId()
    .withMessage("El ID del investigador debe ser un ObjectId válido"),

  query("sort_by")
    .optional()
    .isIn([
      "created_at",
      "updated_at",
      "estimated_completion_date",
      "priority",
      "status",
    ])
    .withMessage("Campo de ordenamiento inválido"),

  query("sort_order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Orden debe ser asc o desc"),
];

// Validador para ID de parámetro
const paramIdValidator = [
  param("id").isMongoId().withMessage("El ID debe ser un ObjectId válido"),
];

module.exports = {
  createInvestigationValidator,
  updateInvestigationValidator,
  addEvidenceValidator,
  addInterviewValidator,
  addFindingValidator,
  completeInvestigationValidator,
  queryValidator,
  paramIdValidator,
};
