const Investigation = require("../models/Investigation");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const logger = require("../config/logger");

class InvestigationController {
  /**
   * Crear una nueva investigación
   */
  static async create(req, res) {
    try {
      const {
        complaint_id,
        investigator_id,
        priority,
        estimated_completion_date,
        investigation_type,
        methodology,
        scope,
        objectives,
        confidentiality_level,
        notes,
      } = req.body;

      // Verificar que la denuncia existe y pertenece al tenant
      const complaint = await Complaint.findOne({
        _id: complaint_id,
        tenant_id: req.tenantId,
      });

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Denuncia no encontrada",
        });
      }

      // Verificar que el investigador existe y tiene el rol correcto
      const investigator = await User.findOne({
        _id: investigator_id,
        tenant_id: req.tenantId,
        role: { $in: ["Investigador", "RRHH", "Tenant Admin"] },
        is_active: true,
      });

      if (!investigator) {
        return res.status(404).json({
          success: false,
          message: "Investigador no encontrado o no tiene permisos",
        });
      }

      // Verificar que no existe una investigación activa para esta denuncia
      const existingInvestigation = await Investigation.findOne({
        complaint_id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (existingInvestigation) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una investigación activa para esta denuncia",
        });
      }

      const investigationData = {
        tenant_id: req.tenantId,
        complaint_id,
        investigator_id,
        assigned_by: req.user._id,
        priority: priority || "normal",
        estimated_completion_date: new Date(estimated_completion_date),
        investigation_type: investigation_type || "formal",
        methodology: methodology || "mixed",
        scope,
        objectives,
        confidentiality_level: confidentiality_level || "confidential",
        notes,
      };

      const investigation = await Investigation.create(investigationData);

      // Actualizar el estado de la denuncia
      await Complaint.findByIdAndUpdate(complaint_id, {
        status: "investigating",
        assigned_to: investigator_id,
        assigned_at: new Date(),
      });

      // Populate información básica
      await investigation.populate([
        {
          path: "complaint_id",
          select: "title type severity status",
        },
        {
          path: "investigator_id",
          select: "first_name last_name email role",
        },
        {
          path: "assigned_by",
          select: "first_name last_name email role",
        },
      ]);

      logger.info(
        `Investigación creada: ${investigation._id} por ${req.user.email}`
      );

      res.status(201).json({
        success: true,
        message: "Investigación creada exitosamente",
        data: investigation,
      });
    } catch (error) {
      logger.error("Error al crear investigación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener lista de investigaciones con filtros
   */
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        investigator_id,
        complaint_id,
        overdue_only,
        sort_by = "created_at",
        sort_order = "desc",
      } = req.query;

      // Construir filtros
      const filters = { tenant_id: req.tenantId, is_active: true };

      // Filtros por rol
      if (req.user.role === "Investigador") {
        filters.investigator_id = req.user._id;
      }
      // RRHH y Tenant Admin ven todas las investigaciones

      // Aplicar filtros adicionales
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (investigator_id) filters.investigator_id = investigator_id;
      if (complaint_id) filters.complaint_id = complaint_id;

      // Filtro para investigaciones vencidas
      if (overdue_only === "true") {
        filters.estimated_completion_date = { $lt: new Date() };
        filters.status = { $ne: "completed" };
      }

      // Paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sort_by]: sort_order === "desc" ? -1 : 1 };

      // Ejecutar consulta
      const [investigations, total] = await Promise.all([
        Investigation.find(filters)
          .populate("complaint_id", "title type severity status")
          .populate("investigator_id", "first_name last_name email role")
          .populate("assigned_by", "first_name last_name email role")
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Investigation.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        success: true,
        message: "Investigaciones obtenidas exitosamente",
        data: investigations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      });
    } catch (error) {
      logger.error("Error al obtener investigaciones:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener una investigación específica
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const investigation = await Investigation.findOne({
        _id: id,
        tenant_id: req.tenantId,
        is_active: true,
      })
        .populate("complaint_id", "title type severity status description")
        .populate("investigator_id", "first_name last_name email role")
        .populate("assigned_by", "first_name last_name email role")
        .populate("timeline.user_id", "first_name last_name email role")
        .populate("evidence.collected_by", "first_name last_name email")
        .populate(
          "evidence.chain_of_custody.user_id",
          "first_name last_name email"
        )
        .populate(
          "interviews.interviewee_id",
          "first_name last_name email role"
        )
        .populate(
          "interviews.interviewer_id",
          "first_name last_name email role"
        )
        .populate("interviews.conducted_by", "first_name last_name email role")
        .populate("findings.documented_by", "first_name last_name email role")
        .populate("conclusion.completed_by", "first_name last_name email role")
        .populate(
          "conclusion.recommendations.assigned_to",
          "first_name last_name email role"
        );

      if (!investigation) {
        return res.status(404).json({
          success: false,
          message: "Investigación no encontrada",
        });
      }

      // Verificar acceso según rol
      if (
        req.user.role === "Investigador" &&
        investigation.investigator_id._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para ver esta investigación",
        });
      }

      res.status(200).json({
        success: true,
        message: "Investigación obtenida exitosamente",
        data: investigation,
      });
    } catch (error) {
      logger.error("Error al obtener investigación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Actualizar una investigación
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        status,
        priority,
        estimated_completion_date,
        scope,
        objectives,
        notes,
      } = req.body;

      const investigation = await Investigation.findOne({
        _id: id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!investigation) {
        return res.status(404).json({
          success: false,
          message: "Investigación no encontrada",
        });
      }

      // Verificar permisos
      if (
        req.user.role === "Investigador" &&
        investigation.investigator_id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para actualizar esta investigación",
        });
      }

      const previousStatus = investigation.status;
      const updateData = {};

      if (status && status !== previousStatus) {
        updateData.status = status;

        // Si se completa la investigación, actualizar fecha
        if (status === "completed") {
          updateData.actual_completion_date = new Date();
        }
      }

      if (priority) updateData.priority = priority;
      if (estimated_completion_date)
        updateData.estimated_completion_date = new Date(
          estimated_completion_date
        );
      if (scope) updateData.scope = scope;
      if (objectives) updateData.objectives = objectives;
      if (notes) updateData.notes = notes;

      const updatedInvestigation = await Investigation.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      // Agregar entrada al timeline si cambió el estado
      if (status && status !== previousStatus) {
        updatedInvestigation.addTimelineEntry(
          "status_changed",
          req.user._id,
          `Estado cambiado de ${previousStatus} a ${status}`,
          previousStatus,
          status
        );
        await updatedInvestigation.save();
      }

      await updatedInvestigation.populate([
        {
          path: "complaint_id",
          select: "title type severity status",
        },
        {
          path: "investigator_id",
          select: "first_name last_name email role",
        },
      ]);

      logger.info(`Investigación actualizada: ${id} por ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: "Investigación actualizada exitosamente",
        data: updatedInvestigation,
      });
    } catch (error) {
      logger.error("Error al actualizar investigación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Agregar evidencia a una investigación
   */
  static async addEvidence(req, res) {
    try {
      const { id } = req.params;
      const { type, title, description, filename, url, source, relevance } =
        req.body;

      const investigation = await Investigation.findOne({
        _id: id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!investigation) {
        return res.status(404).json({
          success: false,
          message: "Investigación no encontrada",
        });
      }

      // Verificar permisos
      if (
        req.user.role === "Investigador" &&
        investigation.investigator_id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para agregar evidencia",
        });
      }

      const evidenceData = {
        type,
        title,
        description,
        filename,
        url,
        source,
        relevance: relevance || "medium",
        collected_by: req.user._id,
        chain_of_custody: [
          {
            user_id: req.user._id,
            action: "collected",
            timestamp: new Date(),
            notes: "Evidencia agregada a la investigación",
          },
        ],
      };

      investigation.evidence.push(evidenceData);

      // Agregar entrada al timeline
      investigation.addTimelineEntry(
        "evidence_collected",
        req.user._id,
        `Evidencia agregada: ${title}`
      );

      await investigation.save();

      logger.info(
        `Evidencia agregada a investigación: ${id} por ${req.user.email}`
      );

      res.status(201).json({
        success: true,
        message: "Evidencia agregada exitosamente",
        data: investigation.evidence[investigation.evidence.length - 1],
      });
    } catch (error) {
      logger.error("Error al agregar evidencia:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Agregar entrevista a una investigación
   */
  static async addInterview(req, res) {
    try {
      const { id } = req.params;
      const {
        interviewee_id,
        interview_date,
        duration_minutes,
        location,
        type,
        summary,
        key_points,
        follow_up_required,
        follow_up_notes,
        recording_url,
        transcript_url,
      } = req.body;

      const investigation = await Investigation.findOne({
        _id: id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!investigation) {
        return res.status(404).json({
          success: false,
          message: "Investigación no encontrada",
        });
      }

      // Verificar permisos
      if (
        req.user.role === "Investigador" &&
        investigation.investigator_id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para agregar entrevistas",
        });
      }

      // Verificar que el entrevistado existe
      const interviewee = await User.findOne({
        _id: interviewee_id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!interviewee) {
        return res.status(404).json({
          success: false,
          message: "Entrevistado no encontrado",
        });
      }

      const interviewData = {
        interviewee_id,
        interviewer_id: req.user._id,
        interview_date: new Date(interview_date),
        duration_minutes,
        location,
        type,
        summary,
        key_points: key_points || [],
        follow_up_required: follow_up_required || false,
        follow_up_notes,
        recording_url,
        transcript_url,
        conducted_by: req.user._id,
      };

      investigation.interviews.push(interviewData);

      // Agregar entrada al timeline
      investigation.addTimelineEntry(
        "interview_conducted",
        req.user._id,
        `Entrevista realizada con ${interviewee.first_name} ${interviewee.last_name}`
      );

      await investigation.save();

      logger.info(
        `Entrevista agregada a investigación: ${id} por ${req.user.email}`
      );

      res.status(201).json({
        success: true,
        message: "Entrevista agregada exitosamente",
        data: investigation.interviews[investigation.interviews.length - 1],
      });
    } catch (error) {
      logger.error("Error al agregar entrevista:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Agregar hallazgo a una investigación
   */
  static async addFinding(req, res) {
    try {
      const { id } = req.params;
      const {
        category,
        description,
        severity,
        supporting_evidence,
        recommendations,
      } = req.body;

      const investigation = await Investigation.findOne({
        _id: id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!investigation) {
        return res.status(404).json({
          success: false,
          message: "Investigación no encontrada",
        });
      }

      // Verificar permisos
      if (
        req.user.role === "Investigador" &&
        investigation.investigator_id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para agregar hallazgos",
        });
      }

      const findingData = {
        category,
        description,
        severity,
        supporting_evidence: supporting_evidence || [],
        recommendations: recommendations || [],
        documented_by: req.user._id,
      };

      investigation.findings.push(findingData);
      await investigation.save();

      logger.info(
        `Hallazgo agregado a investigación: ${id} por ${req.user.email}`
      );

      res.status(201).json({
        success: true,
        message: "Hallazgo agregado exitosamente",
        data: investigation.findings[investigation.findings.length - 1],
      });
    } catch (error) {
      logger.error("Error al agregar hallazgo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Completar una investigación
   */
  static async complete(req, res) {
    try {
      const { id } = req.params;
      const { outcome, summary, recommendations } = req.body;

      const investigation = await Investigation.findOne({
        _id: id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!investigation) {
        return res.status(404).json({
          success: false,
          message: "Investigación no encontrada",
        });
      }

      // Verificar permisos
      if (
        req.user.role === "Investigador" &&
        investigation.investigator_id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para completar esta investigación",
        });
      }

      // Verificar que la investigación no esté ya completada
      if (investigation.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "La investigación ya está completada",
        });
      }

      const conclusionData = {
        outcome,
        summary,
        recommendations: recommendations || [],
        completed_by: req.user._id,
        completed_at: new Date(),
      };

      investigation.conclusion = conclusionData;
      investigation.status = "completed";
      investigation.actual_completion_date = new Date();

      // Agregar entrada al timeline
      investigation.addTimelineEntry(
        "completed",
        req.user._id,
        `Investigación completada con resultado: ${outcome}`
      );

      await investigation.save();

      // Actualizar el estado de la denuncia relacionada
      await Complaint.findByIdAndUpdate(investigation.complaint_id, {
        status: "resolved",
        resolution: {
          outcome: outcome === "substantiated" ? "founded" : "unfounded",
          notes: summary,
          resolved_at: new Date(),
          resolved_by: req.user._id,
        },
      });

      logger.info(`Investigación completada: ${id} por ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: "Investigación completada exitosamente",
        data: investigation,
      });
    } catch (error) {
      logger.error("Error al completar investigación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas de investigaciones
   */
  static async getStats(req, res) {
    try {
      const filters = { tenant_id: req.tenantId, is_active: true };

      // Filtrar por investigador si es necesario
      if (req.user.role === "Investigador") {
        filters.investigator_id = req.user._id;
      }

      const stats = await Investigation.aggregate([
        { $match: filters },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            in_progress: {
              $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
            },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ["$estimated_completion_date", new Date()] },
                      { $ne: ["$status", "completed"] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            avg_duration: { $avg: "$getDurationInDays" },
          },
        },
      ]);

      const statusStats = await Investigation.aggregate([
        { $match: filters },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      const priorityStats = await Investigation.aggregate([
        { $match: filters },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]);

      res.status(200).json({
        success: true,
        message: "Estadísticas obtenidas exitosamente",
        data: {
          overview: stats[0] || {
            total: 0,
            pending: 0,
            in_progress: 0,
            completed: 0,
            overdue: 0,
            avg_duration: 0,
          },
          by_status: statusStats,
          by_priority: priorityStats,
        },
      });
    } catch (error) {
      logger.error("Error al obtener estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Suspender una investigación
   */
  static async suspend(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const investigation = await Investigation.findOne({
        _id: id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!investigation) {
        return res.status(404).json({
          success: false,
          message: "Investigación no encontrada",
        });
      }

      // Solo RRHH y Tenant Admin pueden suspender
      if (!["RRHH", "Tenant Admin"].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para suspender investigaciones",
        });
      }

      const previousStatus = investigation.status;
      investigation.status = "suspended";

      // Agregar entrada al timeline
      investigation.addTimelineEntry(
        "suspended",
        req.user._id,
        reason || "Investigación suspendida",
        previousStatus,
        "suspended"
      );

      await investigation.save();

      logger.info(`Investigación suspendida: ${id} por ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: "Investigación suspendida exitosamente",
        data: investigation,
      });
    } catch (error) {
      logger.error("Error al suspender investigación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Cancelar una investigación
   */
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const investigation = await Investigation.findOne({
        _id: id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!investigation) {
        return res.status(404).json({
          success: false,
          message: "Investigación no encontrada",
        });
      }

      // Solo RRHH y Tenant Admin pueden cancelar
      if (!["RRHH", "Tenant Admin"].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para cancelar investigaciones",
        });
      }

      const previousStatus = investigation.status;
      investigation.status = "cancelled";
      investigation.is_active = false;

      // Agregar entrada al timeline
      investigation.addTimelineEntry(
        "cancelled",
        req.user._id,
        reason || "Investigación cancelada",
        previousStatus,
        "cancelled"
      );

      await investigation.save();

      logger.info(`Investigación cancelada: ${id} por ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: "Investigación cancelada exitosamente",
        data: investigation,
      });
    } catch (error) {
      logger.error("Error al cancelar investigación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = InvestigationController;
