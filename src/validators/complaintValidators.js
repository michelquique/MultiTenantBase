const { body, param, query } = require("express-validator");
const { validateRequest } = require("../middleware");

// Validaciones para crear denuncia
const createComplaintValidation = [
  body("accused_id")
    .isMongoId()
    .withMessage("ID del denunciado debe ser un ID válido"),

  body("type")
    .isIn(["sexual", "psychological", "discrimination", "other"])
    .withMessage(
      "Tipo de denuncia debe ser: sexual, psychological, discrimination, other"
    ),

  body("severity")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Severidad debe ser: low, medium, high, critical"),

  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Título debe tener entre 5 y 200 caracteres"),

  body("description")
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage("Descripción debe tener entre 20 y 5000 caracteres"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Ubicación no puede exceder 300 caracteres"),

  body("incident_date")
    .isISO8601()
    .withMessage("Fecha del incidente debe ser una fecha válida")
    .custom((value) => {
      const incidentDate = new Date(value);
      const now = new Date();
      if (incidentDate > now) {
        throw new Error("La fecha del incidente no puede ser futura");
      }
      return true;
    }),

  body("is_confidential")
    .optional()
    .isBoolean()
    .withMessage("is_confidential debe ser un valor booleano"),

  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Prioridad debe ser: low, normal, high, urgent"),

  validateRequest,
];

// Validaciones para obtener denuncias
const getComplaintsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Página debe ser un número entero mayor a 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Límite debe ser un número entre 1 y 100"),

  query("status")
    .optional()
    .isIn([
      "draft",
      "submitted",
      "under_review",
      "investigating",
      "resolved",
      "closed",
    ])
    .withMessage(
      "Estado debe ser: draft, submitted, under_review, investigating, resolved, closed"
    ),

  query("type")
    .optional()
    .isIn(["sexual", "psychological", "discrimination", "other"])
    .withMessage("Tipo debe ser: sexual, psychological, discrimination, other"),

  query("severity")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Severidad debe ser: low, medium, high, critical"),

  query("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Prioridad debe ser: low, normal, high, urgent"),

  query("assigned_to")
    .optional()
    .isMongoId()
    .withMessage("assigned_to debe ser un ID válido"),

  query("complainant_id")
    .optional()
    .isMongoId()
    .withMessage("complainant_id debe ser un ID válido"),

  query("accused_id")
    .optional()
    .isMongoId()
    .withMessage("accused_id debe ser un ID válido"),

  query("sort_by")
    .optional()
    .isIn([
      "created_at",
      "updated_at",
      "incident_date",
      "reported_date",
      "title",
      "status",
      "priority",
      "severity",
    ])
    .withMessage(
      "sort_by debe ser: created_at, updated_at, incident_date, reported_date, title, status, priority, severity"
    ),

  query("sort_order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sort_order debe ser: asc, desc"),

  validateRequest,
];

// Validaciones para obtener denuncia por ID
const getComplaintByIdValidation = [
  param("id").isMongoId().withMessage("ID de denuncia debe ser un ID válido"),

  validateRequest,
];

// Validaciones para actualizar estado
const updateStatusValidation = [
  param("id").isMongoId().withMessage("ID de denuncia debe ser un ID válido"),

  body("status")
    .isIn([
      "draft",
      "submitted",
      "under_review",
      "investigating",
      "resolved",
      "closed",
    ])
    .withMessage(
      "Estado debe ser: draft, submitted, under_review, investigating, resolved, closed"
    ),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notas no pueden exceder 1000 caracteres"),

  validateRequest,
];

// Validaciones para asignar investigador
const assignInvestigatorValidation = [
  param("id").isMongoId().withMessage("ID de denuncia debe ser un ID válido"),

  body("investigator_id")
    .isMongoId()
    .withMessage("ID del investigador debe ser un ID válido"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notas no pueden exceder 1000 caracteres"),

  validateRequest,
];

// Validaciones para agregar evidencia
const addEvidenceValidation = [
  param("id").isMongoId().withMessage("ID de denuncia debe ser un ID válido"),

  body("type")
    .isIn(["document", "image", "video", "audio"])
    .withMessage("Tipo de evidencia debe ser: document, image, video, audio"),

  body("filename")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage(
      "Nombre del archivo es requerido y no puede exceder 255 caracteres"
    ),

  body("original_name")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage(
      "Nombre original es requerido y no puede exceder 255 caracteres"
    ),

  body("url").isURL().withMessage("URL debe ser una URL válida"),

  body("size")
    .isInt({ min: 1 })
    .withMessage("Tamaño del archivo debe ser un número entero mayor a 0"),

  validateRequest,
];

// Validaciones para resolver denuncia
const resolveComplaintValidation = [
  param("id").isMongoId().withMessage("ID de denuncia debe ser un ID válido"),

  body("outcome")
    .isIn([
      "founded",
      "unfounded",
      "partially_founded",
      "insufficient_evidence",
    ])
    .withMessage(
      "Resultado debe ser: founded, unfounded, partially_founded, insufficient_evidence"
    ),

  body("actions_taken")
    .isArray({ min: 1 })
    .withMessage("Acciones tomadas debe ser un array con al menos un elemento"),

  body("actions_taken.*")
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage("Cada acción debe tener entre 5 y 500 caracteres"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Notas de resolución no pueden exceder 2000 caracteres"),

  validateRequest,
];

// Validaciones para obtener timeline
const getTimelineValidation = [
  param("id").isMongoId().withMessage("ID de denuncia debe ser un ID válido"),

  validateRequest,
];

module.exports = {
  createComplaintValidation,
  getComplaintsValidation,
  getComplaintByIdValidation,
  updateStatusValidation,
  assignInvestigatorValidation,
  addEvidenceValidation,
  resolveComplaintValidation,
  getTimelineValidation,
};
