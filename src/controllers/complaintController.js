const Complaint = require("../models/Complaint");
const User = require("../models/User");
const logger = require("../config/logger");

class ComplaintController {
  /**
   * Crear una nueva denuncia
   */
  static async create(req, res) {
    try {
      const {
        accused_id,
        type,
        severity,
        title,
        description,
        location,
        incident_date,
        is_confidential,
        priority,
      } = req.body;

      // Verificar que el denunciado existe y pertenece al mismo tenant
      const accused = await User.findOne({
        _id: accused_id,
        tenant_id: req.tenantId,
        is_active: true,
      });

      if (!accused) {
        return res.status(404).json({
          success: false,
          message: "Usuario denunciado no encontrado",
        });
      }

      // Verificar que no se denuncie a sí mismo
      if (accused_id === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "No puede denunciarse a sí mismo",
        });
      }

      const complaintData = {
        tenant_id: req.tenantId,
        complainant_id: req.user._id,
        accused_id,
        type,
        severity: severity || "medium",
        title,
        description,
        location,
        incident_date: new Date(incident_date),
        is_confidential: is_confidential !== undefined ? is_confidential : true,
        priority: priority || "normal",
      };

      const complaint = await Complaint.create(complaintData);

      // Populate información básica
      await complaint.populate([
        {
          path: "complainant_id",
          select: "first_name last_name email role department",
        },
        {
          path: "accused_id",
          select: "first_name last_name email role department",
        },
      ]);

      logger.info(`Denuncia creada: ${complaint._id} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: "Denuncia creada exitosamente",
        data: complaint,
      });
    } catch (error) {
      logger.error("Error al crear denuncia:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener lista de denuncias con filtros
   */
  static async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        severity,
        priority,
        assigned_to,
        complainant_id,
        accused_id,
        sort_by = "created_at",
        sort_order = "desc",
      } = req.query;

      // Construir filtros
      const filters = { tenant_id: req.tenantId };

      // Filtros por rol
      if (req.user.role === "Empleado") {
        // Empleados solo ven sus propias denuncias
        filters.complainant_id = req.user._id;
      } else if (req.user.role === "Investigador") {
        // Investigadores ven denuncias asignadas y las que crearon
        filters.$or = [
          { assigned_to: req.user._id },
          { complainant_id: req.user._id },
        ];
      }
      // RRHH y Tenant Admin ven todas las denuncias

      // Aplicar filtros adicionales
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (severity) filters.severity = severity;
      if (priority) filters.priority = priority;
      if (assigned_to) filters.assigned_to = assigned_to;
      if (complainant_id) filters.complainant_id = complainant_id;
      if (accused_id) filters.accused_id = accused_id;

      // Paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sort_by]: sort_order === "desc" ? -1 : 1 };

      // Ejecutar consulta
      const [complaints, total] = await Promise.all([
        Complaint.find(filters)
          .populate(
            "complainant_id",
            "first_name last_name email role department"
          )
          .populate("accused_id", "first_name last_name email role department")
          .populate("assigned_to", "first_name last_name email role")
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Complaint.countDocuments(filters),
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.status(200).json({
        success: true,
        message: "Denuncias obtenidas exitosamente",
        data: complaints,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      });
    } catch (error) {
      logger.error("Error al obtener denuncias:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener una denuncia específica
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const complaint = await Complaint.findById(id)
        .populate(
          "complainant_id",
          "first_name last_name email role department"
        )
        .populate("accused_id", "first_name last_name email role department")
        .populate("assigned_to", "first_name last_name email role")
        .populate("timeline.user_id", "first_name last_name email role")
        .populate("evidence.uploaded_by", "first_name last_name email")
        .populate("resolution.resolved_by", "first_name last_name email");

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Denuncia no encontrada",
        });
      }

      // Verificar acceso
      if (!complaint.canUserAccess(req.user._id, req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para acceder a esta denuncia",
        });
      }

      res.status(200).json({
        success: true,
        message: "Denuncia obtenida exitosamente",
        data: complaint,
      });
    } catch (error) {
      logger.error("Error al obtener denuncia:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Actualizar estado de una denuncia
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const complaint = await Complaint.findById(id);

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Denuncia no encontrada",
        });
      }

      // Verificar permisos
      if (!complaint.canUserAccess(req.user._id, req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para modificar esta denuncia",
        });
      }

      // Verificar que el usuario puede cambiar el estado
      const allowedStatusChanges = {
        "Tenant Admin": [
          "draft",
          "submitted",
          "under_review",
          "investigating",
          "resolved",
          "closed",
        ],
        RRHH: [
          "submitted",
          "under_review",
          "investigating",
          "resolved",
          "closed",
        ],
        Investigador: ["investigating", "resolved"],
        Empleado: ["draft", "submitted"],
      };

      const userAllowedStatuses = allowedStatusChanges[req.user.role] || [];
      if (!userAllowedStatuses.includes(status)) {
        return res.status(403).json({
          success: false,
          message: `No puede cambiar el estado a '${status}' con su rol actual`,
        });
      }

      await complaint.changeStatus(status, req.user._id, notes);

      // Populate para la respuesta
      await complaint.populate([
        {
          path: "complainant_id",
          select: "first_name last_name email role department",
        },
        {
          path: "accused_id",
          select: "first_name last_name email role department",
        },
        { path: "assigned_to", select: "first_name last_name email role" },
      ]);

      logger.info(
        `Estado de denuncia ${id} cambiado a ${status} por ${req.user.email}`
      );

      res.status(200).json({
        success: true,
        message: "Estado de denuncia actualizado exitosamente",
        data: complaint,
      });
    } catch (error) {
      logger.error("Error al actualizar estado de denuncia:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Asignar investigador a una denuncia
   */
  static async assignInvestigator(req, res) {
    try {
      const { id } = req.params;
      const { investigator_id, notes } = req.body;

      const complaint = await Complaint.findById(id);

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Denuncia no encontrada",
        });
      }

      // Verificar permisos (solo RRHH y Tenant Admin pueden asignar)
      if (!["RRHH", "Tenant Admin"].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para asignar investigadores",
        });
      }

      // Verificar que el investigador existe y tiene el rol correcto
      const investigator = await User.findOne({
        _id: investigator_id,
        tenant_id: req.tenantId,
        role: "Investigador",
        is_active: true,
      });

      if (!investigator) {
        return res.status(404).json({
          success: false,
          message: "Investigador no encontrado o no válido",
        });
      }

      await complaint.assignInvestigator(investigator_id, req.user._id, notes);

      // Populate para la respuesta
      await complaint.populate([
        {
          path: "complainant_id",
          select: "first_name last_name email role department",
        },
        {
          path: "accused_id",
          select: "first_name last_name email role department",
        },
        { path: "assigned_to", select: "first_name last_name email role" },
      ]);

      logger.info(
        `Investigador ${investigator_id} asignado a denuncia ${id} por ${req.user.email}`
      );

      res.status(200).json({
        success: true,
        message: "Investigador asignado exitosamente",
        data: complaint,
      });
    } catch (error) {
      logger.error("Error al asignar investigador:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Agregar evidencia a una denuncia
   */
  static async addEvidence(req, res) {
    try {
      const { id } = req.params;
      const { type, filename, original_name, url, size } = req.body;

      const complaint = await Complaint.findById(id);

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Denuncia no encontrada",
        });
      }

      // Verificar permisos
      if (!complaint.canUserAccess(req.user._id, req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para agregar evidencia a esta denuncia",
        });
      }

      const evidenceData = {
        type,
        filename,
        original_name,
        url,
        size: parseInt(size),
      };

      await complaint.addEvidence(evidenceData, req.user._id);

      // Populate para la respuesta
      await complaint.populate([
        {
          path: "complainant_id",
          select: "first_name last_name email role department",
        },
        {
          path: "accused_id",
          select: "first_name last_name email role department",
        },
        { path: "assigned_to", select: "first_name last_name email role" },
        { path: "evidence.uploaded_by", select: "first_name last_name email" },
      ]);

      logger.info(`Evidencia agregada a denuncia ${id} por ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: "Evidencia agregada exitosamente",
        data: complaint,
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
   * Resolver una denuncia
   */
  static async resolve(req, res) {
    try {
      const { id } = req.params;
      const { outcome, actions_taken, notes } = req.body;

      const complaint = await Complaint.findById(id);

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Denuncia no encontrada",
        });
      }

      // Verificar permisos (solo Investigador, RRHH y Tenant Admin pueden resolver)
      if (!["Investigador", "RRHH", "Tenant Admin"].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para resolver denuncias",
        });
      }

      // Verificar que el investigador solo puede resolver denuncias asignadas
      if (
        req.user.role === "Investigador" &&
        !complaint.assigned_to.equals(req.user._id)
      ) {
        return res.status(403).json({
          success: false,
          message: "Solo puede resolver denuncias asignadas a usted",
        });
      }

      const resolutionData = {
        outcome,
        actions_taken: Array.isArray(actions_taken)
          ? actions_taken
          : [actions_taken],
        notes,
      };

      await complaint.resolve(resolutionData, req.user._id);

      // Populate para la respuesta
      await complaint.populate([
        {
          path: "complainant_id",
          select: "first_name last_name email role department",
        },
        {
          path: "accused_id",
          select: "first_name last_name email role department",
        },
        { path: "assigned_to", select: "first_name last_name email role" },
        {
          path: "resolution.resolved_by",
          select: "first_name last_name email",
        },
      ]);

      logger.info(
        `Denuncia ${id} resuelta por ${req.user.email} con resultado: ${outcome}`
      );

      res.status(200).json({
        success: true,
        message: "Denuncia resuelta exitosamente",
        data: complaint,
      });
    } catch (error) {
      logger.error("Error al resolver denuncia:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener estadísticas de denuncias
   */
  static async getStats(req, res) {
    try {
      logger.info("=== DEBUG getStats ===");
      logger.info("req.user:", JSON.stringify(req.user, null, 2));
      logger.info("req.tenantId:", req.tenantId);
      logger.info("req.user.role:", req.user?.role);

      // Verificar permisos (solo RRHH y Tenant Admin pueden ver estadísticas)
      if (!["RRHH", "Tenant Admin"].includes(req.user.role)) {
        logger.warn("Permiso denegado - rol:", req.user?.role);
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para ver estadísticas",
        });
      }

      logger.info("Llamando Complaint.getStats con tenantId:", req.tenantId);
      const stats = await Complaint.getStats(req.tenantId);
      logger.info("Stats resultado:", JSON.stringify(stats, null, 2));

      res.status(200).json({
        success: true,
        message: "Estadísticas obtenidas exitosamente",
        data: stats[0] || {
          total: 0,
          status_counts: {
            draft: 0,
            submitted: 0,
            under_review: 0,
            investigating: 0,
            resolved: 0,
            closed: 0,
          },
          type_counts: {
            sexual: 0,
            psychological: 0,
            discrimination: 0,
            other: 0,
          },
          severity_counts: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
          },
        },
      });
    } catch (error) {
      logger.error("=== ERROR getStats ===");
      logger.error("Error al obtener estadísticas:", error.message);
      logger.error("Stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * Obtener timeline de una denuncia
   */
  static async getTimeline(req, res) {
    try {
      const { id } = req.params;

      const complaint = await Complaint.findById(id)
        .populate("timeline.user_id", "first_name last_name email role")
        .select("timeline");

      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: "Denuncia no encontrada",
        });
      }

      // Verificar acceso
      if (!complaint.canUserAccess(req.user._id, req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "No tiene permisos para acceder a esta denuncia",
        });
      }

      res.status(200).json({
        success: true,
        message: "Timeline obtenido exitosamente",
        data: complaint.timeline,
      });
    } catch (error) {
      logger.error("Error al obtener timeline:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}

module.exports = ComplaintController;
